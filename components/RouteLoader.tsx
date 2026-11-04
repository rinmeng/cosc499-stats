'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';

import LiquidWaveSpinner from '@/components/shadcn-space/spinner/spinner-10';
import { cn } from '@/lib/utils';

/** Phrases shown under the spinner, in a new random order each time it opens. */
const WORDS = [
  'Adding 3k lines in one commit ...',
  'Judging your PR sizes ...',
  'Asking who forgot to review ...',
  'Ignoring that 5,000 line commit ...',
];

/** Only show the overlay if the page takes longer than this, so instant switches don't flash. */
const SHOW_AFTER_MS = 150;
const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Never leave the overlay up if a navigation stalls or gets cancelled. */
const MAX_VISIBLE_MS = 10_000;

/**
 * Full-page loading screen, shown for as long as a page takes to load:
 *  - page load or refresh: rendered in the server HTML and revealed by CSS only if loading takes
 *    longer than SHOW_AFTER_MS (see `.initial-loader` in globals.css); removed once the
 *    page is interactive and its fonts are ready.
 *  - page switches (link clicks, back/forward): shown after SHOW_AFTER_MS, hidden as soon
 *    as the new page is in place.
 */
export function RouteLoader() {
  const pathname = usePathname();
  // 'initial' = full page load or refresh (server-rendered), 'nav' = switching pages.
  const [mode, setMode] = useState<'initial' | 'nav' | null>('initial');
  const visible = mode !== null;
  const setVisible = (on: boolean) => setMode(on ? 'nav' : null);
  const [words, setWords] = useState(WORDS);
  const fromPath = useRef(pathname);
  const pending = useRef(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Page load: remove the server-rendered loader once the page is interactive (this
  // effect runs right after hydration) and the fonts are ready. Not waiting for the
  // window `load` event, which also waits for every avatar image further down the page.
  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setMode((m) => (m === 'initial' ? null : m));
    };
    const safety = setTimeout(done, MAX_VISIBLE_MS);
    (document.fonts?.ready ?? Promise.resolve()).then(done, done);
    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  // Start: internal link clicks to a different page, and browser back/forward.
  useEffect(() => {
    const start = () => {
      fromPath.current = window.location.pathname;
      pending.current = true;
      setWords(shuffle(WORDS));
      if (showTimer.current) clearTimeout(showTimer.current);
      if (maxTimer.current) clearTimeout(maxTimer.current);
      showTimer.current = setTimeout(() => {
        if (pending.current) setVisible(true);
      }, SHOW_AFTER_MS);
      maxTimer.current = setTimeout(() => {
        pending.current = false;
        setVisible(false);
      }, MAX_VISIBLE_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest('a');
      if (!a || !a.href || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page / hash links
      start();
    };

    const onPopState = () => {
      if (window.location.pathname !== fromPath.current) start();
    };

    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      if (showTimer.current) clearTimeout(showTimer.current);
      if (maxTimer.current) clearTimeout(maxTimer.current);
    };
  }, []);

  // Finish: as soon as the new page is in place.
  useEffect(() => {
    if (!pending.current || pathname === fromPath.current) return;
    pending.current = false;
    fromPath.current = pathname;
    if (showTimer.current) clearTimeout(showTimer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    setVisible(false);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={mode === 'initial' ? 'initial-loader' : 'route-loader'}
          role='status'
          aria-live='polite'
          aria-label='Loading page'
          className={cn(
            'fixed inset-0 z-[100] flex items-center justify-center bg-background',
            // CSS-timed reveal for the server-rendered page-load loader
            mode === 'initial' && 'initial-loader'
          )}
          initial={mode === 'initial' ? false : { opacity: 0 }}
          animate={mode === 'initial' ? undefined : { opacity: 1 }}
          exit={mode === 'initial' ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <LiquidWaveSpinner
            size='lg'
            words={words}
            interval={1300}
            className='bg-transparent'
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
