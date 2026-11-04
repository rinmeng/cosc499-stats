import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  GitMerge,
  GitPullRequest,
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
  PageHeader,
  StatTile,
} from '@/components/stats/Blocks';
import { isSmallCohort } from '@/components/stats/HelpComplete';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSummary } from '@/lib/data';
import { cohortColor, fmt, fmtDate, fmtCompact, fmtHours, pct } from '@/lib/format';
import type { TeamStats } from '@/lib/types/stats';
import { cohortBars, cohortBest, currentWeek, trendSeries } from '@/lib/views';

export default function Overview() {
  const s = getSummary();
  if (!s) return <EmptyState />;

  const cohorts = s.cohorts.filter((c) => c.teams.length);
  const sum = (k: 'contributors' | 'commits' | 'prsMerged' | 'reviews') =>
    cohorts.reduce((a, c) => a + c.totals[k], 0);
  const current = cohorts.find((c) => c.isCurrent);

  const allTeams = cohorts.flatMap((c) =>
    c.teams.map((t) => ({ ...t, cohort: c }))
  ) as (TeamStats & { cohort: (typeof cohorts)[number] })[];

  const recordPeople = cohorts
    .map((c) => ({ c, best: cohortBest(c, 'commits') }))
    .filter((x) => x.best)
    .sort((a, b) => b.best!.value - a.best!.value)
    .slice(0, 3);
  const recordReviewers = cohorts
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

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='UBC Okanagan · COSC 499'
        title='Capstone contributions, every cohort'
      >
        Contribution highlights from {cohorts.length} capstone cohorts on GitHub, from{' '}
        {cohorts[0]?.label} to today. Last synced {fmtDate(s.generatedAt)}.
      </PageHeader>

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
        <StatTile icon={Calendar} label='Cohorts' value={cohorts.length} />
        <StatTile
          icon={Users}
          label='Contributors'
          value={fmt(sum('contributors'))}
          hint={`${fmt(allTeams.length)} teams`}
        />
        <StatTile
          icon={GitPullRequest}
          label='Commits'
          value={fmtCompact(sum('commits'))}
        />
        <StatTile
          icon={GitMerge}
          label='Merged PRs'
          value={fmtCompact(sum('prsMerged'))}
        />
        <StatTile
          icon={MessageSquareCode}
          label='Code reviews'
          value={fmtCompact(sum('reviews'))}
        />
      </Grid>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[...cohorts].reverse().map((c) => (
          <Link key={c.year} href={`/${c.year}`} className='group'>
            <Card size='sm' className='h-full transition-colors group-hover:bg-muted/50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <span
                    className='size-2.5'
                    style={{ background: cohortColor(c.year, s.currentYear) }}
                  />
                  {c.label}
                  {c.isCurrent && <Badge>Week {currentWeek(c)}</Badge>}
                  {isSmallCohort(c) && <Badge variant='outline'>Help complete</Badge>}
                  <ArrowRight
                    className='ml-auto size-4 text-muted-foreground transition-transform
                      group-hover:translate-x-0.5'
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className='grid grid-cols-3 gap-2 text-sm'>
                <div>
                  <div className='font-mono font-semibold tabular-nums'>
                    {c.totals.teams}
                  </div>
                  <div className='text-xs text-muted-foreground'>teams</div>
                </div>
                <div>
                  <div className='font-mono font-semibold tabular-nums'>
                    {fmtCompact(c.totals.commits)}
                  </div>
                  <div className='text-xs text-muted-foreground'>commits</div>
                </div>
                <div>
                  <div className='font-mono font-semibold tabular-nums'>
                    {fmt(c.totals.prsMerged)}
                  </div>
                  <div className='text-xs text-muted-foreground'>PRs</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <CohortTrendChart
        title={current ? `How ${current.label} is tracking` : 'Cohorts through the year'}
        description='Average cumulative commits per team by week of term (week 0 = first week of September). Click a cohort to bring it forward.'
        series={trendSeries(s)}
        currentWeek={current ? currentWeek(current) : undefined}
      />

      <Grid className='lg:grid-cols-5'>
        <MetricBarChart
          title='Cohorts side by side'
          description={
            current
              ? `Average per team; header shows all-time totals. ${current.label} is still in progress.`
              : 'Average per team; header shows all-time totals.'
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
        <h2 className='font-heading text-xl font-semibold'>All-time highlights</h2>
        <Grid className='md:grid-cols-2 xl:grid-cols-4'>
          <Highlight
            icon={Trophy}
            title='Most commits by one person'
            description='Top committer of each cohort'
            items={recordPeople.map(({ c, best }) => ({
              label: best!.name,
              href: `/${c.year}/${best!.team.team}`,
              sub: `${best!.team.name}, ${c.label}`,
              value: fmt(best!.value),
            }))}
          />
          <Highlight
            icon={MessageSquareCode}
            title='Most reviews by one person'
            description='Top reviewer of each cohort'
            items={recordReviewers.map(({ c, best }) => ({
              label: best!.name,
              href: `/${c.year}/${best!.team.team}`,
              sub: `${best!.team.name}, ${c.label}`,
              value: fmt(best!.value),
            }))}
          />
          <Highlight
            icon={Users}
            title='Highest team output'
            description='Overall score, all cohorts'
            items={biggestTeams.map((t) => ({
              label: t.name,
              href: `/${t.cohort.year}/${t.team}`,
              sub: t.cohort.label,
              value: `${fmtCompact(t.score)} pts`,
            }))}
          />
          <Highlight
            icon={GitMerge}
            title='Most merged PRs'
            description={`Teams with the most shipped PRs`}
            items={mostPrs.map((t) => ({
              label: t.name,
              href: `/${t.cohort.year}/${t.team}`,
              sub: `${t.cohort.label} · ${pct(t.reviewCoverage)} reviewed · ${fmtHours(t.medianMergeHours)}`,
              value: fmt(t.prsMerged),
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
