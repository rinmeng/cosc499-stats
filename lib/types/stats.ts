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
  reviews: number;
  issuesOpened: number;
  issuesClosed: number;
  issues: number;
  activeWeeks: number;
  score: number;
}

export interface WeekPoint {
  /** Weeks since the cohort's term start (0 = first week of September) */
  week: number;
  /** ISO date of the Sunday starting that week */
  start: string;
  commits: number;
  prs: number;
  reviews: number;
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
  nightOwlShare: number;
  weekendShare: number;
  lastActivity: string | null;
  languages: { name: string; bytes: number }[];
  weekly: WeekPoint[];
  /** commits by [weekday 0=Sun][hour] in the configured timezone */
  punch: number[][];
  /** Members sorted by composite score. The UI only ever shows the top N. */
  members: PersonStats[];
  thisWeekCommits: number;
}

export interface CohortStats {
  org: string;
  /** URL slug: "2024" (winter) or "summer-2024" */
  slug: string;
  session: 'winter' | 'summer';
  year: number;
  label: string;
  note: string | null;
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
  punch: number[][];
  languages: { name: string; bytes: number }[];
  thisWeek: { commits: number; prsMerged: number; reviews: number };
  lastWeek: { commits: number; prsMerged: number; reviews: number };
  medianMergeHours: number | null;
  reviewCoverage: number;
  staffExcluded: string[];
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
}
