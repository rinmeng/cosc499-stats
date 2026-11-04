/**
 * Sync configuration. Edit this file to add a new cohort (e.g. COSC-499-W2027)
 * or to tweak which repos and accounts are counted.
 */

export interface CohortConfig {
  /** GitHub organization login */
  org: string;
  /** Start year of the winter session (W2026 = Sept 2026 → Apr 2027) */
  year: number;
  /** Human label shown in the UI */
  label: string;
  /** Optional caveat shown on the cohort page */
  note?: string;
  /**
   * Team repos that live outside the org (e.g. moved to a personal account).
   * `repo` is "owner/name"; your token needs read access to it.
   */
  extraRepos?: { repo: string; team: number }[];
}

export const cohorts: CohortConfig[] = [
  { org: 'COSC-499-W2023', year: 2023, label: '2023–24' },
  {
    org: 'COSC-499-W2024',
    year: 2024,
    label: '2024–25',
    note: 'Only two team repositories from this cohort are still on GitHub, so its totals are partial.',
  },
  { org: 'COSC-499-W2025', year: 2025, label: '2025–26' },
  { org: 'COSC-499-W2026', year: 2026, label: '2026–27' },
];

/** The cohort that is still in progress. Always re-synced; past cohorts are cached. */
export const currentYear = 2026;

/** Repos whose name matches any of these are skipped (starters, templates, empty copies). */
export const repoExclude: RegExp[] = [
  /starter/i,
  /^templates$/i,
  /^Team7_002$/,
  /^year-long-project-team-12-1$/,
];

/** Repos smaller than this (KB, GitHub `size`) are treated as empty and skipped. */
export const minRepoSizeKb = 50;

/** Pulls the team number out of a repo name. Several repos can map to one team. */
export const teamPattern = /team-?(\d+)/i;

/** Accounts that are never counted (bots, instructors, TAs). Case-insensitive. */
export const excludeLogins: string[] = [
  'github-classroom',
  'github-actions',
  'actions-user',
  'dependabot',
  'copilot',
  'copilot-swe-agent',
  'vercel',
  'coderabbitai',
];

/**
 * Accounts that author commits in more than this share of a cohort's teams are
 * treated as course staff (instructor / TA seeding starter code) and skipped.
 */
export const staffTeamShare = 0.3;

/**
 * Activity outside [term start − lead weeks, May 31 of the following year] is
 * ignored. This drops upstream history in repos forked from older projects.
 */
export const termLeadWeeks = 3;

/** Commits that change more lines than this are left out of line totals (vendored code, lockfiles). */
export const lineOutlierThreshold = 5000;

/** Timezone used for hour-of-day and weekday stats (UBC Okanagan). */
export const timezone = 'America/Vancouver';

/** Weights for the composite contribution score. Lines are not included on purpose. */
export const scoreWeights = {
  commits: 1,
  prsMerged: 3,
  reviews: 2,
  issuesOpened: 1,
  issuesClosed: 1,
};

/** How many people to highlight per team. */
export const topN = 5;
