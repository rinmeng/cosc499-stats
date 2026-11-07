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

/** Same formula as scripts/aggregate.ts: 1 − Gini of points per member. */
function collaboration(values: number[]): number {
  const xs = [...values].sort((a, b) => a - b);
  const n = xs.length;
  const sum = xs.reduce((a, b) => a + b, 0);
  if (n < 2 || sum === 0) return 1;
  const acc = xs.reduce((a, x, i) => a + (2 * (i + 1) - n - 1) * x, 0);
  return 1 - acc / (n * sum);
}

const EXAMPLES = [
  [25, 25, 25, 25],
  [40, 30, 20, 10],
  [70, 10, 10, 10],
];

/** "?" button that opens a dialog explaining how the Collaboration score is calculated. */
export function CollaborationInfo() {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant='ghost' size='sm' className='text-muted-foreground' />}
      >
        <CircleHelp />
        How collaboration is calculated
      </DialogTrigger>
      <DialogContent className='gap-4 overflow-hidden sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>How collaboration is calculated</DialogTitle>
          <DialogDescription>
            Collaboration shows how evenly a team’s points are spread across its members,
            from 0 to 100. A team scores 100 when everyone earned the same number of
            points.
          </DialogDescription>
        </DialogHeader>

        {/* Title and description stay put; only this part scrolls. The viewport needs
            the same max-height as the root, or it grows past the dialog. */}
        <ScrollArea
          className='-mx-6 max-h-[min(55vh,28rem)]
            [&>[data-slot=scroll-area-viewport]]:max-h-[inherit]'
        >
          <div className='space-y-4 px-6 pb-1'>
            <p className='text-sm'>
              It’s based on the <span className='font-medium'>Gini coefficient</span>, a
              standard measure of how evenly something is shared. Collaboration is{' '}
              <span className='font-mono text-xs'>100 × (1 − Gini)</span> of each member’s
              points, so reviews, merged PRs and issues count as well as commits. It also
              sets the teamwork bonus added to a team’s Overall points.
            </p>

            <div className='space-y-1.5 rounded-lg bg-muted p-3 text-xs'>
              <div className='font-medium'>Examples, a team of four</div>
              <table className='w-full font-mono text-muted-foreground tabular-nums'>
                <tbody>
                  {EXAMPLES.map((e) => (
                    <tr key={e.join()}>
                      <td className='py-0.5'>{e.join(' / ')} pts</td>
                      <td className='py-0.5 text-right font-semibold text-foreground'>
                        {Math.round(collaboration(e) * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className='text-xs text-muted-foreground'>
              The this-week cards use only points earned since last Sunday. Everyone with
              points on the team is included. Bots and course staff aren’t counted, and
              only activity during the term is included.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
