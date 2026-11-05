'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Site-wide announcement banner. Like the theme (next-themes), the "seen it" flag lives in
 * localStorage, so it survives reloads without a server round trip. Bump BANNER_ID for a
 * new announcement and everyone sees it again.
 */
const BANNER_ID = 'insights-launch';
const STORAGE_KEY = `banner-dismissed:${BANNER_ID}`;

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

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function write() {
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
  const pathname = usePathname();
  const onInsights = pathname === '/insights' || pathname.startsWith('/insights/');
  // The server snapshot is "dismissed" so the banner never flashes before storage is read.
  const stored = React.useSyncExternalStore(subscribe, read, () => true);
  const dismissed = onInsights || stored;

  // Landing on insights counts as seeing the announcement.
  React.useEffect(() => {
    if (onInsights) write();
  }, [onInsights]);

  const dismiss = React.useCallback(() => write(), []);

  return (
    <BannerContext.Provider value={{ dismissed, dismiss }}>
      {children}
    </BannerContext.Provider>
  );
}

/** Banner strip height; BannerSpacer uses the same so the page starts below it. */
const STRIP = 'h-10';

/**
 * The announcement, as a strip inside the fixed navbar so it stays put while scrolling.
 * Renders nothing once dismissed or on the insights pages.
 */
export function Banner() {
  const { dismissed, dismiss } = useBanner();
  if (dismissed) return null;
  return (
    <div className={`${STRIP} border-t bg-muted/60 text-sm`}>
      <div className='page-container flex h-full items-center gap-3'>
        <Sparkles className='size-4 shrink-0 text-muted-foreground' />
        <p className='min-w-0 flex-1 truncate'>
          <span className='hidden sm:inline'>
            We just launched <span className='font-bold'>Insights</span>: how AI changed
            the way capstone teams code.{' '}
          </span>
          <span className='sm:hidden'>Insights just launched. </span>
          <Link
            href='/insights'
            onClick={dismiss}
            className='inline-flex items-center gap-1 font-medium underline-offset-4
              hover:underline'
          >
            Check it out
            <ArrowRight className='size-3.5' />
          </Link>
        </p>
        <Button
          variant='ghost'
          size='icon'
          className='size-7 shrink-0 text-muted-foreground'
          onClick={dismiss}
          aria-label='Dismiss'
        >
          <X />
        </Button>
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
