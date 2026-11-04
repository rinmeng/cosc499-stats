'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ChevronDown, Menu } from 'lucide-react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { cohortSlug, cohorts, currentCohort } from '@/sync.config';

import { ModeToggle } from './ModeToggle';

const toLink = (c: (typeof cohorts)[number]) => ({
  href: `/${cohortSlug(c)}`,
  label: c.label,
  live: cohortSlug(c) === currentCohort,
});

// Year-long cohorts get their own tab; summer sessions live in a dropdown.
const links = [
  { href: '/', label: 'Overview', live: false },
  ...cohorts.filter((c) => c.session !== 'summer').map(toLink),
];
const summerLinks = cohorts
  .filter((c) => c.session === 'summer')
  .sort((a, b) => b.year - a.year)
  .map(toLink);

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href='/' onClick={onClick} className='flex items-center gap-2 font-semibold'>
      <BarChart3 className='size-5 text-chart-1' />
      <span>
        UBCO COSC 499 <span className='hidden sm:inline'>Capstone Stats</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  const items = (onClick?: () => void, className?: string, list = links) =>
    list.map((l) => (
      <Button
        key={l.href}
        variant={isActive(l.href) ? 'secondary' : 'ghost'}
        size='sm'
        className={className}
        nativeButton={false}
        render={<Link href={l.href} onClick={onClick} />}
      >
        {l.label}
        {l.live && (
          <span className='relative ml-1 flex size-2'>
            <span
              className='absolute inline-flex size-full animate-ping rounded-full
                bg-chart-1 opacity-60'
            />
            <span className='relative inline-flex size-2 rounded-full bg-chart-1' />
          </span>
        )}
      </Button>
    ));

  return (
    <nav className='fixed z-50 w-full border-b bg-background/90 backdrop-blur'>
      <div
        className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6
          lg:px-8'
      >
        <Brand />
        <div className='hidden items-center gap-1 lg:flex'>
          {items()}
          {summerLinks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={
                      summerLinks.some((l) => isActive(l.href)) ? 'secondary' : 'ghost'
                    }
                    size='sm'
                  />
                }
              >
                Summer <ChevronDown className='size-3.5' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {summerLinks.map((l) => (
                  <DropdownMenuItem key={l.href} render={<Link href={l.href} />}>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <ModeToggle />
        </div>
        <div className='lg:hidden'>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant='outline' size='icon' />}>
              <Menu className='size-5' />
              <span className='sr-only'>Toggle menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-72'>
              <SheetHeader className='items-center px-12 text-center'>
                <SheetTitle>
                  <Brand onClick={() => setOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <div className={cn('flex flex-col items-center gap-2 px-4')}>
                {items(() => setOpen(false), 'w-full justify-center')}
                {summerLinks.length > 0 && (
                  <>
                    <p
                      className='mt-2 text-center text-xs font-medium
                        text-muted-foreground'
                    >
                      Summer sessions
                    </p>
                    {items(() => setOpen(false), 'w-full justify-center', summerLinks)}
                  </>
                )}
                <ModeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
