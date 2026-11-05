import { ExternalLink, BookOpen, HandHeart, MessageSquarePlus } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { repoUrl, smallCohortTeams } from '@/sync.config';

/** Past cohorts with few visible teams invite former students to fill in the gaps. */
export const isSmallCohort = (c: { isCurrent: boolean; totals: { teams: number } }) =>
  !c.isCurrent && c.totals.teams < smallCohortTeams;

export const contributingUrl = `${repoUrl}/blob/main/CONTRIBUTING.md`;

/** New-issue link with the title and a body prefilled for this cohort. */
export const issueUrl = (label?: string) => {
  const params = new URLSearchParams({
    template: 'cohort-info.yml',
    title: `Cohort info: ${label ?? ''}`.trim(),
    cohort: label ?? '',
  });
  return `${repoUrl}/issues/new?${params}`;
};

export function HelpComplete({
  label,
  cohort,
  teams,
  note,
  contributors = [],
}: {
  label: string;
  cohort: string;
  teams: number;
  note?: string | null;
  /** GitHub logins of people who already added data for this cohort */
  contributors?: string[];
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
          {contributors.length > 0 && (
            <p
              className='flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-sm
                text-muted-foreground'
            >
              {contributors.length === 1 ? 'Recent contributor:' : 'Recent contributors:'}
              {contributors.map((login) => (
                <a
                  key={login}
                  href={`https://github.com/${login}`}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 font-medium text-foreground
                    underline-offset-2 hover:underline'
                >
                  <Avatar className='size-5'>
                    <AvatarImage src={`https://github.com/${login}.png?size=40`} alt='' />
                    <AvatarFallback className='text-[10px]'>
                      {login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  @{login}
                  <ExternalLink className='size-3.5' />
                </a>
              ))}
            </p>
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            nativeButton={false}
            render={<a href={contributingUrl} target='_blank' rel='noreferrer' />}
          >
            <BookOpen /> How to contribute <ExternalLink />
          </Button>
          <Button
            variant='outline'
            nativeButton={false}
            render={<a href={issueUrl(label)} target='_blank' rel='noreferrer' />}
          >
            <MessageSquarePlus /> Share a link <ExternalLink />
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
  label,
  live = false,
}: {
  cohort: string;
  label?: string;
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
            Your repo may be private or outside the course org. Open an issue with a link
            to it (even just the link helps) and we’ll add it.
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
            href={live ? issueUrl(label) : contributingUrl}
            target='_blank'
            rel='noreferrer'
          />
        }
      >
        {live ? <MessageSquarePlus /> : <BookOpen />}
        {live ? 'Open an issue' : 'How to contribute'}
        <ExternalLink />
      </Button>
    </div>
  );
}
