'use client';

import { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GradeSession } from '@/lib/types';

import { GradeDistribution } from './GradeDistribution';

/**
 * One session's grade spread at a time, picked from a select. A `#<slug>` hash (the
 * cohort page's "Grades report" link) opens that session.
 */
export function GradeExplorer({ sessions }: { sessions: GradeSession[] }) {
  const [slug, setSlug] = useState(sessions[0]?.slug ?? '');

  useEffect(() => {
    const pick = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!sessions.some((x) => x.slug === hash)) return;
      setSlug(hash);
      // The hash names a session, not an element, so scroll to the card ourselves.
      document.getElementById('sessions')?.scrollIntoView({ block: 'start' });
    };
    pick();
    window.addEventListener('hashchange', pick);
    return () => window.removeEventListener('hashchange', pick);
  }, [sessions]);

  const active = sessions.find((x) => x.slug === slug) ?? sessions[0];
  if (!active) return null;
  const items = sessions.map((x) => ({ value: x.slug, label: x.label }));

  return (
    <div id='sessions' className='scroll-mt-24'>
      <GradeDistribution
        grades={active.grades}
        color={active.color}
        title={`${active.label} final grades`}
        action={
          <Select
            value={active.slug}
            onValueChange={(v) => {
              if (!v) return;
              setSlug(v);
              history.replaceState(null, '', `#${v}`);
            }}
            items={items}
          >
            <SelectTrigger className='w-36' aria-label='Session'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((x) => (
                <SelectItem key={x.value} value={x.value}>
                  {x.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
