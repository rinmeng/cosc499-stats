import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Lock,
  MessageSquareCode,
  Trophy,
  Users,
} from 'lucide-react';

import { ShareButton } from '@/components/ShareDialog';
import { MemberRadars, type RadarMember } from '@/components/charts/MemberRadars';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { LanguageDonut } from '@/components/charts/LanguageDonut';
import { Punchcard } from '@/components/charts/Punchcard';
import { TeamRadial } from '@/components/charts/TeamRadial';
import {
  EmptyState,
  Grid,
  PageHeader,
  Section,
  StatTile,
} from '@/components/stats/Blocks';
import { ScoreInfo } from '@/components/stats/ScoreInfo';
import { TopContributors } from '@/components/stats/TopContributors';
import { getCohort, getSummary, getTeam } from '@/lib/data';
import { pageMetadata, teamSeo } from '@/lib/seo';
import { displayName, fmt, fmtDate, fmtHours, pct } from '@/lib/format';
import type { PersonStats } from '@/lib/types/stats';
import {
  currentWeek,
  teamHabits,
  teamTopViews,
  teamTrend,
  trendSeries,
} from '@/lib/views';
import { fadeUp, stagger } from '@/utils/animations';
import { cn } from '@/lib/utils';

export function generateStaticParams() {
  return (
    getSummary()?.cohorts.flatMap((c) =>
      c.teams.map((t) => ({ cohort: c.slug, team: String(t.team) }))
    ) ?? []
  );
}

export async function generateMetadata({ params }: PageProps<'/[cohort]/[team]'>) {
  const { cohort, team } = await params;
  const c = getCohort(cohort);
  const t = c?.teams.find((x) => x.team === Number(team));
  if (!c || !t) return { title: 'Team not found' };
  return pageMetadata(teamSeo(c, t));
}

const AXES: { key: keyof PersonStats; label: string }[] = [
  { key: 'commits', label: 'Commits' },
  { key: 'prsMerged', label: 'PRs' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'issues', label: 'Issues' },
  { key: 'activeWeeks', label: 'Weeks' },
];

export default async function TeamPage({ params }: PageProps<'/[cohort]/[team]'>) {
  const { cohort, team } = await params;
  const summary = getSummary();
  if (!summary) return <EmptyState />;
  const c = getCohort(cohort);
  const t = getTeam(cohort, Number(team));
  if (!c || !t) notFound();

  const view = teamTopViews({ ...c, teams: [t] }, summary.topN)[0];
  const top = t.members.slice(0, summary.topN);
  const maxes = Object.fromEntries(
    AXES.map((a) => [a.key, Math.max(1, ...t.members.map((m) => m[a.key] as number))])
  );
  const radars: RadarMember[] = top.map((m) => ({
    id: m.id,
    name: displayName(m),
    login: m.login,
    avatarUrl: m.avatarUrl,
    values: AXES.map((a) => ({
      axis: a.label,
      raw: m[a.key] as number,
      share: (m[a.key] as number) / maxes[a.key as string],
    })),
  }));

  // The back link goes first (0), so the header takes steps 1–3.
  const next = stagger(4);
  return (
    <div className='space-y-8'>
      <Link
        href={`/${c.slug}`}
        className={cn(
          `inline-flex items-center gap-1 text-sm text-muted-foreground
          hover:text-foreground`,
          fadeUp(0)
        )}
      >
        <ArrowLeft className='size-4' /> {c.label} cohort
      </Link>

      <PageHeader
        action={
          <ShareButton
            item={{
              path: teamSeo(c, t).path,
              title: teamSeo(c, t).title,
              description: teamSeo(c, t).description,
            }}
          />
        }
        start={1}
        eyebrow={c.org}
        title={t.name}
      >
        <div className='space-y-2'>
          {t.description && !/created by GitHub Classroom/i.test(t.description) && (
            <p>{t.description}</p>
          )}
          <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
            {t.repos.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 hover:text-foreground
                  hover:underline'
              >
                {r.isPrivate && <Lock className='size-3' />}
                {r.name}
                <ExternalLink className='size-3' />
              </a>
            ))}
            <span>Last activity {fmtDate(t.lastActivity)}</span>
          </div>
        </div>
      </PageHeader>

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        <StatTile
          className={next()}
          icon={Users}
          label='Contributors'
          value={fmt(t.contributors)}
          unit='people'
        />
        <StatTile
          className={next()}
          icon={GitPullRequest}
          label='Commits'
          value={fmt(t.commits)}
          unit='commits'
        />
        <StatTile
          className={next()}
          icon={GitMerge}
          label='Merged PRs'
          value={fmt(t.prsMerged)}
          unit='PRs'
        />
        <StatTile
          className={next()}
          icon={MessageSquareCode}
          label='Reviews'
          value={fmt(t.reviews)}
          unit='reviews'
          hint={`${pct(t.reviewCoverage)} of merged PRs got one`}
        />
        <StatTile
          className={next()}
          icon={Clock}
          label='Median time to merge'
          value={fmtHours(t.medianMergeHours)}
          hint='from PR opened to merged'
        />
        <StatTile
          className={next()}
          icon={Trophy}
          label='Biggest week'
          value={t.peakWeek ? fmt(t.peakWeek.commits) : '—'}
          unit={t.peakWeek ? 'commits' : undefined}
          hint={t.peakWeek ? `in week ${t.peakWeek.week} of term` : undefined}
        />
      </Grid>

      <Grid className='lg:grid-cols-5'>
        <Section
          className={cn('lg:col-span-3', next())}
          title={`Top ${summary.topN} contributors`}
          description='Switch the measure to see who leads on each.'
          action={<ScoreInfo weights={summary.scoreWeights} />}
        >
          <TopContributorsSingle view={view} />
        </Section>
        <div className='lg:col-span-2'>
          <TeamRadial items={teamHabits(c, t)} />
        </div>
      </Grid>

      {radars.length > 0 && (
        <section className='space-y-3'>
          <div className={next()}>
            <h2 className='font-heading text-lg font-semibold'>Contribution profiles</h2>
            <p className='text-sm text-muted-foreground'>
              Each axis is scaled to the team’s best on that measure, so the shape shows
              where each person shines.
            </p>
          </div>
          <MemberRadars members={radars} />
        </section>
      )}

      <CohortTrendChart
        title={c.isCurrent ? 'How this team is tracking' : 'How this team tracked'}
        description={`Cumulative commits by week of term, next to the average team in ${c.label} and every other ${c.session === 'summer' ? 'summer' : 'year-long'} cohorts. Click a line to bring it forward.`}
        series={[...trendSeries(summary, c.slug), teamTrend(c, t)]}
        highlight={`team-${t.key}`}
        compareTo={c.slug}
        valueLabel='commits'
        currentWeek={c.isCurrent ? currentWeek(c) : undefined}
      />

      <ActivityChart
        data={t.weekly}
        termStart={c.termStart}
        session={c.session}
        title='Team activity by week'
        description='Pick a measure above, or narrow the time range.'
      />

      <Grid className='lg:grid-cols-5'>
        <Section className={cn('lg:col-span-3', next())} title='When the team commits'>
          <Punchcard data={t.punch} timezone={summary.timezone} />
        </Section>
        <div className='lg:col-span-2'>
          <LanguageDonut
            languages={t.languages}
            description='Share of code in this team’s repos'
          />
        </div>
      </Grid>
    </div>
  );
}

function TopContributorsSingle({
  view,
}: {
  view: ReturnType<typeof teamTopViews>[number];
}) {
  return <TopContributors teams={[view]} single />;
}
