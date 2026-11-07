'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fmtCompact } from '@/lib/format';

import { ChartCard } from './ChartCard';
import { SeriesIcon, coloredIcon } from './SeriesIcon';

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
  /**
   * Row value keys that add up to this metric, drawn as a stacked bar (bottom first)
   * with a legend, e.g. Overall = member points + teamwork bonus.
   */
  parts?: { key: string; label: string }[];
}

/** Stack colors: the usual bar color first, then lighter steps of the same palette. */
const PART_COLORS = ['var(--series)', 'var(--chart-1)', 'var(--chart-5)'];

/**
 * Interactive bar chart: one measure at a time, chosen from the header.
 * With `sortDesc`, bars are ordered highest first (no ascending order, by design).
 * With `podium` (a count), a tab shows the top N as a podium: 1st in the middle, then
 * alternating outwards (… 4th, 2nd, 1st, 3rd, 5th …). It's the default view, next to
 * the full chart; both follow the measure picked in the header.
 */
export function MetricBarChart({
  title,
  description,
  rows,
  metrics,
  sortDesc = false,
  podium = 0,
  height = 'h-64',
  switcher = 'header',
  className,
}: {
  title: string;
  description?: React.ReactNode;
  rows: BarRow[];
  metrics: BarMetric[];
  sortDesc?: boolean;
  /** How many places to show on the podium tab; 0 for no podium */
  podium?: number;
  height?: string;
  /**
   * How the measure is picked: 'header' shows clickable totals in the card header;
   * 'buttons' shows a compact button group instead (no totals).
   */
  switcher?: 'header' | 'buttons';
  className?: string;
}) {
  const [active, setActive] = useState(metrics[0]?.key);
  const [view, setView] = useState<'podium' | 'all'>('podium');
  const metric = metrics.find((m) => m.key === active) ?? metrics[0];
  const parts = metric?.parts ?? [];
  const stacked = parts.length > 0;
  const data = rows.map((r) => ({
    label: r.label,
    name: r.name,
    value: r.values[active] ?? 0,
    ...Object.fromEntries(parts.map((p) => [p.key, r.values[p.key] ?? 0])),
  }));
  if (sortDesc || podium) data.sort((a, b) => b.value - a.value);
  const crowded = rows.length > 6;
  // Podium order: 1st in the middle, 2nd to its left, 3rd to its right, and so on.
  const podiumData: ((typeof data)[number] & { rank: number })[] = [];
  data
    .filter((d) => d.value > 0)
    .slice(0, podium)
    .forEach((d, i) => {
      const row = { ...d, rank: i + 1 };
      if (i % 2) podiumData.unshift(row);
      else podiumData.push(row);
    });
  // Many places: smaller labels, compact values (the tooltip keeps the full number).
  const roomy = podiumData.length <= 5;

  const config: ChartConfig = stacked
    ? Object.fromEntries(
        parts.map((p, i) => [
          p.key,
          {
            label: p.label,
            color: PART_COLORS[i % PART_COLORS.length],
            icon: coloredIcon(i, PART_COLORS[i % PART_COLORS.length]),
          },
        ])
      )
    : { value: { label: metric?.label, color: 'var(--series)' } };
  const unit = metric?.unit ? ` ${metric.unit}` : '';

  const tooltip = (
    <ChartTooltip
      cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
      content={
        <ChartTooltipContent
          className={stacked ? 'w-56' : 'w-44'}
          labelFormatter={(_, p) => (p?.[0]?.payload as { name: string })?.name}
          formatter={(value, name, item, index) => {
            const i = parts.findIndex((p) => p.key === name);
            return (
              <div className='flex w-full flex-col gap-1'>
                <div className='flex w-full items-center justify-between gap-3'>
                  <span className='flex items-center gap-1.5 text-muted-foreground'>
                    {stacked ? (
                      <SeriesIcon
                        index={i}
                        color={PART_COLORS[i % PART_COLORS.length]}
                        className='size-3'
                      />
                    ) : (
                      <span className='size-2.5 shrink-0 rounded-[2px] bg-(--color-value)' />
                    )}
                    {stacked ? parts[i]?.label : metric?.label}
                  </span>
                  <span className='font-mono font-medium tabular-nums'>
                    {Number(value).toLocaleString()}
                    {unit}
                  </span>
                </div>
                {stacked && index === parts.length - 1 && (
                  <div
                    className='flex w-full items-center justify-between gap-3 border-t
                      pt-1 font-medium'
                  >
                    <span>{metric?.label}</span>
                    <span className='font-mono tabular-nums'>
                      {Number((item.payload as { value: number }).value).toLocaleString()}
                      {unit}
                    </span>
                  </div>
                )}
              </div>
            );
          }}
        />
      }
    />
  );

  const legend = stacked && (
    <ChartLegend
      content={<ChartLegendContent className='flex-wrap gap-x-4 gap-y-1.5' />}
    />
  );

  /**
   * Stacked: round only the top segment that has height, so a team with no bonus
   * still gets a rounded bar.
   */
  const shape = (r: number) =>
    function StackShape(props: BarShapeProps) {
      const key = (props as { dataKey?: string }).dataKey;
      const row = props.payload as Record<string, number>;
      const at = parts.findIndex((p) => p.key === key);
      const top = parts.slice(at + 1).every((p) => !row[p.key]);
      return <Rectangle {...props} radius={top ? [r, r, 0, 0] : 0} />;
    };

  return (
    <ChartCard
      title={title}
      description={description}
      metrics={
        switcher === 'header'
          ? metrics.map((m) => ({ key: m.key, label: m.label, value: m.total }))
          : undefined
      }
      active={active}
      onActive={setActive}
      action={
        switcher === 'buttons' ? (
          // One row; scrolls sideways on narrow phones instead of wrapping.
          <div className='-mx-1 max-w-full overflow-x-auto px-1 pb-1'>
            <ToggleGroup
              variant='outline'
              size='sm'
              spacing={0}
              value={[active]}
              onValueChange={(v) => v[0] && setActive(v[0])}
            >
              {metrics.map((m) => (
                <ToggleGroupItem key={m.key} value={m.key}>
                  {m.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        ) : (
          podium && (
            <Tabs value={view} onValueChange={(v) => setView(v as 'podium' | 'all')}>
              <TabsList>
                <TabsTrigger value='podium'>Top {podium}</TabsTrigger>
                <TabsTrigger value='all'>All teams</TabsTrigger>
              </TabsList>
            </Tabs>
          )
        )
      }
      className={className}
    >
      {podium && view === 'podium' ? (
        podiumData.length ? (
          <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
            <BarChart
              data={podiumData}
              margin={{ left: 0, right: 12, top: 28 }}
              barCategoryGap={roomy ? '12%' : '8%'}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={podiumData.length > 6 ? -45 : 0}
                textAnchor={podiumData.length > 6 ? 'end' : 'middle'}
                height={podiumData.length > 6 ? 64 : 30}
                tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--foreground)' }}
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              {tooltip}
              {legend}
              {(stacked ? parts.map((p) => p.key) : ['value']).map((key, i, keys) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId={stacked ? 'parts' : undefined}
                  fill={`var(--color-${key})`}
                  radius={roomy ? [8, 8, 0, 0] : [4, 4, 0, 0]}
                  shape={stacked ? shape(roomy ? 8 : 4) : undefined}
                  maxBarSize={160}
                  isAnimationActive={!stacked}
                >
                  {i === keys.length - 1 && (
                    <LabelList
                      dataKey='value'
                      position='top'
                      offset={10}
                      className='fill-foreground font-mono'
                      fontSize={roomy ? 12 : 10}
                      formatter={(v) =>
                        roomy
                          ? `${Number(v).toLocaleString()}${metric?.unit ? ` ${metric.unit}` : ''}`
                          : fmtCompact(Number(v))
                      }
                    />
                  )}
                  {i === 0 && (
                    <LabelList
                      dataKey='rank'
                      position='insideTop'
                      offset={roomy ? 12 : 6}
                      className='fill-background font-heading font-bold'
                      fontSize={roomy ? 28 : 14}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        ) : (
          <div
            className={`flex ${height} items-center justify-center text-sm
              text-muted-foreground`}
          >
            No activity yet
          </div>
        )
      ) : (
        <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
          <BarChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              // Many bars (e.g. every cohort on a phone): tilt the labels so they don't collide.
              angle={crowded ? -45 : 0}
              textAnchor={crowded ? 'end' : 'middle'}
              height={crowded ? 64 : 30}
              tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--foreground)' }}
            />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            {tooltip}
            {legend}
            {(stacked ? parts.map((p) => p.key) : ['value']).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={stacked ? 'parts' : undefined}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
                shape={stacked ? shape(4) : undefined}
                maxBarSize={56}
                isAnimationActive={!stacked}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
