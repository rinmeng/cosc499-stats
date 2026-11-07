/* ---------- Raw grade data written by scripts/sync-grades.ts (data/raw/pair/<ys>.json) ---------- */

/** One COSC 499 row from UBC PAIR: a section, or the "OVERALL" roll-up. */
export interface RawPairSection {
  section: string;
  /** Semicolon-separated names; empty or null when PAIR lists none */
  educators: string | null;
  average: number;
  high: number;
  low: number;
  /** v2 sessions (up to 2020W) */
  enrolled?: number;
  stdev?: number;
  /** v3 sessions (2021S onward) */
  reported?: number;
  median?: number;
  percentile_25?: number;
  percentile_75?: number;
  /** "<50%", "50-54%", … "90-100%" → students; null when PAIR hides the range (< 6) */
  grades: Record<string, number | null>;
}

export interface RawPairFile {
  yearsession: string;
  source: { origin: string; dataset: string; api: string; fetchedAt: string };
  sections: RawPairSection[];
}

/* ---------- Aggregated, per cohort (CohortStats.grades) ---------- */

export interface GradeBucket {
  /** Axis label, e.g. "80–84" */
  label: string;
  /** Lower bound of the range, for sorting */
  from: number;
  /** null when PAIR hides the range (fewer than 6 students) */
  count: number | null;
}

/**
 * The cohort's final COSC 499 grades from UBC PAIR. Course-level only: there is
 * no link between a grade and a team or a person.
 */
export interface CohortGrades {
  /** PAIR session id, e.g. "2023W" */
  yearsession: string;
  /** As listed by PAIR; empty when it lists none. Older sessions may include TAs. */
  instructors: string[];
  /** Students with a reported grade */
  students: number;
  /** Students in ranges PAIR hides, so not shown in any bucket */
  hidden: number;
  sections: number;
  average: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  high: number;
  stdev: number | null;
  /** 0–1, share of students who finished with 80% or more */
  share80: number;
  /** True when a hidden range is 80%+, so share80 is a lower bound */
  share80IsMin: boolean;
  /** Ascending. Everything under 55% is one bucket, so single results aren't singled out. */
  buckets: GradeBucket[];
  source: { dataset: string; fetchedAt: string };
}
