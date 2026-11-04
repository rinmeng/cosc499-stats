'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Menu } from 'lucide-react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { cohorts, currentYear } from '@/sync.config';

import { ModeToggle } from './ModeToggle';

const links = [
  { href: '/', label: 'Overview', live: false },
  ...cohorts.map((c) => ({
    href: `/${c.year}`,
    label: c.label,
    live: c.year === currentYear,
  })),
];

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href='/' onClick={onClick} className='flex items-center gap-2 font-semibold'>
      <BarChart3 className='size-5 text-chart-1' />
      <span>COSC 499 Capstone Stats</span>
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

  const items = (onClick?: () => void, className?: string) =>
    links.map((l) => (
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
        <div className='hidden items-center gap-1 md:flex'>
          {items()}
          <ModeToggle />
        </div>
        <div className='md:hidden'>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant='outline' size='icon' />}>
              <Menu className='size-5' />
              <span className='sr-only'>Toggle menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-72'>
              <SheetHeader>
                <SheetTitle>
                  <Brand onClick={() => setOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <div className={cn('flex flex-col gap-2 px-4')}>
                {items(() => setOpen(false), 'justify-start')}
                <ModeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
