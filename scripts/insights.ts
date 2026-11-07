/**
 * Cross-cohort insights. Reads the same raw files as aggregate.ts and reduces
 * every metric to a team rate, a cohort median, then an era median.
 * No network. Unknown data stays null — it is never stored as zero.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { TZDate } from '@date-fns/tz';
import {
  differenceInMilliseconds,
  isMonday,
  nextMonday,
  subDays,
  subWeeks,
} from 'date-fns';
import { millisecondsInWeek } from 'date-fns/constants';

import { hoursBetween, parseDate, weeksSince } from '../lib/dates';
import type { Era, Insights, InsightMetric, ShareSlice } from '../lib/types/insights';
import type { CohortStats, RawRepo, TeamStats } from '../lib/types/stats';
import {
  AI_BOTS,
  cohortDir,
  cohortSlug,
  cohorts as cohortConfigs,
  excludeLogins,
  lineOutlierThreshold,
  repoExclude,
  termLeadWeeks,
} from '../sync.config';
import {
  MIN_TEAMS,
  bootstrapCI,
  eraOf,
  median,
  windowed,
  type BootstrapEstimate,
} from './lib/stats';

const RAW_DIR = path.join(process.cwd(), 'data', 'raw');

/** Weeks from term start through mid-August (summer) or the end of April (full year). */
function termWeeks(year: number, summer: boolean): number {
  const first = new TZDate(year, summer ? 4 : 8, 1, 'UTC');
  const start = subDays(isMonday(first) ? first : nextMonday(first), 1);
  const end = summer
    ? new TZDate(year, 7, 15, 'UTC')
    : new TZDate(year + 1, 3, 30, 'UTC');
  return Math.max(1, weeksSince(end, start));
}
const LARGE_COMMIT_LINES = 300;
const BOT_NAME = /\[bot\]|github[- ]?actions?|dependabot|github classroom/i;
const ERAS: Era[] = ['pre-ai', 'early-ai', 'agentic'];
const TOOL_ORDER = ['claude', 'copilot', 'cursor', 'codex', 'gemini', 'aider', 'devin'];

const round = (n: number, d = 6) => Math.round(n * 10 ** d) / 10 ** d;

function loadRaw(dirName: string): RawRepo[] {
  const dir = path.join(RAW_DIR, dirName);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as RawRepo)
    .filter((repo) => !repoExclude.some((re) => re.test(repo.name)));
}

function authorKey(login: string | null, email: string | null, name: string | null) {
  if (login) return login.toLowerCase();
  if (email && !email.endsWith('noreply.github.com'))
    return `email:${email.toLowerCase()}`;
  return `name:${(name ?? 'unknown').toLowerCase()}`;
}

interface CommitRow {
  week: number;
  /** Exact weeks since term start (fractional), for term-relative curves. */
  at: number;
  /** Lines changed, or -1 when the commit is over the outlier cap. */
  lines: number;
  scanned: boolean;
  trailers: string[];
}

interface MergedRow {
  week: number;
  additions: number;
  files: number;
  hours: number;
  ai: boolean;
}

interface PersonWeek {
  week: number;
  key: string;
}

interface TeamFacts {
  commits: CommitRow[];
  merged: MergedRow[];
  personWeeks: PersonWeek[];
}

function scanCohort(c: CohortStats): {
  facts: Map<number, TeamFacts>;
  scanned: boolean;
} {
  const cfg = cohortConfigs.find((cfg) => cohortSlug(cfg) === c.slug);
  const repos = cfg ? loadRaw(cohortDir(cfg)) : [];
  const termStart = parseDate(c.termStart);
  const windowStart = subWeeks(termStart, termLeadWeeks);
  const windowEnd =
    c.session === 'summer'
      ? new TZDate(c.year, 8, 15, 23, 59, 59, 'UTC')
      : new TZDate(c.year + 1, 4, 31, 23, 59, 59, 'UTC');
  const inWindow = (iso: string | null) => {
    if (!iso) return false;
    const t = parseDate(iso);
    return t >= windowStart && t <= windowEnd;
  };
  const weeksIn = (iso: string) =>
    differenceInMilliseconds(parseDate(iso), termStart) / millisecondsInWeek;
  const weekOf = (iso: string) => Math.floor(weeksIn(iso));
  const staff = new Set(c.staffExcluded.map((s) => s.toLowerCase()));
  const skip = (login: string | null) => {
    if (!login) return false;
    const k = login.toLowerCase();
    return (
      login.endsWith('[bot]') ||
      staff.has(k) ||
      excludeLogins.some((x) => x.toLowerCase() === k)
    );
  };
  const isAiBot = (login: string | null) =>
    !!login && AI_BOTS.some((x) => x.toLowerCase() === login.toLowerCase());

  const byTeam = new Map<number, RawRepo[]>();
  for (const repo of repos) {
    const list = byTeam.get(repo.team) ?? [];
    list.push(repo);
    byTeam.set(repo.team, list);
  }

  let scanned = false;
  const facts = new Map<number, TeamFacts>();
  for (const [team, teamRepos] of byTeam) {
    const seen = new Set<string>();
    const commits: CommitRow[] = [];
    const merged: MergedRow[] = [];
    const personWeeks: PersonWeek[] = [];
    const seenPw = new Set<string>();
    const addPw = (week: number, key: string) => {
      const id = `${week}|${key}`;
      if (seenPw.has(id)) return;
      seenPw.add(id);
      personWeeks.push({ week, key });
    };

    for (const repo of teamRepos) {
      if (repo.meta.trailersScanned) scanned = true;
      for (const commit of repo.commits) {
        if (seen.has(commit.oid) || !inWindow(commit.date) || skip(commit.login))
          continue;
        if (BOT_NAME.test(`${commit.name ?? ''} ${commit.email ?? ''}`)) continue;
        seen.add(commit.oid);
        const week = weekOf(commit.date);
        const size = commit.additions + commit.deletions;
        commits.push({
          week,
          at: weeksIn(commit.date),
          lines: size <= lineOutlierThreshold ? size : -1,
          scanned: !!repo.meta.trailersScanned,
          trailers: repo.meta.trailersScanned ? (commit.aiTrailers ?? []) : [],
        });
        addPw(week, authorKey(commit.login, commit.email, commit.name));
      }
      for (const pr of repo.prs) {
        if (!inWindow(pr.createdAt)) continue;
        if (pr.login && !skip(pr.login))
          addPw(weekOf(pr.createdAt), pr.login.toLowerCase());
        if (pr.mergedAt && inWindow(pr.mergedAt)) {
          merged.push({
            week: weekOf(pr.mergedAt),
            additions: pr.additions,
            files: pr.changedFiles,
            hours: hoursBetween(pr.mergedAt, pr.createdAt),
            ai: isAiBot(pr.login) || pr.reviews.some((r) => isAiBot(r.login)),
          });
        }
      }
    }
    facts.set(team, { commits, merged, personWeeks });
  }
  return { facts, scanned };
}

function countedLines(rows: CommitRow[]): number[] {
  return rows.filter((r) => r.lines >= 0).map((r) => r.lines);
}

function personWeekCount(rows: PersonWeek[], W: number | null): number {
  const list = W === null ? rows : windowed(rows, (r) => r.week, W);
  return new Set(list.map((r) => `${r.week}|${r.key}`)).size;
}

function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, n) => a + n, 0) / xs.length : null;
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return numerator / denominator;
}

interface MetricSpec {
  key: string;
  label: string;
  unit: string;
  /** Full-term metrics leave the in-progress cohort out of the era median. */
  fullTerm: boolean;
  /**
   * Rare 0/1 per-team signals ("any AI trace?"): average across teams, so the result
   * is the share of teams. A median of mostly-zero values would read 0% everywhere.
   */
  teamShare?: boolean;
  /** Weekly rates: scale a summer term down to a full-year length before mixing. */
  scaleSummer?: boolean;
  session?: 'winter' | 'summer';
  value: (team: TeamStats, facts: TeamFacts | undefined, W: number) => number | null;
}

function buildMetric(
  spec: MetricSpec,
  cohorts: CohortStats[],
  factsByCohort: Map<string, Map<number, TeamFacts>>,
  W: number,
  summerScale: number
): InsightMetric {
  const source = spec.session
    ? cohorts.filter((c) => c.session === spec.session)
    : cohorts;
  const cohortsOut = source
    .filter((c) => c.teams.length > 0)
    .map((c) => {
      const facts = factsByCohort.get(c.slug);
      const scale = spec.scaleSummer && c.session === 'summer' ? summerScale : 1;
      const values = [...c.teams]
        .sort((a, b) => a.team - b.team)
        .map((t) => {
          const raw = spec.value(t, facts?.get(t.team), W);
          return raw === null || !Number.isFinite(raw) ? null : raw * scale;
        })
        .filter((v): v is number => v !== null);
      const value = spec.teamShare ? mean(values) : median(values);
      return {
        slug: c.slug,
        label: c.label,
        year: c.year,
        session: c.session,
        era: eraOf(c.year),
        value: value === null ? null : round(value),
        nTeams: c.teams.length,
        faded: c.teams.length < MIN_TEAMS,
        inProgress: spec.fullTerm && c.isCurrent,
        samples: values,
      };
    });

  const eras = Object.fromEntries(
    ERAS.map((era) => {
      const groups = cohortsOut
        .filter((c) => c.era === era && !c.faded && !c.inProgress && c.samples.length)
        .sort((a, b) => a.slug.localeCompare(b.slug))
        .map((c) => c.samples);
      return [
        era,
        roundEstimate(
          spec.teamShare ? bootstrapCI(groups, undefined, mean) : bootstrapCI(groups)
        ),
      ];
    })
  ) as InsightMetric['eras'];

  return {
    key: spec.key,
    label: spec.label,
    unit: spec.unit,
    eras,
    cohorts: cohortsOut.map((point) => ({
      slug: point.slug,
      label: point.label,
      year: point.year,
      session: point.session,
      era: point.era,
      value: point.value,
      nTeams: point.nTeams,
      faded: point.faded,
      inProgress: point.inProgress,
    })),
  };
}

function roundEstimate(estimate: BootstrapEstimate | null) {
  if (!estimate) return null;
  return {
    value: round(estimate.value),
    lo: round(estimate.lo),
    hi: round(estimate.hi),
    nTeams: estimate.nTeams,
    nCohorts: estimate.nCohorts,
    pooled: round(estimate.pooled),
  };
}

function weekToQuarter(team: TeamStats): number | null {
  const total = team.weekly.reduce((a, w) => a + w.commits, 0);
  if (!total) return null;
  let running = 0;
  for (const w of [...team.weekly].sort((a, b) => a.week - b.week)) {
    running += w.commits;
    if (running / total >= 0.25) return w.week;
  }
  return null;
}

function shareSlices(
  counts: Map<string, number>,
  order: string[],
  keep: number
): ShareSlice[] {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  const ranked = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const top = ranked.slice(0, keep);
  const rest = ranked.slice(keep).reduce((a, [, n]) => a + n, 0);
  const slices = top.map(([name, n]) => ({ name, share: round(n / total, 4) }));
  if (rest > 0) slices.push({ name: 'Other', share: round(rest / total, 4) });
  return slices;
}

export function buildInsights(cohorts: CohortStats[], now: Date): Insights {
  const current = cohorts.find((c) => c.isCurrent);
  const W = current ? Math.max(0, weeksSince(now, current.termStart)) : 0;

  const factsByCohort = new Map<string, Map<number, TeamFacts>>();
  let trailersScanned = false;
  for (const c of cohorts) {
    const scanned = scanCohort(c);
    factsByCohort.set(c.slug, scanned.facts);
    if (scanned.scanned) trailersScanned = true;
  }

  const facts = (slug: string, team: number) => factsByCohort.get(slug)?.get(team);

  const specs: MetricSpec[] = [
    {
      key: 'commitSize',
      label: 'Median',
      unit: 'lines',
      fullTerm: true,
      value: (_t, f) => (f ? median(countedLines(f.commits)) : null),
    },
    {
      key: 'largeCommitShare',
      label: 'Large',
      unit: 'of commits',
      fullTerm: true,
      value: (_t, f) => {
        if (!f) return null;
        const lines = countedLines(f.commits);
        if (!lines.length) return null;
        return lines.filter((n) => n > LARGE_COMMIT_LINES).length / lines.length;
      },
    },
    {
      key: 'prAdditions',
      label: 'PR additions',
      unit: 'lines',
      fullTerm: true,
      value: (_t, f) =>
        f?.merged.length ? median(f.merged.map((m) => m.additions)) : null,
    },
    {
      key: 'prFiles',
      label: 'PR files',
      unit: 'files',
      fullTerm: true,
      value: (_t, f) => (f?.merged.length ? median(f.merged.map((m) => m.files)) : null),
    },
    {
      key: 'prHours',
      label: 'To merge',
      unit: 'to merge',
      fullTerm: true,
      value: (_t, f) => (f?.merged.length ? median(f.merged.map((m) => m.hours)) : null),
    },
    {
      key: 'commitsPerPw',
      label: 'Commits',
      unit: 'per person-week',
      fullTerm: false,
      scaleSummer: true,
      value: (_t, f, w) => {
        if (!f) return null;
        const rows = windowed(f.commits, (r) => r.week, w);
        return rate(rows.length, personWeekCount(f.personWeeks, w));
      },
    },
    {
      key: 'prsPerPw',
      label: 'Merged PRs',
      unit: 'per person-week',
      fullTerm: false,
      scaleSummer: true,
      value: (_t, f, w) => {
        if (!f) return null;
        const rows = windowed(f.merged, (r) => r.week, w);
        return rate(rows.length, personWeekCount(f.personWeeks, w));
      },
    },
    {
      key: 'linesPerPw',
      label: 'Lines',
      unit: 'per person-week',
      fullTerm: false,
      scaleSummer: true,
      value: (_t, f, w) => {
        if (!f) return null;
        const lines = countedLines(windowed(f.commits, (r) => r.week, w)).reduce(
          (a, n) => a + n,
          0
        );
        return rate(lines, personWeekCount(f.personWeeks, w));
      },
    },
    {
      key: 'churn',
      label: 'Churn',
      unit: 'deleted per line added',
      fullTerm: true,
      value: (t) => (t.additions > 0 ? t.deletions / t.additions : null),
    },
    {
      key: 'earlyOutput',
      label: 'Early output',
      unit: 'of commits',
      fullTerm: false,
      value: (_t, f, w) => {
        if (!f) return null;
        const all = windowed(f.commits, (r) => r.week, w);
        if (!all.length) return null;
        const early = windowed(f.commits, (r) => r.week, Math.min(3, w));
        return early.length / all.length;
      },
    },
    {
      key: 'weekToQuarter',
      label: 'Quarter mark',
      unit: 'week of term',
      fullTerm: true,
      value: (t) => weekToQuarter(t),
    },
    {
      key: 'reviewCoverage',
      label: 'Reviewed',
      unit: 'of merged PRs',
      fullTerm: true,
      value: (t) => (t.prsMerged > 0 ? t.reviewCoverage : null),
    },
    {
      key: 'discussionPerPr',
      label: 'Discussion',
      unit: 'per merged PR',
      fullTerm: true,
      value: (t) => (t.prsMerged > 0 ? t.discussionPerPr : null),
    },
    {
      key: 'languagesPerTeam',
      label: 'Languages',
      unit: 'per team',
      fullTerm: true,
      value: (t) => (t.languageCount > 0 ? t.languageCount : null),
    },
    {
      key: 'aiTrailers',
      label: 'AI co-authors',
      unit: 'of teams',
      fullTerm: false,
      teamShare: true,
      value: (_t, f, w) => {
        if (!f) return null;
        const scanned = windowed(f.commits, (r) => r.week, w).filter((r) => r.scanned);
        if (!scanned.length) return null;
        return scanned.some((r) => r.trailers.length > 0) ? 1 : 0;
      },
    },
    {
      key: 'aiBots',
      label: 'AI bots',
      unit: 'of teams',
      fullTerm: true,
      teamShare: true,
      value: (_t, f) => (f?.merged.length ? (f.merged.some((m) => m.ai) ? 1 : 0) : null),
    },
    {
      key: 'prsPer100',
      label: 'Per 100 commits',
      unit: 'merged PRs',
      fullTerm: false,
      value: (_t, f, w) => {
        if (!f) return null;
        const commits = windowed(f.commits, (r) => r.week, w).length;
        const prs = windowed(f.merged, (r) => r.week, w).length;
        return rate(prs * 100, commits);
      },
    },
    {
      key: 'prWeeks',
      label: 'PR weeks',
      unit: 'of active weeks',
      fullTerm: false,
      value: (_t, f, w) => {
        if (!f) return null;
        const active = new Set(windowed(f.commits, (r) => r.week, w).map((r) => r.week));
        if (!active.size) return null;
        const withPr = new Set(windowed(f.merged, (r) => r.week, w).map((r) => r.week));
        let both = 0;
        for (const week of active) if (withPr.has(week)) both++;
        return both / active.size;
      },
    },
    {
      key: 'nightOwl',
      label: 'Night owls',
      unit: 'of activity',
      fullTerm: true,
      value: (t) => (t.activity > 0 ? t.nightOwlShare : null),
    },
    {
      key: 'weekend',
      label: 'Weekends',
      unit: 'of activity',
      fullTerm: true,
      value: (t) => (t.activity > 0 ? t.weekendShare : null),
    },
    {
      key: 'holiday',
      label: 'Holidays',
      unit: 'of activity',
      fullTerm: true,
      value: (t) => (t.activity > 0 ? t.holidayActivity / t.activity : null),
    },
    {
      key: 'pwWinter',
      label: 'Winter',
      unit: 'commits per person-week',
      fullTerm: true,
      session: 'winter',
      value: (t, f) => (f ? rate(t.commits, personWeekCount(f.personWeeks, null)) : null),
    },
    {
      key: 'pwSummer',
      label: 'Summer',
      unit: 'commits per person-week',
      fullTerm: true,
      session: 'summer',
      scaleSummer: true,
      value: (t, f) => (f ? rate(t.commits, personWeekCount(f.personWeeks, null)) : null),
    },
  ];

  const fullYearWeeks = Math.round(
    median(
      cohorts.filter((c) => c.session !== 'summer').map((c) => termWeeks(c.year, false))
    ) ?? 34
  );
  const summerWeeks = Math.round(
    median(
      cohorts.filter((c) => c.session === 'summer').map((c) => termWeeks(c.year, true))
    ) ?? 14
  );
  const summerScale = summerWeeks / fullYearWeeks;

  const metrics = Object.fromEntries(
    specs.map((spec) => [
      spec.key,
      buildMetric(spec, cohorts, factsByCohort, W, summerScale),
    ])
  );

  // Curves run on % of term, not weeks: weeks 0–W of a ~34-week year are its first
  // quarter, but over half of a ~14-week summer. Every cohort covers the same share
  // of its own term that the current cohort has had so far.
  const currentTerm = current?.session === 'summer' ? summerWeeks : fullYearWeeks;
  const curveSpan = Math.max(1, Math.round((W / currentTerm) * 100));
  const curves = cohorts
    .filter((c) => c.teams.length > 0)
    .map((c) => {
      const term = termWeeks(c.year, c.session === 'summer');
      const pcts: number[] = [];
      for (const team of c.teams) {
        const f = facts(c.slug, team.team);
        if (!f) continue;
        for (const commit of f.commits) {
          const pct = (commit.at / term) * 100;
          if (pct >= 0 && pct <= curveSpan) pcts.push(pct);
        }
      }
      if (!pcts.length) return null;
      pcts.sort((a, b) => a - b);
      const points = [];
      let i = 0;
      for (let x = 0; x <= curveSpan; x++) {
        while (i < pcts.length && pcts[i] <= x) i++;
        points.push({ x, value: Math.round((i / pcts.length) * 1000) / 10 });
      }
      return {
        slug: c.slug,
        session: c.session,
        year: c.year,
        label: c.label,
        isCurrent: c.isCurrent,
        points,
      };
    })
    .filter((c): c is NonNullable<typeof c> => !!c);

  const languages = Object.fromEntries(
    ERAS.map((era) => {
      const bytes = new Map<string, number>();
      for (const c of cohorts) {
        if (eraOf(c.year) !== era || c.teams.length < MIN_TEAMS || c.isCurrent) continue;
        for (const team of c.teams)
          for (const lang of team.languages)
            bytes.set(lang.name, (bytes.get(lang.name) ?? 0) + lang.bytes);
      }
      return [era, shareSlices(bytes, [], 6)];
    })
  ) as Insights['languages'];

  const toolCounts = new Map<string, number>();
  const toolTeams = new Map<string, Set<string>>();
  for (const c of cohorts) {
    if (eraOf(c.year) !== 'agentic' || c.teams.length < MIN_TEAMS) continue;
    for (const team of c.teams) {
      const f = facts(c.slug, team.team);
      if (!f) continue;
      for (const commit of windowed(f.commits, (r) => r.week, W)) {
        if (!commit.scanned) continue;
        for (const tool of commit.trailers) {
          toolCounts.set(tool, (toolCounts.get(tool) ?? 0) + 1);
          const teams = toolTeams.get(tool) ?? new Set<string>();
          teams.add(`${c.slug}|${team.team}`);
          toolTeams.set(tool, teams);
        }
      }
    }
  }
  const tools = shareSlices(toolCounts, TOOL_ORDER, TOOL_ORDER.length).map((s) => ({
    ...s,
    commits: toolCounts.get(s.name),
    teams: toolTeams.get(s.name)?.size,
  }));

  return {
    window: { week: W, termPct: curveSpan },
    eras: [
      { key: 'pre-ai', label: 'Before AI', years: '2017–2021' },
      { key: 'early-ai', label: 'Early AI', years: '2022–2023' },
      { key: 'agentic', label: 'Agentic', years: '2024–' },
    ],
    trailersScanned,
    termScale: { fullYearWeeks, summerWeeks },
    metrics,
    curves,
    languages,
    tools,
  };
}
