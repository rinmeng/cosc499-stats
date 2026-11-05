'use client';

import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Inline "Some cohorts" trigger for the small-cohort note. Opens a dialog listing the
 * cohorts drawn faded and how many teams each has, so the note itself stays one line.
 */
export function SmallCohortsDialog({
  cohorts,
}: {
  cohorts: { slug: string; label: string; nTeams: number }[];
}) {
  const one = cohorts.length === 1;
  return (
    <Dialog>
      <DialogTrigger
        className='font-medium text-foreground underline decoration-dotted
          underline-offset-4 hover:decoration-solid'
      >
        {one ? 'One cohort' : 'Some cohorts'}
      </DialogTrigger>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Cohorts drawn faded</DialogTitle>
          <DialogDescription>
            Fewer than three teams, so {one ? 'it is' : 'they are'} left out of every era
            median.
          </DialogDescription>
        </DialogHeader>
        <ul className='divide-y text-sm'>
          {cohorts.map((c) => (
            <li key={c.slug} className='flex items-center justify-between py-2'>
              <Link href={`/${c.slug}`} className='font-medium hover:underline'>
                {c.label}
              </Link>
              <span className='text-muted-foreground tabular-nums'>
                {c.nTeams} {c.nTeams === 1 ? 'team' : 'teams'}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
