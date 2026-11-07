'use client';

import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STEPS = 5;

const hourLabel = (h: number) =>
  h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`;

/** Activity (see ActivityInfo) by weekday × hour (local time), as a single-hue sequential heatmap. */
export function Punchcard({ data, timezone }: { data: number[][]; timezone: string }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(1, ...data.flat());
  const total = data.flat().reduce((a, b) => a + b, 0);
  const step = (n: number) => (n === 0 ? 0 : Math.max(1, Math.ceil((n / max) * STEPS)));

  let peak = { d: 0, h: 0, n: -1 };
  data.forEach((row, d) => row.forEach((n, h) => n > peak.n && (peak = { d, h, n })));

  const focus = hover ?? { d: peak.d, h: peak.h };
  const n = data[focus.d]?.[focus.h] ?? 0;

  return (
    <div className='space-y-3'>
      <p className='text-sm text-muted-foreground' aria-live='polite'>
        <span className='font-medium text-foreground'>
          {DAYS[focus.d]} {hourLabel(focus.h)}
        </span>{' '}
        · {n.toLocaleString()} {n === 1 ? 'action' : 'actions'}
        {total ? ` (${((n / total) * 100).toFixed(1)}% of all)` : ''}
        {!hover && ' · busiest slot'}
      </p>
      <div className='overflow-x-auto'>
        <div
          className='grid min-w-[560px] gap-[2px]'
          style={{ gridTemplateColumns: '2.5rem repeat(24, minmax(0, 1fr))' }}
          onMouseLeave={() => setHover(null)}
          role='img'
          aria-label={`Activity by day and hour (${timezone}). Busiest: ${DAYS[peak.d]} ${hourLabel(peak.h)}.`}
        >
          {data.map((row, d) => (
            <div key={d} className='contents'>
              <div className='flex items-center pr-1 text-xs text-muted-foreground'>
                {DAYS[d]}
              </div>
              {row.map((v, h) => (
                <div
                  key={h}
                  onMouseEnter={() => setHover({ d, h })}
                  className='aspect-square min-h-3 rounded-[3px] transition-[outline]
                    hover:outline-2 hover:outline-foreground'
                  style={{ background: `var(--seq-${step(v)})` }}
                />
              ))}
            </div>
          ))}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className='pt-1 text-center text-[10px] text-muted-foreground'>
              {h % 3 === 0 ? hourLabel(h).replace(' ', '') : ''}
            </div>
          ))}
        </div>
      </div>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span>Fewer</span>
        {Array.from({ length: STEPS + 1 }, (_, i) => (
          <span
            key={i}
            className='size-3 rounded-[2px]'
            style={{ background: `var(--seq-${i})` }}
          />
        ))}
        <span>More</span>
        <span className='ml-auto'>Times in {timezone.replace('_', ' ')}</span>
      </div>
    </div>
  );
}
