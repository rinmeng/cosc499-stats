import 'server-only';

import { fmt } from '@/lib/format';
import type { OgStat } from '@/lib/og';
import type { Person } from '@/lib/people';
import { SITE_DESCRIPTION } from '@/lib/site';
import type { CohortStats, TeamStats } from '@/lib/types/stats';

/** One title + description per page, shared by <head> metadata and the social image. */
export interface PageSeo {
  /** Short page title (the image header; the browser tab adds the site name) */
  title: string;
  description: string;
  path: string;
}

export const overviewSeo = (): PageSeo => ({
  title: 'Overview',
  description: SITE_DESCRIPTION,
  path: '/',
});

export const insightsSeo = (): PageSeo => ({
  title: 'AI impact',
  description:
    'How UBCO COSC 499 capstone coding changed from before AI tools, through Copilot and ChatGPT, to the agentic era, and which AI tools sign their commits. Era medians of team rates, with no ranking of people.',
  path: '/insights',
});

export const gradesSeo = (): PageSeo => ({
  title: 'Grades',
  description:
    'UBCO COSC 499 final grades from UBC PAIR: class size, class average and how each year-long and summer session finished since 2017, with who taught it.',
  path: '/insights/grades',
});

export const trendsSeo = (): PageSeo => ({
  title: 'Trends',
  description:
    'Cross-year COSC 499 trends: when work lands in the term, pull request adoption, night and weekend activity, and summer versus winter.',
  path: '/insights/trends',
});

export const aboutSeo = (): PageSeo => ({
  title: 'About',
  description:
    'Why this site exists: so current and future UBCO COSC 499 cohorts can benchmark themselves against past ones, and so the work behind every capstone, from top contributors to 3 am work sessions, gets recognized.',
  path: '/about',
});

export function cohortSeo(c: CohortStats): PageSeo {
  // Summer labels already say "Summer 2024".
  const kind = c.session === 'summer' ? 'session' : 'year-long cohort';
  const teams = `${c.totals.teams} capstone ${c.totals.teams === 1 ? 'team' : 'teams'}`;
  const g = c.grades;
  const names = g?.instructors ?? [];
  const taught = names.length
    ? ` Taught by ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}.`
    : '';
  const students = g ? ` for a class of ${fmt(g.students)} students` : '';
  return {
    title: `${c.label} cohort`,
    description: c.teams.length
      ? `UBCO COSC 499 ${c.label} ${kind}: ${teams}, ${fmt(c.totals.commits)} commits and ${fmt(c.totals.prsMerged)} merged PRs. Top contributors, team highlights and weekly activity${students}.${taught}`
      : `UBCO COSC 499 ${c.label} ${kind}. No team repositories are visible on GitHub yet${g ? `, but it had a class of ${fmt(g.students)} students` : ''}. Help add your team.${taught}`,
    path: `/${c.slug}`,
  };
}

export function teamSeo(c: CohortStats, t: TeamStats): PageSeo {
  return {
    title: `${t.name} · ${c.label}`,
    description: `UBCO COSC 499 ${c.label} capstone ${t.name}: top contributors, weekly activity and team habits, with ${fmt(t.commits)} commits, ${fmt(t.prsMerged)} merged PRs and ${fmt(t.reviews)} reviews.`,
    path: `/${c.slug}/${t.team}`,
  };
}

/**
 * A person's page, described by their most recent capstone. Their own numbers only,
 * never a rank or a comparison (see the Tone rule).
 */
export function personSeo(p: Person): PageSeo & { stats: OgStat[]; subtitle: string } {
  const latest = p.capstones.at(-1)!;
  const m = latest.stats;
  const where = `${latest.team.name}, ${latest.cohort.label}`;
  const more =
    p.capstones.length > 1 ? ` Part of ${p.capstones.length} COSC 499 capstones.` : '';
  return {
    title: p.name,
    subtitle: `${where}${latest.cohort.isCurrent ? ' (in progress)' : ''}`,
    description: `${p.name}'s UBCO COSC 499 capstone (${where}): ${fmt(m.commits)} commits, ${fmt(m.prsMerged)} merged PRs and ${fmt(m.reviews)} code reviews.${more}`,
    path: `/u/${p.login}`,
    stats: [
      { label: 'commits', value: fmt(m.commits) },
      { label: 'merged PRs', value: fmt(m.prsMerged) },
      { label: 'reviews', value: fmt(m.reviews) },
      { label: 'active weeks', value: fmt(m.activeWeeks) },
    ],
  };
}

/** Next.js metadata for a page (canonical URL, Open Graph, Twitter). */
export function pageMetadata(p: PageSeo) {
  const full = `UBCO COSC 499 · ${p.title}`;
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { title: full, description: p.description, url: p.path },
    twitter: {
      card: 'summary_large_image' as const,
      title: full,
      description: p.description,
    },
  };
}
