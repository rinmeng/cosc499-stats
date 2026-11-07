import { notFound } from 'next/navigation';
import {
  Clock,
  GitMerge,
  GitPullRequest,
  Handshake,
  MessageSquareCode,
  CalendarDays,
  FileDiff,
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
  Star,
} from 'lucide-react';

import { ArrowLink } from '@/components/ArrowLink';
import { ExternalLink } from '@/components/ExternalLink';
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
import { ShareButton } from '@/components/ShareDialog';
import { CollaborationInfo } from '@/components/stats/CollaborationInfo';
import { TeamTable } from '@/components/stats/TeamTable';
import { ActivityInfo } from '@/components/stats/ActivityInfo';
import { ScoreInfo } from '@/components/stats/ScoreInfo';
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
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';
import { fadeUp, stagger } from '@/utils/animations';

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
  if (!c) return { title: 'Cohort not found', robots: { index: false } };
  return pageMetadata(cohortSeo(c));
}

/** The cohort's GitHub organization, linked; nothing for sessions that had no org. */
function OrgLink({ org }: { org?: string }) {
  if (!org) return null;
  return <ExternalLink href={`https://github.com/${org}`}>{org}</ExternalLink>;
}

/** Opens this session on the Grades page (its grade spread and the year-by-year view). */
function GradesLink({ slug }: { slug: string }) {
  return <ArrowLink href={`/insights/grades#${slug}`}>Grades report</ArrowLink>;
}

/** "Taught by A", "Taught by A and B": the instructors PAIR lists, if any. */
function taughtBy(names: string[] | undefined) {
  if (!names?.length) return null;
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `Taught by ${list}`;
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
        <PageHeader
          action={
            <ShareButton
              item={{
                path: cohortSeo(c).path,
                title: cohortSeo(c).title,
                description: cohortSeo(c).description,
              }}
            />
          }
          title={`${c.label} cohort`}
          meta={[
            c.hasOrg && <OrgLink org={c.org} />,
            taughtBy(c.grades?.instructors),
            c.grades && `${fmt(c.grades.students)} students`,
            c.grades && <GradesLink slug={c.slug} />,
          ]}
        >
          No team repositories from this session are visible on GitHub yet.
        </PageHeader>
        <Reveal className={fadeUp(3)}>
          <HelpComplete
            label={c.label}
            cohort={c.slug}
            teams={0}
            note={c.note}
            contributors={c.contributors}
          />
        </Reveal>
      </div>
    );

  const week = currentWeek(c);
  const live = c.isCurrent;
  // Whole-term points: what members earned, plus each team's teamwork bonus.
  const earned = c.teams.reduce((a, t) => a + t.score, 0);
  const bonus = c.teams.reduce((a, t) => a + t.teamworkBonus, 0);

  // Shares need enough actions to mean something.
  const enough = (t: TeamStats) => t.activity >= 100;
  const activityInfo = <ActivityInfo timezone={summary.timezone} />;
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

  // Momentum cards, ordered per state in the section below.
  const mostActiveThisWeek = card(
    {
      icon: Sparkles,
      title: 'Most active this week',
      description: 'Commits, pull requests, reviews and issues since last Sunday',
    },
    topTeams(c, (t) => t.thisWeekActivity ?? 0, 3),
    (t) => ({ value: fmt(t.thisWeekActivity ?? 0), unit: 'actions' })
  );
  const mostLinesThisWeek = card(
    {
      icon: FileDiff,
      title: 'Most lines this week',
      description: 'Lines added and deleted on the main branch since last Sunday',
    },
    topTeams(c, (t) => t.thisWeekLines ?? 0, 3),
    (t) => ({ value: fmtCompact(t.thisWeekLines ?? 0), unit: 'lines' })
  );
  const mostPrsThisWeek = card(
    {
      icon: GitMerge,
      title: 'Most PRs merged this week',
    },
    topTeams(c, (t) => t.thisWeekPrsMerged ?? 0, 3),
    (t) => ({ value: fmt(t.thisWeekPrsMerged ?? 0), unit: 'PRs' })
  );
  const biggestWeek = card(
    { icon: Trophy, title: 'Biggest week', description: 'Most commits in a single week' },
    topTeams(c, (t) => t.peakWeek?.commits ?? 0, 3),
    (t) => ({
      value: fmt(t.peakWeek?.commits ?? 0),
      unit: 'commits',
      sub: `week ${t.peakWeek?.week}`,
    })
  );
  const strongestFinish = card(
    {
      icon: Flag,
      title: 'Strongest finish',
      description: 'Commits in the last 4 weeks of term',
    },
    topTeams(c, (t) => t.finishCommits ?? 0, 3),
    (t) => ({ value: fmt(t.finishCommits ?? 0), unit: 'commits' })
  );
  const fastestStart = card(
    {
      icon: Rocket,
      title: 'Fastest start',
      description: 'Commits in the first 4 weeks of term',
    },
    topTeams(c, (t) => t.startCommits, 3),
    (t) => ({ value: fmt(t.startCommits), unit: 'commits' })
  );

  // Live term: three "this week" sections up front, every term-long section tucked
  // behind "Show more". Finished terms show the term sections as before.
  const weeklySections: HighlightSection[] = [
    {
      title: 'Weekly momentum',
      action: activityInfo,
      cards: [mostActiveThisWeek, mostLinesThisWeek, mostPrsThisWeek],
    },
    {
      title: 'Weekly teamwork',
      action: <CollaborationInfo />,
      cards: [
        card(
          {
            icon: Handshake,
            title: 'Most collaborative this week',
            description: 'Points since last Sunday shared most evenly across the team',
          },
          topTeams(
            c,
            (t) => (t.thisWeekEvenness ?? 0) + t.thisWeekCommits / 1e6,
            3,
            (t) => (t.thisWeekContributors ?? 0) >= 3
          ),
          (t) => ({
            value: `${Math.round((t.thisWeekEvenness ?? 0) * 100)}`,
            unit: '/ 100',
            sub: `${t.thisWeekContributors} people`,
          })
        ),
        card(
          {
            icon: MessageSquareCode,
            title: 'Most reviews this week',
            description: 'Teammate reviews submitted since last Sunday',
          },
          topTeams(c, (t) => t.thisWeekReviews ?? 0, 3),
          (t) => ({ value: fmt(t.thisWeekReviews ?? 0), unit: 'reviews' })
        ),
        card(
          {
            icon: CircleCheckBig,
            title: 'Most issues closed this week',
          },
          topTeams(c, (t) => t.thisWeekIssuesClosed ?? 0, 3),
          (t) => ({ value: fmt(t.thisWeekIssuesClosed ?? 0), unit: 'issues' })
        ),
      ],
    },
    {
      title: 'Weekly rhythm',
      action: activityInfo,
      cards: [
        card(
          {
            icon: Moon,
            title: 'Night owls this week',
            description: 'Activity between 10 pm and 4 am since last Sunday',
          },
          topTeams(c, (t) => t.thisWeekNightActivity ?? 0, 3),
          (t) => ({ value: fmt(t.thisWeekNightActivity ?? 0), unit: 'actions' })
        ),
        card(
          {
            icon: Sunrise,
            title: 'Early birds this week',
            description: 'Activity between 5 am and 9 am since last Sunday',
            empty: 'No teams were early birds this week.',
          },
          topTeams(c, (t) => t.thisWeekEarlyActivity ?? 0, 3),
          (t) => ({ value: fmt(t.thisWeekEarlyActivity ?? 0), unit: 'actions' })
        ),
        card(
          {
            icon: CalendarDays,
            title: 'Weekend warriors this week',
            description: 'Activity on Saturday or Sunday this week',
          },
          topTeams(c, (t) => t.thisWeekWeekendActivity ?? 0, 3),
          (t) => ({ value: fmt(t.thisWeekWeekendActivity ?? 0), unit: 'actions' })
        ),
      ],
    },
  ];

  const termSections: HighlightSection[] = [
    {
      title: 'Across the term',
      cards: [fastestStart, biggestWeek, strongestFinish],
    },
    {
      title: 'Strangest stats',
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
            description: 'Activity between 3 and 4 am',
          },
          topTeams(c, (t) => t.witchingActivity, 3),
          (t) => ({ value: fmt(t.witchingActivity), unit: 'actions' })
        ),
        card(
          {
            icon: TreePine,
            title: 'Holiday heroes',
            description:
              c.session === 'summer'
                ? 'Activity on Victoria Day, Canada Day or BC Day'
                : 'Activity on Thanksgiving, over Christmas and New Year, or in reading week',
          },
          topTeams(c, (t) => t.holidayActivity, 3),
          (t) => ({ value: fmt(t.holidayActivity), unit: 'actions' })
        ),
        card(
          {
            icon: NotebookPen,
            title: 'Exam-season grinders',
            description: 'Activity during the December and April exam periods',
          },
          topTeams(c, (t) => t.examActivity, 3),
          (t) => ({ value: fmt(t.examActivity), unit: 'actions' })
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
      ],
    },
    {
      title: 'Work rhythm',
      action: activityInfo,
      cards: [
        card(
          {
            icon: Moon,
            title: 'Night owls',
            description: 'Share of activity between 10 pm and 4 am',
          },
          topTeams(c, (t) => t.nightOwlShare, 3, enough),
          (t) => ({ value: pct(t.nightOwlShare), unit: 'of activity' })
        ),
        card(
          {
            icon: Sunrise,
            title: 'Early birds',
            description: 'Share of activity between 5 am and 9 am',
          },
          topTeams(c, (t) => t.earlyBirdShare, 3, enough),
          (t) => ({ value: pct(t.earlyBirdShare), unit: 'of activity' })
        ),
        card(
          {
            icon: CalendarDays,
            title: 'Weekend warriors',
            description: 'Share of activity on Saturday or Sunday',
          },
          topTeams(c, (t) => t.weekendShare, 3, enough),
          (t) => ({ value: pct(t.weekendShare), unit: 'of activity' })
        ),
      ],
    },
    {
      title: 'Teamwork',
      description: 'Sharing the work and reviewing each other’s code.',
      action: <CollaborationInfo />,
      more: true,
      cards: [
        card(
          {
            icon: Handshake,
            title: 'Most collaborative',
            description: 'Points shared most evenly across the team',
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
  const next = stagger();
  const sections = live
    ? [...weeklySections, ...termSections.map((sec) => ({ ...sec, more: true }))]
    : termSections;
  // The live term leads with who's doing the work (contributors, team output, this
  // week); its tracking chart follows the team list. Past terms keep the tracking chart
  // up top. Activity by week sits below the team list either way.
  const trackingChart = (
    <div id='tracking' className='scroll-mt-20'>
      <CohortTrendChart
        title={live ? 'How this cohort is tracking' : 'How this cohort tracked'}
        description={`Average cumulative points per team by week of term.`}
        series={trendSeries(summary, c.slug)}
        action={<ScoreInfo weights={summary.scoreWeights} />}
        highlight={c.slug}
        currentWeek={live ? week : undefined}
      />
    </div>
  );
  const activityChart = (
    <ActivityChart
      info={activityInfo}
      data={c.weekly}
      termStart={c.termStart}
      session={c.session}
    />
  );

  return (
    <div className='space-y-8'>
      <PageHeader
        action={
          <ShareButton
            item={{
              path: cohortSeo(c).path,
              title: cohortSeo(c).title,
              description: cohortSeo(c).description,
            }}
          />
        }
        // Only the live term gets a line above the title: how far along it is.
        eyebrow={live && <Badge>In progress · week {week}</Badge>}
        title={`${c.label} cohort`}
        meta={
          live
            ? [
                c.hasOrg && <OrgLink org={c.org} />,
                `${fmt(c.totals.contributors)} contributors`,
                `Started ${fmtDate(c.termStart)}`,
                `Synced ${fmtDate(summary.generatedAt)}`,
              ]
            : [
                c.hasOrg && <OrgLink org={c.org} />,
                c.session === 'summer' && 'Summer session, May to August',
                taughtBy(c.grades?.instructors),
                c.grades && `${fmt(c.grades.students)} students`,
                `${c.totals.teams} teams`,
                `${fmt(c.totals.contributors)} contributors`,
                `Started ${fmtDate(c.termStart)}`,
                c.grades && <GradesLink slug={c.slug} />,
              ]
        }
      >
        {live && `${c.totals.teams} teams building right now.`}
      </PageHeader>

      {isSmallCohort(c) && (
        <Reveal className={next()}>
          <HelpComplete
            label={c.label}
            cohort={c.slug}
            teams={c.totals.teams}
            note={c.note}
            contributors={c.contributors}
          />
        </Reveal>
      )}

      <Grid className='grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
        {live ? (
          <>
            <StatTile
              className={next()}
              icon={Star}
              label='Points this week'
              value={fmt(c.thisWeek.points)}
              unit='pts'
              trend={{ now: c.thisWeek.points, last: c.lastWeek.points, unit: 'pts' }}
            />
            <StatTile
              className={next()}
              icon={GitPullRequest}
              label='Commits this week'
              value={fmt(c.thisWeek.commits)}
              unit='commits'
              trend={{
                now: c.thisWeek.commits,
                last: c.lastWeek.commits,
                unit: 'commits',
              }}
            />
            <StatTile
              className={next()}
              icon={GitMerge}
              label='Merged PRs this week'
              value={fmt(c.thisWeek.prsMerged)}
              unit='PRs'
              trend={{
                now: c.thisWeek.prsMerged,
                last: c.lastWeek.prsMerged,
                unit: 'PRs',
              }}
            />
            <StatTile
              className={next()}
              icon={MessageSquareCode}
              label='Reviews this week'
              value={fmt(c.thisWeek.reviews)}
              unit='reviews'
              trend={{
                now: c.thisWeek.reviews,
                last: c.lastWeek.reviews,
                unit: 'reviews',
              }}
            />
            <StatTile
              className={next()}
              icon={Clock}
              label='Time to merge this week'
              value={fmtHours(c.thisWeek.medianMergeHours)}
              trend={
                c.lastWeek.medianMergeHours !== null &&
                c.thisWeek.medianMergeHours !== null
                  ? {
                      now: c.thisWeek.medianMergeHours,
                      last: c.lastWeek.medianMergeHours,
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
              value={fmtCompact(c.thisWeek.lines)}
              unit='lines'
              trend={{
                now: c.thisWeek.lines,
                last: c.lastWeek.lines,
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
              value={fmtCompact(earned + bonus)}
              unit='pts'
              hint={
                bonus > 0
                  ? `${fmt(earned)} earned + ${fmt(bonus)} teamwork bonus`
                  : undefined
              }
            />
            <StatTile
              className={next()}
              icon={GitPullRequest}
              label='Commits'
              value={fmtCompact(c.totals.commits)}
              unit='commits'
              hint={`avg ${fmt(c.avgPerTeam.commits)} commits per team`}
            />
            <StatTile
              className={next()}
              icon={GitMerge}
              label='Merged PRs'
              value={fmt(c.totals.prsMerged)}
              unit='PRs'
              hint={`avg ${fmt(c.avgPerTeam.prsMerged)} PRs per team`}
            />
            <StatTile
              className={next()}
              icon={MessageSquareCode}
              label='Reviews'
              value={fmt(c.totals.reviews)}
              unit='reviews'
              hint={`${pct(c.reviewCoverage)} of merged PRs got one`}
            />
            <StatTile
              className={next()}
              icon={Clock}
              label='Median time to merge'
              value={fmtHours(c.medianMergeHours)}
              hint='from PR opened to merged'
            />
            <StatTile
              className={next()}
              icon={Sparkles}
              label='Lines changed'
              value={fmtCompact(c.totals.lines)}
              unit='lines'
              hint='added + deleted, excl. very large commits'
            />
          </>
        )}
      </Grid>

      {!live && trackingChart}

      <Section
        className={next()}
        title='Top contributors'
        description={`Top 10 across the cohort, or the top ${summary.topN} on each team.`}
        action={<ScoreInfo weights={summary.scoreWeights} />}
      >
        <TopContributors
          teams={teamTopViews(c, summary.topN)}
          cohort={cohortTopView(c, 10)}
        />
      </Section>

      <MetricBarChart
        title='Team output'
        description={
          <>
            The top half of teams, or every team highest first.
            <div className='mt-1 -ml-2'>
              <ScoreInfo weights={summary.scoreWeights} bonus={summary.teamworkBonus} />
            </div>
          </>
        }
        {...teamBars(c)}
        sortDesc
        // Podium covers the top half of the cohort's teams.
        podium={Math.ceil(c.teams.length / 2)}
      />

      <HighlightSections sections={sections} />

      <Section
        className={next()}
        title='Teams'
        description='Click a column to see who leads on it.'
        action={<CollaborationInfo />}
      >
        <TeamTable rows={teamRows(c)} live={live} />
      </Section>

      {!isSmallCohort(c) && (
        <Reveal className={next()}>
          <MissingTeam cohort={c.slug} label={c.label} live={live} />
        </Reveal>
      )}

      {live && trackingChart}
      {activityChart}

      <Grid className='lg:grid-cols-5'>
        <Section
          className={cn('lg:col-span-3', next())}
          title='When the cohort is active'
          action={activityInfo}
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
