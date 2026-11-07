import type { CohortGrades } from './grades';
import type { Insights } from './insights';

/* ---------- Raw data written by scripts/sync.ts (data/raw/<org>/<repo>.json) ---------- */

export interface RawCommit {
  oid: string;
  /** GitHub login, or null when the commit email isn't linked to an account */
  login: string | null;
  name: string | null;
  email: string | null;
  /** ISO author date */
  date: string;
  additions: number;
  deletions: number;
  /**
   * Tool ids parsed from Co-authored-by trailers (claude, copilot, …).
   * Absent on files synced before trailer scanning. The message itself is never stored.
   */
  aiTrailers?: string[];
}

export interface RawReview {
  login: string | null;
  state: string;
  submittedAt: string | null;
}

export interface RawPullRequest {
  number: number;
  login: string | null;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  mergedBy: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  comments: number;
  reviews: RawReview[];
}

export interface RawIssue {
  number: number;
  login: string | null;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt: string | null;
  assignees: string[];
}

export interface RawRepo {
  org: string;
  name: string;
  team: number;
  fetchedAt: string;
  meta: {
    url: string;
    isPrivate: boolean;
    isFork: boolean;
    isArchived: boolean;
    createdAt: string;
    pushedAt: string | null;
    defaultBranch: string | null;
    stars: number;
    sizeKb: number;
    description: string | null;
    /** True once sync has parsed commit messages for AI co-author trailers. */
    trailersScanned?: boolean;
  };
  /** language → bytes */
  languages: Record<string, number>;
  commits: RawCommit[];
  prs: RawPullRequest[];
  issues: RawIssue[];
}

/* ---------- Aggregated summary written by scripts/aggregate.ts (data/summary.json) ---------- */

export type MetricKey =
  'score' | 'commits' | 'prsMerged' | 'reviews' | 'issues' | 'lines';

export interface PersonStats {
  id: string;
  login: string | null;
  name: string | null;
  avatarUrl: string | null;
  commits: number;
  additions: number;
  deletions: number;
  lines: number;
  prsOpened: number;
  prsMerged: number;
  /** PRs they opened that were closed without being merged */
  prsClosed: number;
  reviews: number;
  issuesOpened: number;
  issuesClosed: number;
  issues: number;
  activeWeeks: number;
  score: number;
  /**
   * Timed actions: commits, PRs opened, PRs merged (by whoever merged), reviews and
   * issues opened. The rhythm stats below count these, not just commits.
   */
  activity: number;
  /** actions 10 pm–4 am, 5–9 am, 3–4 am, and on holidays (local time) */
  nightActivity: number;
  earlyActivity: number;
  witchingActivity: number;
  holidayActivity: number;
  /** lines changed in their single biggest commit (≤ 20,000, to skip vendored code) */
  biggestCommit: number;
}

export interface WeekPoint {
  /** Weeks since the cohort's term start (0 = first week of September) */
  week: number;
  /** ISO date of the Sunday starting that week */
  start: string;
  commits: number;
  prs: number;
  reviews: number;
  /** contribution points earned that week (same weights as PersonStats.score) */
  score: number;
}

export interface PrHighlight {
  number: number;
  repo: string;
  value: number;
}

export interface TeamStats {
  key: string;
  team: number;
  name: string;
  repos: { name: string; url: string; isPrivate: boolean }[];
  description: string | null;
  contributors: number;
  commits: number;
  additions: number;
  deletions: number;
  prsOpened: number;
  prsMerged: number;
  reviews: number;
  issuesOpened: number;
  issuesClosed: number;
  openPrs: number;
  openIssues: number;
  score: number;
  /** 0–1, how evenly commits are shared (1 − Gini) */
  collaboration: number;
  /** 0–1, merged PRs reviewed by someone other than the author */
  reviewCoverage: number;
  medianMergeHours: number | null;
  peakWeek: { week: number; start: string; commits: number } | null;
  /** timed actions (see PersonStats.activity), including ones not tied to a member */
  activity: number;
  /** 0–1, share of activity 10 pm–4 am, 5–9 am, and on Saturday or Sunday */
  nightOwlShare: number;
  earlyBirdShare: number;
  weekendShare: number;
  /** PRs closed without merging */
  prsClosedUnmerged: number;
  /** 0–1, of PRs that were closed, the share that were merged */
  shipRate: number;
  /** average comments + reviews per merged PR */
  discussionPerPr: number;
  /** issues opened in the window, and the share of them now closed */
  issuesTotal: number;
  issueCloseRate: number;
  languageCount: number;
  /** commits in the first 4 weeks of term */
  startCommits: number;
  /** commits in the last 4 weeks of term (null while the term is still running) */
  finishCommits: number | null;
  /** most consecutive weeks with at least one commit */
  longestStreak: number;
  /** the local calendar day (YYYY-MM-DD) with the most commits */
  biggestDay: { date: string; commits: number } | null;
  /** actions on holidays / breaks (Thanksgiving, Dec 24–26, Dec 31–Jan 1, reading week; summer: Victoria Day, Canada Day, BC Day) */
  holidayActivity: number;
  /** actions during final exam periods (winter only) */
  examActivity: number;
  /** actions between 3 and 4 am */
  witchingActivity: number;
  /** single merged PRs: fastest / slowest (hours from open to merge) and biggest (files changed) */
  fastestPr: PrHighlight | null;
  slowestPr: PrHighlight | null;
  megaPr: PrHighlight | null;
  lastActivity: string | null;
  languages: { name: string; bytes: number }[];
  weekly: WeekPoint[];
  /** actions by [weekday 0=Sun][hour] in the configured timezone */
  punch: number[][];
  /** Members sorted by composite score. The UI only ever shows the top N. */
  members: PersonStats[];
  thisWeekCommits: number;
  /** Actions since Sunday (see PersonStats.activity) */
  thisWeekActivity: number;
  /** lines added + deleted on the default branch this week */
  thisWeekLines: number;
  /** PRs merged since Sunday */
  thisWeekPrsMerged: number;
  /** Teammate reviews submitted since Sunday */
  thisWeekReviews: number;
  /** People who committed since Sunday */
  thisWeekContributors: number;
  /** How evenly this week's commits were split across members, 0–1 (1 − Gini) */
  thisWeekEvenness: number;
  /** Issues closed since Sunday */
  thisWeekIssuesClosed: number;
  /** This week's actions 10 pm–4 am, 5–9 am, and on Saturday or Sunday (local time) */
  thisWeekNightActivity: number;
  thisWeekEarlyActivity: number;
  thisWeekWeekendActivity: number;
}

export interface CohortStats {
  org: string;
  /** URL slug: "2024" (winter) or "summer-2024" */
  slug: string;
  session: 'winter' | 'summer';
  year: number;
  label: string;
  note: string | null;
  /** False for sessions with no course org (`org` is then a display label) */
  hasOrg: boolean;
  /** GitHub logins of people who added this cohort's data */
  contributors: string[];
  isCurrent: boolean;
  termStart: string;
  teams: TeamStats[];
  totals: {
    teams: number;
    contributors: number;
    commits: number;
    prsMerged: number;
    reviews: number;
    issuesOpened: number;
    lines: number;
  };
  avgPerTeam: {
    commits: number;
    prsMerged: number;
    reviews: number;
    issuesOpened: number;
  };
  weekly: WeekPoint[];
  /** average cumulative commits per team by term week */
  cumulative: { week: number; value: number }[];
  /** average cumulative points (score) per team by term week */
  cumulativeScore: { week: number; value: number }[];
  punch: number[][];
  languages: { name: string; bytes: number }[];
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
  medianMergeHours: number | null;
  reviewCoverage: number;
  staffExcluded: string[];
  /** Final course grades from UBC PAIR; null when PAIR has no data for the session */
  grades: CohortGrades | null;
}

export interface Summary {
  generatedAt: string;
  currentYear: number;
  currentCohort: string;
  topN: number;
  scoreWeights: Record<string, number>;
  lineOutlierThreshold: number;
  timezone: string;
  cohorts: CohortStats[];
  insights: Insights;
}

/** Cohort totals for one term week (in-progress "this week" tiles). */
export interface WeekTotals {
  commits: number;
  prsMerged: number;
  reviews: number;
  /** added + deleted, excl. very large commits */
  lines: number;
  /** median hours from opened to merged, for PRs merged that week */
  medianMergeHours: number | null;
}
