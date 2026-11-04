import 'server-only';

import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import type {
  CohortStats,
  MetricKey,
  PersonStats,
  Summary,
  TeamStats,
} from '@/lib/types/stats';

const SUMMARY = path.join(process.cwd(), 'data', 'summary.json');

let cache: { mtime: number; data: Summary } | null = null;

/** Load data/summary.json (written by `pnpm sync`). Returns null when it hasn't been synced yet. */
export function getSummary(): Summary | null {
  if (!existsSync(SUMMARY)) return null;
  const mtime = statSync(SUMMARY).mtimeMs;
  if (cache?.mtime !== mtime) {
    cache = { mtime, data: JSON.parse(readFileSync(SUMMARY, 'utf8')) as Summary };
  }
  return cache.data;
}

export function getCohort(slug: string): CohortStats | null {
  return getSummary()?.cohorts.find((c) => c.slug === slug) ?? null;
}

export function getTeam(slug: string, team: number): TeamStats | null {
  return getCohort(slug)?.teams.find((t) => t.team === team) ?? null;
}

export const METRICS: { key: MetricKey; label: string; short: string }[] = [
  { key: 'score', label: 'Overall', short: 'pts' },
  { key: 'commits', label: 'Commits', short: 'commits' },
  { key: 'prsMerged', label: 'Merged PRs', short: 'PRs' },
  { key: 'reviews', label: 'Reviews', short: 'reviews' },
  { key: 'issues', label: 'Issues', short: 'issues' },
  { key: 'lines', label: 'Lines', short: 'lines' },
];

export type TopEntry = Pick<PersonStats, 'id' | 'login' | 'name' | 'avatarUrl'> & {
  value: number;
};

/**
 * Top-N people for each metric. Only positive values are kept, and nobody
 * outside the top N is ever sent to the client.
 */
export function topByMetric(
  members: PersonStats[],
  n: number
): Record<MetricKey, TopEntry[]> {
  return Object.fromEntries(
    METRICS.map(({ key }) => [
      key,
      [...members]
        .filter((m) => m[key] > 0)
        .sort((a, b) => b[key] - a[key])
        .slice(0, n)
        .map((m) => ({
          id: m.id,
          login: m.login,
          name: m.name,
          avatarUrl: m.avatarUrl,
          value: m[key],
        })),
    ])
  ) as Record<MetricKey, TopEntry[]>;
}
