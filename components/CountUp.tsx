'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

import { AnimatedNumber } from '@/components/animated-number';

interface Parsed {
  prefix: string;
  num: number;
  decimals: number;
  grouped: boolean;
  suffix: string;
}

/** Split an already-formatted value like "13.8K", "1,230 pts", "97%" or "5.1 h". */
function parse(text: string): Parsed | null {
  const m = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text);
  if (!m) return null;
  const [, prefix, numStr, suffix] = m;
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return {
    prefix,
    num: Number(numStr.replace(/,/g, '')),
    decimals,
    grouped: numStr.includes(','),
    suffix,
  };
}

const noopSubscribe = () => () => {};

/** Time between rolled steps while counting (each step rolls the changed digits). */
const STEP_MS = 100;
/** Gap between one number starting and the next, so they don't all animate at once. */
const STAGGER_MS = 60;

/**
 * Shared start queue: numbers that come into view together start one after another
 * (STAGGER_MS apart) instead of all at the same moment, which avoids a lag spike.
 */
/** If a number would wait longer than this (fast scrolling past many), just show it. */
const MAX_WAIT_MS = 1500;

let nextStartAt = 0;
/** Milliseconds to wait before starting, or null to skip the animation entirely. */
function reserveStart(): number | null {
  const now = performance.now();
  const at = Math.max(now, nextStartAt);
  if (at - now > MAX_WAIT_MS) return null;
  nextStartAt = at + STAGGER_MS;
  return at - now;
}

/**
 * On a visitor's first visit, counts a formatted number up from 0 the first time it
 * scrolls into view (rolling-digit AnimatedNumber). Returning visitors just see the
 * value. Later value changes roll from the old value to the new either way.
 * Non-numeric text (e.g. "—") is shown as is.
 */
export function CountUp({
  value,
  className,
  duration = 0.8,
}: {
  value: string | number;
  className?: string;
  duration?: number;
}) {
  const text = typeof value === 'number' ? value.toLocaleString() : value;
  const parsed = parse(text);
  const target = parsed?.num ?? 0;

  const ref = useRef<HTMLSpanElement>(null);
  // Only once it's actually scrolled to: most of it on screen, not just peeking in.
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduceMotion = useReducedMotion();
  // First-visit session? Set before paint by the script in app/layout.tsx. Read as an
  // external store so the server render (false) and hydration agree.
  const armed = useSyncExternalStore(
    noopSubscribe,
    () => document.documentElement.dataset.countup === '1',
    () => false
  );
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  // Server HTML and returning visitors get the final value straight away.
  const [shown, setShown] = useState(target);
  const [begun, setBegun] = useState(false);
  const current = useRef(target);
  // Whether the one-time count-up has run (or was skipped for this visitor).
  const done = useRef(false);

  useEffect(() => {
    if (!parsed || reduceMotion) return;
    let delay: number | null = 0;
    let from = current.current;
    if (armed && !done.current) {
      // First visit: count up from 0 once it's scrolled into view, in the shared queue.
      if (!inView) return;
      done.current = true;
      delay = reserveStart();
      from = 0;
    } else {
      done.current = true;
      // Later value changes (e.g. switching a metric) roll from the old value.
      if (target === current.current) return;
    }
    if (delay === null) {
      const t = setTimeout(() => {
        current.current = target;
        setShown(target);
        setBegun(true);
      }, 0);
      return () => clearTimeout(t);
    }
    let last = 0;
    let controls: ReturnType<typeof animate> | null = null;
    const timer = setTimeout(() => {
      setBegun(true);
      controls = animate(from, target, {
        duration,
        ease: 'easeOut',
        onUpdate: (v) => {
          current.current = v;
          const now = performance.now();
          if (now - last >= STEP_MS) {
            last = now;
            setShown(v);
          }
        },
        onComplete: () => {
          current.current = target;
          setShown(target);
        },
      });
    }, delay);
    return () => {
      clearTimeout(timer);
      controls?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when these change
  }, [target, inView, armed, reduceMotion]);

  // Before a first-visit count-up begins, show 0.
  const display = armed && !begun ? 0 : shown;
  const ready = hydrated;

  if (!parsed) return <span className={className}>{text}</span>;

  const format = (v: number) => {
    const n = Number(v.toFixed(parsed.decimals));
    const body = parsed.grouped
      ? n.toLocaleString('en-US', {
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        })
      : n.toFixed(parsed.decimals);
    return `${parsed.prefix}${body}${parsed.suffix}`;
  };

  return (
    // The invisible final value reserves the full width up front, so neighbours never
    // shift while the number grows; digits fill in from the right, like an odometer.
    <span ref={ref} className='inline-grid justify-items-end'>
      <span
        aria-hidden
        className='invisible col-start-1 row-start-1 whitespace-pre tabular-nums'
      >
        {text}
      </span>
      {/* Hidden until hydrated on a first visit, so the final value never flashes before
          the count-up starts from 0 (see .countup rules in globals.css). */}
      <span
        className='col-start-1 row-start-1'
        data-countup-value
        data-ready={ready || undefined}
      >
        <AnimatedNumber
          value={reduceMotion ? target : display}
          format={format}
          srText={text}
          className={className}
          blur={false}
        />
      </span>
    </span>
  );
}
