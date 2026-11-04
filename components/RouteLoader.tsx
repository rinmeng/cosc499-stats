'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';

import LiquidWaveSpinner from '@/components/shadcn-space/spinner/spinner-10';

/** Phrases shown under the spinner, in a new random order each time it opens. */
const WORDS = [
  'Adding 3k lines in one commit ...',
  'Judging your PR sizes ...',
  'Asking who forgot to review ...',
  'Ignoring that 5,000 line commit ...',
];

/**
 * Long enough for the first (random) phrase to animate in fully (its characters stagger in at
 * 15 ms each plus a 200 ms fade, about 0.7 s) and be read before the next one starts.
 */
const MIN_VISIBLE_MS = 1800;
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
 * Full-page loading screen shown only while switching pages (link clicks and
 * back/forward). It never shows on the first page load.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [words, setWords] = useState(WORDS);
  const startedAt = useRef(0);
  const fromPath = useRef(pathname);

  // Start: internal link clicks to a different page, and browser back/forward.
  useEffect(() => {
    const start = () => {
      startedAt.current = Date.now();
      fromPath.current = window.location.pathname;
      setWords(shuffle(WORDS));
      setVisible(true);
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
    };
  }, []);

  // Finish: once the new page is in place, but not before the minimum time.
  useEffect(() => {
    if (!visible) return;
    const arrived = pathname !== fromPath.current;
    const elapsed = Date.now() - startedAt.current;
    const wait = arrived
      ? Math.max(0, MIN_VISIBLE_MS - elapsed)
      : Math.max(0, MAX_VISIBLE_MS - elapsed);
    const t = setTimeout(() => {
      fromPath.current = pathname;
      setVisible(false);
    }, wait);
    return () => clearTimeout(t);
  }, [pathname, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='route-loader'
          role='status'
          aria-live='polite'
          aria-label='Loading page'
          className='fixed inset-0 z-[100] flex items-center justify-center bg-background'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
