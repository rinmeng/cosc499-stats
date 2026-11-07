import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  GitMerge,
  GitPullRequest,
  Lock,
  MessageSquareCode,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';

import { ExternalLink } from '@/components/ExternalLink';
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
import { ActivityInfo } from '@/components/stats/ActivityInfo';
import { CollaborationInfo } from '@/components/stats/CollaborationInfo';
import { ScoreInfo } from '@/components/stats/ScoreInfo';
import { TopContributors } from '@/components/stats/TopContributors';
import { getCohort, getSummary, getTeam } from '@/lib/data';
import { pageMetadata, teamSeo } from '@/lib/seo';
import { displayName, fmt, fmtCompact, fmtDate, fmtHours, pct } from '@/lib/format';
import type { PersonStats } from '@/lib/types/stats';
import {
  currentWeek,
  overallScore,
  teamHabits,
  teamTopViews,
  teamPointsSeries,
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
  if (!c || !t) return { title: 'Team not found', robots: { index: false } };
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
  const live = c.isCurrent;
  const overall = overallScore(t);
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
        meta={[
          ...t.repos.map((r) => (
            <ExternalLink key={r.name} href={r.url}>
              {r.isPrivate && <Lock className='size-3' />}
              {r.name}
            </ExternalLink>
          )),
          `${fmt(t.contributors)} contributors`,
          live && `${fmt(overall)} pts so far`,
          `Last activity ${fmtDate(t.lastActivity)}`,
        ]}
      >
        {t.description && !/created by GitHub Classroom/i.test(t.description) && (
          <p>{t.description}</p>
        )}
      </PageHeader>

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        {live ? (
          <>
            <StatTile
              className={next()}
              icon={Star}
              label='Points this week'
              value={fmt(t.thisWeek.points)}
              unit='pts'
              trend={{ now: t.thisWeek.points, last: t.lastWeek.points, unit: 'pts' }}
            />
            <StatTile
              className={next()}
              icon={GitPullRequest}
              label='Commits this week'
              value={fmt(t.thisWeek.commits)}
              unit='commits'
              trend={{
                now: t.thisWeek.commits,
                last: t.lastWeek.commits,
                unit: 'commits',
              }}
            />
            <StatTile
              className={next()}
              icon={GitMerge}
              label='Merged PRs this week'
              value={fmt(t.thisWeek.prsMerged)}
              unit='PRs'
              trend={{
                now: t.thisWeek.prsMerged,
                last: t.lastWeek.prsMerged,
                unit: 'PRs',
              }}
            />
            <StatTile
              className={next()}
              icon={MessageSquareCode}
              label='Reviews this week'
              value={fmt(t.thisWeek.reviews)}
              unit='reviews'
              trend={{
                now: t.thisWeek.reviews,
                last: t.lastWeek.reviews,
                unit: 'reviews',
              }}
            />
            <StatTile
              className={next()}
              icon={Clock}
              label='Time to merge this week'
              value={fmtHours(t.thisWeek.medianMergeHours)}
              trend={
                t.lastWeek.medianMergeHours !== null &&
                t.thisWeek.medianMergeHours !== null
                  ? {
                      now: t.thisWeek.medianMergeHours,
                      last: t.lastWeek.medianMergeHours,
                      format: fmtHours,
                      unit: 'median',
                    }
                  : undefined
              }
              hint='median, from PR opened to merged'
            />
            <StatTile
              className={next()}
              icon={Sparkles}
              label='Lines changed this week'
              value={fmtCompact(t.thisWeek.lines)}
              unit='lines'
              trend={{
                now: t.thisWeek.lines,
                last: t.lastWeek.lines,
                unit: 'lines',
                format: fmtCompact,
              }}
            />
          </>
        ) : (
          <>
            <StatTile
              className={next()}
              icon={Star}
              label='Overall'
              value={fmt(overall)}
              unit='pts'
              hint={
                t.teamworkBonus > 0
                  ? `${fmt(t.score)} + ${fmt(t.teamworkBonus)} teamwork bonus`
                  : undefined
              }
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
          </>
        )}
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
          <TeamRadial items={teamHabits(c, t)} action={<CollaborationInfo />} />
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
        description={`Points from week 0, next to every other team in ${c.label} (faded) and the cohort's average team. Doesn't include the teamwork bonus.`}
        legendHint='Click a name to bring its line forward'
        series={teamPointsSeries(summary, c, t)}
        action={<ScoreInfo weights={summary.scoreWeights} />}
        faintLabel={`Other teams in ${c.label}`}
        highlight={`team-${t.key}`}
        compareTo={c.slug}
        valueLabel='points'
        currentWeek={c.isCurrent ? currentWeek(c) : undefined}
      />

      <ActivityChart
        info={<ActivityInfo timezone={summary.timezone} />}
        data={t.weekly}
        termStart={c.termStart}
        session={c.session}
        title='Team activity by week'
        description='Every commit, pull request, review and issue on the team, by week. Narrow the time range above.'
      />

      <Grid className='lg:grid-cols-5'>
        <Section
          className={cn('lg:col-span-3', next())}
          title='When the team is active'
          description='Every commit, pull request, review and issue, by day and hour.'
          action={<ActivityInfo timezone={summary.timezone} />}
        >
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
