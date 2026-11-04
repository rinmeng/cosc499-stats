/**
 * Sync configuration. Edit this file to add a new cohort (e.g. COSC-499-W2027)
 * or to tweak which repos and accounts are counted.
 */

export type Session = 'winter' | 'summer';

export interface CohortConfig {
  /**
   * GitHub organization login. Leave it out for cohorts that had no course org
   * (2017 and 2019–2022): their teams are listed in `extraRepos` instead.
   */
  org?: string;
  /** Start year: winter 2026 = Sept 2026 → Apr 2027, summer 2026 = May → Aug 2026 */
  year: number;
  /** Defaults to 'winter' (the year-long session) */
  session?: Session;
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

const NO_ORG_NOTE =
  'This session had no course GitHub organization. Its teams were found in ' +
  'students’ own repositories, so it may be missing teams.';

export const cohorts: CohortConfig[] = [
  {
    year: 2017,
    label: '2017–18',
    note: NO_ORG_NOTE,
    extraRepos: [
      { repo: 'kseaman/Capstone3DModelling', team: 1 },
      { repo: 'CooperHowling/AR_tour', team: 2 },
    ],
  },
  {
    org: 'UBCO-COSC499-Winter-2018-Term-1-2',
    year: 2018,
    label: '2018–19',
    note: 'Only a few team repositories from this cohort are public, so its totals are partial.',
  },
  {
    year: 2019,
    label: '2019–20',
    note: NO_ORG_NOTE,
    extraRepos: [
      { repo: 'rosarobert/COSC-499-FDB', team: 1 },
      { repo: 'dBaiko/COSC-499-Group-1', team: 2 },
      { repo: 'Chris0728/OmegaR', team: 3 },
      { repo: 'RaphaelChevallier/Social-Learning-Platform', team: 4 },
    ],
  },
  {
    year: 2020,
    label: '2020–21',
    note: NO_ORG_NOTE,
    extraRepos: [
      { repo: 'japser36/COSC-499-Pace-A', team: 1 },
      { repo: 'Boykoa97/PaceB', team: 2 },
      { repo: 'jpabadir/pace-c', team: 3 },
      { repo: 'JadenBalogh/home-together-b', team: 4 },
      { repo: 'yyht6300a/499Project-Minecraft-C', team: 5 },
      { repo: 'ctakasaka/Minecraft-Integrated-AI-Dashboard', team: 6 },
      { repo: 'Nathan-Nesbitt/Minecraft_AI', team: 7 },
    ],
  },
  {
    year: 2021,
    label: '2021–22',
    note: NO_ORG_NOTE,
    extraRepos: [
      { repo: 'IRIDIXVdt/2021W-UBCO-COSC-499-Cyclops', team: 1 },
      { repo: 'cosc-499-EDG1/ethics-dashboard', team: 2 },
      { repo: 'COSC-499-Woo-Woo-Network/COSC_499_Project_Woo_Woo_Network', team: 3 },
    ],
  },
  {
    year: 2022,
    label: '2022–23',
    note: NO_ORG_NOTE,
    extraRepos: [{ repo: 'COSC-499-EquiFood-B/EquiFoodApp-B', team: 1 }],
  },
  { org: 'COSC-499-W2023', year: 2023, label: '2023–24' },
  {
    org: 'COSC-499-W2024',
    year: 2024,
    label: '2024–25',
    note: 'Only two team repositories from this cohort are still on GitHub, so its totals are partial.',
  },
  { org: 'COSC-499-W2025', year: 2025, label: '2025–26' },
  { org: 'COSC-499-W2026', year: 2026, label: '2026–27' },

  // Summer sessions (May → August)
  {
    year: 2021,
    session: 'summer',
    label: 'Summer 2021',
    note: NO_ORG_NOTE,
    extraRepos: [
      { repo: 'COSC499-Group1/canvas-gamification', team: 1 },
      { repo: 'COSC499-Group1/canvas-gamification-ui', team: 1 },
    ],
  },
  {
    org: 'UBCO-COSC-499-Summer-2022',
    year: 2022,
    session: 'summer',
    label: 'Summer 2022',
  },
  {
    org: 'UBCO-COSC-499-Summer-2023',
    year: 2023,
    session: 'summer',
    label: 'Summer 2023',
  },
  {
    org: 'UBCO-COSC499-Summer-2024',
    year: 2024,
    session: 'summer',
    label: 'Summer 2024',
  },
  {
    org: 'UBCO-COSC499-S2025',
    year: 2025,
    session: 'summer',
    label: 'Summer 2025',
    note: 'Only one team repository from this session is visible on GitHub.',
  },
  {
    org: 'UBCO-COSC499-S2026',
    year: 2026,
    session: 'summer',
    label: 'Summer 2026',
    note: 'No team repositories from this session are visible on GitHub yet.',
  },
];

/** URL slug and CLI name for a cohort: winter "2024", summer "summer-2024". */
export const cohortSlug = (c: Pick<CohortConfig, 'year' | 'session'>) =>
  c.session === 'summer' ? `summer-${c.year}` : String(c.year);

/** Folder under data/raw/ for a cohort: its org, or `no-org-<slug>` when it had none. */
export const cohortDir = (c: Pick<CohortConfig, 'org' | 'year' | 'session'>) =>
  c.org ?? `no-org-${cohortSlug(c)}`;

/** Slug of the cohort that is still in progress. Always re-synced; past cohorts are cached. */
export const currentCohort = '2026';

/** Start year of the current cohort (derived; used for colors and the trend chart). */
export const currentYear =
  cohorts.find((c) => cohortSlug(c) === currentCohort)?.year ?? new Date().getFullYear();

/** Repos whose name matches any of these are skipped (starters, templates, empty copies). */
export const repoExclude: RegExp[] = [
  /starter/i,
  /^templates$/i,
  /^docker-examples$/i,
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
  'copilot-pull-request-reviewer',
  'vercel',
  'coderabbitai',
  // Course staff (instructors / TAs). Auto-detection below misses them in small
  // cohorts, so they are listed explicitly.
  'sfazackerley',
  'ayhchen',
  'bohuie',
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

/** Public repo, used for "help complete this cohort" links. */
export const repoUrl = 'https://github.com/rinmeng/cosc499-stats';

/** Past cohorts with fewer teams than this get a "help complete this cohort" prompt. */
export const smallCohortTeams = 10;
