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

/** A centred "Show more …" button that reveals `children` below it. */
export function ShowMore({
  more,
  less,
  children,
}: {
  /** Button text while collapsed, e.g. "Show 9 more years" */
  more: string;
  /** Button text while open, e.g. "Show fewer years" */
  less: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className='space-y-4'>
      <CollapsibleContent>{children}</CollapsibleContent>
      <div className='flex justify-center'>
        <CollapsibleTrigger render={<Button variant='outline' />}>
          {open ? less : more}
          <ChevronDown className={cn('transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>
    </Collapsible>
  );
}
