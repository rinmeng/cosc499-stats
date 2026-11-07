'use client';

import { addWeeks, format } from 'date-fns';

import { isoDate, parseDate, UTC } from '@/lib/dates';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WeekPoint } from '@/lib/types/stats';

import { ChartCard } from './ChartCard';

type Range = 'all' | 'fall' | 'winter' | 'recent';

const RANGES: { value: Range; label: string }[] = [
  { value: 'all', label: 'Whole year' },
  { value: 'fall', label: 'Fall term' },
  { value: 'winter', label: 'Winter term' },
  { value: 'recent', label: 'Last 8 weeks' },
];

const shortDate = (iso: string) => format(parseDate(iso), 'MMM d', { in: UTC });

/**
 * Weekly activity (actions) as an area chart: every commit, PR opened or merged, review and issue
 * opened, like the rhythm stats. Narrow the time range with the select.
 */
export function ActivityChart({
  data,
  termStart,
  title = 'Activity by week',
  description,
  session = 'winter',
  info,
}: {
  data: WeekPoint[];
  termStart: string;
  title?: string;
  description?: string;
  session?: 'winter' | 'summer';
  /** Help dialog trigger shown before the range select (e.g. ActivityInfo) */
  info?: React.ReactNode;
}) {
  // Summer sessions are one short term, so only whole-term and recent views apply.
  const ranges =
    session === 'summer'
      ? [
          { value: 'all' as Range, label: 'Whole term' },
          { value: 'recent' as Range, label: 'Last 8 weeks' },
        ]
      : RANGES;
  const [range, setRange] = useState<Range>('all');

  const rows = useMemo(() => {
    if (!data.length) return [];
    const start = parseDate(termStart);
    const byWeek = new Map(data.map((d) => [d.week, d]));
    const min = data[0].week;
    const max = data[data.length - 1].week;
    const all = Array.from({ length: max - min + 1 }, (_, i) => {
      const week = min + i;
      const d = byWeek.get(week);
      return {
        week,
        start: isoDate(addWeeks(start, week)),
        activity: d?.activity ?? 0,
      };
    });
    if (range === 'fall') return all.filter((r) => r.week <= 15);
    if (range === 'winter') return all.filter((r) => r.week >= 17);
    if (range === 'recent') return all.slice(-8);
    return all;
  }, [data, termStart, range]);

  const total = rows.reduce((a, r) => a + r.activity, 0).toLocaleString();
  const config = {
    activity: { label: 'Activity', color: 'var(--series)' },
  } satisfies ChartConfig;

  return (
    <ChartCard
      title={title}
      description={description}
      metrics={[{ key: 'activity', label: 'Activity', value: total }]}
      active='activity'
      action={
        <div className='flex flex-wrap items-center justify-center gap-1 lg:justify-end'>
          {info}
          <Select
            value={range}
            onValueChange={(v) => v && setRange(v as Range)}
            items={ranges}
          >
            <SelectTrigger className='w-36' aria-label='Time range'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ranges.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <ChartContainer config={config} className='aspect-auto h-64 w-full'>
        <AreaChart data={rows} margin={{ left: 0, right: 12, top: 8 }}>
          <defs>
            <linearGradient id={'fill-activity'} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={'var(--color-activity)'} stopOpacity={0.8} />
              <stop offset='95%' stopColor={'var(--color-activity)'} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey='start'
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={shortDate}
          />
          <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator='dot'
                labelFormatter={(_, p) => {
                  const r = p?.[0]?.payload as
                    { week: number; start: string } | undefined;
                  return r ? `Week ${r.week} · from ${shortDate(r.start)}` : '';
                }}
                formatter={(value) => {
                  const n = Number(value);
                  return (
                    <div className='flex w-full items-center justify-between gap-3'>
                      <span className='flex items-center gap-1.5 text-muted-foreground'>
                        <span
                          className='size-2.5 shrink-0 rounded-full bg-(--color-activity)'
                        />
                        Activity
                      </span>
                      <span className='font-mono font-medium tabular-nums'>
                        {n.toLocaleString()} {n === 1 ? 'action' : 'actions'}
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Area
            dataKey='activity'
            type='monotone'
            fill={'url(#fill-activity)'}
            stroke={'var(--color-activity)'}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
