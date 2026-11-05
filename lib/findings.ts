import { fmtInsight, type InsightKind } from '@/lib/format';
import type { Era, Estimate, Insights } from '@/lib/types/insights';

/**
 * Plain-English sentences for the insights page ("Here's what we found").
 * Each one compares the agentic era with the years before AI, using the same era
 * medians the charts draw. `**text**` marks the part to emphasize.
 */

/** How the baseline era reads after "than" / "from". */
const BASELINE: Record<Era, string> = {
  'pre-ai': 'before AI',
  'early-ai': 'in the early AI years',
  agentic: 'in the agentic era',
};

type Words = { up: string; down: string };

const MORE: Words = { up: 'more', down: 'fewer' };
const MORE_MASS: Words = { up: 'more', down: 'less' };
const BIGGER: Words = { up: 'larger', down: 'smaller' };
const LONGER: Words = { up: 'longer', down: 'shorter' };

/** Below this relative change, two medians read as "about the same". */
const SAME_RATIO = 0.1;
/** For shares, a gap under this many percentage points reads as "about the same". */
const SAME_POINTS = 0.02;

function times(r: number) {
  return `${r < 10 ? r.toFixed(1).replace(/\.0$/, '') : Math.round(r)}×`;
}

const v = (n: number, kind: InsightKind) => fmtInsight(n, kind);
/** Lines and counts that only make sense as whole numbers. */
const whole = (n: number) => fmtInsight(Math.round(n), 'count');

/** ", which was 2.7 commits a week": the baseline spelled out, so no one has to decode "(2.7)". */
const which = (was: string, unit = '') => `, which was ${was}${unit ? ` ${unit}` : ''}`;

/**
 * "**1.6× more** than before AI, which was 2.7 commits a week"
 * "**24% fewer** than before AI, which was …" / "about the same as before AI, which was …"
 */
function ratioPhrase(
  a: number,
  b: number,
  kind: InsightKind,
  words: Words,
  base: string,
  { unit = '', format = (n: number) => fmtInsight(n, kind) } = {}
) {
  const was = which(format(b), unit);
  if (b === 0) return a === 0 ? `the same as ${base}` : `up from none ${base}`;
  const r = a / b;
  if (Math.abs(r - 1) < SAME_RATIO) return `about the same as ${base}${was}`;
  if (r > 1) return `**${times(r)} ${words.up}** than ${base}${was}`;
  return `**${Math.round((1 - r) * 100)}% ${words.down}** than ${base}${was}`;
}

/** "up from 43% before AI" / "down from …" / "about the same as …" */
function sharePhrase(a: number, b: number, base: string) {
  const was = fmtInsight(b, 'share');
  if (Math.abs(a - b) < SAME_POINTS) return `about the same as ${base}${which(was)}`;
  return `**${a > b ? 'up' : 'down'} from ${was}** ${base}`;
}

interface Pair {
  a: number;
  b: number;
  base: string;
}

type Template = (p: Pair) => string;

/** One sentence per metric key. `a` is the agentic era, `b` the baseline era. */
const TEMPLATES: Record<string, Template> = {
  commitSize: ({ a, b, base }) =>
    `A typical commit changes **${whole(a)} lines** in the agentic era, ${ratioPhrase(a, b, 'count', BIGGER, base, { unit: 'lines', format: whole })}.`,
  largeCommitShare: ({ a, b, base }) =>
    `**${v(a, 'share')}** of commits change more than 300 lines, ${sharePhrase(a, b, base)}.`,
  prAdditions: ({ a, b, base }) =>
    `A merged pull request adds **${whole(a)} lines**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'lines', format: whole })}.`,
  prFiles: ({ a, b, base }) =>
    `A merged pull request touches **${v(a, 'count')} files**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'files' })}.`,
  prHours: ({ a, b, base }) =>
    `Pull requests take **${v(a, 'hours')}** to merge, ${ratioPhrase(a, b, 'hours', LONGER, base)}.`,
  commitsPerPw: ({ a, b, base }) =>
    `Each active person makes **${v(a, 'count')} commits a week**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'commits a week' })}.`,
  prsPerPw: ({ a, b, base }) =>
    `Each active person merges **${v(a, 'count')} pull requests a week**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'pull requests a week' })}.`,
  linesPerPw: ({ a, b, base }) =>
    `Each active person changes **${whole(a)} lines a week**, ${ratioPhrase(a, b, 'count', MORE_MASS, base, { unit: 'lines a week', format: whole })}.`,
  churn: ({ a, b, base }) =>
    `For every 100 lines added, teams delete **${Math.round(a * 100)}**, ${
      Math.abs(a - b) < 0.05
        ? `about the same as ${base}${which(String(Math.round(b * 100)))}`
        : `**${a > b ? 'up' : 'down'} from ${Math.round(b * 100)}** ${base}`
    }.`,
  earlyOutput: ({ a, b, base }) =>
    `**${v(a, 'share')}** of the early-term work lands in the first four weeks, ${sharePhrase(a, b, base)}.`,
  weekToQuarter: ({ a, b, base }) => {
    const gap = b - a;
    const tail =
      Math.abs(gap) < 0.5
        ? `about the same as ${base}${which(`week ${v(b, 'week')}`)}`
        : `**${v(Math.abs(gap), 'week')} week${Math.round(Math.abs(gap)) === 1 ? '' : 's'} ${gap > 0 ? 'sooner' : 'later'}** than ${base}${which(`week ${v(b, 'week')}`)}`;
    return `Teams reach a quarter of their term’s work by **week ${v(a, 'week')}**, ${tail}.`;
  },
  reviewCoverage: ({ a, b, base }) =>
    `**${v(a, 'share')}** of merged pull requests get a review from a teammate, ${sharePhrase(a, b, base)}.`,
  discussionPerPr: ({ a, b, base }) =>
    `Each merged pull request gets **${v(a, 'count')} comments and reviews**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'comments and reviews' })}.`,
  languagesPerTeam: ({ a, b, base }) =>
    `A typical team’s code spans **${v(a, 'count')} languages**, ${
      Math.abs(a - b) < 0.5
        ? `about the same as ${base}${which(v(b, 'count'), 'languages')}`
        : `**${a > b ? 'up' : 'down'} from ${v(b, 'count')}** ${base}`
    }.`,
  aiTrailers: ({ a, b, base }) =>
    `**${v(a, 'share')}** of commits name an AI tool as a co-author, ${sharePhrase(a, b, base)}.`,
  aiBots: ({ a, b, base }) =>
    `**${v(a, 'share')}** of a typical team’s merged pull requests involve an AI bot, ${sharePhrase(a, b, base)}.`,
  prsPer100: ({ a, b, base }) =>
    `Teams merge **${whole(a)} pull requests for every 100 commits**, ${ratioPhrase(a, b, 'count', MORE, base, { unit: 'per 100 commits', format: whole })}.`,
  prWeeks: ({ a, b, base }) =>
    `A pull request gets merged in **${v(a, 'share')}** of a team’s active weeks, ${sharePhrase(a, b, base)}.`,
  nightOwl: ({ a, b, base }) =>
    `**${v(a, 'share')}** of commits land between 10 pm and 4 am, ${sharePhrase(a, b, base)}.`,
  weekend: ({ a, b, base }) =>
    `**${v(a, 'share')}** of commits land on a weekend, ${sharePhrase(a, b, base)}.`,
  holiday: ({ a, b, base }) =>
    `**${v(a, 'share')}** of commits land on a holiday or break, ${sharePhrase(a, b, base)}.`,
};

/** Agentic value plus the earliest era that has a value to compare against. */
function pair(eras: Record<Era, Estimate | null>): Pair | null {
  const a = eras.agentic?.value;
  if (a == null || !Number.isFinite(a)) return null;
  for (const era of ['pre-ai', 'early-ai'] as Era[]) {
    const b = eras[era]?.value;
    if (b != null && Number.isFinite(b)) return { a, b, base: BASELINE[era] };
  }
  return null;
}

/** The sentence for one metric, or null when an era is missing. */
export function finding(insights: Insights, key: string): string | null {
  const metric = insights.metrics[key];
  const template = TEMPLATES[key];
  if (!metric || !template) return null;
  const eras = Object.values(metric.eras) as (Estimate | null)[];
  // Nothing to say when every era is zero (e.g. no AI bot activity yet).
  if (eras.every((e) => !e || e.value === 0)) return null;
  const p = pair(metric.eras);
  return p ? template(p) : null;
}

/** Summer vs winter, within the agentic era (falls back to the latest era with both). */
export function sessionFinding(insights: Insights): string | null {
  const winter = insights.metrics.pwWinter?.eras;
  const summer = insights.metrics.pwSummer?.eras;
  if (!winter || !summer) return null;
  for (const era of ['agentic', 'early-ai', 'pre-ai'] as Era[]) {
    const w = winter[era]?.value;
    const s = summer[era]?.value;
    if (w == null || s == null || w === 0) continue;
    const when =
      era === 'agentic'
        ? 'In the agentic era'
        : `${BASELINE[era][0].toUpperCase()}${BASELINE[era].slice(1)}`;
    return `${when}, summer teams make **${v(s, 'count')} commits per person-week** (scaled to a full year), ${ratioPhrase(s, w, 'count', MORE, 'winter', { unit: 'commits per person-week' })}.`;
  }
  return null;
}

/** Keys for each tab's "Here's what we found" card, in reading order. */
export const FINDING_KEYS = {
  impact: [
    'commitsPerPw',
    'linesPerPw',
    'prsPerPw',
    'commitSize',
    'reviewCoverage',
    'prHours',
    'languagesPerTeam',
  ],
  fingerprints: ['aiTrailers', 'aiBots'],
  trends: ['prsPer100', 'weekend', 'nightOwl'],
} as const;
