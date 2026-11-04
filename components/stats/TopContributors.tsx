'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { MetricKey } from '@/lib/types/stats';

export interface TopEntryView {
  id: string;
  name: string;
  login: string | null;
  avatarUrl: string | null;
  value: number;
}

export interface TeamTopView {
  key: string;
  name: string;
  href: string;
  top: Record<MetricKey, TopEntryView[]>;
}

export const METRIC_OPTIONS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'score', label: 'Overall', unit: 'pts' },
  { key: 'commits', label: 'Commits', unit: 'commits' },
  { key: 'prsMerged', label: 'Merged PRs', unit: 'PRs' },
  { key: 'reviews', label: 'Reviews', unit: 'reviews' },
  { key: 'issues', label: 'Issues', unit: 'issues' },
  { key: 'lines', label: 'Lines', unit: 'lines' },
];

export function MetricToggle({
  value,
  onChange,
}: {
  value: MetricKey;
  onChange: (m: MetricKey) => void;
}) {
  return (
    <ToggleGroup
      variant='outline'
      size='sm'
      spacing={0}
      value={[value]}
      onValueChange={(v) => v[0] && onChange(v[0] as MetricKey)}
      className='flex-wrap'
    >
      {METRIC_OPTIONS.map((m) => (
        <ToggleGroupItem key={m.key} value={m.key}>
          {m.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function TopList({ entries, unit }: { entries: TopEntryView[]; unit: string }) {
  const best = entries[0]?.value || 1;
  if (!entries.length)
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>No activity yet</p>
    );
  return (
    <ol className='space-y-2.5'>
      {entries.map((e, i) => (
        <li key={e.id} className='flex items-center gap-3'>
          <span className='w-4 text-right font-mono text-xs text-muted-foreground'>
            {i + 1}
          </span>
          <Avatar className='size-7'>
            {e.avatarUrl && <AvatarImage src={e.avatarUrl} alt='' />}
            <AvatarFallback className='text-[10px]'>
              {e.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <div className='flex items-baseline justify-between gap-2'>
              {e.login ? (
                <a
                  href={`https://github.com/${e.login}`}
                  target='_blank'
                  rel='noreferrer'
                  className='truncate text-sm font-medium hover:underline'
                  title={e.login}
                >
                  {e.name}
                </a>
              ) : (
                <span className='truncate text-sm font-medium'>{e.name}</span>
              )}
              <span
                className='shrink-0 font-mono text-xs tabular-nums text-muted-foreground'
              >
                {e.value.toLocaleString()} {unit}
              </span>
            </div>
            <div className='mt-1 h-1 bg-muted'>
              <div
                className='h-full rounded-r-[4px] bg-chart-1'
                style={{ width: `${Math.max(4, (e.value / best) * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Grid of team cards, each listing that team's top contributors for the chosen metric. */
export function TopContributors({
  teams,
  single = false,
}: {
  teams: TeamTopView[];
  single?: boolean;
}) {
  const [metric, setMetric] = useState<MetricKey>('score');
  const unit = METRIC_OPTIONS.find((m) => m.key === metric)!.unit;

  if (single)
    return (
      <div className='space-y-4'>
        <MetricToggle value={metric} onChange={setMetric} />
        <TopList entries={teams[0]?.top[metric] ?? []} unit={unit} />
      </div>
    );

  return (
    <div className='space-y-4'>
      <MetricToggle value={metric} onChange={setMetric} />
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {teams.map((t) => (
          <Card key={t.key} size='sm'>
            <CardHeader>
              <CardTitle>
                <Link href={t.href} className='hover:underline'>
                  {t.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopList entries={t.top[metric]} unit={unit} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
