import Link from 'next/link';
import {
  ArrowRight,
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
  AlertCircle,
} from 'lucide-react';

import { ArrowLink } from '@/components/ArrowLink';
import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { LanguageDonut } from '@/components/charts/LanguageDonut';
import { MetricBarChart } from '@/components/charts/MetricBarChart';
import {
  EmptyState,
  Grid,
  Highlight,
  type HighlightProps,
  PageHeader,
} from '@/components/stats/Blocks';
import { isSmallCohort } from '@/components/stats/HelpComplete';
import { ScoreInfo } from '@/components/stats/ScoreInfo';
import { ShowMore } from '@/components/stats/ShowMore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSummary } from '@/lib/data';
import { overviewSeo, pageMetadata } from '@/lib/seo';
import { cohortColor, fmt, fmtCompact, fmtHours, pct } from '@/lib/format';
import type { TeamStats } from '@/lib/types/stats';
import {
  byTermStart,
  everyone,
  cohortBars,
  cohortBest,
  currentWeek,
  overallScore,
  trendSeries,
} from '@/lib/views';
import { LiveDot } from '@/components/LiveDot';
import { fadeUp, stagger } from '@/utils/animations';
import { cn } from '@/lib/utils';

/** Headline totals cover this many cohort years, newest first (summer included). */
const TOTALS_YEARS = 5;

/** Cohort cards shown before "Show more": one full row of the 4-column grid, newest first. */
const RECENT_COHORT_CARDS = 4;

export const metadata = {
  ...pageMetadata(overviewSeo()),
  // keep the site-wide default title on the home page
  title: { absolute: 'UBCO COSC 499 Capstone Stats' },
};

export default function Overview() {
  const s = getSummary();
  if (!s) return <EmptyState />;

  const cohorts = s.cohorts.filter((c) => c.teams.length);
  const current = cohorts.find((c) => c.isCurrent);

  // Headline totals: the last few cohort years, each with its summer session.
  const totalsFrom = s.currentYear - (TOTALS_YEARS - 1);
  const totalsCohorts = cohorts.filter((c) => c.year >= totalsFrom);
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
  const biggestTeams = [...allTeams]
    .sort((a, b) => overallScore(b) - overallScore(a))
    .slice(0, 3);
  const mostPrs = [...allTeams].sort((a, b) => b.prsMerged - a.prsMerged).slice(0, 3);

  const languages = new Map<string, number>();
  cohorts.forEach((c) =>
    c.languages.forEach((l) =>
      languages.set(l.name, (languages.get(l.name) ?? 0) + l.bytes)
    )
  );

  // Individual records from the same window (shares need at least 100 actions).
  const people = everyone(s).filter((p) => p.cohort.year >= totalsFrom);
  const regulars = people.filter((p) => p.m.activity >= 100);
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
      description: 'Biggest share of their activity between 10 pm and 4 am',
      items: top3(regulars, (p) => share(p.m.nightActivity, p.m.activity)).map((p) =>
        personItem(p, pct(share(p.m.nightActivity, p.m.activity)), 'of activity')
      ),
    },
    {
      icon: Sunrise,
      title: 'Early birds',
      description: 'Biggest share of their activity between 5 am and 9 am',
      items: top3(regulars, (p) => share(p.m.earlyActivity, p.m.activity)).map((p) =>
        personItem(p, pct(share(p.m.earlyActivity, p.m.activity)), 'of activity')
      ),
    },
    {
      icon: Ghost,
      title: '3 am regulars',
      description: 'Most actions between 3 and 4 am',
      items: top3(people, (p) => p.m.witchingActivity).map((p) =>
        personItem(p, fmt(p.m.witchingActivity), 'actions')
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
      description: 'Most actions on holidays and breaks',
      items: top3(people, (p) => p.m.holidayActivity).map((p) =>
        personItem(p, fmt(p.m.holidayActivity), 'actions')
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
  // A configured cohort with no visible repos still gets a card (for example Summer 2026).
  const byNewest = [...s.cohorts]
    .filter((c) => c.year >= totalsFrom)
    .sort(byTermStart)
    .reverse();
  const recentCohorts = byNewest.slice(0, RECENT_COHORT_CARDS);
  const olderCohorts = byNewest.slice(RECENT_COHORT_CARDS);
  const cohortGrid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
  const next = stagger();
  const cohortCard = (c: (typeof s.cohorts)[number], anim: string) => (
    <Link key={c.slug} href={`/${c.slug}`} className={cn('group', anim)}>
      <Card
        size='sm'
        className='h-full py-3 transition-colors group-hover:bg-muted/50 md:py-4'
      >
        <CardHeader className='gap-1 px-3 md:px-4'>
          <CardTitle className='flex items-center gap-2 text-sm md:text-base'>
            <span
              className='size-2.5 shrink-0'
              style={{
                background: cohortColor(c.year, s.currentYear, c.session),
              }}
            />
            <span className='truncate'>
              {c.isCurrent
                ? 'This year'
                : c.session === 'summer'
                  ? `S${c.year}`
                  : c.label}
            </span>
            {c.isCurrent && (
              <Badge>
                Week {currentWeek(c)} <LiveDot />
              </Badge>
            )}
            {isSmallCohort(c) && (
              <Badge variant='outline'>
                <AlertCircle /> Incomplete
              </Badge>
            )}
            <ArrowRight
              aria-label='View leaderboard'
              className='ml-auto size-4 shrink-0 text-muted-foreground
                transition-transform group-hover:translate-x-0.5'
            />
          </CardTitle>
          <p className='font-mono text-xs tabular-nums text-muted-foreground'>
            {c.teams.length
              ? `${fmt(c.totals.teams)} teams · ${fmtCompact(c.totals.commits)} commits · ${fmt(c.totals.prsMerged)} PRs`
              : 'No visible repos yet'}
          </p>
        </CardHeader>
      </Card>
    </Link>
  );

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='UBC Okanagan · COSC 499'
        title='UBCO COSC 499 capstone stats, every cohort'
      >
        Contribution highlights from the last {TOTALS_YEARS} years of UBCO COSC 499
        capstone cohorts on GitHub. Older cohorts are in the Full year and Summer menus.
      </PageHeader>

      <div className='space-y-4'>
        <div className={cohortGrid}>
          {recentCohorts.map((c) => cohortCard(c, next()))}
        </div>
        {olderCohorts.length > 0 && (
          <ShowMore
            more={`Show ${olderCohorts.length} more ${olderCohorts.length === 1 ? 'cohort' : 'cohorts'}`}
            less='Show fewer cohorts'
            className={next()}
          >
            <div className={cohortGrid}>
              {/* Mounts when opened, so these stagger from the click. */}
              {olderCohorts.map((c, i) => cohortCard(c, fadeUp(i)))}
            </div>
          </ShowMore>
        )}
      </div>

      <CohortTrendChart
        title={current ? `How ${current.label} is tracking` : 'Cohorts through the year'}
        description={
          <>
            The last 4 year-long and 3 summer cohorts.
            {current && (
              <ArrowLink href={`/${current.slug}#tracking`} className='mt-2 flex'>
                View this year’s benchmark
              </ArrowLink>
            )}
          </>
        }
        series={trendSeries(s)}
        currentWeek={current ? currentWeek(current) : undefined}
        action={<ScoreInfo weights={s.scoreWeights} />}
      />

      <Grid className='lg:grid-cols-5'>
        <MetricBarChart
          title='Cohorts side by side'
          description={`Every cohort since ${[...cohorts].sort(byTermStart)[0]?.label}. ${current ? ` ${current.label} is still in progress.` : ''}`}
          {...cohortBars(s)}
          switcher='buttons'
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
        <div className={next()}>
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
              <Highlight key={h.title} {...h} className={next()} />
            ))}
        </Grid>
      </div>

      <div className='space-y-3'>
        <h2 className={cn('font-heading text-xl font-semibold', next())}>
          Highlights, last {TOTALS_YEARS} years
        </h2>
        <Grid className='md:grid-cols-2 xl:grid-cols-4'>
          <Highlight
            className={next()}
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
            className={next()}
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
            className={next()}
            icon={Users}
            title='Highest team output'
            description={`Overall score, ${yearLabel(totalsFrom)} to ${yearLabel(s.currentYear)}`}
            items={biggestTeams.map((t) => ({
              label: t.name,
              href: `/${t.cohort.slug}/${t.team}`,
              sub: t.cohort.label,
              value: fmtCompact(overallScore(t)),
              unit: 'pts',
            }))}
            footer={<ScoreInfo weights={s.scoreWeights} bonus={s.teamworkBonus} />}
          />
          <Highlight
            className={next()}
            icon={GitMerge}
            title='Most merged PRs'
            description={`Teams with the most shipped PRs`}
            items={mostPrs.map((t) => ({
              label: t.name,
              href: `/${t.cohort.slug}/${t.team}`,
              sub: `${t.cohort.label} · ${pct(t.reviewCoverage)} reviewed · ${fmtHours(t.medianMergeHours)} to merge`,
              value: fmt(t.prsMerged),
              unit: 'PRs',
              wrapSub: true,
            }))}
          />
        </Grid>
      </div>

      <Card className={next()}>
        <CardHeader>
          <CardTitle>How AI changed capstone</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            The same cohorts, lined up as before AI tools, the Copilot and ChatGPT years,
            and the agentic era. Medians of teams, not a ranking of people.
          </p>
          <ArrowLink href='/insights' className='text-sm'>
            See the comparison
          </ArrowLink>
        </CardContent>
      </Card>

      <p className={cn('text-xs text-muted-foreground', next())}>
        Counts cover the default branch (merge commits excluded), pull requests and issues
        from mid-August to the end of May each year. Bots and course staff are left out.
        Line counts skip commits over {fmt(s.lineOutlierThreshold)} lines, which are
        usually dependencies or generated files.
      </p>
    </div>
  );
}
