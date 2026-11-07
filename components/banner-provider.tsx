'use client';

import * as React from 'react';
import {
  CalendarDays,
  ChevronDown,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Trophy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * Site-wide announcement banner. Like the theme (next-themes), the "seen it" flag lives in
 * localStorage, so it survives reloads without a server round trip. Bump BANNER_ID for a
 * new announcement and everyone sees it again.
 */
const BANNER_ID = 'weekly-update';
const KEY_PREFIX = 'banner-dismissed:';
const STORAGE_KEY = `${KEY_PREFIX}${BANNER_ID}`;

/** Drop "seen it" flags left by earlier announcements (e.g. insights-launch). */
function clearOldFlags() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(KEY_PREFIX) && k !== STORAGE_KEY)
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Blocked storage: nothing to clean up.
  }
}

interface BannerContextValue {
  dismissed: boolean;
  dismiss: () => void;
}

const BannerContext = React.createContext<BannerContextValue>({
  dismissed: true,
  dismiss: () => {},
});

export const useBanner = () => React.useContext(BannerContext);

const listeners = new Set<() => void>();

/**
 * On `pnpm dev` the banner always comes back on reload: dismissing only hides it until
 * the next page load, and nothing is written to localStorage.
 */
const DEV = process.env.NODE_ENV === 'development';
let devDismissed = false;

function read(): boolean {
  if (DEV) return devDismissed;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function write() {
  if (DEV) devDismissed = true;
  else
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Private mode or blocked storage: the banner just comes back next visit.
    }
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener('storage', fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', fn);
  };
}

export function BannerProvider({ children }: { children: React.ReactNode }) {
  // The server snapshot is "dismissed" so the banner never flashes before storage is read.
  const dismissed = React.useSyncExternalStore(subscribe, read, () => true);
  const dismiss = React.useCallback(() => write(), []);

  React.useEffect(clearOldFlags, []);

  return (
    <BannerContext.Provider value={{ dismissed, dismiss }}>
      {children}
    </BannerContext.Provider>
  );
}

/** Banner strip height; BannerSpacer uses the same so the page starts below it. */
const STRIP = 'h-10';

/** What changed in this version, listed in the banner's "What's new" popover. */
const CHANGES = [
  {
    icon: GraduationCap,
    title: 'Final grades and instructors',
    body: 'Each cohort page shows who taught the class, how many students took it and how the class finished, from UBC’s public grade reports.',
  },
  {
    icon: CalendarDays,
    title: 'Weekly highlights first',
    body: 'The current cohort’s page leads with this week’s standouts. The term-long highlights are still a click away under “Show more”.',
  },
  {
    icon: Trophy,
    title: 'Team output podium',
    body: 'Team output now opens on a podium of the top half of the cohort’s teams. “All teams” shows the full chart.',
  },
  {
    icon: TrendingUp,
    title: 'How each team is tracking',
    body: 'Every team page charts the team’s points by week, next to the cohort’s average team and the other teams.',
  },
];

/**
 * The announcement, as a strip inside the fixed navbar so it stays put while scrolling.
 * Renders nothing once dismissed ("Don't show this again" in the popover).
 */
export function Banner() {
  const { dismissed, dismiss } = useBanner();
  const [open, setOpen] = React.useState(false);
  if (dismissed) return null;
  return (
    <div className={`${STRIP} border-t bg-muted/60 text-sm`}>
      <div className='page-container flex h-full items-center gap-3'>
        <Sparkles className='size-4 shrink-0 text-muted-foreground' />
        <p className='min-w-0 flex-1 truncate'>
          <span className='hidden sm:inline'>
            <span className='font-bold'>New:</span> final grades for each class, weekly
            highlights, a team podium and team tracking by points.{' '}
          </span>
          <span className='sm:hidden'>
            <span className='font-bold'>New</span> on the dashboard.{' '}
          </span>
        </p>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant='ghost' size='sm' className='h-7 shrink-0 gap-1 px-2'>
                What’s new
                <ChevronDown className='size-3.5' />
              </Button>
            }
          />
          <PopoverContent align='end' className='w-80'>
            <PopoverHeader>
              <PopoverTitle>What’s new</PopoverTitle>
            </PopoverHeader>
            <ul className='space-y-3'>
              {CHANGES.map((c) => (
                <li key={c.title} className='flex gap-3'>
                  <c.icon className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  <div className='space-y-0.5'>
                    <p className='font-medium'>{c.title}</p>
                    <p className='text-muted-foreground'>{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className='flex justify-end gap-2'>
              {/* Hides the banner for good; "Got it" just closes this and keeps it. */}
              <Button size='sm' variant='ghost' onClick={dismiss}>
                Don’t show this again
              </Button>
              <Button size='sm' onClick={() => setOpen(false)}>
                Got it
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

/** Pushes the page down by the strip's height while the banner is showing. */
export function BannerSpacer() {
  const { dismissed } = useBanner();
  if (dismissed) return null;
  return <div className={STRIP} aria-hidden />;
}
