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

/** Copy for one chart's "Why might this be?" dialog. */
export interface Why {
  /** What the chart measures, as one short “This metric …” sentence. */
  measures: string;
  /** Possible explanations for the pattern. Hedged: none of these are proven. */
  reasons: { title: string; detail: string }[];
  /** How the number is calculated, and what is left out. */
  method?: string;
}

export interface WhyRow {
  label: string;
  value: string;
  note?: string;
}

/**
 * "?" button that opens a dialog explaining why a chart may look the way it does.
 * Same pattern as ScoreInfo (How points are calculated).
 */
export function WhyDialog({
  title,
  why,
  sample,
  rows,
  rowsTitle = 'Each cohort',
}: {
  title: string;
  why: Why;
  /** e.g. "35 teams in 6 cohorts" */
  sample?: string;
  /** Per-cohort values behind the chart, so nothing is hidden by the medians. */
  rows?: WhyRow[];
  rowsTitle?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant='ghost'
            size='sm'
            className='-ml-2 h-7 px-2 text-muted-foreground'
          />
        }
      >
        <CircleHelp />
        Why might this be?
      </DialogTrigger>
      <DialogContent className='gap-4 overflow-hidden sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{why.measures}</DialogDescription>
        </DialogHeader>

        {/* Title and subtitle stay put; only this part scrolls. The viewport needs the
            same max-height as the root, or it grows past the dialog. */}
        <ScrollArea
          className='-mx-6 max-h-[min(55vh,28rem)]
            [&>[data-slot=scroll-area-viewport]]:max-h-[inherit]'
        >
          <div className='space-y-4 px-6 pb-1'>
            <div className='space-y-2'>
              <div className='text-sm font-medium'>Possible reasons</div>
              <ul className='divide-y text-sm'>
                {why.reasons.map((r) => (
                  <li key={r.title} className='py-2'>
                    <div className='font-medium'>{r.title}</div>
                    <div className='text-xs text-muted-foreground'>{r.detail}</div>
                  </li>
                ))}
              </ul>
            </div>

            {rows && rows.length > 0 && (
              <div className='space-y-1.5 rounded-lg bg-muted p-3 text-xs'>
                <div className='font-medium'>{rowsTitle}</div>
                <table className='w-full'>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.label}>
                        <td className='py-0.5 pr-3 text-muted-foreground'>
                          {row.label}
                          {row.note && <span className='opacity-70'> · {row.note}</span>}
                        </td>
                        <td className='py-0.5 text-right font-mono tabular-nums'>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className='text-xs text-muted-foreground'>
              {why.method && <>{why.method} </>}
              {sample && <>Based on {sample}. </>}
              These are possible explanations, not proven causes: courses, team sizes and
              projects changed between years too.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
