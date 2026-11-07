'use client';

import { ExternalLink } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { fmt, pct } from '@/lib/format';
import { useIsMobile } from '@/hooks/use-mobile';
import type { CohortGrades } from '@/lib/types';

const PAIR_URL =
  'https://reports.im.it.ubc.ca/t/Learner/views/GradeDistributionReport/GradeDistributionReport';

const num = (n: number | null) => (n === null ? '—' : `${Math.round(n * 10) / 10}%`);

/** COSC 499 final grade spread for one cohort (course-wide, from UBC PAIR). */
export function GradeDistribution({
  grades: g,
  color,
  title = 'Final grades',
  action,
}: {
  grades: CohortGrades;
  /** The cohort's color (cohortColor) */
  color: string;
  title?: string;
  /** Top-right control, e.g. a session picker */
  action?: React.ReactNode;
}) {
  const names = g.instructors;
  const taught = names.length
    ? ` Taught by ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}.`
    : '';
  // Ten ranges don't fit side by side on a phone: tilt the labels.
  const tilt = useIsMobile();
  const config: ChartConfig = { count: { label: 'Students', color } };
  const data = g.buckets.map((b) => ({
    label: b.label,
    count: b.count ?? 0,
    hidden: b.count === null,
  }));

  const stats = [
    { label: 'Class average', value: num(g.average) },
    g.median !== null
      ? { label: 'Median', value: num(g.median) }
      : g.stdev !== null
        ? { label: 'Standard deviation', value: `${g.stdev}` }
        : null,
    g.p25 !== null && g.p75 !== null
      ? { label: 'Middle half', value: `${Math.round(g.p25)}–${Math.round(g.p75)}%` }
      : null,
    {
      label: 'Finished with 80%+',
      value: `${g.share80IsMin ? 'at least ' : ''}${pct(g.share80)}`,
    },
    { label: 'Top grade', value: `${g.high}%` },
  ].filter((s) => s !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>{title}</CardTitle>
        <CardDescription>
          How the {fmt(g.students)} students in COSC 499 finished
          {g.sections > 1 ? `, across ${g.sections} sections` : ''}.{taught} Course-wide
          only: grades are not linked to teams or people.
        </CardDescription>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className='grid gap-6 lg:grid-cols-[minmax(0,14rem)_1fr]'>
        <dl className='grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-1'>
          {stats.map((s) => (
            <div key={s.label} className='space-y-0.5'>
              <dt className='text-xs text-muted-foreground'>{s.label}</dt>
              <dd className='font-mono text-xl font-semibold tabular-nums'>{s.value}</dd>
            </div>
          ))}
        </dl>
        <ChartContainer config={config} className='aspect-auto h-60 w-full'>
          <BarChart
            key={g.yearsession}
            data={data}
            margin={{ top: 20, left: -20, right: 4 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              // Bold labels in the foreground color, as in every bar chart (MetricBarChart).
              tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--foreground)' }}
              angle={tilt ? -45 : 0}
              textAnchor={tilt ? 'end' : 'middle'}
              height={tilt ? 44 : 30}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={48} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `${label}%`}
                  formatter={(value, _n, item) => (
                    <span className='font-mono tabular-nums'>
                      {item.payload.hidden
                        ? 'Fewer than 6 (hidden by PAIR)'
                        : `${fmt(Number(value))} students`}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey='count' fill='var(--color-count)' radius={4}>
              <LabelList
                dataKey='count'
                position='top'
                className='fill-muted-foreground'
                fontSize={11}
                formatter={(v) => (Number(v) > 0 ? fmt(Number(v)) : '')}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-wrap gap-x-1 text-xs text-muted-foreground'>
        Source:
        <a
          href={PAIR_URL}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
        >
          UBC PAIR <ExternalLink className='size-3' />
        </a>
        <span>
          ({g.yearsession}).
          {g.hidden > 0 &&
            ` PAIR hides ranges with fewer than 6 students, so ${g.hidden} ${g.hidden === 1 ? 'grade is' : 'grades are'} not shown.`}
        </span>
      </CardFooter>
    </Card>
  );
}
