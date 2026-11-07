export const getDelayClass = (index: number) => {
  const delays = [
    'delay-0',
    'delay-[75ms]',
    'delay-[150ms]',
    'delay-[225ms]',
    'delay-[300ms]',
    'delay-[375ms]',
    'delay-[450ms]',
    'delay-[525ms]',
    'delay-[600ms]',
    'delay-[675ms]',
    'delay-[750ms]',
    'delay-[825ms]',
    'delay-[900ms]',
    'delay-[975ms]',
    'delay-[1050ms]',
    'delay-[1125ms]',
    'delay-[1200ms]',
    'delay-[1275ms]',
    'delay-[1350ms]',
    'delay-[1425ms]',
    'delay-[1500ms]',
    'delay-[1575ms]',
    'delay-[1650ms]',
    'delay-[1725ms]',
    'delay-[1800ms]',
    'delay-[1875ms]',
    'delay-[1950ms]',
  ];
  return delays[Math.min(Math.max(index, 0), delays.length - 1)];
};

/** Fade in from the bottom, `index` × 100 ms after the page renders. */
export const fadeUp = (index = 0) => `fade-in-from-bottom ${getDelayClass(index)}`;

/** Fade in from the left, `index` × 100 ms after the page renders (navbar items). */
export const fadeLeft = (index = 0) => `fade-in-from-left ${getDelayClass(index)}`;

/** Past this step everything is below the fold anyway, so later blocks share its delay. */
const MAX_STEP = 12;

/**
 * Hands out `fadeUp` classes in render order: each call lands 100 ms after the last.
 * Pages start at 3 because `PageHeader` staggers its own eyebrow, title and intro (0–2).
 */
export function stagger(start = 3) {
  let i = start;
  return () => fadeUp(Math.min(i++, MAX_STEP));
}
