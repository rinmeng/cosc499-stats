'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { FindingText } from '@/components/insights/FindingText';
import { WhyDialog, type Why } from '@/components/insights/WhyDialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ERA_COLOR, fmtInsight, type InsightKind } from '@/lib/format';
import type { Era } from '@/lib/types/insights';

import { ChartCard } from './ChartCard';
import { ERA_MARK, EraLegend, Mark, markState, type MarkState } from './EraShape';

export interface TimelinePoint {
  termStart: string;
  label: string;
  value: number;
  nTeams: number;
  faded: boolean;
  hollow: boolean;
  color: string;
  session: 'winter' | 'summer';
}

export interface TimelineSeries {
  key: string;
  label: string;
  headline: string;
  /** Plain-English sentence for this metric ("**1.6× more** than before AI") */
  finding?: string | null;
  kind: InsightKind;
  nTeams: number;
  nCohorts: number;
  points: TimelinePoint[];
}

/** Era of a cohort, by the calendar year its term starts in. */
function eraOf(termStart: string): Era {
  const year = Number(termStart.slice(0, 4));
  return year >= 2024 ? 'agentic' : year >= 2022 ? 'early-ai' : 'pre-ai';
}

/**
 * One value per cohort, oldest first. shadcn "Line Chart - Dots Colors": each dot
 * takes its era's color from the row's `fill`. In-progress cohorts are hollow and
 * cohorts with fewer than 3 teams are faint (both listed in the legend).
 */
export function CohortTimelineChart({
  title,
  why,
  series,
  empty,
}: {
  title: string;
  why: Why;
  series: TimelineSeries[];
  empty?: string;
}) {
  const [activeKey, setActiveKey] = useState(series[0]?.key);
  const active = series.find((s) => s.key === activeKey) ?? series[0];
  if (!active) return null;
  const kind = active.kind;

  const data = [...active.points]
    .sort((a, b) => a.termStart.localeCompare(b.termStart))
    .map((p) => ({
      ...p,
      fill: ERA_COLOR[eraOf(p.termStart)],
      shape: ERA_MARK[eraOf(p.termStart)],
    }));

  const states = (['inProgress', 'small'] as MarkState[]).filter((st) =>
    data.some((p) => markState(p) === st)
  );

  const config = {
    value: { label: active.label, color: 'var(--muted-foreground)' },
  } satisfies ChartConfig;

  const rows = data.map((p) => ({
    label: p.label,
    value: fmtInsight(p.value, kind),
    note: p.hollow
      ? 'in progress'
      : p.faded
        ? `${p.nTeams} team${p.nTeams === 1 ? '' : 's'}, not in the era median`
        : `${p.nTeams} teams`,
  }));

  return (
    <ChartCard
      title={title}
      description={
        <span className='flex flex-col items-start gap-1'>
          {active.finding && (
            <FindingText text={active.finding} className='text-sm text-foreground' />
          )}
          <WhyDialog
            title={title}
            why={why}
            sample={`${active.nTeams} teams in ${active.nCohorts} cohorts`}
            rows={rows}
            rowsTitle={`${active.label}, each cohort`}
          />
        </span>
      }
      metrics={
        series.length > 1
          ? series.map((s) => ({ key: s.key, label: s.label, value: s.headline }))
          : undefined
      }
      active={active.key}
      onActive={setActiveKey}
      wideMetrics
    >
      {data.length === 0 ? (
        <p className='px-2 py-10 text-center text-sm text-muted-foreground'>
          {empty ?? 'Not enough data yet.'}
        </p>
      ) : (
        <>
          <ChartContainer config={config} className='aspect-auto h-64 w-full'>
            <LineChart
              accessibilityLayer
              data={data}
              margin={{ top: 24, left: 12, right: 24 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(v) => fmtInsight(Number(v), kind)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator='line'
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
                    formatter={(value, _name, item) => {
                      const p = item.payload as (typeof data)[number];
                      return (
                        <div className='grid w-full gap-0.5'>
                          <div className='flex items-center justify-between gap-4'>
                            <span className='text-muted-foreground'>{active.label}</span>
                            <span className='font-mono font-medium tabular-nums'>
                              {fmtInsight(Number(value), kind)}
                            </span>
                          </div>
                          <span className='text-[11px] text-muted-foreground'>
                            {p.nTeams} teams
                            {p.faded ? ' · not in the era median' : ''}
                            {p.hollow ? ' · in progress' : ''}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Line
                dataKey='value'
                type='linear'
                stroke='var(--color-value)'
                strokeWidth={2}
                dot={({ payload, ...props }) => {
                  if (props.cx == null || props.cy == null)
                    return <g key={payload.label} />;
                  return (
                    <g key={payload.label}>
                      <Mark
                        cx={props.cx}
                        cy={props.cy}
                        r={5.5}
                        shape={payload.shape}
                        color={payload.fill}
                        state={markState(payload)}
                      />
                    </g>
                  );
                }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
          <EraLegend states={states} />
        </>
      )}
    </ChartCard>
  );
}
