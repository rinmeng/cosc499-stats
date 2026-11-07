'use client';

import { useState } from 'react';
import { Circle, Square, type LucideIcon } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { fmt } from '@/lib/format';
import type { GradeMeasure, GradesView } from '@/lib/types';

import { ChartCard } from './ChartCard';
import { SeriesIcon } from './SeriesIcon';

type Series = 'winter' | 'summer';

/**
 * Color is never the only cue: each line has its own marker shape (circle / square,
 * the SeriesIcon order) and summer is dashed, in the chart, legend and tooltip alike.
 */
const SERIES: Record<
  Series,
  { label: string; color: string; icon: number; Shape: LucideIcon; dash?: string }
> = {
  winter: { label: 'Year-long', color: 'var(--cohort-1)', icon: 0, Shape: Circle },
  summer: {
    label: 'Summer',
    color: 'var(--summer-1)',
    icon: 1,
    Shape: Square,
    dash: '6 4',
  },
};

const config: ChartConfig = {
  winter: { label: SERIES.winter.label, color: SERIES.winter.color },
  summer: { label: SERIES.summer.label, color: SERIES.summer.color },
};

/** Recharts dot renderer drawing the series' shape, outlined in the card color. */
function marker(key: Series, size: number) {
  const { Shape } = SERIES[key];
  return function Marker(props: { cx?: number; cy?: number; index?: number }) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return <g key={`${key}-${index}`} />;
    return (
      <Shape
        key={`${key}-${index}`}
        x={cx - size / 2}
        y={cy - size / 2}
        width={size}
        height={size}
        fill={`var(--color-${key})`}
        stroke='var(--card)'
        strokeWidth={2.5}
      />
    );
  };
}

const UNIT: Record<GradeMeasure, (v: number) => string> = {
  average: (v) => `${v}%`,
  students: (v) => `${fmt(v)} students`,
  share80: (v) => `${v}%`,
};

/**
 * COSC 499 grades by start year, one line for year-long cohorts and a dashed one
 * for summer sessions (as in the overview's trend chart). Pick the measure in the header.
 */
export function GradeTrendChart({ view }: { view: GradesView }) {
  const [measure, setMeasure] = useState<GradeMeasure>('students');
  const t = view.totals;
  const rows = view.trend[measure];

  return (
    <ChartCard
      title='Through the years'
      description='Each point is one session, by the year it started. Summer sessions are dashed.'
      metrics={[
        { key: 'students', label: 'Students', value: fmt(t.students) },
        {
          key: 'average',
          label: 'Class average',
          value: `${t.average}%`,
        },
        {
          key: 'share80',
          label: 'Finished 80%+',
          value: `${Math.round(t.share80 * 100)}%`,
        },
      ]}
      active={measure}
      onActive={setMeasure}
      // Room for the full labels ("Finished 80%+") instead of truncating them.
      wideMetrics
    >
      <ChartContainer config={config} className='aspect-auto h-72 w-full'>
        <LineChart data={rows} margin={{ left: 0, right: 16, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='year'
            type='number'
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
            domain={measure === 'students' ? [0, 'auto'] : ['auto', 'auto']}
            tickFormatter={(v) => (measure === 'students' ? fmt(v) : `${v}%`)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className='w-52'
                labelFormatter={(_, p) => `Started ${p?.[0]?.payload?.year}`}
                formatter={(value, name, item) => (
                  <div className='flex w-full items-center justify-between gap-3'>
                    <span className='flex items-center gap-1.5 text-muted-foreground'>
                      <SeriesIcon
                        index={SERIES[name as Series].icon}
                        color={SERIES[name as Series].color}
                        className='size-3'
                      />
                      {item.payload[`${name}Label`]}
                    </span>
                    <span className='font-mono font-medium tabular-nums'>
                      {UNIT[measure](Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          {(['winter', 'summer'] as Series[]).map((key) => (
            <Line
              key={key}
              dataKey={key}
              type='monotone'
              stroke={`var(--color-${key})`}
              strokeWidth={2.5}
              strokeDasharray={SERIES[key].dash}
              dot={marker(key, 12)}
              activeDot={marker(key, 16)}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
      {/* Legend: shape + line sample (dashed for summer) + name, as in CohortTrendChart. */}
      <ul className='mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs'>
        {(['winter', 'summer'] as Series[]).map((key) => (
          <li key={key} className='flex items-center gap-1.5 text-muted-foreground'>
            <SeriesIcon
              index={SERIES[key].icon}
              color={SERIES[key].color}
              className='size-3'
            />
            <svg width='18' height='4' aria-hidden>
              <line
                x1='1'
                y1='2'
                x2='17'
                y2='2'
                stroke={SERIES[key].color}
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeDasharray={SERIES[key].dash ? '4 3' : undefined}
              />
            </svg>
            {SERIES[key].label}
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
