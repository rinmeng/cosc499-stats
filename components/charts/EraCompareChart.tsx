'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from 'recharts';

import { FindingText } from '@/components/insights/FindingText';
import { WhyDialog, type Why } from '@/components/insights/WhyDialog';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ERA_COLOR, eraLabel, fmtInsight, type InsightKind } from '@/lib/format';
import type { Era } from '@/lib/types/insights';

import { ChartCard } from './ChartCard';
import { coloredIcon } from './SeriesIcon';

export interface EraBar {
  era: Era;
  value: number;
  lo: number;
  hi: number;
  nTeams: number;
  nCohorts: number;
  pooled: number;
}

export interface EraDot {
  era: Era;
  label: string;
  value: number;
  nTeams: number;
  faded: boolean;
  hollow: boolean;
  session: 'winter' | 'summer';
  color: string;
}

export interface EraSeries {
  key: string;
  label: string;
  headline: string;
  /** Plain-English sentence for this metric ("**1.6× more** than before AI") */
  finding?: string | null;
  kind: InsightKind;
  nTeams: number;
  nCohorts: number;
  bars: EraBar[];
  /** Second bar per era. Winter stays in `bars`. */
  summerBars?: EraBar[];
  /** Per-cohort values. Listed in the "Why" dialog, not drawn. */
  dots: EraDot[];
}

const ERA_ORDER: Era[] = ['pre-ai', 'early-ai', 'agentic'];

/** Per-cohort rows for the dialog, oldest era first. */
export function cohortRows(dots: EraDot[], kind: InsightKind) {
  return [...dots]
    .sort((a, b) => ERA_ORDER.indexOf(a.era) - ERA_ORDER.indexOf(b.era))
    .map((dot) => ({
      label: dot.label,
      value: fmtInsight(dot.value, kind),
      note: dot.hollow
        ? 'in progress'
        : dot.faded
          ? `${dot.nTeams} team${dot.nTeams === 1 ? '' : 's'}, not in the era median`
          : `${dot.nTeams} teams`,
    }));
}

/**
 * Era comparison. shadcn "Bar Chart - Label" (one bar per era, value on top, color
 * per bar via Cell), or "Bar Chart - Multiple" + legend when the series has a
 * summer bar next to winter.
 */
export function EraCompareChart({
  title,
  why,
  series,
  empty,
  compact = false,
}: {
  title: string;
  why: Why;
  series: EraSeries[];
  empty?: string;
  /** Half-width card: metric tabs in their own row, slimmer bars. */
  compact?: boolean;
}) {
  const [activeKey, setActiveKey] = useState(series[0]?.key);
  const active = series.find((s) => s.key === activeKey) ?? series[0];
  if (!active) return null;
  const kind = active.kind;
  const dual = !!active.summerBars?.length;

  const data = ERA_ORDER.flatMap((era) => {
    const winter = active.bars.find((b) => b.era === era);
    const summer = active.summerBars?.find((b) => b.era === era);
    if (!winter && !summer) return [];
    return [
      {
        era,
        label: eraLabel(era),
        value: winter?.value ?? null,
        summer: summer?.value ?? null,
        winterBar: winter,
        summerBar: summer,
      },
    ];
  });

  const config: ChartConfig = dual
    ? {
        value: {
          label: 'Winter',
          color: 'var(--chart-4)',
          icon: coloredIcon(0, 'var(--chart-4)'),
        },
        summer: {
          label: 'Summer',
          color: 'var(--summer-2)',
          icon: coloredIcon(1, 'var(--summer-2)'),
        },
      }
    : { value: { label: active.label, color: 'var(--chart-3)' } };

  const label = (v: unknown) => (v == null ? '' : fmtInsight(Number(v), kind));

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
            rows={cohortRows(active.dots, kind)}
            rowsTitle={`${active.label}, each cohort`}
          />
        </span>
      }
      metrics={series.map((s) => ({ key: s.key, label: s.label, value: s.headline }))}
      active={active.key}
      onActive={setActiveKey}
      stacked={compact}
      wideMetrics={!compact}
      className='h-full'
    >
      {data.length === 0 ? (
        <p className='px-2 py-10 text-center text-sm text-muted-foreground'>
          {empty ?? 'Not enough data yet.'}
        </p>
      ) : (
        <ChartContainer
          config={config}
          className={compact ? 'aspect-auto h-56 w-full' : 'aspect-auto h-64 w-full'}
        >
          <BarChart accessibilityLayer data={data} margin={{ top: 24 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='label' tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel={!dual}
                  indicator={dual ? 'dashed' : 'dot'}
                  formatter={(value, name, item) => {
                    const row = item.payload as (typeof data)[number];
                    const bar = name === 'summer' ? row.summerBar : row.winterBar;
                    return (
                      <div className='grid w-full gap-0.5'>
                        <div className='flex items-center justify-between gap-4'>
                          <span className='text-muted-foreground'>
                            {dual ? config[String(name)]?.label : row.label}
                          </span>
                          <span className='font-mono font-medium tabular-nums'>
                            {label(value)}
                          </span>
                        </div>
                        {bar && (
                          <span className='text-[11px] text-muted-foreground'>
                            Median of {bar.nCohorts} cohort{bar.nCohorts === 1 ? '' : 's'}{' '}
                            · {bar.nTeams} teams
                          </span>
                        )}
                      </div>
                    );
                  }}
                />
              }
            />
            {dual && <ChartLegend content={<ChartLegendContent />} />}
            <Bar
              dataKey='value'
              fill='var(--color-value)'
              radius={dual ? 4 : 8}
              maxBarSize={dual ? 40 : compact ? 56 : 72}
            >
              {!dual &&
                data.map((row) => <Cell key={row.era} fill={ERA_COLOR[row.era]} />)}
              <LabelList
                position='top'
                offset={12}
                className='fill-foreground'
                fontSize={12}
                formatter={label}
              />
            </Bar>
            {dual && (
              <Bar dataKey='summer' fill='var(--color-summer)' radius={4} maxBarSize={40}>
                <LabelList
                  position='top'
                  offset={12}
                  className='fill-foreground'
                  fontSize={12}
                  formatter={label}
                />
              </Bar>
            )}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
