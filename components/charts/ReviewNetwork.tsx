'use client';

import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { ReviewEdge } from '@/lib/types';

export interface NetworkMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const SIZE = 400;
const CENTER = SIZE / 2;
/** Ring the members sit on, and the gap kept clear around each avatar. */
const RING = 140;
const NODE = 30;
const TOP_PAIRS = 5;

const first = (name: string) => name.split(/\s+/)[0];
const plural = (n: number) => `${n.toLocaleString()} ${n === 1 ? 'PR' : 'PRs'}`;

/**
 * Who reviewed whose pull requests, as a network: members sit on a circle, each
 * reviewer → author pair is a curved arrow, thicker for more PRs reviewed. Everyone is
 * drawn the same size and in name order, so the picture is about the team's links,
 * not a ranking of people.
 */
export function ReviewNetwork({
  members,
  edges,
}: {
  members: NetworkMember[];
  edges: ReviewEdge[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const people = [...members].sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(people.map((m) => [m.id, m]));
  const links = edges.filter((e) => byId.has(e.from) && byId.has(e.to));

  if (links.length === 0) {
    return (
      <p className='py-10 text-center text-sm text-muted-foreground'>
        No reviews between teammates were recorded on GitHub. Reviews done in person or
        only in comments don’t show up here.
      </p>
    );
  }

  const pos = new Map(
    people.map((m, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / people.length;
      return [m.id, { x: CENTER + RING * Math.cos(a), y: CENTER + RING * Math.sin(a) }];
    })
  );
  const max = Math.max(...links.map((e) => e.count));
  const involves = (e: ReviewEdge) => !active || e.from === active || e.to === active;

  /** A gentle arc from reviewer to author, trimmed so it stops at the avatar's edge. */
  const path = (e: ReviewEdge) => {
    const a = pos.get(e.from)!;
    const b = pos.get(e.to)!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    // Bow to the right of the direction of travel, so A→B and B→A sit side by side.
    const bend = len * 0.16;
    const c = {
      x: (a.x + b.x) / 2 - (dy / len) * bend,
      y: (a.y + b.y) / 2 + (dx / len) * bend,
    };
    const trim = (p: { x: number; y: number }) => {
      const tx = c.x - p.x;
      const ty = c.y - p.y;
      const tl = Math.hypot(tx, ty);
      return { x: p.x + (tx / tl) * NODE, y: p.y + (ty / tl) * NODE };
    };
    const s = trim(a);
    const t = trim(b);
    return `M ${s.x} ${s.y} Q ${c.x} ${c.y} ${t.x} ${t.y}`;
  };

  const strongest = links[0];
  const name = (id: string) => first(byId.get(id)!.name);
  const shown = (active ? links.filter(involves) : links).slice(0, TOP_PAIRS);
  const activeName = active ? byId.get(active)?.name : null;

  return (
    <div
      className='flex flex-col gap-6 md:flex-row md:items-center md:justify-center
        md:gap-12'
    >
      <div
        className='relative mx-auto aspect-square w-full max-w-sm shrink-0 md:mx-0
          lg:max-w-md'
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className='absolute inset-0 size-full overflow-visible'
          role='img'
          aria-label={`Review network for ${people.length} members with ${links.length} reviewer-to-author links. Strongest: ${name(strongest.from)} reviewed ${plural(strongest.count)} from ${name(strongest.to)}.`}
        >
          <defs>
            <marker
              id='review-arrow'
              viewBox='0 0 10 10'
              refX='8'
              refY='5'
              markerWidth='9'
              markerHeight='9'
              markerUnits='userSpaceOnUse'
              orient='auto-start-reverse'
            >
              <path d='M 0 0 L 10 5 L 0 10 z' fill='var(--series)' />
            </marker>
          </defs>
          {[...links].reverse().map((e) => (
            <path
              key={`${e.from}-${e.to}`}
              d={path(e)}
              fill='none'
              stroke='var(--series)'
              strokeWidth={1.25 + (e.count / max) * 7}
              strokeLinecap='round'
              markerEnd='url(#review-arrow)'
              className='transition-opacity duration-200'
              opacity={active ? (involves(e) ? 0.95 : 0.08) : 0.55}
            />
          ))}
        </svg>
        {people.map((m) => {
          const p = pos.get(m.id)!;
          const on = active === m.id;
          return (
            <button
              key={m.id}
              type='button'
              aria-pressed={on}
              onMouseEnter={() => setActive(m.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(m.id)}
              onBlur={() => setActive(null)}
              onClick={() => setActive(on ? null : m.id)}
              className='absolute flex -translate-x-1/2 -translate-y-1/2 flex-col
                items-center gap-1 rounded-full outline-none'
              style={{ left: `${(p.x / SIZE) * 100}%`, top: `${(p.y / SIZE) * 100}%` }}
            >
              <Avatar
                className={cn(
                  'size-11 ring-2 ring-background transition-shadow sm:size-12',
                  on && 'ring-foreground'
                )}
              >
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt='' />}
                <AvatarFallback>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'max-w-20 truncate rounded bg-background/80 px-1 text-xs font-medium',
                  active && !on && 'text-muted-foreground'
                )}
              >
                {first(m.name)}
              </span>
            </button>
          );
        })}
      </div>

      <div className='w-full min-w-0 space-y-3 md:max-w-sm'>
        <p className='text-sm text-muted-foreground' aria-live='polite'>
          {activeName ? (
            <>
              <span className='font-medium text-foreground'>{activeName}</span>’s review
              links
            </>
          ) : (
            <>Top review pairs</>
          )}
        </p>
        <ol className='space-y-2'>
          {shown.map((e) => (
            <li key={`${e.from}-${e.to}`} className='flex items-baseline gap-2 text-sm'>
              <span className='min-w-0 flex-1 truncate'>
                <span className='font-medium'>{name(e.from)}</span>
                <span className='text-muted-foreground'> reviewed </span>
                <span className='font-medium'>{name(e.to)}</span>
              </span>
              <span
                className='font-mono text-xs whitespace-nowrap text-muted-foreground
                  tabular-nums'
              >
                {plural(e.count)}
              </span>
            </li>
          ))}
        </ol>
        <p className='text-xs text-muted-foreground'>
          Thicker lines mean more PRs reviewed; arrows point to the PR’s author. Hover or
          tap someone to see just their links.
        </p>
      </div>
    </div>
  );
}
