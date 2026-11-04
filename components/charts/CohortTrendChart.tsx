'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { ChartCard } from './ChartCard';

export interface TrendSeries {
  year: number;
  label: string;
  /** CSS color for this cohort (ordinal: newer cohorts are stronger) */
  color: string;
  isCurrent: boolean;
  points: { week: number; value: number }[];
}

/**
 * Average cumulative commits per team, aligned by week of term, one line per cohort.
 * Header buttons show each cohort's value at the comparison week; clicking one
 * brings that cohort's line to the front.
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
  const initial = series.find((s) => s.isCurrent)?.year ?? series.at(-1)?.year;
  const [focus, setFocus] = useState(String(initial));

  const config: ChartConfig = Object.fromEntries(
    series.map((s) => [`y${s.year}`, { label: s.label, color: s.color }])
  );

  const weeks = new Set<number>();
  series.forEach((s) => s.points.forEach((p) => weeks.add(p.week)));
  const rows = [...weeks]
    .sort((a, b) => a - b)
    .map((week) => {
      const row: Record<string, number> = { week };
      for (const s of series) {
        const p = s.points.find((x) => x.week === week);
        if (p) row[`y${s.year}`] = p.value;
      }
      return row;
    });

  // Value at the comparison week: today's week for a live cohort, else the season's end.
  const valueAt = (s: TrendSeries) => {
    const w = currentWeek ?? Infinity;
    const pts = s.points.filter((p) => p.week <= w);
    return pts.at(-1)?.value ?? 0;
  };

  // Context line for the current cohort: where it stands and the latest past cohort at the same week.
  const nowHint = (s: TrendSeries) => {
    const prev = series.filter((x) => !x.isCurrent).at(-1);
    const base = `avg commits per team by week ${currentWeek ?? '—'}`;
    if (!prev) return base;
    const diff = Math.round(valueAt(s) - valueAt(prev));
    return diff > 0
      ? `${base} · ${diff.toLocaleString()} ahead of ${prev.label} at this point`
      : `${base} · ${prev.label} was at ${Math.round(valueAt(prev)).toLocaleString()} at this point`;
  };

  return (
    <ChartCard
      title={title}
      description={description}
      metrics={[...series].reverse().map((s) => ({
        key: String(s.year),
        label: s.isCurrent ? `${s.label} · now` : s.label,
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
                formatter={(value, name, item) => (
                  <div className='flex w-full items-center justify-between gap-3'>
                    <span className='flex items-center gap-1.5 text-muted-foreground'>
                      <span
                        className='size-2.5 shrink-0 rounded-[2px]'
                        style={{ background: item.color }}
                      />
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
            .sort(
              (a, b) =>
                Number(String(a.year) === focus) - Number(String(b.year) === focus)
            )
            .map((s) => {
              const on = String(s.year) === focus;
              return (
                <Line
                  key={s.year}
                  dataKey={`y${s.year}`}
                  type='monotone'
                  stroke={`var(--color-y${s.year})`}
                  strokeWidth={on ? 3 : 2}
                  strokeOpacity={on ? 1 : 0.35}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              );
            })}
        </LineChart>
      </ChartContainer>
      <div className='mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs'>
        {series.map((s) => (
          <span key={s.year} className='flex items-center gap-1.5 text-muted-foreground'>
            <span className='h-0.5 w-4 rounded-full' style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}
