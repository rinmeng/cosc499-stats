'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, Lock } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface TeamRow {
  team: number;
  name: string;
  href: string;
  isPrivate: boolean;
  contributors: number;
  commits: number;
  prsMerged: number;
  reviews: number;
  issuesOpened: number;
  reviewCoverage: number;
  collaboration: number;
  openPrs?: number;
  openIssues?: number;
}

type SortKey = Exclude<keyof TeamRow, 'name' | 'href' | 'isPrivate'>;

const COLUMNS: {
  key: SortKey;
  label: string;
  fmt?: (n: number) => string;
  live?: boolean;
}[] = [
  { key: 'contributors', label: 'People' },
  { key: 'commits', label: 'Commits' },
  { key: 'prsMerged', label: 'Merged PRs' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'issuesOpened', label: 'Issues' },
  { key: 'reviewCoverage', label: 'Reviewed PRs', fmt: (n) => `${Math.round(n * 100)}%` },
  { key: 'collaboration', label: 'Collaboration', fmt: (n) => `${Math.round(n * 100)}` },
  { key: 'openPrs', label: 'Open PRs', live: true },
  { key: 'openIssues', label: 'Open issues', live: true },
];

/**
 * Every team at a glance. Ordered by team number by default; clicking a column
 * highlights the strongest teams on that measure (descending only).
 */
export function TeamTable({ rows, live = false }: { rows: TeamRow[]; live?: boolean }) {
  const [sort, setSort] = useState<SortKey>('team');
  const cols = COLUMNS.filter((c) => live || !c.live);
  const sorted = [...rows].sort((a, b) =>
    sort === 'team' ? a.team - b.team : (b[sort] ?? 0) - (a[sort] ?? 0)
  );

  const head = (key: SortKey, label: string, align = 'text-right') => (
    <TableHead key={key} className={align}>
      <button
        type='button'
        onClick={() => setSort(key)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          sort === key && 'text-foreground'
        )}
        aria-pressed={sort === key}
      >
        {label}
        {sort === key && key !== 'team' && <ArrowDown className='size-3' />}
      </button>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {head('team', 'Team', 'text-left')}
          {cols.map((c) => head(c.key, c.label))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => (
          <TableRow key={r.team}>
            <TableCell className='font-medium'>
              <Link
                href={r.href}
                className='inline-flex items-center gap-1.5 hover:underline'
              >
                {r.name}
                {r.isPrivate && (
                  <Lock
                    className='size-3 text-muted-foreground'
                    aria-label='private repo'
                  />
                )}
              </Link>
            </TableCell>
            {cols.map((c) => (
              <TableCell
                key={c.key}
                className={cn(
                  'text-right font-mono tabular-nums',
                  sort === c.key && 'font-semibold'
                )}
              >
                {c.fmt ? c.fmt(r[c.key] ?? 0) : (r[c.key] ?? 0).toLocaleString()}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
