'use client';

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface RadarMember {
  id: string;
  name: string;
  login: string | null;
  avatarUrl: string | null;
  values: { axis: string; raw: number; share: number }[];
}

const config = {
  share: { label: 'Share of team best', color: 'var(--series)' },
} satisfies ChartConfig;

/**
 * One radar (with dots) per highlighted contributor, each axis scaled to the
 * team's best on that axis, so the shape shows where each person shines.
 */
export function MemberRadars({ members }: { members: RadarMember[] }) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {members.map((m) => (
        <Card key={m.id} size='sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Avatar className='size-7'>
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt='' />}
                <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className='truncate'>{m.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='pb-0'>
            <ChartContainer
              config={config}
              className='mx-auto aspect-[4/3] w-full max-h-64'
            >
              <RadarChart
                data={m.values}
                outerRadius='72%'
                margin={{ top: 8, right: 36, bottom: 8, left: 36 }}
              >
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(_, __, item) => (
                        <span className='font-mono tabular-nums'>
                          {item.payload.axis}: {Number(item.payload.raw).toLocaleString()}
                        </span>
                      )}
                    />
                  }
                />
                <PolarAngleAxis dataKey='axis' tick={{ fontSize: 11 }} />
                <PolarGrid />
                <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                <Radar
                  dataKey='share'
                  fill='var(--color-share)'
                  fillOpacity={0.6}
                  dot={{ r: 4, fillOpacity: 1 }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
