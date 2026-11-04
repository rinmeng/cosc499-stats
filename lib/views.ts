import 'server-only';

import type { TrendSeries } from '@/components/charts/CohortTrendChart';
import type { BarMetric, BarRow } from '@/components/charts/MetricBarChart';
import type { RadialItem } from '@/components/charts/TeamRadial';
import type { TeamRow } from '@/components/stats/TeamTable';
import type { TeamTopView } from '@/components/stats/TopContributors';
import { topByMetric } from '@/lib/data';
import { cohortColor, displayName, fmt, fmtCompact } from '@/lib/format';
import type { CohortStats, MetricKey, Summary, TeamStats } from '@/lib/types/stats';

export const teamHref = (year: number, t: TeamStats) => `/${year}/${t.team}`;

export function teamTopViews(c: CohortStats, n: number): TeamTopView[] {
  return [...c.teams]
    .sort((a, b) => a.team - b.team)
    .map((t) => {
      const top = topByMetric(t.members, n);
      return {
        key: t.key,
        name: t.name,
        href: teamHref(c.year, t),
        top: Object.fromEntries(
          Object.entries(top).map(([k, list]) => [
            k,
            list.map((e) => ({ ...e, name: displayName(e) })),
          ])
        ) as TeamTopView['top'],
      };
    });
}

export function teamRows(c: CohortStats): TeamRow[] {
  return c.teams.map((t) => ({
    team: t.team,
    name: t.name,
    href: teamHref(c.year, t),
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
  const cohorts = s.cohorts.filter((c) => c.teams.length);
  const rows = cohorts.map((c) => ({
    label: c.label,
    name: `${c.label} · average per team`,
    values: { ...c.avgPerTeam },
  }));
  const all = (k: keyof CohortStats['avgPerTeam']) =>
    fmt(cohorts.reduce((a, c) => a + c.totals[k], 0));
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

export function trendSeries(s: Summary): TrendSeries[] {
  return s.cohorts
    .filter((c) => c.teams.length)
    .map((c) => ({
      year: c.year,
      label: c.label,
      color: cohortColor(c.year, s.currentYear),
      isCurrent: c.isCurrent,
      points: c.cumulative.filter((p) => p.week <= 34),
    }));
}

export function currentWeek(c: CohortStats, now = Date.now()) {
  return Math.floor((now - Date.parse(c.termStart)) / (7 * 86_400_000));
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
