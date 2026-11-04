'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

// Like iOS's numeric text transition: a changed digit rolls out and its replacement rolls in
// from the other side, both blurring, up when the value grew and down when it shrank. Digits
// that didn't change stay still, and everything else (".", ",", "%", "$", " GB") never moves.
const roll = {
  enter: (direction: number) => ({
    y: direction > 0 ? '60%' : '-60%',
    opacity: 0,
    filter: 'blur(5px)',
  }),
  center: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: (direction: number) => ({
    y: direction > 0 ? '-60%' : '60%',
    opacity: 0,
    filter: 'blur(5px)',
  }),
};
// Same roll without the blur: transform + opacity only, so it stays on the GPU and
// doesn't repaint every frame (used where many numbers animate, e.g. while scrolling).
const rollNoBlur = {
  enter: (direction: number) => ({ y: direction > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { y: '0%', opacity: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? '-60%' : '60%', opacity: 0 }),
};
// Quick, with only a little overshoot.
const transition = { type: 'spring', duration: 0.35, bounce: 0.15 } as const;

// Copied from rinmeng/actions-runner-dashboard (web/components/animated-number.tsx).
export function AnimatedNumber<T extends number | null | undefined>({
  value,
  format,
  className,
  srText,
  blur = true,
}: {
  value: T;
  format: (value: T) => string;
  className?: string;
  /** What screen readers (and crawlers) get; defaults to the formatted value */
  srText?: string;
  /** Blur digits as they roll (prettier, but costs a repaint per frame) */
  blur?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  // The last value and which way it moved, kept during render so every digit that changes in
  // one update rolls the same way (React's "storing information from previous renders").
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  if (value !== previous) {
    if (typeof value === 'number' && typeof previous === 'number')
      setDirection(value >= previous ? 1 : -1);
    setPrevious(value);
  }

  const text = format(value);
  if (reduceMotion)
    return <span className={cn('tabular-nums', className)}>{srText ?? text}</span>;

  const chars = [...text];
  const variants = blur ? roll : rollNoBlur;
  return (
    // overflow-y: clip keeps rolling digits inside the line, so a scrolling ancestor (a table,
    // the sidebar) never flashes a scrollbar. Unlike hidden it leaves the baseline alone.
    <span className={cn('inline-block overflow-y-clip tabular-nums', className)}>
      <span className='sr-only'>{srText ?? text}</span>
      <span aria-hidden>
        {/* One slot per place value, counted from the right (ones, tens, ...), so a place keeps its
            element while its digit changes. A place that appears or goes (9 to 10) rolls too. */}
        <AnimatePresence mode='popLayout' initial={false} custom={direction}>
          {chars.map((char, index) => {
            const place = chars.length - index;
            if (!/\d/.test(char)) {
              return (
                <span key={place} className='whitespace-pre'>
                  {char}
                </span>
              );
            }
            return (
              <motion.span
                key={place}
                className='relative inline-block'
                custom={direction}
                variants={variants}
                initial='enter'
                animate='center'
                exit='exit'
                transition={transition}
              >
                <AnimatePresence mode='popLayout' initial={false} custom={direction}>
                  <motion.span
                    key={char}
                    className='inline-block'
                    custom={direction}
                    variants={variants}
                    initial='enter'
                    animate='center'
                    exit='exit'
                    transition={transition}
                  >
                    {char}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>
    </span>
  );
}
