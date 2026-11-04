'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/CountUp';

export interface HeaderMetric<K extends string = string> {
  key: K;
  label: string;
  value: string;
  /** Small line under the value (only shown on emphasized metrics) */
  hint?: string;
  /** Give this metric more room: full row on mobile, double width on desktop */
  emphasis?: boolean;
  /** Small marker shown before the label (e.g. the series' shape) */
  icon?: React.ReactNode;
}

/**
 * The shadcn "interactive chart" card: title on the left, clickable metric
 * totals on the right (one is active), optional extra control (e.g. a Select).
 *
 * Metrics sit in a grid with hairline dividers: on phones and tablets they form
 * a full-width row under the title (an emphasized metric takes its own row);
 * from `lg` up they sit to the right of the title.
 */
export function ChartCard<K extends string>({
  title,
  description,
  metrics,
  active,
  onActive,
  action,
  className,
  stacked = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  metrics?: HeaderMetric<K>[];
  active?: K;
  onActive?: (k: K) => void;
  action?: React.ReactNode;
  className?: string;
  /** Put the metrics in their own full-width row under the title (for many metrics) */
  stacked?: boolean;
  children: React.ReactNode;
}) {
  const plain = metrics?.filter((m) => !m.emphasis).length ?? 0;
  // Keep plain metrics on one row on phones; 4 across still fits a 360px screen.
  const cols = Math.min(Math.max(plain, 1), 4);
  // Stacked: 3 across on phones; on desktop every metric in one row, emphasis twice as wide.
  const stackedCols = { '--cols-lg': plain + 2 } as React.CSSProperties;

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader
        className={cn(
          'flex flex-col items-stretch border-b p-0!',
          !stacked && 'lg:flex-row'
        )}
      >
        <div
          className='flex flex-1 flex-col justify-center gap-1 px-4 pt-5 pb-4 sm:px-6
            lg:py-5'
        >
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && (
          <div className='flex items-center px-4 pb-4 sm:px-6 lg:py-5 lg:pl-0'>
            {action}
          </div>
        )}
        {metrics && metrics.length > 0 && (
          <div
            className={cn(
              'grid gap-px border-t bg-border',
              stacked
                ? // phones: wrap 3 per row and let the last row stretch (no empty cells)
                  `flex flex-wrap lg:grid
                    lg:grid-cols-[repeat(var(--cols-lg),minmax(0,1fr))]`
                : 'lg:flex lg:border-t-0 lg:border-l'
            )}
            style={
              stacked
                ? stackedCols
                : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
            }
          >
            {metrics.map((m) => (
              <button
                key={m.key}
                type='button'
                data-active={active === m.key}
                data-emphasis={m.emphasis || undefined}
                aria-pressed={active === m.key}
                onClick={() => onActive?.(m.key)}
                style={m.emphasis && !stacked ? { gridColumn: '1 / -1' } : undefined}
                data-stacked={stacked || undefined}
                className='group/metric flex min-w-0 flex-col justify-center gap-1 bg-card
                  px-3 py-3 text-left transition-colors hover:bg-muted/40
                  data-[active=true]:bg-muted sm:px-5 sm:py-4 lg:min-w-28 lg:flex-1
                  lg:px-6 lg:py-5 sm:data-emphasis:py-5 lg:data-emphasis:min-w-56
                  lg:data-emphasis:flex-[2] data-stacked:grow data-stacked:basis-[30%]
                  data-stacked:data-emphasis:basis-full lg:data-stacked:basis-auto
                  lg:data-stacked:data-emphasis:col-span-2'
              >
                <span
                  className='flex min-w-0 items-center gap-1.5 text-[11px]
                    text-muted-foreground sm:text-xs
                    group-data-emphasis/metric:font-medium
                    group-data-emphasis/metric:text-foreground'
                >
                  {m.icon}
                  <span className='truncate'>{m.label}</span>
                </span>
                <span
                  className='font-heading text-lg leading-none font-bold tabular-nums
                    sm:text-2xl group-data-emphasis/metric:text-4xl
                    sm:group-data-emphasis/metric:text-5xl'
                >
                  <CountUp value={m.value} />
                </span>
                {m.emphasis && m.hint && (
                  <span className='text-xs text-muted-foreground'>{m.hint}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className='px-2 py-4 sm:p-6'>{children}</CardContent>
    </Card>
  );
}
