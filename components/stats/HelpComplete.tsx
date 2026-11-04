import { BookOpen, HandHeart, MessageSquarePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { repoUrl, smallCohortTeams } from '@/sync.config';

/** Past cohorts with few visible teams invite former students to fill in the gaps. */
export const isSmallCohort = (c: { isCurrent: boolean; totals: { teams: number } }) =>
  !c.isCurrent && c.totals.teams < smallCohortTeams;

export const contributingUrl = `${repoUrl}/blob/main/CONTRIBUTING.md`;

export function HelpComplete({
  label,
  cohort,
  teams,
  note,
}: {
  label: string;
  cohort: string;
  teams: number;
  note?: string | null;
}) {
  return (
    <Card className='border-chart-3/40 bg-chart-3/5 ring-chart-3/20'>
      <CardContent className='flex flex-col gap-4 md:flex-row md:items-center'>
        <div
          className='flex size-10 shrink-0 items-center justify-center rounded-full
            bg-chart-3/15'
        >
          <HandHeart className='size-5 text-chart-4 dark:text-chart-2' />
        </div>
        <div className='flex-1 space-y-1'>
          <p className='font-heading font-semibold'>Were you in the {label} cohort?</p>
          <p className='text-sm text-muted-foreground'>
            {note ??
              `Only ${teams} team${teams === 1 ? ' is' : 's are'} visible on GitHub right now.`}{' '}
            If you can still see your team’s repo, you can add it in about 15 minutes. Run{' '}
            <code className='rounded bg-muted px-1 py-0.5 font-mono text-xs'>
              pnpm sync:year {cohort}
            </code>{' '}
            and open a pull request. No coding needed.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            nativeButton={false}
            render={<a href={contributingUrl} target='_blank' rel='noreferrer' />}
          >
            <BookOpen /> How to contribute
          </Button>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={`${repoUrl}/issues/new`} target='_blank' rel='noreferrer' />}
          >
            <MessageSquarePlus /> Share info
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact prompt for every other cohort: a team that's missing can be added by
 * anyone who can still see its repo.
 */
export function MissingTeam({
  cohort,
  live = false,
}: {
  cohort: string;
  live?: boolean;
}) {
  return (
    <div
      className='flex flex-col gap-3 rounded-2xl border border-dashed px-5 py-4
        sm:flex-row sm:items-center'
    >
      <HandHeart className='size-5 shrink-0 text-chart-4 dark:text-chart-2' />
      <p className='flex-1 text-sm text-muted-foreground'>
        <span className='font-medium text-foreground'>Don’t see your team?</span>{' '}
        {live ? (
          <>
            Your repo may be private or outside the course org. Open an issue with the
            repo link and we’ll add it.
          </>
        ) : (
          <>
            Help put it on the site: run{' '}
            <code className='rounded bg-muted px-1 py-0.5 font-mono text-xs'>
              pnpm sync:year {cohort}
            </code>{' '}
            and open a pull request with the data. The guide walks you through every step.
          </>
        )}
      </p>
      <Button
        size='sm'
        variant='outline'
        nativeButton={false}
        render={
          <a
            href={live ? `${repoUrl}/issues/new` : contributingUrl}
            target='_blank'
            rel='noreferrer'
          />
        }
      >
        {live ? <MessageSquarePlus /> : <BookOpen />}
        {live ? 'Open an issue' : 'How to contribute'}
      </Button>
    </div>
  );
}
