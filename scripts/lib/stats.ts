import { ERA_BOUNDS } from '../../sync.config';
import type { Era } from '../../lib/types/insights';

/** Cohorts with fewer teams than this are left out of era medians. */
export const MIN_TEAMS = 3;

export const BOOTSTRAP_SAMPLES = 1000;
export const BOOTSTRAP_SEED = 499;

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Linear interpolation between sorted values. `p` is between 0 and 1. */
export function quantile(xs: number[], p: number): number {
  if (!xs.length) throw new Error('quantile of an empty sample');
  const s = [...xs].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return s[lo];
  return s[lo] * (hi - idx) + s[hi] * (idx - lo);
}

export function eraOf(year: number): Era {
  if (year <= ERA_BOUNDS.preAiMax) return 'pre-ai';
  if (year <= ERA_BOUNDS.earlyAiMax) return 'early-ai';
  return 'agentic';
}

/** Items whose week index falls in `0..W`, inclusive. */
export function windowed<T>(items: T[], week: (item: T) => number, W: number): T[] {
  return items.filter((item) => {
    const w = week(item);
    return w >= 0 && w <= W;
  });
}

/**
 * Mulberry32. Same seed → same sequence, so two aggregates produce the same intervals.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BootstrapEstimate {
  value: number;
  lo: number;
  hi: number;
  nTeams: number;
  nCohorts: number;
  pooled: number;
}

/**
 * Era median of one number per cohort, plus an 80% bootstrap interval.
 * `groups` is one array of team values per eligible cohort. Cohorts and the teams
 * inside them are resampled with replacement.
 */
export function bootstrapCI(
  groups: number[][],
  seed = BOOTSTRAP_SEED
): BootstrapEstimate | null {
  const clean = groups
    .map((g) => g.filter((n) => Number.isFinite(n)))
    .filter((g) => g.length);
  if (!clean.length) return null;

  const cohortMedians = clean.map((g) => median(g)!);
  const value = median(cohortMedians)!;
  const pooled = median(clean.flat())!;
  const nTeams = clean.reduce((a, g) => a + g.length, 0);
  const nCohorts = clean.length;

  const rand = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < BOOTSTRAP_SAMPLES; i++) {
    const medians: number[] = [];
    for (let c = 0; c < nCohorts; c++) {
      const group = clean[Math.floor(rand() * nCohorts)];
      const resampled: number[] = [];
      for (let t = 0; t < group.length; t++)
        resampled.push(group[Math.floor(rand() * group.length)]);
      medians.push(median(resampled)!);
    }
    samples.push(median(medians)!);
  }

  return {
    value,
    lo: quantile(samples, 0.1),
    hi: quantile(samples, 0.9),
    nTeams,
    nCohorts,
    pooled,
  };
}
