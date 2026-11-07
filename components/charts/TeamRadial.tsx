'use client';

import { LabelList, PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import { SeriesIcon } from './SeriesIcon';
import {
  Card,
  CardContent,
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

export interface RadialItem {
  key: string;
  label: string;
  /** 0–100 */
  value: number;
  hint: string;
}

/** Radial bars (with labels) for a team's 0–100 habits: reviews, discussion, steadiness, sharing. */
export function TeamRadial({ items }: { items: RadialItem[] }) {
  const config: ChartConfig = {
    value: { label: 'Score' },
    ...Object.fromEntries(
      items.map((it, i) => [it.key, { label: it.label, color: `var(--cohort-${i + 1})` }])
    ),
  };
  const data = items.map((it) => ({ ...it, fill: `var(--color-${it.key})` }));

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Team habits</CardTitle>
        <CardDescription>Each ring is out of 100</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer config={config} className='mx-auto aspect-square max-h-60'>
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius={40}
            outerRadius={110}
            barSize={18}
          >
            <PolarAngleAxis type='number' domain={[0, 100]} tick={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey='key'
                  formatter={(value, _n, item) => (
                    <div className='flex w-full items-center justify-between gap-3'>
                      <span className='flex items-center gap-1.5 text-muted-foreground'>
                        <SeriesIcon
                          index={items.findIndex((x) => x.key === item.payload.key)}
                          color={String(config[item.payload.key]?.color)}
                          className='size-3'
                        />
                        {item.payload.label}
                      </span>
                      <span className='font-mono tabular-nums'>
                        {Math.round(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <RadialBar dataKey='value' background cornerRadius={9}>
              <LabelList
                position='insideStart'
                dataKey='label'
                className='fill-white mix-blend-luminosity'
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='pt-4'>
        <ul className='w-full space-y-1.5 text-sm'>
          {items.map((it, i) => (
            <li key={it.key} className='flex items-baseline gap-2'>
              <SeriesIcon
                index={i}
                color={`var(--cohort-${i + 1})`}
                className='size-3.5 translate-y-0.5'
              />
              <span className='font-medium'>{it.label}</span>
              <span className='truncate text-xs text-muted-foreground'>{it.hint}</span>
              <span className='ml-auto font-mono tabular-nums'>
                {Math.round(it.value)}
              </span>
            </li>
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}
