import type { Era } from '@/lib/types/insights';

const nf = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const fmt = (n: number) => nf.format(Math.round(n));
export const fmtCompact = (n: number) => (n < 10_000 ? fmt(n) : compact.format(n));
export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function fmtHours(h: number | null): string {
  if (h === null) return '—';
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export function fmtDate(iso: string | null, withYear = true): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
    // date-only strings (YYYY-MM-DD) are UTC midnight; don't shift them a day back
    timeZone: iso.length === 10 ? 'UTC' : 'America/Vancouver',
  });
}

export function fmtRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  const mins = Math.round((now - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export const displayName = (p: { login: string | null; name: string | null }) =>
  p.name && p.login && p.name.toLowerCase() !== p.login.toLowerCase()
    ? p.name
    : (p.login ?? p.name ?? 'Unknown');

/**
 * Fixed color per cohort (color follows entity). The ramp is ordinal: the
 * current cohort gets the strongest step, older cohorts step back.
 */
/**
 * One color per era. chart-2 and chart-3 are almost the same green in light mode,
 * so the three eras use the steps that actually separate.
 */
export const ERA_COLOR: Record<Era, string> = {
  'pre-ai': 'var(--chart-5)',
  'early-ai': 'var(--chart-3)',
  agentic: 'var(--chart-1)',
};

export function eraLabel(era: Era): string {
  if (era === 'pre-ai') return 'Before AI';
  if (era === 'early-ai') return 'Early AI';
  return 'Agentic';
}

export type InsightKind = 'share' | 'hours' | 'count' | 'week';

export function fmtInsight(n: number | null | undefined, kind: InsightKind): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (kind === 'share') return pct(n);
  if (kind === 'hours') return fmtHours(n);
  if (kind === 'week') return String(Math.round(n));
  if (Math.abs(n) >= 100) return fmt(n);
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? fmt(rounded) : rounded.toFixed(1);
}

export function cohortColor(
  year: number,
  currentYear: number,
  session: 'winter' | 'summer' = 'winter'
): string {
  const slot = Math.min(Math.max(currentYear - year, 0), 3) + 1;
  // Summer sessions get their own neutral ramp (and dashed lines in the trend chart).
  if (session === 'summer') return `var(--summer-${Math.min(slot, 3)})`;
  return `var(--cohort-${slot})`;
}
