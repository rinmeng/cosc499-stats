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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Banner } from '@/components/banner-provider';
import { cn } from '@/lib/utils';
import { cohortSlug, cohorts, currentCohort } from '@/sync.config';
import { fadeLeft } from '@/utils/animations';

import { LiveDot } from './LiveDot';
import { ModeToggle } from './ModeToggle';
import { PeopleSearch } from './PeopleSearch';

const toLink = (c: (typeof cohorts)[number]) => ({
  href: `/${cohortSlug(c)}`,
  label: c.label,
  live: cohortSlug(c) === currentCohort,
});

type NavLink = ReturnType<typeof toLink>;

/** Tabs: overview and about. Insights and the year selectors are dropdowns. */
const links: NavLink[] = [
  { href: '/', label: 'Overview', live: false },
  { href: '/about', label: 'About', live: false },
];
const insightLinks: NavLink[] = [
  { href: '/insights/grades', label: 'Grades', live: false },
  { href: '/insights', label: 'AI impact', live: false },
  { href: '/insights/trends', label: 'Trends', live: false },
];
/**
 * Every cohort in one list, newest term first: a summer session (May) sorts just
 * below the year-long cohort that starts that September. Summers read "S2025".
 */
const yearLinks: NavLink[] = [...cohorts]
  .sort(
    (a, b) =>
      b.year - a.year ||
      (a.session === 'summer' ? 1 : 0) - (b.session === 'summer' ? 1 : 0)
  )
  .map((c) => {
    const link = toLink(c);
    if (link.live) return { ...link, label: 'This year' };
    return c.session === 'summer' ? { ...link, label: `S${c.year}` } : link;
  });

/** One dropdown after the tabs (desktop), one folding section (mobile menu). */
const groups = [{ key: 'years', label: 'Years', heading: 'Years', links: yearLinks }];

function NavDropdown({
  label,
  links,
  active,
  live,
  className,
}: {
  label: string;
  links: NavLink[];
  active: boolean;
  live?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={active ? 'secondary' : 'ghost'}
            size='sm'
            className={className}
          />
        }
      >
        {label}
        {live && <LiveDot className='ml-1' />}
        <ChevronDown className='size-3.5' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {links.map((l) => (
          <DropdownMenuItem key={l.href} render={<Link href={l.href} />}>
            {l.label}
            {l.live && <LiveDot className='ml-1' />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      href='/'
      onClick={onClick}
      className={cn('flex items-center gap-2 font-semibold', className)}
    >
      <BarChart3 className='size-5 text-chart-1' />
      <span>UBCO Capstone</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // '/' and '/insights' are parents of other links, so they match only exactly.
  const isActive = (href: string) =>
    href === '/' || href === '/insights'
      ? pathname === href
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
        {l.live && <LiveDot className='ml-1' />}
      </Button>
    ));

  return (
    <nav className='fixed z-50 w-full border-b bg-background'>
      <div className='page-container flex items-center justify-between py-3'>
        <Brand className={fadeLeft(0)} />
        <div className='flex items-center gap-2 lg:gap-1'>
          <div className='hidden items-center gap-1 lg:flex'>
            {/* Brand is step 0; the tabs follow left to right. */}
            {items(
              undefined,
              fadeLeft(1),
              links.filter((l) => l.href === '/')
            )}
            <NavDropdown
              label='Insights'
              links={insightLinks}
              active={pathname === '/insights' || pathname.startsWith('/insights/')}
              className={fadeLeft(2)}
            />
            {items(
              undefined,
              fadeLeft(3),
              links.filter((l) => l.href === '/about')
            )}
            {groups.map((g, i) => {
              const selected = g.links.find((l) => isActive(l.href));
              const shown = selected ?? yearLinks.find((l) => l.live);
              return (
                <NavDropdown
                  key={g.key}
                  label={g.label ?? ''}
                  links={g.links}
                  active={!!selected}
                  live={!!shown?.live}
                  className={fadeLeft(4 + i)}
                />
              );
            })}
          </div>
          {/* One instance for every screen size: each copy would add its own ⌘K listener. */}
          <PeopleSearch
            className={cn(
              'size-9 px-0 lg:h-7 lg:w-auto lg:px-3',
              fadeLeft(4 + groups.length)
            )}
          />
          {/* On mobile the theme toggle lives in the menu sheet instead. */}
          <ModeToggle
            className={cn('hidden size-8 lg:inline-flex', fadeLeft(5 + groups.length))}
          />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant='outline'
                  size='icon-lg'
                  className={cn('lg:hidden', fadeLeft(6 + groups.length))}
                />
              }
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
                <ModeToggle className='mb-2 size-9' />
                {items(
                  () => setOpen(false),
                  'w-full justify-center',
                  links.filter((l) => l.href === '/')
                )}
                <p className='mt-2 text-center text-xs font-medium text-muted-foreground'>
                  Insights
                </p>
                {items(() => setOpen(false), 'w-full justify-center', insightLinks)}
                {items(
                  () => setOpen(false),
                  'w-full justify-center',
                  links.filter((l) => l.href === '/about')
                )}
                {/* Years is a long list, so it folds away; it starts open on a cohort page. */}
                {groups.map((g) => (
                  <Collapsible
                    key={g.key}
                    defaultOpen={g.links.some((l) => isActive(l.href))}
                    className='mt-2 flex w-full flex-col items-center gap-2'
                  >
                    <CollapsibleTrigger
                      className='group/trigger flex w-full items-center justify-center
                        gap-1 rounded-md py-1 text-xs font-medium text-muted-foreground
                        hover:text-foreground'
                    >
                      {g.heading}
                      {g.links.some((l) => l.live) && <LiveDot className='ml-1' />}
                      <ChevronDown
                        className='size-3.5 transition-transform
                          group-data-[panel-open]/trigger:rotate-180'
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className='flex w-full flex-col gap-2'>
                      {items(() => setOpen(false), 'w-full justify-center', g.links)}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <Banner />
    </nav>
  );
}
