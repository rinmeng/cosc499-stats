import { cn } from '@/lib/utils';

/**
 * Wraps a block that has no `className` prop of its own (most charts) so it can fade in.
 * A one-column grid, so the child still fills the row height inside a parent grid.
 */
export function Reveal({
  className,
  children,
}: {
  /** Usually a `fadeUp(...)` class */
  className: string;
  children: React.ReactNode;
}) {
  return <div className={cn('grid grid-cols-1', className)}>{children}</div>;
}
