'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Starts each newly opened page at the top, like a full page load would.
 *
 * Next's `<Link>` only scrolls far enough to bring the changed segment into view, so a
 * page can open partway down under the shared navbar. This resets to the top on a
 * forward move to a different page, and leaves alone the cases where staying put is
 * what people expect:
 * - Back / Forward: the browser and Next restore the previous position.
 * - `#anchor` links: they jump to their section.
 * - Same-page changes (query params, filters, tabs): the pathname doesn't change.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      fromHistory.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;

    const wasHistory = fromHistory.current;
    fromHistory.current = false;
    if (wasHistory || window.location.hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
