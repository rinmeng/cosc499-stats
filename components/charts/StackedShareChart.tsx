'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { WhyDialog, type Why } from '@/components/insights/WhyDialog';

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ShareSlice } from '@/lib/types/insights';

import { ChartCard } from './ChartCard';

const PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--summer-2)',
  'var(--muted-foreground)',
];

export interface ShareRow {
  label: string;
  slices: ShareSlice[];
}

function keyOf(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'slice';
}

export function StackedShareChart({
  title,
  description,
  why,
  rows,
  nTeams,
  nCohorts,
  empty,
}: {
  title: string;
  /** One short line under the title */
  description?: string;
  why: Why;
  rows: ShareRow[];
  nTeams: number;
  nCohorts: number;
  empty?: string;
}) {
  const names: string[] = [];
  for (const row of rows)
    for (const slice of row.slices)
      if (!names.includes(slice.name)) names.push(slice.name);
  if (names.includes('Other')) {
    names.splice(names.indexOf('Other'), 1);
    names.push('Other');
  }

  const data = rows.map((row) => {
    const point: Record<string, string | number> = { label: row.label };
    for (const name of names) {
      point[keyOf(name)] = (row.slices.find((s) => s.name === name)?.share ?? 0) * 100;
    }
    return point;
  });

  const config: ChartConfig = Object.fromEntries(
    names.map((name, i) => [
      keyOf(name),
      { label: name, color: PALETTE[Math.min(i, PALETTE.length - 1)] },
    ])
  );

  return (
    <ChartCard
      title={title}
      description={
        <span className='flex flex-col items-start gap-1'>
          {description && <span className='text-sm text-foreground'>{description}</span>}
          <WhyDialog
            title={title}
            why={why}
            sample={nCohorts ? `${nTeams} teams in ${nCohorts} cohorts` : undefined}
          />
        </span>
      }
    >
      {names.length === 0 ? (
        <p className='px-2 py-10 text-center text-sm text-muted-foreground'>
          {empty ?? 'No data yet.'}
        </p>
      ) : (
        <ChartContainer config={config} className='aspect-auto h-72 w-full'>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 12, top: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-44'
                  formatter={(value, name) => (
                    <div className='flex w-full items-center justify-between gap-3'>
                      <span className='text-muted-foreground'>
                        {config[name as string]?.label ?? name}
                      </span>
                      <span className='font-mono tabular-nums'>
                        {Math.round(Number(value))}%
                      </span>
                    </div>
                  )}
                />
              }
            />
            <ChartLegend
              content={<ChartLegendContent className='flex-wrap gap-x-4 gap-y-1.5' />}
            />
            {names.map((name) => (
              <Bar
                key={name}
                dataKey={keyOf(name)}
                stackId='share'
                fill={`var(--color-${keyOf(name)})`}
                radius={name === names.at(-1) ? [4, 4, 0, 0] : undefined}
                maxBarSize={56}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
