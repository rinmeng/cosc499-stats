'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { ChartCard } from './ChartCard';

export interface BarRow {
  /** short axis label, e.g. "T8" or "2025–26" */
  label: string;
  /** full label for the tooltip */
  name: string;
  values: Record<string, number>;
}

export interface BarMetric {
  key: string;
  label: string;
  /** headline shown in the header button */
  total: string;
  unit?: string;
}

/**
 * Interactive bar chart: one measure at a time, chosen from the header.
 * With `sortDesc`, bars are ordered highest first (no ascending order, by design).
 */
export function MetricBarChart({
  title,
  description,
  rows,
  metrics,
  sortDesc = false,
  height = 'h-64',
  className,
}: {
  title: string;
  description?: string;
  rows: BarRow[];
  metrics: BarMetric[];
  sortDesc?: boolean;
  height?: string;
  className?: string;
}) {
  const [active, setActive] = useState(metrics[0]?.key);
  const metric = metrics.find((m) => m.key === active) ?? metrics[0];
  const data = rows.map((r) => ({
    label: r.label,
    name: r.name,
    value: r.values[active] ?? 0,
  }));
  if (sortDesc) data.sort((a, b) => b.value - a.value);

  const config = {
    value: { label: metric?.label, color: 'var(--series)' },
  } satisfies ChartConfig;

  return (
    <ChartCard
      title={title}
      description={description}
      metrics={metrics.map((m) => ({ key: m.key, label: m.label, value: m.total }))}
      active={active}
      onActive={setActive}
      className={className}
    >
      <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='label'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            fontSize={11}
          />
          <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={
              <ChartTooltipContent
                className='w-44'
                labelFormatter={(_, p) => (p?.[0]?.payload as { name: string })?.name}
                formatter={(value) => (
                  <div className='flex w-full items-center justify-between gap-3'>
                    <span className='flex items-center gap-1.5 text-muted-foreground'>
                      <span className='size-2.5 shrink-0 rounded-[2px] bg-(--color-value)' />
                      {metric?.label}
                    </span>
                    <span className='font-mono font-medium tabular-nums'>
                      {Number(value).toLocaleString()}
                      {metric?.unit ? ` ${metric.unit}` : ''}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey='value'
            fill='var(--color-value)'
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
