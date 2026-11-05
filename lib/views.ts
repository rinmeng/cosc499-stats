import 'server-only';

import type { EraSeries } from '@/components/charts/EraCompareChart';
import type { TrendSeries } from '@/components/charts/CohortTrendChart';
import type { TimelineSeries } from '@/components/charts/CohortTimelineChart';
import type { BarMetric, BarRow } from '@/components/charts/MetricBarChart';
import type { ShareRow } from '@/components/charts/StackedShareChart';
import type { RadialItem } from '@/components/charts/TeamRadial';
import type { TeamRow } from '@/components/stats/TeamTable';
import type { TeamTopView, TopEntryView } from '@/components/stats/TopContributors';
import { topByMetric } from '@/lib/data';
import {
  ERA_COLOR,
  cohortColor,
  displayName,
  fmt,
  fmtCompact,
  fmtInsight,
  type InsightKind,
} from '@/lib/format';
import { finding, FINDING_KEYS, sessionFinding } from '@/lib/findings';
import type { Era, Estimate, InsightMetric } from '@/lib/types/insights';
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

const INSIGHT_KIND: Record<string, InsightKind> = {
  commitSize: 'count',
  largeCommitShare: 'share',
  prAdditions: 'count',
  prFiles: 'count',
  prHours: 'hours',
  commitsPerPw: 'count',
  prsPerPw: 'count',
  linesPerPw: 'count',
  churn: 'count',
  earlyOutput: 'share',
  weekToQuarter: 'week',
  reviewCoverage: 'share',
  discussionPerPr: 'count',
  languagesPerTeam: 'count',
  aiTrailers: 'share',
  aiBots: 'share',
  prsPer100: 'count',
  prWeeks: 'share',
  nightOwl: 'share',
  weekend: 'share',
  holiday: 'share',
  pwWinter: 'count',
  pwSummer: 'count',
};

function coverage(metric: InsightMetric) {
  let nTeams = 0;
  let nCohorts = 0;
  for (const estimate of Object.values(metric.eras) as (Estimate | null)[]) {
    if (!estimate) continue;
    nTeams += estimate.nTeams;
    nCohorts += estimate.nCohorts;
  }
  return { nTeams, nCohorts };
}

function eraSeries(s: Summary, key: string): EraSeries {
  const metric = s.insights.metrics[key];
  const kind = INSIGHT_KIND[key] ?? 'count';
  const bars = (Object.entries(metric.eras) as [Era, Estimate | null][])
    .filter((entry): entry is [Era, Estimate] => !!entry[1])
    .map(([era, estimate]) => ({ era, ...estimate }));
  const { nTeams, nCohorts } = coverage(metric);
  return {
    key,
    label: metric.label,
    headline: fmtInsight(metric.eras.agentic?.value, kind),
    finding: finding(s.insights, key),
    kind,
    nTeams,
    nCohorts,
    bars,
    dots: metric.cohorts
      .filter((c) => c.value != null)
      .map((c) => ({
        era: c.era,
        label: c.label,
        value: c.value!,
        nTeams: c.nTeams,
        faded: c.faded,
        hollow: c.inProgress,
        session: c.session,
        color: cohortColor(c.year, s.currentYear, c.session),
      })),
  };
}

function timelineSeries(s: Summary, key: string): TimelineSeries {
  const metric = s.insights.metrics[key];
  const kind = INSIGHT_KIND[key] ?? 'count';
  const bySlug = new Map(s.cohorts.map((c) => [c.slug, c]));
  const { nTeams, nCohorts } = coverage(metric);
  return {
    key,
    label: metric.label,
    headline: fmtInsight(metric.eras.agentic?.value, kind),
    finding: finding(s.insights, key),
    kind,
    nTeams,
    nCohorts,
    points: metric.cohorts
      .filter((c) => c.value != null)
      .flatMap((c) => {
        const src = bySlug.get(c.slug);
        if (!src) return [];
        return [
          {
            termStart: src.termStart,
            label: c.label,
            value: c.value!,
            nTeams: c.nTeams,
            faded: c.faded,
            hollow: c.inProgress,
            color: cohortColor(c.year, s.currentYear, c.session),
            session: c.session,
          },
        ];
      })
      .sort((a, b) => a.termStart.localeCompare(b.termStart)),
  };
}

/**
 * "1.6×" + "more commits per person-week in the agentic era than before AI".
 * A drop reads as "24%" + "fewer …" rather than "×0.8".
 */
function ratioTile(
  agentic: number | undefined,
  before: number | undefined,
  noun: string
) {
  const tail = `${noun} in agentic era vs before AI era.`;
  if (agentic == null || before == null || before === 0)
    return { value: '—', unit: `${noun} in ageantic era vs before AI era.` };
  const r = agentic / before;
  if (Math.abs(r - 1) < 0.1) return { value: '≈', unit: `as many ${tail}` };
  if (r > 1)
    return { value: `${r.toFixed(1).replace(/\.0$/, '')}×`, unit: `more ${tail}` };
  return { value: `${Math.round((1 - r) * 100)}%`, unit: `fewer ${tail}` };
}

export interface InsightsView {
  windowWeek: number;
  eras: { key: Era; label: string; years: string; color: string }[];
  faded: { label: string; nTeams: number }[];
  /** `hint` marks the numbers to bold with **…** (render with FindingText) */
  ratios: { label: string; value: string; unit: string; hint: string }[];
  /** "Here's what we found" sentences per tab */
  findings: { impact: string[]; fingerprints: string[]; trends: string[] };
  trailersScanned: boolean;
  termScale: { fullYearWeeks: number; summerWeeks: number };
  commitSize: EraSeries[];
  pullRequests: EraSeries[];
  output: EraSeries[];
  churn: TimelineSeries[];
  ramp: EraSeries[];
  review: EraSeries[];
  languages: ShareRow[];
  languageSample: { nTeams: number; nCohorts: number };
  languagesPerTeam: EraSeries[];
  trailers: TimelineSeries[];
  tools: ShareRow[];
  toolSample: { nTeams: number; nCohorts: number };
  botTiles: { era: Era; label: string; value: string; hint: string }[];
  bots: TimelineSeries[];
  curves: TrendSeries[];
  curveLabel: string;
  prsPer100: TimelineSeries[];
  prWeeks: TimelineSeries[];
  nightOwl: TimelineSeries[];
  weekend: TimelineSeries[];
  holiday: TimelineSeries[];
  session: EraSeries[];
}

const RATIO_KEYS = [
  { key: 'commitsPerPw', label: 'Commits per person-week', noun: 'commits' },
  { key: 'prsPerPw', label: 'Merged PRs per person-week', noun: 'merged PRs' },
  { key: 'linesPerPw', label: 'Lines per person-week', noun: 'lines changed' },
] as const;

export function insightsView(s: Summary): InsightsView {
  const insights = s.insights;
  const kind = (key: string) => INSIGHT_KIND[key] ?? 'count';
  const winter = eraSeries(s, 'pwWinter');
  const summer = eraSeries(s, 'pwSummer');
  const start = new Map(s.cohorts.map((c) => [c.slug, c.termStart]));
  const sentences = (keys: readonly string[]) =>
    keys.map((key) => finding(insights, key)).filter((f): f is string => !!f);

  const languages: ShareRow[] = insights.eras
    .map((era) => ({ label: era.label, slices: insights.languages[era.key] }))
    .filter((row) => row.slices.length);

  return {
    windowWeek: insights.window.week,
    eras: insights.eras.map((era) => ({
      ...era,
      color: ERA_COLOR[era.key],
    })),
    faded: insights.metrics.commitSize.cohorts
      .filter((c) => c.faded)
      .map((c) => ({ label: c.label, nTeams: c.nTeams })),
    ratios: RATIO_KEYS.map(({ key, label, noun }) => {
      const metric = insights.metrics[key];
      const agentic = metric.eras.agentic?.value;
      const before = metric.eras['pre-ai']?.value;
      return {
        label,
        ...ratioTile(agentic, before, noun),
        hint: `**${fmtInsight(agentic, kind(key))}** a week in the agentic era · **${fmtInsight(before, kind(key))}** before AI`,
      };
    }),
    findings: {
      impact: sentences(FINDING_KEYS.impact),
      fingerprints: sentences(FINDING_KEYS.fingerprints),
      trends: [...sentences(FINDING_KEYS.trends), sessionFinding(insights)].filter(
        (f): f is string => !!f
      ),
    },
    trailersScanned: insights.trailersScanned,
    termScale: insights.termScale,
    commitSize: [eraSeries(s, 'commitSize'), eraSeries(s, 'largeCommitShare')],
    pullRequests: [
      eraSeries(s, 'prHours'),
      eraSeries(s, 'prAdditions'),
      eraSeries(s, 'prFiles'),
    ],
    output: [
      eraSeries(s, 'linesPerPw'),
      eraSeries(s, 'commitsPerPw'),
      eraSeries(s, 'prsPerPw'),
    ],
    churn: [timelineSeries(s, 'churn')],
    ramp: [eraSeries(s, 'weekToQuarter'), eraSeries(s, 'earlyOutput')],
    review: [eraSeries(s, 'reviewCoverage'), eraSeries(s, 'discussionPerPr')],
    languages,
    languageSample: coverage(insights.metrics.languagesPerTeam),
    languagesPerTeam: [eraSeries(s, 'languagesPerTeam')],
    trailers: [timelineSeries(s, 'aiTrailers')],
    tools: insights.tools.length ? [{ label: 'Agentic', slices: insights.tools }] : [],
    toolSample: coverage(insights.metrics.aiTrailers),
    botTiles: insights.eras.map((era) => {
      const estimate = insights.metrics.aiBots.eras[era.key];
      return {
        era: era.key,
        label: era.label,
        value: fmtInsight(estimate?.value, 'share'),
        hint: estimate
          ? `n = ${estimate.nTeams} teams · ${estimate.nCohorts} cohorts`
          : 'Not enough cohorts',
      };
    }),
    bots: [timelineSeries(s, 'aiBots')],
    curves: insights.curves
      .map((curve) => ({
        ...curve,
        color: cohortColor(curve.year, s.currentYear, curve.session),
      }))
      .sort((a, b) => (start.get(a.slug) ?? '').localeCompare(start.get(b.slug) ?? '')),
    curveLabel: `% of weeks 0–${insights.window.week}`,
    prsPer100: [timelineSeries(s, 'prsPer100')],
    prWeeks: [timelineSeries(s, 'prWeeks')],
    nightOwl: [timelineSeries(s, 'nightOwl')],
    weekend: [timelineSeries(s, 'weekend')],
    holiday: [timelineSeries(s, 'holiday')],
    session: [
      {
        key: 'session',
        label: 'Per person-week',
        headline: winter.headline,
        finding: sessionFinding(insights),
        kind: 'count' as const,
        nTeams: winter.nTeams + summer.nTeams,
        nCohorts: winter.nCohorts + summer.nCohorts,
        bars: winter.bars,
        summerBars: summer.bars,
        dots: [...winter.dots, ...summer.dots],
      },
    ],
  };
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
