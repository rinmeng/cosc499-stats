export const getDelayClass = (index: number) => {
  const delays = [
    'delay-0',
    'delay-[100ms]',
    'delay-[200ms]',
    'delay-[300ms]',
    'delay-[400ms]',
    'delay-[500ms]',
    'delay-[500ms]',
    'delay-[600ms]',
    'delay-[700ms]',
    'delay-[800ms]',
    'delay-[900ms]',
    'delay-[1000ms]',
    'delay-[1100ms]',
    'delay-[1200ms]',
    'delay-[1300ms]',
    'delay-[1400ms]',
    'delay-[1500ms]',
    'delay-[1600ms]',
    'delay-[1700ms]',
    'delay-[1800ms]',
    'delay-[1900ms]',
    'delay-[2000ms]',
  ];
  return delays[Math.min(index, delays.length - 1)];
};
