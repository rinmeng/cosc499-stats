import { notFound } from 'next/navigation';
import {
  Clock,
  GitMerge,
  GitPullRequest,
  Handshake,
  MessageSquareCode,
  Moon,
  Sparkles,
  Users,
} from 'lucide-react';

import { ActivityChart } from '@/components/charts/ActivityChart';
import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { LanguageDonut } from '@/components/charts/LanguageDonut';
import { MetricBarChart } from '@/components/charts/MetricBarChart';
import { Punchcard } from '@/components/charts/Punchcard';
import {
  EmptyState,
  Grid,
  Highlight,
  PageHeader,
  Section,
  StatTile,
} from '@/components/stats/Blocks';
import {
  HelpComplete,
  isSmallCohort,
  MissingTeam,
} from '@/components/stats/HelpComplete';
import { TeamTable } from '@/components/stats/TeamTable';
import { TopContributors } from '@/components/stats/TopContributors';
import { Badge } from '@/components/ui/badge';
import { getCohort, getSummary } from '@/lib/data';
import { fmt, fmtCompact, fmtDate, fmtHours, pct } from '@/lib/format';
import {
  cohortTopView,
  currentWeek,
  teamBars,
  trendSeries,
  teamHref,
  teamRows,
  teamTopViews,
  topTeams,
} from '@/lib/views';

export function generateStaticParams() {
  return getSummary()?.cohorts.map((c) => ({ year: String(c.year) })) ?? [];
}

export async function generateMetadata({ params }: PageProps<'/[year]'>) {
  const { year } = await params;
  const c = getCohort(Number(year));
  return { title: c ? `${c.label} cohort · COSC 499 Stats` : 'COSC 499 Stats' };
}

export default async function CohortPage({ params }: PageProps<'/[year]'>) {
  const { year } = await params;
  const summary = getSummary();
  if (!summary) return <EmptyState />;
  const c = getCohort(Number(year));
  if (!c) notFound();

  const week = currentWeek(c);
  const live = c.isCurrent;

  const collaborative = topTeams(
    c,
    (t) => t.collaboration,
    3,
    (t) => t.contributors >= 3
  );
  const reviewCulture = topTeams(
    c,
    (t) => t.reviewCoverage,
    3,
    (t) => t.prsMerged >= 10
  );
  const fastest = c.teams
    .filter((t) => t.medianMergeHours !== null && t.prsMerged >= 10)
    .sort((a, b) => a.medianMergeHours! - b.medianMergeHours!)
    .slice(0, 3);
  const activeThisWeek = topTeams(c, (t) => t.thisWeekCommits, 3);
  const nightOwls = topTeams(
    c,
    (t) => t.nightOwlShare,
    3,
    (t) => t.commits >= 50
  );

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow={
          <span className='flex items-center gap-2'>
            {c.org}
            {live && <Badge>In progress · week {week}</Badge>}
          </span>
        }
        title={`${c.label} cohort`}
      >
        {live ? (
          <>
            {c.totals.teams} teams building right now. Term started {fmtDate(c.termStart)}
            ; data last synced {fmtDate(summary.generatedAt)}.
          </>
        ) : (
          <>
            {c.totals.teams} teams, {fmt(c.totals.contributors)} contributors, term
            starting {fmtDate(c.termStart)}.
          </>
        )}
      </PageHeader>

      {isSmallCohort(c) && (
        <HelpComplete
          label={c.label}
          year={c.year}
          teams={c.totals.teams}
          note={c.note}
        />
      )}

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        <StatTile icon={Users} label='Contributors' value={fmt(c.totals.contributors)} />
        <StatTile
          icon={GitPullRequest}
          label='Commits'
          value={fmtCompact(c.totals.commits)}
          hint={`${fmt(c.avgPerTeam.commits)} per team`}
        />
        <StatTile
          icon={GitMerge}
          label='Merged PRs'
          value={fmt(c.totals.prsMerged)}
          hint={`${fmt(c.avgPerTeam.prsMerged)} per team`}
        />
        <StatTile
          icon={MessageSquareCode}
          label='Reviews'
          value={fmt(c.totals.reviews)}
          hint={`${pct(c.reviewCoverage)} of PRs reviewed`}
        />
        <StatTile
          icon={Clock}
          label='Median time to merge'
          value={fmtHours(c.medianMergeHours)}
        />
        {live ? (
          <StatTile
            icon={Sparkles}
            label='Commits this week'
            value={fmt(c.thisWeek.commits)}
            hint={c.lastWeek.commits ? `${fmt(c.lastWeek.commits)} last week` : undefined}
          />
        ) : (
          <StatTile
            icon={Sparkles}
            label='Lines changed'
            value={fmtCompact(c.totals.lines)}
            hint='excl. very large commits'
          />
        )}
      </Grid>

      {live && (
        <CohortTrendChart
          title='How this cohort is tracking'
          description='Average cumulative commits per team by week of term, next to past cohorts at the same point in the year. Click a cohort to bring it forward.'
          series={trendSeries(summary)}
          currentWeek={week}
        />
      )}

      <Section
        title='Top contributors'
        description={`“Overall” weighs commits ×${summary.scoreWeights.commits}, merged PRs ×${summary.scoreWeights.prsMerged}, reviews ×${summary.scoreWeights.reviews} and issues ×${summary.scoreWeights.issuesOpened}. Top 10 across the cohort, or the top ${summary.topN} on each team. Switch the measure to rank by just one thing.`}
      >
        <TopContributors
          teams={teamTopViews(c, summary.topN)}
          cohort={cohortTopView(c, 10)}
        />
      </Section>

      <Grid className='lg:grid-cols-3'>
        {live && activeThisWeek.length > 0 && (
          <Highlight
            icon={Sparkles}
            title='Most active this week'
            description='Commits since Sunday'
            items={activeThisWeek.map((t) => ({
              label: t.name,
              href: teamHref(c.year, t),
              value: fmt(t.thisWeekCommits),
            }))}
          />
        )}
        {collaborative.length > 0 && (
          <Highlight
            icon={Handshake}
            title='Most collaborative'
            description='Commits shared most evenly across the team'
            items={collaborative.map((t) => ({
              label: t.name,
              href: teamHref(c.year, t),
              value: `${Math.round(t.collaboration * 100)}`,
              sub: `${t.contributors} people`,
            }))}
          />
        )}
        {reviewCulture.length > 0 && (
          <Highlight
            icon={MessageSquareCode}
            title='Strongest review culture'
            description='Share of merged PRs reviewed by a teammate'
            items={reviewCulture.map((t) => ({
              label: t.name,
              href: teamHref(c.year, t),
              value: pct(t.reviewCoverage),
              sub: `${fmt(t.prsMerged)} PRs`,
            }))}
          />
        )}
        {fastest.length > 0 && (
          <Highlight
            icon={Clock}
            title='Quickest to merge'
            description='Median time from PR opened to merged'
            items={fastest.map((t) => ({
              label: t.name,
              href: teamHref(c.year, t),
              value: fmtHours(t.medianMergeHours),
            }))}
          />
        )}
        {!live && nightOwls.length > 0 && (
          <Highlight
            icon={Moon}
            title='Night owls'
            description='Share of commits made between 10 pm and 4 am'
            items={nightOwls.map((t) => ({
              label: t.name,
              href: teamHref(c.year, t),
              value: pct(t.nightOwlShare),
            }))}
          />
        )}
      </Grid>

      <ActivityChart
        data={c.weekly}
        termStart={c.termStart}
        description='Across the whole cohort. Pick a measure above, or narrow the time range.'
      />

      <MetricBarChart
        title='Team output'
        description='Highest first. Overall weighs commits, merged PRs, reviews and issues.'
        {...teamBars(c)}
        sortDesc
      />

      <Section
        title='Teams'
        description='Every team at a glance. Click a column to see who leads on it. Collaboration is 0–100, higher means work is shared more evenly.'
      >
        <TeamTable rows={teamRows(c)} live={live} />
      </Section>

      {!isSmallCohort(c) && <MissingTeam year={c.year} live={live} />}

      <Grid className='lg:grid-cols-5'>
        <Section
          className='lg:col-span-3'
          title='When the cohort commits'
          description='Hover a cell for the count.'
        >
          <Punchcard data={c.punch} timezone={summary.timezone} />
        </Section>
        <div className='lg:col-span-2'>
          <LanguageDonut languages={c.languages} />
        </div>
      </Grid>
    </div>
  );
}
