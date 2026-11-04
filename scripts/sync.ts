/**
 * Fetch raw contribution data for every cohort repo into data/raw/<org>/<repo>.json,
 * then rebuild data/summary.json.
 *
 *   pnpm sync              past cohorts from cache, current cohort refreshed
 *   pnpm sync:year 2024    only the 2024–25 cohort, always re-fetched
 *   pnpm sync:year summer-2024   only the Summer 2024 session
 *   pnpm sync:current      only the current cohort
 *   pnpm sync:all          refresh everything
 *
 * Flags: --year <YYYY | summer-YYYY> | --org <name> | --current | --force | --no-aggregate
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { Octokit } from 'octokit';

import { createClient } from '../lib/github';
import { aggregate } from './aggregate';
import { progress } from './progress';
import type { RawCommit, RawIssue, RawPullRequest, RawRepo } from '../lib/types/stats';
import {
  cohortSlug,
  cohorts,
  currentCohort,
  minRepoSizeKb,
  repoExclude,
  teamPattern,
} from '../sync.config';

const RAW_DIR = path.join(process.cwd(), 'data', 'raw');
/** Repos fetched at once. GitHub's secondary rate limits kick in above roughly this. */
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyCurrent = args.includes('--current');
const flag = (name: string) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const orgArg = flag('--org');
const yearArg = flag('--year')?.toLowerCase();
const skipAggregate = args.includes('--no-aggregate');

if (args.includes('--year') && !yearArg) {
  console.error('Usage: pnpm sync:year <YYYY | summer-YYYY>   e.g. pnpm sync:year 2024');
  console.error(`Known cohorts: ${cohorts.map(cohortSlug).join(', ')}`);
  process.exit(1);
}

const gh = createClient();

/* ---------------------------- GraphQL queries ---------------------------- */

const META_QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      url
      isPrivate
      isFork
      isArchived
      createdAt
      pushedAt
      stargazerCount
      diskUsage
      description
      defaultBranchRef {
        name
      }
      languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
        edges {
          size
          node {
            name
          }
        }
      }
    }
  }
`;

const HISTORY_QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: $first, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                oid
                authoredDate
                additions
                deletions
                parents {
                  totalCount
                }
                author {
                  name
                  email
                  user {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const PR_QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(
        first: $first
        after: $after
        orderBy: { field: CREATED_AT, direction: ASC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          number
          state
          createdAt
          mergedAt
          closedAt
          additions
          deletions
          changedFiles
          author {
            login
          }
          mergedBy {
            login
          }
          comments {
            totalCount
          }
          reviews(first: 50) {
            nodes {
              state
              submittedAt
              author {
                login
              }
            }
          }
        }
      }
    }
  }
`;

const ISSUE_QUERY = /* GraphQL */ `
  query ($owner: String!, $name: String!, $first: Int!, $after: String) {
    repository(owner: $owner, name: $name) {
      issues(
        first: $first
        after: $after
        orderBy: { field: CREATED_AT, direction: ASC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          number
          state
          createdAt
          closedAt
          author {
            login
          }
          assignees(first: 10) {
            nodes {
              login
            }
          }
        }
      }
    }
  }
`;

/* -------------------------------- Fetchers ------------------------------- */

type PageInfo = { hasNextPage: boolean; endCursor: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** GraphQL with retries for GitHub's transient 502/504s and timeouts on heavy pages. */
async function gql(
  query: string,
  vars: Record<string, unknown>,
  tries = 4
): Promise<Json> {
  for (let i = 1; ; i++) {
    try {
      return await gh.graphql(query, vars);
    } catch (err) {
      const msg = String((err as Error).message ?? err);
      const transient =
        /50[234]|timeout|timed out|ECONNRESET|socket hang up|something went wrong/i.test(
          msg
        );
      if (!transient || i >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** (i - 1)));
    }
  }
}

/**
 * Page through a connection, shrinking the page size when GitHub can't serve a
 * page in time (huge diffs, many reviews) and growing it back afterwards.
 */
async function paginate<T>(
  query: string,
  vars: Record<string, unknown>,
  pick: (res: Json) => { nodes: Json[]; pageInfo: PageInfo } | null | undefined,
  map: (node: Json) => T | null,
  maxFirst = 100
): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  let first = maxFirst;
  for (;;) {
    let res: Json;
    try {
      res = await gql(query, { ...vars, first, after }, first > 5 ? 2 : 4);
    } catch (err) {
      if (first > 5) {
        first = Math.max(5, Math.floor(first / 3));
        continue;
      }
      throw err;
    }
    const conn = pick(res);
    if (!conn) break;
    for (const n of conn.nodes) {
      const v = map(n);
      if (v) out.push(v);
    }
    if (!conn.pageInfo.hasNextPage) break;
    after = conn.pageInfo.endCursor;
    first = Math.min(maxFirst, first * 2);
  }
  return out;
}

function fetchCommits(owner: string, name: string): Promise<RawCommit[]> {
  return paginate(
    HISTORY_QUERY,
    { owner, name },
    (res) => res.repository.defaultBranchRef?.target?.history,
    (c): RawCommit | null =>
      // skip merge commits (matches GitHub's contributor graph)
      c.parents.totalCount > 1
        ? null
        : {
            oid: c.oid,
            login: c.author?.user?.login ?? null,
            name: c.author?.name ?? null,
            email: c.author?.email ?? null,
            date: c.authoredDate,
            additions: c.additions,
            deletions: c.deletions,
          }
  );
}

function fetchPullRequests(owner: string, name: string): Promise<RawPullRequest[]> {
  return paginate(
    PR_QUERY,
    { owner, name },
    (res) => res.repository.pullRequests,
    (pr): RawPullRequest => ({
      number: pr.number,
      login: pr.author?.login ?? null,
      state: pr.state,
      createdAt: pr.createdAt,
      mergedAt: pr.mergedAt,
      closedAt: pr.closedAt,
      mergedBy: pr.mergedBy?.login ?? null,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      comments: pr.comments.totalCount,
      reviews: pr.reviews.nodes.map((r: Json) => ({
        login: r.author?.login ?? null,
        state: r.state,
        submittedAt: r.submittedAt,
      })),
    }),
    50
  );
}

function fetchIssues(owner: string, name: string): Promise<RawIssue[]> {
  return paginate(
    ISSUE_QUERY,
    { owner, name },
    (res) => res.repository.issues,
    (is): RawIssue => ({
      number: is.number,
      login: is.author?.login ?? null,
      state: is.state,
      createdAt: is.createdAt,
      closedAt: is.closedAt,
      assignees: is.assignees.nodes.map((a: Json) => a.login),
    })
  );
}

async function fetchRepo(org: string, name: string, team: number): Promise<RawRepo> {
  const metaRes: Json = await gql(META_QUERY, { owner: org, name });
  const r = metaRes.repository;
  const [commits, prs, issues] = await Promise.all([
    fetchCommits(org, name),
    fetchPullRequests(org, name),
    fetchIssues(org, name),
  ]);
  return {
    org,
    name,
    team,
    fetchedAt: new Date().toISOString(),
    meta: {
      url: r.url,
      isPrivate: r.isPrivate,
      isFork: r.isFork,
      isArchived: r.isArchived,
      createdAt: r.createdAt,
      pushedAt: r.pushedAt,
      defaultBranch: r.defaultBranchRef?.name ?? null,
      stars: r.stargazerCount,
      sizeKb: r.diskUsage ?? 0,
      description: r.description,
    },
    languages: Object.fromEntries(
      r.languages.edges.map((e: Json) => [e.node.name, e.size as number])
    ),
    commits,
    prs,
    issues,
  };
}

async function listOrgRepos(octokit: Octokit, org: string) {
  const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
    org,
    type: 'all',
    per_page: 100,
  });
  return repos;
}

/* ---------------------------------- Main --------------------------------- */

async function runPool<T>(items: T[], size: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(size, queue.length) }, async () => {
      while (queue.length) await fn(queue.shift()!);
    })
  );
}

async function main() {
  const targets = cohorts.filter(
    (c) =>
      (!orgArg || c.org.toLowerCase() === orgArg.toLowerCase()) &&
      (!yearArg || cohortSlug(c) === yearArg) &&
      (!onlyCurrent || cohortSlug(c) === currentCohort)
  );
  if (!targets.length) {
    console.error(
      `No cohort matches ${yearArg ?? orgArg ?? '--current'}. ` +
        `Known: ${cohorts.map((c) => `${cohortSlug(c)} (${c.org})`).join(', ')}. ` +
        'Add new cohorts in sync.config.ts.'
    );
    process.exit(1);
  }

  const started = Date.now();
  if (yearArg) {
    console.log(
      `Syncing ${yearArg} only. This usually takes 4–6 minutes; leave it running.`
    );
  }
  let fetched = 0;
  let cached = 0;
  const failures: string[] = [];

  for (const cohort of targets) {
    const dir = path.join(RAW_DIR, cohort.org);
    mkdirSync(dir, { recursive: true });
    // A single-cohort run (--year / --org) always re-fetches that cohort.
    const refresh =
      force || !!yearArg || !!orgArg || cohortSlug(cohort) === currentCohort;

    const repos = await listOrgRepos(gh, cohort.org);
    const selected: { owner: string; name: string; team: number; file: string }[] = repos
      .filter((r) => !repoExclude.some((re) => re.test(r.name)))
      .filter((r) => (r.size ?? 0) >= minRepoSizeKb)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((r, i) => ({
        owner: cohort.org,
        name: r.name,
        // Repos with no team number in the name (e.g. a renamed project) still count;
        // they get a number from 100 up and are shown under their repo name.
        team: Number(teamPattern.exec(r.name)?.[1] ?? 100 + i),
        file: `${r.name}.json`,
      }));

    // Team repos that live outside the org (see `extraRepos` in sync.config.ts).
    for (const extra of cohort.extraRepos ?? []) {
      const [owner, name] = extra.repo.split('/');
      selected.push({ owner, name, team: extra.team, file: `${owner}__${name}.json` });
    }

    console.log(
      `\n${cohort.org}: ${selected.length} team repos (${repos.length} total)` +
        (refresh ? '' : ' [cached unless missing]')
    );

    progress.start(selected.length);
    await runPool(
      selected,
      CONCURRENCY,
      async ({ owner, name, team, file: fileName }) => {
        const file = path.join(dir, fileName);
        if (!refresh && existsSync(file)) {
          cached++;
          progress.skip();
          return;
        }
        progress.begin(name);
        try {
          const t = Date.now();
          const data = await fetchRepo(owner, name, team);
          writeFileSync(file, JSON.stringify(data));
          fetched++;
          progress.end(name);
          progress.log(
            `  ✓ ${name.padEnd(48)} team ${String(team).padStart(2)}  ` +
              `${data.commits.length} commits, ${data.prs.length} PRs, ${data.issues.length} issues ` +
              `(${((Date.now() - t) / 1000).toFixed(1)}s)`
          );
        } catch (err) {
          failures.push(`${owner}/${name}`);
          progress.end(name);
          progress.log(`  ✗ ${name}: ${(err as Error).message}`, 'err');
        }
      }
    );
    progress.stop();
  }

  const rate = await gh.rest.rateLimit.get();
  console.log(
    `\nDone in ${((Date.now() - started) / 1000).toFixed(0)}s: ${fetched} fetched, ${cached} cached` +
      (failures.length ? `, ${failures.length} failed` : '') +
      `. GraphQL budget left: ${rate.data.resources.graphql?.remaining}`
  );
  if (failures.length) {
    console.error('Failed:', failures.join(', '));
    process.exitCode = 1;
  }

  if (!skipAggregate) {
    console.log('');
    aggregate();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
