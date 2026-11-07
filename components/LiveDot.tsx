import { cn } from '@/lib/utils';

/** Pulsing dot marking something that's still in progress (e.g. the current cohort). */
export function LiveDot({
  className,
  label = 'in progress',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn('relative flex size-2', className)} aria-label={label}>
      <span
        className='absolute inline-flex size-full animate-ping rounded-full bg-chart-1
          opacity-60'
      />
      <span className='relative inline-flex size-2 rounded-full bg-chart-1' />
    </span>
  );
}
