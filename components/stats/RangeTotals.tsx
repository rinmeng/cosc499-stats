'use client';

import { useState } from 'react';
import {
  Calendar,
  GitMerge,
  GitPullRequest,
  MessageSquareCode,
  Users,
} from 'lucide-react';

import { Grid, StatTile } from '@/components/stats/Blocks';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { fmt, fmtCompact } from '@/lib/format';

/** One cohort's totals, enough to add up any range of years on the client. */
export interface RangeCohort {
  /** Start year; a summer session counts toward the year it falls in */
  year: number;
  teams: number;
  contributors: number;
  commits: number;
  prsMerged: number;
  reviews: number;
}

/** Year-long label for a start year: 2023 → "2023–24". */
const yearLabel = (y: number) => `${y}–${String(y + 1).slice(2)}`;

/**
 * The overview's headline tiles, totalled over a chosen range of years.
 * Each year includes its year-long cohort and that year's summer session.
 */
export function RangeTotals({
  cohorts,
  defaultFrom,
}: {
  cohorts: RangeCohort[];
  /** First year selected on load (clamped to the years that have data) */
  defaultFrom: number;
}) {
  const years = [...new Set(cohorts.map((c) => c.year))].sort((a, b) => b - a);
  const newest = years[0];
  const oldest = years.at(-1)!;
  const [from, setFrom] = useState(Math.max(defaultFrom, oldest));
  const [to, setTo] = useState(newest);

  const picked = cohorts.filter((c) => c.year >= from && c.year <= to);
  const sum = (k: keyof Omit<RangeCohort, 'year'>) =>
    picked.reduce((a, c) => a + c[k], 0);

  const select = (
    value: number,
    onChange: (y: number) => void,
    allowed: (y: number) => boolean,
    label: string
  ) => (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className='[&_select]:border-border [&_select]:bg-card [&_select]:font-mono
        [&_select]:font-semibold [&_select]:text-foreground [&_svg]:text-foreground'
    >
      {years.map((y) => (
        <NativeSelectOption key={y} value={y} disabled={!allowed(y)}>
          {yearLabel(y)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );

  const all = from === oldest && to === newest;

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-2'>
        <span className='text-sm font-medium'>Totals from</span>
        {select(from, setFrom, (y) => y <= to, 'First year')}
        <span className='text-sm font-medium'>to</span>
        {select(to, setTo, (y) => y >= from, 'Last year')}
        <Button
          variant='outline'
          size='sm'
          disabled={all}
          onClick={() => {
            setFrom(oldest);
            setTo(newest);
          }}
        >
          All years
        </Button>
        <span className='w-full text-xs text-muted-foreground sm:w-auto'>
          Each year includes its summer session.
        </span>
      </div>
      <Grid className='grid-cols-3 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-5'>
        <StatTile
          compact
          icon={Calendar}
          label='Cohorts'
          value={picked.length}
          unit='sessions'
        />
        <StatTile
          compact
          icon={Users}
          label='Contributors'
          value={fmt(sum('contributors'))}
          unit='people'
          hint={`across ${fmt(sum('teams'))} teams`}
        />
        <StatTile
          compact
          icon={GitPullRequest}
          label='Commits'
          value={fmtCompact(sum('commits'))}
          unit='commits'
        />
        <StatTile
          compact
          icon={GitMerge}
          label='Merged PRs'
          value={fmtCompact(sum('prsMerged'))}
          unit='PRs'
        />
        <StatTile
          compact
          icon={MessageSquareCode}
          label='Code reviews'
          value={fmtCompact(sum('reviews'))}
          unit='reviews'
        />
      </Grid>
    </div>
  );
}
