'use client';

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

import { WhyDialog, type Why } from '@/components/insights/WhyDialog';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { ShareSlice } from '@/lib/types/insights';

import { ChartCard } from './ChartCard';

// The chart ramp is all green, so skip steps to keep neighbouring bars apart.
const PALETTE = [
  'var(--chart-1)',
  'var(--chart-4)',
  'var(--summer-2)',
  'var(--chart-2)',
  'var(--chart-5)',
  'var(--muted-foreground)',
];

/** One set of shares (summing to ~100%) as horizontal bars, largest first. */
export function HorizontalShareChart({
  title,
  description,
  why,
  slices,
  nTeams,
  nCohorts,
  empty,
}: {
  title: string;
  description?: string;
  why: Why;
  slices: ShareSlice[];
  nTeams: number;
  nCohorts: number;
  empty?: string;
}) {
  const data = [...slices]
    .sort((a, b) => b.share - a.share)
    .map((s, i) => ({
      name: s.name,
      value: s.share * 100,
      commits: s.commits,
      teams: s.teams,
      fill: PALETTE[Math.min(i, PALETTE.length - 1)],
    }));
  const config = { value: { label: 'Share' } } satisfies ChartConfig;

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
      {data.length === 0 ? (
        <p className='px-2 py-10 text-center text-sm text-muted-foreground'>
          {empty ?? 'No data yet.'}
        </p>
      ) : (
        <ChartContainer
          config={config}
          className='aspect-auto w-full'
          style={{ height: data.length * 44 + 16 }}
        >
          <BarChart
            accessibilityLayer
            data={data}
            layout='vertical'
            margin={{ left: 0, right: 48, top: 0, bottom: 0 }}
          >
            <XAxis type='number' dataKey='value' domain={[0, 100]} hide />
            <YAxis
              dataKey='name'
              type='category'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={80}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey='name'
                  formatter={(value, _n, item) => (
                    <div className='flex w-full flex-col gap-0.5'>
                      <div className='flex w-full items-center justify-between gap-3'>
                        <span className='text-muted-foreground'>{item.payload.name}</span>
                        <span className='font-mono tabular-nums'>
                          {Math.round(Number(value))}%
                        </span>
                      </div>
                      {item.payload.commits != null && (
                        <span className='text-xs text-muted-foreground'>
                          {item.payload.commits} commits
                          {item.payload.teams != null && ` · ${item.payload.teams} teams`}
                        </span>
                      )}
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey='value' radius={5} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
              <LabelList
                dataKey='value'
                position='right'
                offset={8}
                className='fill-foreground'
                fontSize={12}
                formatter={(v) => `${Math.round(Number(v))}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
