import 'server-only';

import type { TrendSeries } from '@/components/charts/CohortTrendChart';
import type { BarMetric, BarRow } from '@/components/charts/MetricBarChart';
import type { RadialItem } from '@/components/charts/TeamRadial';
import type { TeamRow } from '@/components/stats/TeamTable';
import type { TeamTopView, TopEntryView } from '@/components/stats/TopContributors';
import { topByMetric } from '@/lib/data';
import { cohortColor, displayName, fmt, fmtCompact } from '@/lib/format';
import type { CohortStats, MetricKey, Summary, TeamStats } from '@/lib/types/stats';

export const teamHref = (slug: string, t: TeamStats) => `/${slug}/${t.team}`;

export function teamTopViews(c: CohortStats, n: number): TeamTopView[] {
  return [...c.teams]
    .sort((a, b) => a.team - b.team)
    .map((t) => {
      const top = topByMetric(t.members, n);
      return {
        key: t.key,
        name: t.name,
        href: teamHref(c.slug, t),
        top: Object.fromEntries(
          Object.entries(top).map(([k, list]) => [
            k,
            list.map((e) => ({ ...e, name: displayName(e) })),
          ])
        ) as TeamTopView['top'],
      };
    });
}

/** Top contributors across the whole cohort, per metric, each tagged with their team. */
export function cohortTopView(
  c: CohortStats,
  n: number
): Record<MetricKey, TopEntryView[]> {
  const people = c.teams.flatMap((t) =>
    t.members.map((m) => ({ m, team: { name: t.name, href: teamHref(c.slug, t) } }))
  );
  const keys: MetricKey[] = [
    'score',
    'commits',
    'prsMerged',
    'reviews',
    'issues',
    'lines',
  ];
  return Object.fromEntries(
    keys.map((k) => [
      k,
      people
        .filter(({ m }) => m[k] > 0)
        .sort((a, b) => b.m[k] - a.m[k])
        .slice(0, n)
        .map(({ m, team }) => ({
          id: m.id,
          login: m.login,
          name: displayName(m),
          avatarUrl: m.avatarUrl,
          value: m[k],
          team,
        })),
    ])
  ) as Record<MetricKey, TopEntryView[]>;
}

export function teamRows(c: CohortStats): TeamRow[] {
  return c.teams.map((t) => ({
    team: t.team,
    name: t.name,
    href: teamHref(c.slug, t),
    isPrivate: t.repos.some((r) => r.isPrivate),
    contributors: t.contributors,
    commits: t.commits,
    prsMerged: t.prsMerged,
    reviews: t.reviews,
    issuesOpened: t.issuesOpened,
    reviewCoverage: t.reviewCoverage,
    collaboration: t.collaboration,
    openPrs: t.openPrs,
    openIssues: t.openIssues,
  }));
}

/** Per-team bars for the cohort page (one measure at a time). */
export function teamBars(c: CohortStats): { rows: BarRow[]; metrics: BarMetric[] } {
  const rows = c.teams.map((t) => ({
    label: `T${t.team}`,
    name: t.name,
    values: {
      score: t.score,
      commits: t.commits,
      prsMerged: t.prsMerged,
      reviews: t.reviews,
    },
  }));
  const sum = (k: string) => rows.reduce((a, r) => a + (r.values[k as 'score'] ?? 0), 0);
  return {
    rows,
    metrics: [
      { key: 'score', label: 'Overall', total: fmtCompact(sum('score')), unit: 'pts' },
      { key: 'commits', label: 'Commits', total: fmtCompact(sum('commits')) },
      { key: 'prsMerged', label: 'Merged PRs', total: fmt(sum('prsMerged')) },
      { key: 'reviews', label: 'Reviews', total: fmt(sum('reviews')) },
    ],
  };
}

/** Per-cohort bars (average per team) for the overview. */
export function cohortBars(s: Summary): { rows: BarRow[]; metrics: BarMetric[] } {
  const cohorts = s.cohorts.filter((c) => c.teams.length).sort(byTermStart);
  // Short axis labels so every cohort fits: "23–24" year-long, "S24" summer.
  // The tooltip keeps the full label.
  const short = (c: CohortStats) =>
    c.session === 'summer'
      ? `S${String(c.year).slice(2)}`
      : `${String(c.year).slice(2)}–${String(c.year + 1).slice(2)}`;
  const rows = cohorts.map((c) => ({
    label: short(c),
    name: `${c.label} · average per team`,
    values: { ...c.avgPerTeam },
  }));
  const all = (k: keyof CohortStats['avgPerTeam']) =>
    fmtCompact(cohorts.reduce((a, c) => a + c.totals[k], 0));
  return {
    rows,
    metrics: [
      { key: 'commits', label: 'Commits', total: all('commits') },
      { key: 'prsMerged', label: 'Merged PRs', total: all('prsMerged') },
      { key: 'reviews', label: 'Reviews', total: all('reviews') },
      { key: 'issuesOpened', label: 'Issues', total: all('issuesOpened') },
    ],
  };
}

/** 0–100 team habits for the radial chart. */
export function teamHabits(c: CohortStats, t: TeamStats): RadialItem[] {
  const lastWeek = c.isCurrent
    ? currentWeek(c)
    : Math.max(...t.weekly.map((w) => w.week), 0);
  const span = Math.max(1, lastWeek + 1);
  const active = t.weekly.filter(
    (w) => w.week >= 0 && w.week <= lastWeek && w.commits > 0
  ).length;
  return [
    {
      key: 'review',
      label: 'Reviews',
      value: t.reviewCoverage * 100,
      hint: 'merged PRs reviewed by a teammate',
    },
    {
      key: 'collab',
      label: 'Sharing',
      value: t.collaboration * 100,
      hint: 'how evenly commits are shared',
    },
    {
      key: 'steady',
      label: 'Steady',
      value: Math.min(100, (active / span) * 100),
      hint: 'weeks with commits this term',
    },
  ];
}

/** Oldest first, by when the term started (summer 2024 sits between 2023–24 and 2024–25). */
export const byTermStart = (a: CohortStats, b: CohortStats) =>
  a.termStart.localeCompare(b.termStart);

/**
 * Cohorts in the trend chart: the latest 4 year-long and 3 summer sessions, as many as
 * the color ramps (--cohort-1..4, --summer-1..3) can tell apart. Older cohorts would
 * share a color and crowd the header.
 */
const TREND_WINTER_YEARS = 4;
const TREND_SUMMER_YEARS = 3;

/**
 * Recent cohorts with data, oldest first. Summer sessions are a shorter term, so their
 * lines simply end earlier; the chart draws them dashed.
 */
/**
 * With `include` (a cohort's own page), every cohort of that session is shown instead
 * of just the recent ones: summer next to summer, year-long next to year-long.
 */
export function trendSeries(s: Summary, include?: string): TrendSeries[] {
  const session = s.cohorts.find((c) => c.slug === include)?.session;
  return s.cohorts
    .filter((c) => c.teams.length)
    .filter((c) => !session || c.session === session)
    .filter(
      (c) =>
        !!session ||
        s.currentYear - c.year <
          (c.session === 'summer' ? TREND_SUMMER_YEARS : TREND_WINTER_YEARS)
    )
    .sort(byTermStart)
    .map((c) => ({
      slug: c.slug,
      session: c.session,
      year: c.year,
      label: c.label,
      color: cohortColor(c.year, s.currentYear, c.session),
      isCurrent: c.isCurrent,
      points: c.cumulative.filter((p) => p.week <= 34),
    }));
}

/** One team's cumulative commits by term week, on the same weeks as its cohort's line. */
export function teamTrend(c: CohortStats, t: TeamStats): TrendSeries {
  const byWeek = new Map(t.weekly.map((w) => [w.week, w.commits]));
  let running = 0;
  return {
    slug: `team-${t.key}`,
    session: c.session,
    year: c.year,
    label: t.name,
    color: 'var(--foreground)',
    isCurrent: false,
    points: c.cumulative
      .map((p) => ({ week: p.week, value: (running += byWeek.get(p.week) ?? 0) }))
      .filter((p) => p.week <= 34),
  };
}

export function currentWeek(c: CohortStats, now = Date.now()) {
  return Math.floor((now - Date.parse(c.termStart)) / (7 * 86_400_000));
}

/** Every contributor across all cohorts, with where they were (for all-time records). */
export function everyone(s: Summary) {
  return s.cohorts.flatMap((c) =>
    c.teams.flatMap((t) =>
      t.members.map((m) => ({ m, name: displayName(m), team: t, cohort: c }))
    )
  );
}

/** Best contributor in a cohort by a metric (for record cards). */
export function cohortBest(c: CohortStats, key: MetricKey) {
  let best: {
    name: string;
    login: string | null;
    team: TeamStats;
    value: number;
  } | null = null;
  for (const t of c.teams)
    for (const m of t.members)
      if (!best || m[key] > best.value)
        best = { name: displayName(m), login: m.login, team: t, value: m[key] };
  return best;
}

export function topTeams<T>(
  c: CohortStats,
  value: (t: TeamStats) => number | null,
  n = 3,
  filter: (t: TeamStats) => boolean = () => true
) {
  return c.teams
    .filter((t) => filter(t) && (value(t) ?? 0) > 0)
    .sort((a, b) => (value(b) ?? 0) - (value(a) ?? 0))
    .slice(0, n) as (TeamStats & T)[];
}
