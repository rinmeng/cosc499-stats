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

const COUNTED: { label: string; detail: string }[] = [
  {
    label: 'Commit',
    detail:
      'When it was authored. This time comes from the author’s own computer, so a rebase can move it.',
  },
  { label: 'Pull request opened', detail: 'When it was opened, for its author.' },
  {
    label: 'Pull request merged',
    detail: 'When it was merged, for whoever merged it.',
  },
  {
    label: 'Review',
    detail: 'When each person first reviewed someone else’s pull request (once per PR).',
  },
  { label: 'Issue opened', detail: 'When it was created, for its author.' },
];

/** "?" button that opens a dialog explaining what the rhythm stats count as activity. */
export function ActivityInfo({ timezone }: { timezone: string }) {
  const zone = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone;
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant='ghost' size='sm' className='text-muted-foreground' />}
      >
        <CircleHelp />
        What counts as activity
      </DialogTrigger>
      <DialogContent className='gap-4 overflow-hidden sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>What counts as activity</DialogTitle>
          <DialogDescription>
            This metric counts when people were working on anything.
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
                {COUNTED.map((r) => (
                  <tr key={r.label}>
                    <td className='py-2 pr-3 align-top'>
                      <div className='font-medium'>{r.label}</div>
                      <div className='text-xs text-muted-foreground'>{r.detail}</div>
                    </td>
                    <td
                      className='py-2 text-right align-top font-mono whitespace-nowrap
                        tabular-nums'
                    >
                      1 action
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className='space-y-1.5 rounded-lg bg-muted p-3 text-xs'>
              <div className='font-medium'>Not counted</div>
              <ul className='list-disc space-y-1 pl-4 text-muted-foreground'>
                <li>
                  Closing an issue. A merged pull request often closes one at the same
                  moment, which would count that moment twice.
                </li>
                <li>Comments, since GitHub’s data here doesn’t include their times.</li>
                <li>Bots and course staff.</li>
              </ul>
            </div>

            <p className='text-xs text-muted-foreground'>
              Every action counts once, whatever its kind: these stats are about when work
              happens, not how much it’s worth (that’s what points are for). Times are in{' '}
              {zone} time, and only activity during the term is included.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
