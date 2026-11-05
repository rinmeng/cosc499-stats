import { notFound } from 'next/navigation';
import {
  Clock,
  GitMerge,
  GitPullRequest,
  Handshake,
  MessageSquareCode,
  CalendarDays,
  ExternalLink,
  CalendarFold,
  CircleCheckBig,
  Flag,
  Gem,
  Languages,
  MessagesSquare,
  ShieldCheck,
  Boxes,
  Ghost,
  Hourglass,
  Moon,
  NotebookPen,
  TreePine,
  Zap,
  PackageCheck,
  Rocket,
  Trophy,
  Sunrise,
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
  type HighlightProps,
  PageHeader,
  Section,
  StatTile,
} from '@/components/stats/Blocks';
import {
  HelpComplete,
  isSmallCohort,
  MissingTeam,
} from '@/components/stats/HelpComplete';
import {
  HighlightSections,
  type HighlightSection,
} from '@/components/stats/HighlightSections';
import { TeamTable } from '@/components/stats/TeamTable';
import { TopContributors } from '@/components/stats/TopContributors';
import { Badge } from '@/components/ui/badge';
import { getCohort, getSummary } from '@/lib/data';
import type { TeamStats } from '@/lib/types/stats';
import { cohortSeo, pageMetadata } from '@/lib/seo';
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
  return getSummary()?.cohorts.map((c) => ({ cohort: c.slug })) ?? [];
}

/** GitHub "languages" that are markup, styling or config, not a language a team picked. */
const NOT_PROGRAMMING = new Set([
  'HTML',
  'CSS',
  'SCSS',
  'Sass',
  'Less',
  'Dockerfile',
  'Makefile',
  'Procfile',
  'Batchfile',
  'Shell',
  'PowerShell',
  'Jupyter Notebook',
  'Handlebars',
  'EJS',
  'Mustache',
  'Twig',
  'Blade',
  'HCL',
  'Nix',
  'CMake',
  'Roff',
  'TeX',
  'Smarty',
  'Pug',
]);

export async function generateMetadata({ params }: PageProps<'/[cohort]'>) {
  const { cohort } = await params;
  const c = getCohort(cohort);
  if (!c) return { title: 'Cohort not found' };
  return pageMetadata(cohortSeo(c));
}

/** The cohort's GitHub organization, linked; nothing for sessions that had no org. */
function OrgLink({ org }: { org?: string }) {
  if (!org) return null;
  return (
    <>
      <a
        href={`https://github.com/${org}`}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
      >
        {org} <ExternalLink className='size-3.5' />
      </a>
      {' · '}
    </>
  );
}

export default async function CohortPage({ params }: PageProps<'/[cohort]'>) {
  const { cohort } = await params;
  const summary = getSummary();
  if (!summary) return <EmptyState />;
  const c = getCohort(cohort);
  if (!c) notFound();

  // Nothing visible yet (e.g. a summer session whose repos are all private).
  if (c.teams.length === 0)
    return (
      <div className='space-y-8'>
        <PageHeader eyebrow='COSC 499 capstone' title={`${c.label} cohort`}>
          <OrgLink org={c.org} />
          No team repositories from this session are visible on GitHub yet.
        </PageHeader>
        <HelpComplete label={c.label} cohort={c.slug} teams={0} note={c.note} />
      </div>
    );

  const week = currentWeek(c);
  const live = c.isCurrent;

  const enough = (t: TeamStats) => t.commits >= 50;
  const card = (
    h: Omit<HighlightProps, 'items'>,
    teams: TeamStats[],
    item: (t: TeamStats) => {
      value: string;
      unit?: string;
      sub?: string;
      wrapSub?: boolean;
    }
  ): HighlightProps => ({
    ...h,
    items: teams.map((t) => ({ label: t.name, href: teamHref(c.slug, t), ...item(t) })),
  });
  const fmtDays = (h: number) => (h >= 48 ? `${(h / 24).toFixed(0)} days` : fmtHours(h));
  const fmtSecs = (h: number) => {
    const s = h * 3600;
    return s < 120 ? `${Math.max(1, Math.round(s))} s` : fmtHours(h);
  };

  // Tech: language share helpers.
  const langBytes = (t: TeamStats, name: string) =>
    t.languages.find((l) => l.name === name)?.bytes ?? 0;
  const codeBytes = (t: TeamStats) => t.languages.reduce((a, l) => a + l.bytes, 0);
  // Type-safe: TypeScript's share of a team's JavaScript + TypeScript code.
  const jsTs = (t: TeamStats) => langBytes(t, 'TypeScript') + langBytes(t, 'JavaScript');
  const tsShare = (t: TeamStats) => (jsTs(t) ? langBytes(t, 'TypeScript') / jsTs(t) : 0);
  // Rare pick: a programming language (≥ 1% of the team's code) no other team used.
  const used = (t: TeamStats) =>
    t.languages.filter(
      (l) => !NOT_PROGRAMMING.has(l.name) && l.bytes >= codeBytes(t) * 0.01
    );
  const teamsUsing = new Map<string, number>();
  c.teams.forEach((t) =>
    used(t).forEach((l) => teamsUsing.set(l.name, (teamsUsing.get(l.name) ?? 0) + 1))
  );
  const rarePicks = (t: TeamStats) =>
    c.teams.length > 1 ? used(t).filter((l) => teamsUsing.get(l.name) === 1) : [];

  const allSections: HighlightSection[] = [
    {
      title: 'Strangest stats',
      description: 'The odd, the heroic and the slightly concerning.',
      cards: [
        card(
          {
            icon: Zap,
            title: 'Speed demon',
            description: 'Fastest single PR from opened to merged',
          },
          c.teams
            .filter((t) => t.fastestPr)
            .sort((a, b) => a.fastestPr!.value - b.fastestPr!.value)
            .slice(0, 3),
          (t) => ({
            value: fmtSecs(t.fastestPr!.value),
            sub: `PR #${t.fastestPr!.number}`,
          })
        ),
        card(
          {
            icon: Hourglass,
            title: 'Patience award',
            description: 'Longest a PR stayed open before finally being merged',
          },
          topTeams(c, (t) => t.slowestPr?.value ?? 0, 3),
          (t) => ({
            value: fmtDays(t.slowestPr!.value),
            sub: `PR #${t.slowestPr!.number}`,
          })
        ),
        card(
          {
            icon: Ghost,
            title: 'Witching hour',
            description: 'Commits made between 3 and 4 am',
          },
          topTeams(c, (t) => t.witchingCommits, 3),
          (t) => ({ value: fmt(t.witchingCommits), unit: 'commits' })
        ),
        card(
          {
            icon: TreePine,
            title: 'Holiday heroes',
            description:
              c.session === 'summer'
                ? 'Commits on Victoria Day, Canada Day or BC Day'
                : 'Commits on Thanksgiving, over Christmas and New Year, or in reading week',
          },
          topTeams(c, (t) => t.holidayCommits, 3),
          (t) => ({ value: fmt(t.holidayCommits), unit: 'commits' })
        ),
        card(
          {
            icon: NotebookPen,
            title: 'Exam-season grinders',
            description: 'Commits during the December and April exam periods',
          },
          topTeams(c, (t) => t.examCommits, 3),
          (t) => ({ value: fmt(t.examCommits), unit: 'commits' })
        ),
        card(
          {
            icon: Boxes,
            title: 'Mega PR',
            description: 'Most files changed in a single merged PR',
          },
          topTeams(c, (t) => t.megaPr?.value ?? 0, 3),
          (t) => ({
            value: fmt(t.megaPr!.value),
            unit: 'files',
            sub: `PR #${t.megaPr!.number}`,
          })
        ),
        card(
          {
            icon: CalendarFold,
            title: 'Biggest day',
            description: 'Most commits a team made in a single day',
          },
          topTeams(c, (t) => t.biggestDay?.commits ?? 0, 3),
          (t) => ({
            value: fmt(t.biggestDay!.commits),
            unit: 'commits',
            sub: `on ${fmtDate(t.biggestDay!.date)}`,
          })
        ),
      ],
    },
    {
      title: 'Work rhythm',
      description: 'When teams like to work.',
      cards: [
        card(
          {
            icon: Moon,
            title: 'Night owls',
            description: 'Share of commits made between 10 pm and 4 am',
          },
          topTeams(c, (t) => t.nightOwlShare, 3, enough),
          (t) => ({ value: pct(t.nightOwlShare), unit: 'of commits' })
        ),
        card(
          {
            icon: Sunrise,
            title: 'Early birds',
            description: 'Share of commits made between 5 am and 9 am',
          },
          topTeams(c, (t) => t.earlyBirdShare, 3, enough),
          (t) => ({ value: pct(t.earlyBirdShare), unit: 'of commits' })
        ),
        card(
          {
            icon: CalendarDays,
            title: 'Weekend warriors',
            description: 'Share of commits made on Saturday or Sunday',
          },
          topTeams(c, (t) => t.weekendShare, 3, enough),
          (t) => ({ value: pct(t.weekendShare), unit: 'of commits' })
        ),
      ],
    },
    {
      title: 'Momentum',
      description: 'Who got going early, finished strong and had the biggest weeks.',
      cards: [
        live
          ? card(
              {
                icon: Sparkles,
                title: 'Most active this week',
                description: 'Commits since Sunday',
              },
              topTeams(c, (t) => t.thisWeekCommits, 3),
              (t) => ({ value: fmt(t.thisWeekCommits), unit: 'commits' })
            )
          : null,
        card(
          {
            icon: Trophy,
            title: 'Biggest week',
            description: 'Most commits in a single week',
          },
          topTeams(c, (t) => t.peakWeek?.commits ?? 0, 3),
          (t) => ({
            value: fmt(t.peakWeek?.commits ?? 0),
            unit: 'commits',
            sub: `week ${t.peakWeek?.week}`,
          })
        ),
        card(
          {
            icon: Flag,
            title: 'Strongest finish',
            description: 'Commits in the last 4 weeks of term',
          },
          topTeams(c, (t) => t.finishCommits ?? 0, 3),
          (t) => ({ value: fmt(t.finishCommits ?? 0), unit: 'commits' })
        ),
        card(
          {
            icon: Rocket,
            title: 'Fastest start',
            description: 'Commits in the first 4 weeks of term',
          },
          topTeams(c, (t) => t.startCommits, 3),
          (t) => ({ value: fmt(t.startCommits), unit: 'commits' })
        ),
      ],
    },
    {
      title: 'Teamwork',
      description: 'Sharing the work and reviewing each other’s code.',
      more: true,
      cards: [
        card(
          {
            icon: Handshake,
            title: 'Most collaborative',
            description:
              'Commits shared most evenly across the team (100 = everyone equal)',
          },
          topTeams(
            c,
            (t) => t.collaboration,
            3,
            (t) => t.contributors >= 3
          ),
          (t) => ({
            value: `${Math.round(t.collaboration * 100)}`,
            unit: '/ 100',
            sub: `${t.contributors} people`,
          })
        ),
        card(
          {
            icon: MessageSquareCode,
            title: 'Strongest review culture',
            description: 'Share of merged PRs reviewed by a teammate',
          },
          topTeams(
            c,
            (t) => t.reviewCoverage + t.prsMerged / 1e6,
            3,
            (t) => t.prsMerged >= 10
          ),
          (t) => ({
            value: pct(t.reviewCoverage),
            unit: 'reviewed',
            sub: `of ${fmt(t.prsMerged)} merged PRs`,
          })
        ),
        card(
          {
            icon: MessagesSquare,
            title: 'Deepest discussions',
            description: 'Average comments and reviews per merged PR',
          },
          topTeams(
            c,
            (t) => t.discussionPerPr,
            3,
            (t) => t.prsMerged >= 10
          ),
          (t) => ({ value: t.discussionPerPr.toFixed(1), unit: 'per PR' })
        ),
      ],
    },
    {
      title: 'Shipping',
      description: 'Getting work merged and issues closed.',
      more: true,
      cards: [
        card(
          {
            icon: Clock,
            title: 'Quickest to merge',
            description: 'Median time from PR opened to merged',
          },
          c.teams
            .filter((t) => t.medianMergeHours !== null && t.prsMerged >= 10)
            .sort((a, b) => a.medianMergeHours! - b.medianMergeHours!)
            .slice(0, 3),
          (t) => ({ value: fmtHours(t.medianMergeHours), unit: 'median' })
        ),
        card(
          {
            icon: PackageCheck,
            title: 'PRs shipped',
            description:
              'Of the PRs that were closed, the share merged rather than dropped',
          },
          topTeams(
            c,
            (t) => t.shipRate + t.prsMerged / 1e6,
            3,
            (t) => t.prsMerged >= 10
          ),
          (t) => ({
            value: pct(t.shipRate),
            unit: 'merged',
            sub: `${fmt(t.prsMerged)} merged, ${fmt(t.prsClosedUnmerged)} closed`,
          })
        ),
        card(
          {
            icon: CircleCheckBig,
            title: 'Closing the loop',
            description: 'Share of opened issues that are now closed',
          },
          topTeams(
            c,
            (t) => t.issueCloseRate + t.issuesTotal / 1e6,
            3,
            (t) => t.issuesTotal >= 10
          ),
          (t) => ({
            value: pct(t.issueCloseRate),
            unit: 'closed',
            sub: `of ${fmt(t.issuesTotal)} issues`,
          })
        ),
      ],
    },
    {
      title: 'Tech',
      description: 'What teams built with.',
      more: true,
      cards: [
        card(
          {
            icon: Languages,
            title: 'Polyglots',
            description: 'Most programming languages across the team’s repos',
          },
          topTeams(c, (t) => t.languageCount + t.commits / 1e6, 3),
          (t) => ({
            value: String(t.languageCount),
            unit: 'languages',
            sub: t.languages.map((l) => l.name).join(', '),
            wrapSub: true,
          })
        ),
        card(
          {
            icon: ShieldCheck,
            title: 'Type-safe',
            description:
              'Highest share of TypeScript in their JavaScript + TypeScript code',
          },
          topTeams(
            c,
            (t) => tsShare(t) + jsTs(t) / 1e12,
            3,
            (t) => langBytes(t, 'TypeScript') > 0 && jsTs(t) >= codeBytes(t) * 0.2
          ),
          (t) => ({ value: pct(tsShare(t)), unit: 'TypeScript', sub: 'of their JS + TS' })
        ),
        card(
          {
            icon: Gem,
            title: 'Rare pick',
            description: 'A programming language no other team in this cohort used',
          },
          topTeams(c, (t) => rarePicks(t).reduce((a, l) => a + l.bytes, 0), 3),
          (t) => {
            const [top, ...rest] = rarePicks(t);
            return {
              value: top.name,
              unit: `${pct(top.bytes / codeBytes(t))} of code`,
              sub: rest.length ? `also ${rest.map((l) => l.name).join(', ')}` : undefined,
            };
          }
        ),
      ],
    },
  ];
  // Most interesting first; on a live cohort, "this week" momentum leads.
  const sections = live
    ? [
        ...allSections.filter((x) => x.title === 'Momentum'),
        ...allSections.filter((x) => x.title !== 'Momentum'),
      ]
    : allSections;

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow={
          <span className='flex items-center gap-2'>
            COSC 499 capstone
            {live && <Badge>In progress · week {week}</Badge>}
          </span>
        }
        title={`${c.label} cohort`}
      >
        <OrgLink org={c.org} />
        {live ? (
          <>
            {c.totals.teams} teams building right now. Term started {fmtDate(c.termStart)}
            ; data last synced {fmtDate(summary.generatedAt)}.
          </>
        ) : (
          <>
            {c.session === 'summer' && 'Summer session (May to August). '}
            {c.totals.teams} teams, {fmt(c.totals.contributors)} contributors, term
            starting {fmtDate(c.termStart)}.
          </>
        )}
      </PageHeader>

      {isSmallCohort(c) && (
        <HelpComplete
          label={c.label}
          cohort={c.slug}
          teams={c.totals.teams}
          note={c.note}
        />
      )}

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        <StatTile
          icon={Users}
          label='Contributors'
          value={fmt(c.totals.contributors)}
          unit='people'
        />
        <StatTile
          icon={GitPullRequest}
          label='Commits'
          value={fmtCompact(c.totals.commits)}
          unit='commits'
          hint={`avg ${fmt(c.avgPerTeam.commits)} commits per team`}
        />
        <StatTile
          icon={GitMerge}
          label='Merged PRs'
          value={fmt(c.totals.prsMerged)}
          unit='PRs'
          hint={`avg ${fmt(c.avgPerTeam.prsMerged)} PRs per team`}
        />
        <StatTile
          icon={MessageSquareCode}
          label='Reviews'
          value={fmt(c.totals.reviews)}
          unit='reviews'
          hint={`${pct(c.reviewCoverage)} of merged PRs got one`}
        />
        <StatTile
          icon={Clock}
          label='Median time to merge'
          value={fmtHours(c.medianMergeHours)}
          hint='from PR opened to merged'
        />
        {live ? (
          <StatTile
            icon={Sparkles}
            label='Commits this week'
            value={fmt(c.thisWeek.commits)}
            unit='commits'
            hint={
              c.lastWeek.commits
                ? `${fmt(c.lastWeek.commits)} commits last week`
                : undefined
            }
          />
        ) : (
          <StatTile
            icon={Sparkles}
            label='Lines changed'
            value={fmtCompact(c.totals.lines)}
            unit='lines'
            hint='added + deleted, excl. very large commits'
          />
        )}
      </Grid>

      {live && (
        <CohortTrendChart
          title='How this cohort is tracking'
          description='Average cumulative commits per team by week of term, next to past cohorts at the same point in their term (summer sessions dashed). Click a cohort to bring it forward.'
          series={trendSeries(summary)}
          currentWeek={week}
        />
      )}

      <ActivityChart
        data={c.weekly}
        termStart={c.termStart}
        session={c.session}
        description='Across the whole cohort. Pick a measure above, or narrow the time range.'
      />

      <MetricBarChart
        title='Team output'
        description='Highest first. Overall weighs commits, merged PRs, reviews and issues.'
        {...teamBars(c)}
        sortDesc
      />

      <Section
        title='Top contributors'
        description={`“Overall” weighs commits ×${summary.scoreWeights.commits}, merged PRs ×${summary.scoreWeights.prsMerged}, reviews ×${summary.scoreWeights.reviews} and issues ×${summary.scoreWeights.issuesOpened}. Top 10 across the cohort, or the top ${summary.topN} on each team. Switch the measure to rank by just one thing.`}
      >
        <TopContributors
          teams={teamTopViews(c, summary.topN)}
          cohort={cohortTopView(c, 10)}
        />
      </Section>

      <HighlightSections sections={sections} />

      <Section
        title='Teams'
        description='Every team at a glance. Click a column to see who leads on it. Collaboration is 0–100, higher means work is shared more evenly.'
      >
        <TeamTable rows={teamRows(c)} live={live} />
      </Section>

      {!isSmallCohort(c) && <MissingTeam cohort={c.slug} label={c.label} live={live} />}

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
