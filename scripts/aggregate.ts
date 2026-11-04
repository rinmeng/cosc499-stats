/**
 * Turn data/raw/** into data/summary.json, which is the only file the site reads.
 * Pure: no network calls. Run with `pnpm aggregate`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type {
  CohortStats,
  PersonStats,
  RawRepo,
  Summary,
  TeamStats,
  WeekPoint,
} from '../lib/types/stats';
import {
  cohortSlug,
  cohorts,
  currentCohort,
  currentYear,
  teamPattern,
  excludeLogins,
  lineOutlierThreshold,
  scoreWeights,
  staffTeamShare,
  termLeadWeeks,
  timezone,
  topN,
} from '../sync.config';

const DATA_DIR = path.join(process.cwd(), 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const DAY = 86_400_000;
const WEEK = 7 * DAY;

/* --------------------------------- Helpers -------------------------------- */

/** Sunday on/before the first Monday of September (winter) or May (summer), in UTC. */
function termStartFor(year: number, summer = false): Date {
  const d = new Date(Date.UTC(year, summer ? 4 : 8, 1));
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() - 1);
  return d;
}

const BOT_NAME = /\[bot\]|github[- ]?actions?|dependabot|github classroom/i;

const isBot = (login: string) =>
  login.endsWith('[bot]') ||
  excludeLogins.some((x) => x.toLowerCase() === login.toLowerCase());

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function gini(values: number[]): number {
  const xs = values.filter((v) => v >= 0).sort((a, b) => a - b);
  const n = xs.length;
  const sum = xs.reduce((a, b) => a + b, 0);
  if (n < 2 || sum === 0) return 0;
  let acc = 0;
  xs.forEach((x, i) => (acc += (2 * (i + 1) - n - 1) * x));
  return acc / (n * sum);
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

const hourFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: timezone,
  hour: 'numeric',
  hourCycle: 'h23',
  weekday: 'short',
});
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function localSlot(iso: string): { dow: number; hour: number } {
  const parts = hourFmt.formatToParts(new Date(iso));
  const hour = Number(parts.find((p) => p.type === 'hour')!.value) % 24;
  const dow = DOW.indexOf(parts.find((p) => p.type === 'weekday')!.value);
  return { dow, hour };
}

const emptyPunch = () => Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);

/** Key a commit author: login when linked, otherwise a normalized email/name. */
function authorKey(login: string | null, email: string | null, name: string | null) {
  if (login) return login.toLowerCase();
  if (email && !email.endsWith('noreply.github.com'))
    return `email:${email.toLowerCase()}`;
  return `name:${(name ?? 'unknown').toLowerCase()}`;
}

/* ---------------------------------- Main ---------------------------------- */

function loadRaw(org: string): RawRepo[] {
  const dir = path.join(RAW_DIR, org);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as RawRepo);
}

function buildCohort(cfg: (typeof cohorts)[number], now: Date): CohortStats | null {
  const repos = loadRaw(cfg.org);
  const summer = cfg.session === 'summer';
  const slug = cohortSlug(cfg);

  const termStart = termStartFor(cfg.year, summer);
  const windowStart = termStart.getTime() - termLeadWeeks * WEEK;
  // Winter runs to the end of the following May; summer to mid-September.
  const windowEnd = summer
    ? Date.UTC(cfg.year, 8, 15, 23, 59, 59)
    : Date.UTC(cfg.year + 1, 4, 31, 23, 59, 59);
  const inWindow = (iso: string | null) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return t >= windowStart && t <= windowEnd;
  };
  const weekOf = (iso: string) =>
    Math.floor((Date.parse(iso) - termStart.getTime()) / WEEK);
  const weekStart = (w: number) =>
    new Date(termStart.getTime() + w * WEEK).toISOString().slice(0, 10);

  const nowWeek = Math.floor((now.getTime() - termStart.getTime()) / WEEK);
  const isCurrent = slug === currentCohort;

  /* Staff detection: logins committing to many different teams in one cohort. */
  const teamsByLogin = new Map<string, Set<number>>();
  for (const r of repos)
    for (const c of r.commits) {
      if (!c.login || !inWindow(c.date)) continue;
      const k = c.login.toLowerCase();
      if (!teamsByLogin.has(k)) teamsByLogin.set(k, new Set());
      teamsByLogin.get(k)!.add(r.team);
    }
  const teamCount = new Set(repos.map((r) => r.team)).size;
  const staff = new Set(
    [...teamsByLogin]
      .filter(
        ([, t]) => teamCount >= 4 && t.size >= Math.max(3, teamCount * staffTeamShare)
      )
      .map(([k]) => k)
  );
  const skip = (login: string | null) =>
    !!login && (isBot(login) || staff.has(login.toLowerCase()));

  /* Group repos by team */
  const byTeam = new Map<number, RawRepo[]>();
  for (const r of repos) {
    if (!byTeam.has(r.team)) byTeam.set(r.team, []);
    byTeam.get(r.team)!.push(r);
  }

  const teams: TeamStats[] = [];
  const cohortPunch = emptyPunch();
  const cohortWeekly = new Map<number, WeekPoint>();
  const cohortLang = new Map<string, number>();
  const cohortMergeHours: number[] = [];
  let cohortMerged = 0;
  let cohortReviewed = 0;

  for (const [team, teamRepos] of [...byTeam].sort((a, b) => a[0] - b[0])) {
    const people = new Map<string, PersonStats & { weeks: Set<number> }>();
    const person = (key: string, login: string | null, name: string | null) => {
      let p = people.get(key);
      if (!p) {
        p = {
          id: key,
          login,
          name,
          avatarUrl: login ? `https://github.com/${login}.png?size=96` : null,
          commits: 0,
          additions: 0,
          deletions: 0,
          lines: 0,
          prsOpened: 0,
          prsMerged: 0,
          reviews: 0,
          issuesOpened: 0,
          issuesClosed: 0,
          issues: 0,
          activeWeeks: 0,
          score: 0,
          weeks: new Set(),
        };
        people.set(key, p);
      }
      if (!p.name && name) p.name = name;
      return p;
    };

    const weekly = new Map<number, WeekPoint>();
    const wp = (w: number) => {
      if (!weekly.has(w))
        weekly.set(w, { week: w, start: weekStart(w), commits: 0, prs: 0, reviews: 0 });
      return weekly.get(w)!;
    };
    const punch = emptyPunch();
    const langs = new Map<string, number>();
    const mergeHours: number[] = [];
    let merged = 0;
    let reviewed = 0;
    let openPrs = 0;
    let openIssues = 0;
    let last: string | null = null;
    const touch = (iso: string | null) => {
      if (iso && (!last || iso > last)) last = iso;
    };

    for (const repo of teamRepos) {
      for (const [lang, bytes] of Object.entries(repo.languages))
        langs.set(lang, (langs.get(lang) ?? 0) + bytes);

      const seen = new Set<string>();
      for (const c of repo.commits) {
        if (seen.has(c.oid) || !inWindow(c.date) || skip(c.login)) continue;
        if (BOT_NAME.test(`${c.name ?? ''} ${c.email ?? ''}`)) continue;
        seen.add(c.oid);
        const p = person(authorKey(c.login, c.email, c.name), c.login, c.name);
        p.commits++;
        if (c.additions + c.deletions <= lineOutlierThreshold) {
          p.additions += c.additions;
          p.deletions += c.deletions;
        }
        const w = weekOf(c.date);
        p.weeks.add(w);
        wp(w).commits++;
        const { dow, hour } = localSlot(c.date);
        punch[dow][hour]++;
        touch(c.date);
      }

      for (const pr of repo.prs) {
        if (!inWindow(pr.createdAt)) continue;
        if (pr.state === 'OPEN') openPrs++;
        if (pr.login && !skip(pr.login)) {
          const p = person(pr.login.toLowerCase(), pr.login, null);
          p.prsOpened++;
          p.weeks.add(weekOf(pr.createdAt));
          if (pr.mergedAt && inWindow(pr.mergedAt)) p.prsMerged++;
        }
        if (pr.mergedAt && inWindow(pr.mergedAt)) {
          wp(weekOf(pr.mergedAt)).prs++;
          merged++;
          mergeHours.push(
            (Date.parse(pr.mergedAt) - Date.parse(pr.createdAt)) / 3_600_000
          );
          touch(pr.mergedAt);
          if (pr.reviews.some((r) => r.login && r.login !== pr.login && !isBot(r.login)))
            reviewed++;
        }
        const reviewers = new Set<string>();
        for (const r of pr.reviews) {
          if (!r.login || r.login === pr.login || skip(r.login)) continue;
          if (r.submittedAt && !inWindow(r.submittedAt)) continue;
          if (reviewers.has(r.login)) continue;
          reviewers.add(r.login);
          const p = person(r.login.toLowerCase(), r.login, null);
          p.reviews++;
          if (r.submittedAt) {
            p.weeks.add(weekOf(r.submittedAt));
            wp(weekOf(r.submittedAt)).reviews++;
            touch(r.submittedAt);
          }
        }
      }

      for (const is of repo.issues) {
        if (!inWindow(is.createdAt)) continue;
        if (is.state === 'OPEN') openIssues++;
        if (is.login && !skip(is.login))
          person(is.login.toLowerCase(), is.login, null).issuesOpened++;
        if (is.state === 'CLOSED')
          for (const a of is.assignees)
            if (a && !skip(a)) person(a.toLowerCase(), a, null).issuesClosed++;
      }
    }

    // Merge unlinked "email:" / "name:" authors into a login with the same display name.
    for (const [key, p] of [...people]) {
      if (p.login || !p.name) continue;
      const match = [...people.values()].find(
        (q) =>
          q.login &&
          (q.name?.toLowerCase() === p.name!.toLowerCase() ||
            q.login.toLowerCase() === p.name!.toLowerCase())
      );
      if (!match) continue;
      match.commits += p.commits;
      match.additions += p.additions;
      match.deletions += p.deletions;
      p.weeks.forEach((w) => match.weeks.add(w));
      people.delete(key);
    }

    const members: PersonStats[] = [...people.values()]
      .map(({ weeks, ...p }) => {
        const issues = p.issuesOpened + p.issuesClosed;
        const score =
          p.commits * scoreWeights.commits +
          p.prsMerged * scoreWeights.prsMerged +
          p.reviews * scoreWeights.reviews +
          p.issuesOpened * scoreWeights.issuesOpened +
          p.issuesClosed * scoreWeights.issuesClosed;
        return {
          ...p,
          lines: p.additions + p.deletions,
          issues,
          activeWeeks: weeks.size,
          score,
        };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    const sum = (k: keyof PersonStats) =>
      members.reduce((a, p) => a + (p[k] as number), 0);

    const weeklyArr = [...weekly.values()].sort((a, b) => a.week - b.week);
    const peak = weeklyArr.reduce<WeekPoint | null>(
      (best, w) => (!best || w.commits > best.commits ? w : best),
      null
    );
    const totalCommits = sum('commits');
    let night = 0;
    let early = 0;
    let weekend = 0;
    punch.forEach((row, dow) =>
      row.forEach((n, h) => {
        if (h >= 22 || h < 4) night += n;
        if (h >= 5 && h < 9) early += n;
        if (dow === 0 || dow === 6) weekend += n;
        cohortPunch[dow][h] += n;
      })
    );

    for (const w of weeklyArr) {
      const c = cohortWeekly.get(w.week) ?? { ...w, commits: 0, prs: 0, reviews: 0 };
      c.commits += w.commits;
      c.prs += w.prs;
      c.reviews += w.reviews;
      cohortWeekly.set(w.week, c);
    }
    langs.forEach((b, l) => cohortLang.set(l, (cohortLang.get(l) ?? 0) + b));
    cohortMergeHours.push(...mergeHours);
    cohortMerged += merged;
    cohortReviewed += reviewed;

    const main = [...teamRepos].sort((a, b) => b.commits.length - a.commits.length)[0];
    teams.push({
      key: `team-${team}`,
      team,
      // Repos without a team number in their name are shown under their repo name.
      name: teamPattern.test(main.name) ? `Team ${team}` : main.name,
      repos: teamRepos.map((r) => ({
        name: r.name,
        url: r.meta.url,
        isPrivate: r.meta.isPrivate,
      })),
      description: main.meta.description,
      contributors: members.length,
      commits: totalCommits,
      additions: sum('additions'),
      deletions: sum('deletions'),
      prsOpened: sum('prsOpened'),
      prsMerged: merged,
      reviews: sum('reviews'),
      issuesOpened: sum('issuesOpened'),
      issuesClosed: sum('issuesClosed'),
      openPrs,
      openIssues,
      score: sum('score'),
      collaboration: round(1 - gini(members.map((m) => m.commits))),
      reviewCoverage: merged ? round(reviewed / merged) : 0,
      medianMergeHours: (() => {
        const m = median(mergeHours);
        return m === null ? null : round(m, 1);
      })(),
      peakWeek: peak
        ? { week: peak.week, start: peak.start, commits: peak.commits }
        : null,
      nightOwlShare: totalCommits ? round(night / totalCommits) : 0,
      earlyBirdShare: totalCommits ? round(early / totalCommits) : 0,
      weekendShare: totalCommits ? round(weekend / totalCommits) : 0,
      reviewerShare: members.length
        ? round(members.filter((m) => m.reviews > 0).length / members.length)
        : 0,
      lastActivity: last,
      languages: [...langs]
        .map(([name, bytes]) => ({ name, bytes }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 8),
      weekly: weeklyArr,
      punch,
      members,
      thisWeekCommits: weekly.get(nowWeek)?.commits ?? 0,
    });
  }

  teams.sort((a, b) => b.score - a.score);

  const weeklyAll = [...cohortWeekly.values()].sort((a, b) => a.week - b.week);
  const t = (k: 'commits' | 'prsMerged' | 'reviews' | 'issuesOpened' | 'contributors') =>
    teams.reduce((a, x) => a + x[k], 0);

  // Average cumulative commits per team, by term week (for "on track" comparison).
  const lastWeek = isCurrent ? nowWeek : Math.max(...weeklyAll.map((w) => w.week), 0);
  const cumulative: { week: number; value: number }[] = [];
  let running = 0;
  for (let w = -termLeadWeeks; w <= lastWeek; w++) {
    running += cohortWeekly.get(w)?.commits ?? 0;
    cumulative.push({ week: w, value: round(running / Math.max(teams.length, 1), 1) });
  }

  const weekTotals = (w: number) => ({
    commits: cohortWeekly.get(w)?.commits ?? 0,
    prsMerged: cohortWeekly.get(w)?.prs ?? 0,
    reviews: cohortWeekly.get(w)?.reviews ?? 0,
  });

  const n = Math.max(teams.length, 1);
  const lines = teams.reduce((a, x) => a + x.additions + x.deletions, 0);

  return {
    org: cfg.org,
    slug,
    session: summer ? 'summer' : 'winter',
    year: cfg.year,
    label: cfg.label,
    note: cfg.note ?? null,
    isCurrent,
    termStart: termStart.toISOString().slice(0, 10),
    teams,
    totals: {
      teams: teams.length,
      contributors: t('contributors'),
      commits: t('commits'),
      prsMerged: t('prsMerged'),
      reviews: t('reviews'),
      issuesOpened: t('issuesOpened'),
      lines,
    },
    avgPerTeam: {
      commits: round(t('commits') / n, 1),
      prsMerged: round(t('prsMerged') / n, 1),
      reviews: round(t('reviews') / n, 1),
      issuesOpened: round(t('issuesOpened') / n, 1),
    },
    weekly: weeklyAll,
    cumulative,
    punch: cohortPunch,
    languages: [...cohortLang]
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes),
    thisWeek: weekTotals(nowWeek),
    lastWeek: weekTotals(nowWeek - 1),
    medianMergeHours: (() => {
      const m = median(cohortMergeHours);
      return m === null ? null : round(m, 1);
    })(),
    reviewCoverage: cohortMerged ? round(cohortReviewed / cohortMerged) : 0,
    staffExcluded: [...staff].sort(),
  };
}

export function aggregate() {
  const now = new Date();
  const built = cohorts
    .map((c) => buildCohort(c, now))
    .filter((c): c is CohortStats => !!c);

  const summary: Summary = {
    generatedAt: now.toISOString(),
    currentYear,
    currentCohort,
    topN,
    scoreWeights,
    lineOutlierThreshold,
    timezone,
    cohorts: built,
  };
  writeFileSync(path.join(DATA_DIR, 'summary.json'), JSON.stringify(summary));

  for (const c of built) {
    console.log(
      `${c.org}: ${c.totals.teams} teams, ${c.totals.contributors} contributors, ` +
        `${c.totals.commits} commits, ${c.totals.prsMerged} merged PRs, ${c.totals.reviews} reviews` +
        (c.staffExcluded.length ? ` (staff excluded: ${c.staffExcluded.join(', ')})` : '')
    );
  }
  console.log(`Wrote data/summary.json`);
}

// Run directly: `pnpm aggregate`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  aggregate();
}
