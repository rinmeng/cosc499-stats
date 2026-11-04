'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Time between rolled steps while counting (each step rolls the changed digits). */
const STEP_MS = 100;
/** Gap between one number starting and the next, so they don't all animate at once. */
const STAGGER_MS = 90;

/**
 * Shared start queue: numbers that come into view together start one after another
 * (STAGGER_MS apart) instead of all at the same moment, which avoids a lag spike.
 */
/** If a number would wait longer than this (fast scrolling past many), just show it. */
const MAX_WAIT_MS = 700;

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
 * Counts a formatted number up from 0 the first time it scrolls into view, using the
 * rolling-digit AnimatedNumber. Later value changes roll from the old value to the new.
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
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  const started = useRef(false);

  useEffect(() => {
    if (!parsed || !inView || reduceMotion) return;
    let last = 0;
    let controls: ReturnType<typeof animate> | null = null;
    // First run waits its turn in the queue; later value changes (e.g. switching a
    // metric) start right away.
    const delay = started.current ? 0 : reserveStart();
    if (delay === null) {
      started.current = true;
      current.current = target;
      const t = setTimeout(() => setShown(target), 0);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      started.current = true;
      controls = animate(current.current, target, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the number changes
  }, [target, inView, reduceMotion]);

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
    <span ref={ref} className='inline-block'>
      <AnimatedNumber
        value={reduceMotion ? target : shown}
        format={format}
        srText={text}
        className={className}
        blur={false}
      />
    </span>
  );
}
