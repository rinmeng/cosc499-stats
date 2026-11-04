'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** "Show more highlights" toggle that reveals a second grid of highlight cards. */
export function MoreHighlights({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className='space-y-4'>
      <div className='flex justify-center'>
        <CollapsibleTrigger render={<Button variant='outline' />}>
          {open ? 'Show fewer highlights' : `Show ${count} more highlights`}
          <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
