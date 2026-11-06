'use client';

import { Label, Pie, PieChart } from 'recharts';

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

import { SeriesIcon } from './SeriesIcon';

const SLICES = 4;

/** Donut of the top languages (plus "Other") with the leading language in the middle. */
export function LanguageDonut({
  languages,
  description = 'Share of code across team repositories',
}: {
  languages: { name: string; bytes: number }[];
  description?: string;
}) {
  const total = languages.reduce((a, l) => a + l.bytes, 0) || 1;
  const top = languages.slice(0, SLICES);
  const rest = languages.slice(SLICES).reduce((a, l) => a + l.bytes, 0);
  const data = [
    ...top.map((l, i) => ({
      key: `l${i}`,
      name: l.name,
      value: l.bytes,
      fill: `var(--color-l${i})`,
    })),
    ...(rest > 0
      ? [{ key: 'other', name: 'Other', value: rest, fill: 'var(--color-other)' }]
      : []),
  ];
  const config: ChartConfig = {
    value: { label: 'Share' },
    ...Object.fromEntries(
      top.map((l, i) => [`l${i}`, { label: l.name, color: `var(--cohort-${i + 1})` }])
    ),
    other: { label: 'Other', color: 'var(--muted-foreground)' },
  };
  const lead = top[0];

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Languages</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer config={config} className='mx-auto aspect-square max-h-60'>
          <PieChart>
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
                          index={data.findIndex((x) => x.key === item.payload.key)}
                          color={item.payload.fill}
                          className='size-3'
                        />
                        {item.payload.name}
                      </span>
                      <span className='font-mono tabular-nums'>
                        {((Number(value) / total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey='value'
              nameKey='key'
              innerRadius={62}
              strokeWidth={4}
              stroke='var(--card)'
            >
              <Label
                content={({ viewBox }) => {
                  if (!lead || !viewBox || !('cx' in viewBox) || !('cy' in viewBox))
                    return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor='middle'
                      dominantBaseline='middle'
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className='fill-foreground font-heading text-3xl font-bold'
                      >
                        {Math.round((lead.bytes / total) * 100)}%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className='fill-muted-foreground text-sm'
                      >
                        {lead.name}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='pt-4'>
        <ul className='grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-sm'>
          {data.map((d, i) => (
            <li key={d.key} className='flex items-center gap-2'>
              <SeriesIcon index={i} color={`var(--color-${d.key})`} />
              <span className='truncate'>{d.name}</span>
              <span
                className='ml-auto font-mono text-xs tabular-nums text-muted-foreground'
              >
                {((d.value / total) * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}
