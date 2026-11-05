export type Era = 'pre-ai' | 'early-ai' | 'agentic';

export interface Estimate {
  value: number;
  lo: number;
  hi: number;
  nTeams: number;
  nCohorts: number;
  /** Median of the team values, ignoring which cohort they belong to. */
  pooled: number;
}

export interface CohortPoint {
  slug: string;
  label: string;
  year: number;
  session: 'winter' | 'summer';
  era: Era;
  /** Null when the cohort has no data for this metric (unknown, not zero). */
  value: number | null;
  nTeams: number;
  /** Fewer than 3 teams: drawn faded and left out of the era median. */
  faded: boolean;
  /** Full-term metric on the cohort that is still running. */
  inProgress: boolean;
}

export interface InsightMetric {
  key: string;
  label: string;
  unit: string;
  better?: 'up' | 'down' | null;
  eras: Record<Era, Estimate | null>;
  cohorts: CohortPoint[];
}

/** One cohort's cumulative share of its own weeks 0–W, as a percent. */
export interface InsightCurve {
  slug: string;
  session: 'winter' | 'summer';
  year: number;
  label: string;
  isCurrent: boolean;
  points: { week: number; value: number }[];
}

export interface ShareSlice {
  name: string;
  share: number;
}

export interface Insights {
  window: { week: number };
  eras: { key: Era; label: string; years: string }[];
  /** False until at least one repo has been re-synced with trailer parsing. */
  trailersScanned: boolean;
  /**
   * Summer weekly rates are multiplied by summerWeeks / fullYearWeeks before they
   * are mixed with full-year cohorts.
   */
  termScale: { fullYearWeeks: number; summerWeeks: number };
  metrics: Record<string, InsightMetric>;
  curves: InsightCurve[];
  languages: Record<Era, ShareSlice[]>;
  /** Tool mentions among agentic-era commits that have a trailer. Shares sum to 1. */
  tools: ShareSlice[];
}
