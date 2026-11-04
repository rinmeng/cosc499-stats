'use client';

import { useState } from 'react';
import {
  Circle,
  Diamond,
  Hexagon,
  Octagon,
  Pentagon,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { ChartCard } from './ChartCard';

export interface TrendSeries {
  /** Cohort slug, e.g. "2024" or "summer-2024" */
  slug: string;
  session: 'winter' | 'summer';
  year: number;
  label: string;
  /** CSS color for this cohort (ordinal: newer cohorts are stronger) */
  color: string;
  isCurrent: boolean;
  points: { week: number; value: number }[];
}

const SUMMER_DASH = '6 4';

/**
 * Each cohort also gets its own shape, so lines can be told apart without color
 * (color-blind readers, print, grayscale). Assigned in term order, so a cohort
 * keeps its shape as new ones are added.
 */
const SHAPES: LucideIcon[] = [
  Circle,
  Square,
  Triangle,
  Diamond,
  Star,
  Hexagon,
  Pentagon,
  Octagon,
];

/** How often (in weeks) a shape marker is drawn along each line. */
const MARKER_EVERY = 4;

function ShapeIcon({
  Icon,
  color,
  size = 12,
  className,
}: {
  Icon: LucideIcon;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <Icon
      aria-hidden
      className={className}
      width={size}
      height={size}
      fill={color}
      stroke={color}
      strokeWidth={2}
    />
  );
}

/** Chart-config key for a cohort (CSS-variable safe). */
const keyOf = (s: TrendSeries) => `c_${s.slug.replace(/[^a-z0-9]/gi, '_')}`;

/**
 * Average cumulative commits per team, aligned by week of term, one line per cohort.
 * Year-long cohorts are solid lines on the lime ramp; summer sessions (a shorter,
 * May–August term) are dashed on a neutral ramp. Header buttons show each cohort's
 * value at the comparison week; clicking one brings that cohort's line forward.
 */
export function CohortTrendChart({
  series,
  currentWeek,
  title,
  description,
}: {
  series: TrendSeries[];
  currentWeek?: number;
  title: string;
  description?: string;
}) {
  const shapeOf = new Map(series.map((s, i) => [s.slug, SHAPES[i % SHAPES.length]]));
  const lastWeekOf = new Map(series.map((s) => [s.slug, s.points.at(-1)?.week]));
  const initial = series.find((s) => s.isCurrent) ?? series.at(-1);
  const [focus, setFocus] = useState(initial?.slug ?? '');

  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [keyOf(s), { label: s.label, color: s.color }])
  );

  const weeks = new Set<number>();
  series.forEach((s) => s.points.forEach((p) => weeks.add(p.week)));
  const rows = [...weeks]
    .sort((a, b) => a - b)
    .map((week) => {
      const row: Record<string, number> = { week };
      for (const s of series) {
        const p = s.points.find((x) => x.week === week);
        if (p) row[keyOf(s)] = p.value;
      }
      return row;
    });

  // Value at the comparison week: today's week for a live cohort, else the term's end.
  const valueAt = (s: TrendSeries) => {
    const w = currentWeek ?? Infinity;
    const pts = s.points.filter((p) => p.week <= w);
    return pts.at(-1)?.value ?? 0;
  };

  // Context for the current cohort, compared with the latest past cohort of the same kind.
  const nowHint = (s: TrendSeries) => {
    const prev = series.filter((x) => !x.isCurrent && x.session === s.session).at(-1);
    const base = `avg commits per team by week ${currentWeek ?? '—'}`;
    if (!prev) return base;
    const diff = Math.round(valueAt(s) - valueAt(prev));
    return diff > 0
      ? `${base} · ${diff.toLocaleString()} ahead of ${prev.label} at this point`
      : `${base} · ${prev.label} was at ${Math.round(valueAt(prev)).toLocaleString()} at this point`;
  };

  // Header: current cohort first, then newest to oldest.
  const ordered = [...series]
    .reverse()
    .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));

  return (
    <ChartCard
      title={title}
      description={description}
      stacked={series.length > 4}
      metrics={ordered.map((s) => ({
        key: s.slug,
        label: s.isCurrent ? `${s.label} · now` : s.label,
        icon: <ShapeIcon Icon={shapeOf.get(s.slug)!} color={s.color} size={11} />,
        value: Math.round(valueAt(s)).toLocaleString(),
        emphasis: s.isCurrent,
        hint: s.isCurrent ? nowHint(s) : undefined,
      }))}
      active={focus}
      onActive={setFocus}
    >
      <ChartContainer config={config} className='aspect-auto h-72 w-full'>
        <LineChart data={rows} margin={{ left: 0, right: 16, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='week'
            type='number'
            domain={['dataMin', 'dataMax']}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(w) => `Wk ${w}`}
          />
          <YAxis tickLine={false} axisLine={false} width={40} />
          {currentWeek !== undefined && (
            <ReferenceLine
              x={currentWeek}
              stroke='var(--muted-foreground)'
              strokeOpacity={0.5}
              label={{
                value: 'Today',
                position: 'insideTopRight',
                fill: 'var(--muted-foreground)',
                fontSize: 11,
              }}
            />
          )}
          <ChartTooltip
            content={
              <ChartTooltipContent
                className='w-56'
                labelFormatter={(_, p) => `Week ${p?.[0]?.payload?.week} of term`}
                formatter={(value, name) => (
                  <div className='flex w-full items-center justify-between gap-3'>
                    <span className='flex items-center gap-1.5 text-muted-foreground'>
                      {(() => {
                        const s = series.find((x) => keyOf(x) === name);
                        return s ? (
                          <ShapeIcon
                            Icon={shapeOf.get(s.slug)!}
                            color={s.color}
                            size={11}
                          />
                        ) : null;
                      })()}
                      {config[name as string]?.label}
                    </span>
                    <span className='font-mono font-medium tabular-nums'>
                      {Math.round(Number(value)).toLocaleString()}
                    </span>
                  </div>
                )}
              />
            }
          />
          {[...series]
            .sort((a, b) => Number(a.slug === focus) - Number(b.slug === focus))
            .map((s) => {
              const on = s.slug === focus;
              const k = keyOf(s);
              const Icon = shapeOf.get(s.slug)!;
              const idx = series.indexOf(s);
              const color = `var(--color-${k})`;
              // Markers every few weeks (staggered per cohort so they don't stack) and at the end.
              const marker = (size: number, always = false) =>
                function Marker(props: {
                  cx?: number;
                  cy?: number;
                  index?: number;
                  payload?: { week: number };
                }) {
                  const { cx, cy, payload, index } = props;
                  const w = payload?.week;
                  const show =
                    always ||
                    w === lastWeekOf.get(s.slug) ||
                    (w !== undefined && (w + idx) % MARKER_EVERY === 0);
                  if (cx == null || cy == null || !show || payload?.[k as never] == null)
                    return <g key={`${k}-${index}`} />;
                  return (
                    <Icon
                      key={`${k}-${index}`}
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      fill={color}
                      stroke='var(--card)'
                      strokeWidth={2.5}
                      opacity={on ? 1 : 0.55}
                    />
                  );
                };
              return (
                <Line
                  key={s.slug}
                  dataKey={k}
                  type='monotone'
                  stroke={`var(--color-${k})`}
                  strokeWidth={on ? 3 : 2}
                  strokeOpacity={on ? 1 : 0.4}
                  strokeDasharray={s.session === 'summer' ? SUMMER_DASH : undefined}
                  dot={marker(on ? 13 : 11)}
                  activeDot={marker(16, true)}
                  connectNulls
                />
              );
            })}
        </LineChart>
      </ChartContainer>
      <div className='mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs'>
        {series.map((s) => (
          <button
            key={s.slug}
            type='button'
            onClick={() => setFocus(s.slug)}
            className='flex items-center gap-1.5 text-muted-foreground
              hover:text-foreground'
          >
            <ShapeIcon Icon={shapeOf.get(s.slug)!} color={s.color} size={12} />
            <svg width='18' height='4' aria-hidden>
              <line
                x1='1'
                y1='2'
                x2='17'
                y2='2'
                stroke={s.color}
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeDasharray={s.session === 'summer' ? '4 3' : undefined}
              />
            </svg>
            {s.label}
          </button>
        ))}
      </div>
    </ChartCard>
  );
}
