import { ERA_COLOR, eraLabel } from '@/lib/format';
import type { Era } from '@/lib/types/insights';

/**
 * One SVG marker drawn everywhere (chart dots, legends, axis ticks, tooltips), so a
 * legend swatch is always the exact mark it describes.
 */
export type MarkShape = 'circle' | 'square' | 'triangle';
export type MarkState = 'normal' | 'inProgress' | 'small';

/**
 * Era marker: each era has its own shape as well as its color, so dots and bars can be
 * told apart without color (color-blind readers, print, grayscale).
 */
export const ERA_MARK: Record<Era, MarkShape> = {
  'pre-ai': 'circle',
  'early-ai': 'square',
  agentic: 'triangle',
};

const ERA_ORDER: Era[] = ['pre-ai', 'early-ai', 'agentic'];

/** Neutral color for cohort dots that aren't colored by era. */
export const NEUTRAL_MARK = 'var(--foreground)';

/** In progress wins over small sample: an unfinished term is the bigger caveat. */
export const markState = (p: { hollow?: boolean; faded?: boolean }): MarkState =>
  p.hollow ? 'inProgress' : p.faded ? 'small' : 'normal';

export function Mark({
  cx,
  cy,
  shape = 'circle',
  color,
  state = 'normal',
  r = 4.5,
  outline,
}: {
  cx: number;
  cy: number;
  shape?: MarkShape;
  color: string;
  state?: MarkState;
  r?: number;
  /** Extra stroke (e.g. var(--card)) to separate a filled mark from what's behind it */
  outline?: string;
}) {
  const hollow = state === 'inProgress';
  const paint = {
    fill: hollow ? 'var(--card)' : color,
    fillOpacity: state === 'small' ? 0.35 : 1,
    stroke: hollow ? color : (outline ?? 'none'),
    strokeWidth: hollow ? 1.75 : outline ? 2 : 0,
    paintOrder: 'stroke' as const,
  };
  if (shape === 'square') {
    const s = r * 1.8;
    return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={1} {...paint} />;
  }
  if (shape === 'triangle') {
    const h = r * 1.15;
    const w = r * 1.2;
    const points = `${cx},${cy - h} ${cx + w},${cy + h * 0.8} ${cx - w},${cy + h * 0.8}`;
    return <polygon points={points} strokeLinejoin='round' {...paint} />;
  }
  return <circle cx={cx} cy={cy} r={r} {...paint} />;
}

/** A Mark as an inline icon, for HTML (legends, badges, tooltips). */
export function MarkIcon({
  size = 12,
  className,
  ...mark
}: Omit<React.ComponentProps<typeof Mark>, 'cx' | 'cy' | 'r'> & {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox='0 0 12 12'
      overflow='visible'
      className={className}
    >
      <Mark cx={6} cy={6} r={4.5} {...mark} />
    </svg>
  );
}

/** The era's own mark: its shape in its color. */
export function EraShape({
  era,
  size = 12,
  className,
}: {
  era: Era;
  size?: number;
  className?: string;
}) {
  return (
    <MarkIcon
      size={size}
      className={className}
      shape={ERA_MARK[era]}
      color={ERA_COLOR[era]}
    />
  );
}

const STATE_KEYS: { state: MarkState; label: string }[] = [
  { state: 'normal', label: 'Cohort' },
  { state: 'inProgress', label: 'In progress' },
  { state: 'small', label: 'Fewer than 3 teams' },
];

/**
 * Legend built from the same Mark as the chart. `eras` lists the era marks (only
 * when dots are drawn in era shape/color); the state keys explain fill styles and
 * are only listed when a plotted dot actually uses them.
 */
export function EraLegend({
  eras = true,
  states = [],
  stateShape = 'circle',
  children,
}: {
  eras?: boolean;
  states?: MarkState[];
  stateShape?: MarkShape;
  children?: React.ReactNode;
}) {
  const keys = STATE_KEYS.filter((k) => states.includes(k.state));
  if (!eras && keys.length === 0 && !children) return null;
  return (
    <div
      className='mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs
        text-muted-foreground'
    >
      {eras &&
        ERA_ORDER.map((era) => (
          <span key={era} className='inline-flex items-center gap-1.5'>
            <EraShape era={era} />
            {eraLabel(era)}
          </span>
        ))}
      {keys.map((k) => (
        <span key={k.state} className='inline-flex items-center gap-1.5'>
          <MarkIcon shape={stateShape} color={NEUTRAL_MARK} state={k.state} />
          {k.label}
        </span>
      ))}
      {children}
    </div>
  );
}
