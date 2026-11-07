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

/** "Show more highlights" toggle that reveals extra highlight sections. */
export function MoreHighlights({
  count,
  children,
  className,
}: {
  count: number;
  children: React.ReactNode;
  /** On the button row, e.g. a `fadeUp(...)` class */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className='space-y-4'>
      <div className={cn('flex justify-center', className)}>
        <CollapsibleTrigger render={<Button variant='outline' />}>
          {open ? 'Show fewer highlights' : `Show ${count} more highlights`}
          <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className='space-y-8 pt-2'>{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
