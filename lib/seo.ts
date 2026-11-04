import 'server-only';

import { fmt } from '@/lib/format';
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

export function cohortSeo(c: CohortStats): PageSeo {
  const kind = c.session === 'summer' ? 'summer session' : 'year-long cohort';
  return {
    title: `${c.label} cohort`,
    description: c.teams.length
      ? `UBCO COSC 499 ${c.label} ${kind}: top contributors, team highlights and weekly activity across ${c.totals.teams} capstone teams, with ${fmt(c.totals.commits)} commits and ${fmt(c.totals.prsMerged)} merged PRs.`
      : `UBCO COSC 499 ${c.label} ${kind}. No team repositories are visible on GitHub yet, so help add your team.`,
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
