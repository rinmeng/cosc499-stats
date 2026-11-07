'use client';

import { CircleHelp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TeamworkBonus } from '@/lib/types';

const ROWS: { key: string; label: string; detail: string }[] = [
  {
    key: 'commits',
    label: 'Commit',
    detail:
      'Each commit you authored during the term, counted once even if it’s in several branches.',
  },
  {
    key: 'prsMerged',
    label: 'Merged PR',
    detail: 'Each pull request you opened that was merged.',
  },
  {
    key: 'reviews',
    label: 'Review',
    detail: 'Each pull request you reviewed for someone else (once per PR).',
  },
  {
    key: 'issuesOpened',
    label: 'Issue opened',
    detail: 'Each issue you created.',
  },
  {
    key: 'issuesClosed',
    label: 'Issue closed',
    detail: 'Each closed issue you were assigned to.',
  },
];

/**
 * "?" button that opens a dialog explaining how the Overall score is calculated.
 * Pass `bonus` where team totals are shown, to explain the teamwork bonus too.
 */
export function ScoreInfo({
  weights,
  bonus,
}: {
  weights: Record<string, number>;
  bonus?: TeamworkBonus;
}) {
  const example = {
    commits: 40,
    prsMerged: 10,
    reviews: 8,
    issuesOpened: 5,
    issuesClosed: 6,
  };
  const parts = ROWS.map((r) => ({
    ...r,
    n: example[r.key as keyof typeof example],
    w: weights[r.key] ?? 0,
  }));
  const total = parts.reduce((a, p) => a + p.n * p.w, 0);

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant='ghost' size='sm' className='text-muted-foreground' />}
      >
        <CircleHelp />
        How points are calculated
      </DialogTrigger>
      <DialogContent className='gap-4 overflow-hidden sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>How points are calculated</DialogTitle>
          <DialogDescription>
            The Overall score adds up each person’s GitHub activity, with weights so that
            shipping and reviewing work counts for more than a single commit. A team’s
            score is the sum of its members’ scores.
          </DialogDescription>
        </DialogHeader>

        {/* Title and description stay put; only this part scrolls. The viewport needs
            the same max-height as the root, or it grows past the dialog. */}
        <ScrollArea
          className='-mx-6 max-h-[min(55vh,28rem)]
            [&>[data-slot=scroll-area-viewport]]:max-h-[inherit]'
        >
          <div className='space-y-4 px-6 pb-1'>
            <table className='w-full text-sm'>
              <tbody className='divide-y'>
                {parts.map((p) => (
                  <tr key={p.key}>
                    <td className='py-2 pr-3 align-top'>
                      <div className='font-medium'>{p.label}</div>
                      <div className='text-xs text-muted-foreground'>{p.detail}</div>
                    </td>
                    <td
                      className='py-2 text-right align-top font-mono whitespace-nowrap
                        tabular-nums'
                    >
                      {p.w} {p.w === 1 ? 'pt' : 'pts'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='space-y-1.5 rounded-lg bg-muted p-3 text-xs'>
              <div className='font-medium'>Example</div>
              <div className='font-mono leading-relaxed text-muted-foreground'>
                {parts.map((p, i) => (
                  <span key={p.key}>
                    {i > 0 && ' + '}
                    {p.n}×{p.w}
                  </span>
                ))}{' '}
                = <span className='font-semibold text-foreground'>{total} pts</span>
              </div>
            </div>

            {bonus && (
              <div className='space-y-1 text-sm'>
                <div className='font-medium'>Teamwork bonus</div>
                <p className='text-muted-foreground'>
                  Teams of {bonus.minContributors} or more get up to{' '}
                  {Math.round(bonus.rate * 100)}% extra for sharing the work evenly. A
                  perfectly even team gets the full {Math.round(bonus.rate * 100)}%, and
                  the bonus shrinks as fewer people carry more of the points. It’s scaled
                  for team size, so small teams don’t get a head start. Individual scores
                  never include it.
                </p>
              </div>
            )}

            <p className='text-xs text-muted-foreground'>
              Lines of code aren’t part of the score, since they say more about generated
              files than effort. Bots and course staff aren’t counted. Only activity
              during the term is included.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
