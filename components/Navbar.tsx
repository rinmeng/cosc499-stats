'use client';

import { Fragment, useState } from 'react';
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
import { PeopleSearch } from './PeopleSearch';

const toLink = (c: (typeof cohorts)[number]) => ({
  href: `/${cohortSlug(c)}`,
  label: c.label,
  live: cohortSlug(c) === currentCohort,
});

type NavLink = ReturnType<typeof toLink>;

// The running cohort already has its own tab, so the dropdowns skip it.
const winter = cohorts
  .filter((c) => c.session !== 'summer' && cohortSlug(c) !== currentCohort)
  .sort((a, b) => b.year - a.year);
const current = cohorts.find((c) => cohortSlug(c) === currentCohort);

/** Tabs: the overview and the cohort that's running now (with the live dot). */
const links: NavLink[] = [
  { href: '/', label: 'Overview', live: false },
  { href: '/about', label: 'About', live: false },
  ...(current ? [toLink(current)] : []),
];
const olderLinks = winter.map(toLink);
const summerLinks = cohorts
  .filter((c) => c.session === 'summer')
  .sort((a, b) => b.year - a.year)
  .map(toLink);

/** Dropdowns after the tabs (desktop) and labelled sections (mobile menu). */
const groups = [
  { key: 'older', label: 'More years', heading: 'Earlier years', links: olderLinks },
  { key: 'summer', label: 'Summer', heading: 'Summer sessions', links: summerLinks },
].filter((g) => g.links.length > 0);

/** Pulsing dot marking the cohort that's still in progress. */
function LiveDot() {
  return (
    <span className='relative ml-1 flex size-2' aria-label='in progress'>
      <span
        className='absolute inline-flex size-full animate-ping rounded-full bg-chart-1
          opacity-60'
      />
      <span className='relative inline-flex size-2 rounded-full bg-chart-1' />
    </span>
  );
}

function NavDropdown({
  label,
  links,
  active,
}: {
  label: string;
  links: NavLink[];
  active: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant={active ? 'secondary' : 'ghost'} size='sm' />}
      >
        {label} <ChevronDown className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {links.map((l) => (
          <DropdownMenuItem key={l.href} render={<Link href={l.href} />}>
            {l.label}
            {l.live && <LiveDot />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href='/' onClick={onClick} className='flex items-center gap-2 font-semibold'>
      <BarChart3 className='size-5 text-chart-1' />
      <span>
        UBCO COSC 499{' '}
        <span className='hidden sm:inline lg:hidden xl:inline'>Capstone Stats</span>
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
        {l.live && <LiveDot />}
      </Button>
    ));

  return (
    <nav className='fixed z-50 w-full border-b bg-background'>
      <div
        className='mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6
          lg:px-8'
      >
        <Brand />
        <div className='flex items-center gap-2 lg:gap-1'>
          <div className='hidden items-center gap-1 lg:flex'>
            {items()}
            {groups.map((g) => (
              <NavDropdown
                key={g.key}
                label={g.label}
                links={g.links}
                active={g.links.some((l) => isActive(l.href))}
              />
            ))}
          </div>
          {/* One instance for every screen size: each copy would add its own ⌘K listener. */}
          <PeopleSearch className='size-9 px-0 lg:h-7 lg:w-auto lg:px-3' />
          <ModeToggle className='size-9 lg:size-8' />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant='outline' size='icon-lg' className='lg:hidden' />}
            >
              <Menu className='size-5' />
              <span className='sr-only'>Toggle menu</span>
            </SheetTrigger>
            <SheetContent side='right' className='w-72 overflow-y-auto'>
              <SheetHeader className='items-center px-12 text-center'>
                <SheetTitle>
                  <Brand onClick={() => setOpen(false)} />
                </SheetTitle>
              </SheetHeader>
              <div className={cn('flex flex-col items-center gap-2 px-4 pb-6')}>
                {items(() => setOpen(false), 'w-full justify-center')}
                {groups.map((g) => (
                  <Fragment key={g.key}>
                    <p
                      className='mt-2 text-center text-xs font-medium
                        text-muted-foreground'
                    >
                      {g.heading}
                    </p>
                    {items(() => setOpen(false), 'w-full justify-center', g.links)}
                  </Fragment>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
