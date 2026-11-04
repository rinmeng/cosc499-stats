import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  GitPullRequest,
  GitPullRequestClosed,
  Ghost,
  Moon,
  Sunrise,
  TreePine,
  FileCode2,
  GitMerge,
  MessageSquareCode,
  Trophy,
  Users,
} from 'lucide-react';

import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { LanguageDonut } from '@/components/charts/LanguageDonut';
import { MetricBarChart } from '@/components/charts/MetricBarChart';
import {
  EmptyState,
  Grid,
  Highlight,
  type HighlightProps,
  PageHeader,
  StatTile,
} from '@/components/stats/Blocks';
import { isSmallCohort } from '@/components/stats/HelpComplete';
import { ShowMore } from '@/components/stats/ShowMore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSummary } from '@/lib/data';
import { overviewSeo, pageMetadata } from '@/lib/seo';
import { cohortColor, fmt, fmtDate, fmtCompact, fmtHours, pct } from '@/lib/format';
import type { TeamStats } from '@/lib/types/stats';
import {
  byTermStart,
  everyone,
  cohortBars,
  cohortBest,
  currentWeek,
  trendSeries,
} from '@/lib/views';

/** Headline totals cover this many cohort years, newest first (summer included). */
const TOTALS_YEARS = 5;

/** Cohort cards shown before "Show more": one full row of the 4-column grid, newest first. */
const RECENT_COHORT_CARDS = 4;

export const metadata = {
  ...pageMetadata(overviewSeo()),
  // keep the site-wide default title on the home page
  title: { absolute: 'UBCO COSC 499 Capstone Stats · UBC Okanagan' },
};

export default function Overview() {
  const s = getSummary();
  if (!s) return <EmptyState />;

  const cohorts = s.cohorts.filter((c) => c.teams.length);
  const current = cohorts.find((c) => c.isCurrent);

  // Headline totals: the last few cohort years, each with its summer session.
  const totalsFrom = s.currentYear - (TOTALS_YEARS - 1);
  const totalsCohorts = cohorts.filter((c) => c.year >= totalsFrom);
  const totalOf = (k: 'teams' | 'contributors' | 'commits' | 'prsMerged' | 'reviews') =>
    totalsCohorts.reduce((a, c) => a + c.totals[k], 0);
  const yearLabel = (y: number) => `${y}–${String(y + 1).slice(2)}`;

  const allTeams = totalsCohorts.flatMap((c) =>
    c.teams.map((t) => ({ ...t, cohort: c }))
  ) as (TeamStats & { cohort: (typeof cohorts)[number] })[];

  const recordPeople = totalsCohorts
    .map((c) => ({ c, best: cohortBest(c, 'commits') }))
    .filter((x) => x.best)
    .sort((a, b) => b.best!.value - a.best!.value)
    .slice(0, 3);
  const recordReviewers = totalsCohorts
    .map((c) => ({ c, best: cohortBest(c, 'reviews') }))
    .filter((x) => x.best)
    .sort((a, b) => b.best!.value - a.best!.value)
    .slice(0, 3);
  const biggestTeams = [...allTeams].sort((a, b) => b.score - a.score).slice(0, 3);
  const mostPrs = [...allTeams].sort((a, b) => b.prsMerged - a.prsMerged).slice(0, 3);

  const languages = new Map<string, number>();
  cohorts.forEach((c) =>
    c.languages.forEach((l) =>
      languages.set(l.name, (languages.get(l.name) ?? 0) + l.bytes)
    )
  );

  // Individual records from the same window (shares need at least 50 commits).
  const people = everyone(s).filter((p) => p.cohort.year >= totalsFrom);
  const regulars = people.filter((p) => p.m.commits >= 50);
  const top3 = <T,>(list: T[], value: (x: T) => number) =>
    [...list]
      .filter((x) => value(x) > 0)
      .sort((a, b) => value(b) - value(a))
      .slice(0, 3);
  const personItem = (p: (typeof people)[number], value: string, unit?: string) => ({
    label: p.name,
    href: `/${p.cohort.slug}/${p.team.team}`,
    sub: `${p.team.name}, ${p.cohort.label}`,
    value,
    unit,
  });
  const share = (n: number, d: number) => (d ? n / d : 0);
  const oddities: HighlightProps[] = [
    {
      icon: Moon,
      title: 'Night owls',
      description: 'Biggest share of their commits made between 10 pm and 4 am',
      items: top3(regulars, (p) => share(p.m.nightCommits, p.m.commits)).map((p) =>
        personItem(p, pct(share(p.m.nightCommits, p.m.commits)), 'of commits')
      ),
    },
    {
      icon: Sunrise,
      title: 'Early birds',
      description: 'Biggest share of their commits made between 5 am and 9 am',
      items: top3(regulars, (p) => share(p.m.earlyCommits, p.m.commits)).map((p) =>
        personItem(p, pct(share(p.m.earlyCommits, p.m.commits)), 'of commits')
      ),
    },
    {
      icon: Ghost,
      title: '3 am regulars',
      description: 'Most commits made between 3 and 4 am',
      items: top3(people, (p) => p.m.witchingCommits).map((p) =>
        personItem(p, fmt(p.m.witchingCommits), 'commits')
      ),
    },
    {
      icon: FileCode2,
      title: 'Biggest single commit',
      description:
        'Most lines changed in one commit (vendored code over 20,000 lines left out)',
      items: top3(people, (p) => p.m.biggestCommit).map((p) =>
        personItem(p, fmtCompact(p.m.biggestCommit), 'lines')
      ),
    },
    {
      icon: TreePine,
      title: 'Holiday heroes',
      description: 'Most commits on holidays and breaks',
      items: top3(people, (p) => p.m.holidayCommits).map((p) =>
        personItem(p, fmt(p.m.holidayCommits), 'commits')
      ),
    },
    {
      icon: GitPullRequestClosed,
      title: 'Back to the drawing board',
      description: 'Most pull requests opened and then closed without merging',
      items: top3(people, (p) => p.m.prsClosed ?? 0).map((p) =>
        personItem(p, fmt(p.m.prsClosed ?? 0), 'closed PRs')
      ),
    },
  ];

  // Cohort cards: same 5-year window as the totals (older years live in the navbar).
  // Newest first; only the first row shows up front, the rest sit behind "Show more".
  const byNewest = [...s.cohorts]
    .filter((c) => c.year >= totalsFrom)
    .sort(byTermStart)
    .reverse();
  const recentCohorts = byNewest.slice(0, RECENT_COHORT_CARDS);
  const olderCohorts = byNewest.slice(RECENT_COHORT_CARDS);
  const cohortGrid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
  const cohortCard = (c: (typeof s.cohorts)[number]) => (
    <Link key={c.slug} href={`/${c.slug}`} className='group'>
      <Card
        size='sm'
        className='h-full py-3 transition-colors group-hover:bg-muted/50 md:py-4'
      >
        <CardHeader className='px-3 md:px-4'>
          <CardTitle className='flex items-center gap-2 text-sm md:text-base'>
            <span
              className='size-2.5'
              style={{
                background: cohortColor(c.year, s.currentYear, c.session),
              }}
            />
            {c.label}
            {c.isCurrent && <Badge>Week {currentWeek(c)}</Badge>}
            {c.session === 'summer' && !isSmallCohort(c) && (
              <Badge variant='secondary'>Summer</Badge>
            )}
            {isSmallCohort(c) && <Badge variant='outline'>Help complete</Badge>}
            <ArrowRight
              className='ml-auto size-4 text-muted-foreground transition-transform
                group-hover:translate-x-0.5'
            />
          </CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-3 gap-2 px-3 text-sm md:px-4'>
          <div>
            <div className='font-mono text-sm font-semibold tabular-nums md:text-base'>
              {c.totals.teams.toLocaleString()}
            </div>
            <div className='text-[11px] text-muted-foreground md:text-xs'>teams</div>
          </div>
          <div>
            <div className='font-mono text-sm font-semibold tabular-nums md:text-base'>
              {fmtCompact(c.totals.commits)}
            </div>
            <div className='text-[11px] text-muted-foreground md:text-xs'>commits</div>
          </div>
          <div>
            <div className='font-mono text-sm font-semibold tabular-nums md:text-base'>
              {fmt(c.totals.prsMerged)}
            </div>
            <div className='text-[11px] text-muted-foreground md:text-xs'>PRs</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='UBC Okanagan · COSC 499'
        title='Capstone contributions, every cohort'
      >
        Contribution highlights from {cohorts.length} capstone cohorts on GitHub,
        year-long and summer sessions, from {[...cohorts].sort(byTermStart)[0]?.label} to
        today. Last synced {fmtDate(s.generatedAt)}.
      </PageHeader>

      <div className='space-y-3'>
        <h2 className='text-sm font-medium'>
          Last {TOTALS_YEARS} years · {yearLabel(totalsFrom)} to{' '}
          {yearLabel(s.currentYear)}
          <span className='font-normal text-muted-foreground'>
            , summer sessions included
          </span>
        </h2>
        <Grid className='grid-cols-3 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-5'>
          <StatTile
            compact
            icon={Calendar}
            label='Cohorts'
            value={totalsCohorts.length}
            unit='sessions'
          />
          <StatTile
            compact
            icon={Users}
            label='Contributors'
            value={fmt(totalOf('contributors'))}
            unit='people'
            hint={`across ${fmt(totalOf('teams'))} teams`}
          />
          <StatTile
            compact
            icon={GitPullRequest}
            label='Commits'
            value={fmtCompact(totalOf('commits'))}
            unit='commits'
          />
          <StatTile
            compact
            icon={GitMerge}
            label='Merged PRs'
            value={fmtCompact(totalOf('prsMerged'))}
            unit='PRs'
          />
          <StatTile
            compact
            icon={MessageSquareCode}
            label='Code reviews'
            value={fmtCompact(totalOf('reviews'))}
            unit='reviews'
          />
        </Grid>
      </div>

      <div className='space-y-4'>
        <div className={cohortGrid}>{recentCohorts.map(cohortCard)}</div>
        {olderCohorts.length > 0 && (
          <ShowMore
            more={`Show ${olderCohorts.length} more ${olderCohorts.length === 1 ? 'cohort' : 'cohorts'}`}
            less='Show fewer cohorts'
          >
            <div className={cohortGrid}>{olderCohorts.map(cohortCard)}</div>
          </ShowMore>
        )}
      </div>

      <CohortTrendChart
        title={current ? `How ${current.label} is tracking` : 'Cohorts through the year'}
        description='The last 4 year-long and 3 summer cohorts. Average cumulative commits per team by week of term (week 0 = first week of September, or of May for summer sessions; summer is dashed). Click a cohort to bring it forward.'
        series={trendSeries(s)}
        currentWeek={current ? currentWeek(current) : undefined}
      />

      <Grid className='lg:grid-cols-5'>
        <MetricBarChart
          title='Cohorts side by side'
          description={
            current
              ? `Average per team; header shows all-time totals. S = summer session. ${current.label} is still in progress.`
              : 'Average per team; header shows all-time totals. S = summer session.'
          }
          {...cohortBars(s)}
          height='h-72'
          className='lg:col-span-3'
        />
        <div className='lg:col-span-2'>
          <LanguageDonut
            languages={[...languages]
              .map(([name, bytes]) => ({ name, bytes }))
              .sort((a, b) => b.bytes - a.bytes)}
            description='Share of code across every team repository'
          />
        </div>
      </Grid>

      <div className='space-y-3'>
        <div>
          <h2 className='font-heading text-xl font-semibold'>
            Oddities, last {TOTALS_YEARS} years
          </h2>
          <p className='text-sm text-muted-foreground'>
            The most memorable individual habits from {yearLabel(totalsFrom)} to{' '}
            {yearLabel(s.currentYear)}.
          </p>
        </div>
        <Grid className='md:grid-cols-2 xl:grid-cols-3'>
          {oddities
            .filter((h) => h.items.length > 0)
            .map((h) => (
              <Highlight key={h.title} {...h} />
            ))}
        </Grid>
      </div>

      <div className='space-y-3'>
        <h2 className='font-heading text-xl font-semibold'>
          Highlights, last {TOTALS_YEARS} years
        </h2>
        <Grid className='md:grid-cols-2 xl:grid-cols-4'>
          <Highlight
            icon={Trophy}
            title='Most commits by one person'
            description='Top committer of each cohort'
            items={recordPeople.map(({ c, best }) => ({
              label: best!.name,
              href: `/${c.slug}/${best!.team.team}`,
              sub: `${best!.team.name}, ${c.label}`,
              value: fmt(best!.value),
              unit: 'commits',
            }))}
          />
          <Highlight
            icon={MessageSquareCode}
            title='Most reviews by one person'
            description='Top reviewer of each cohort'
            items={recordReviewers.map(({ c, best }) => ({
              label: best!.name,
              href: `/${c.slug}/${best!.team.team}`,
              sub: `${best!.team.name}, ${c.label}`,
              value: fmt(best!.value),
              unit: 'reviews',
            }))}
          />
          <Highlight
            icon={Users}
            title='Highest team output'
            description={`Overall score, ${yearLabel(totalsFrom)} to ${yearLabel(s.currentYear)}`}
            items={biggestTeams.map((t) => ({
              label: t.name,
              href: `/${t.cohort.slug}/${t.team}`,
              sub: t.cohort.label,
              value: fmtCompact(t.score),
              unit: 'pts',
            }))}
          />
          <Highlight
            icon={GitMerge}
            title='Most merged PRs'
            description={`Teams with the most shipped PRs`}
            items={mostPrs.map((t) => ({
              label: t.name,
              href: `/${t.cohort.slug}/${t.team}`,
              sub: `${t.cohort.label} · ${pct(t.reviewCoverage)} reviewed · ${fmtHours(t.medianMergeHours)}`,
              value: fmt(t.prsMerged),
              unit: 'PRs',
            }))}
          />
        </Grid>
      </div>

      <p className='text-xs text-muted-foreground'>
        Counts cover the default branch (merge commits excluded), pull requests and issues
        from mid-August to the end of May each year. Bots and course staff are left out.
        Line counts skip commits over {fmt(s.lineOutlierThreshold)} lines, which are
        usually dependencies or generated files.
      </p>
    </div>
  );
}
