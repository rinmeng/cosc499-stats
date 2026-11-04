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

/** Steps per second while counting (each step rolls the changed digits). */
const STEP_MS = 70;

/**
 * Counts a formatted number up from 0 the first time it scrolls into view, using the
 * rolling-digit AnimatedNumber. Later value changes roll from the old value to the new.
 * Non-numeric text (e.g. "—") is shown as is.
 */
export function CountUp({
  value,
  className,
  duration = 0.9,
}: {
  value: string | number;
  className?: string;
  duration?: number;
}) {
  const text = typeof value === 'number' ? value.toLocaleString() : value;
  const parsed = parse(text);
  const target = parsed?.num ?? 0;

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -5% 0px' });
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (!parsed || !inView || reduceMotion) return;
    let last = 0;
    const controls = animate(current.current, target, {
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
    return () => controls.stop();
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
      />
    </span>
  );
}
