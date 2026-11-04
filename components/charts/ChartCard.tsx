'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface HeaderMetric<K extends string = string> {
  key: K;
  label: string;
  value: string;
}

/**
 * The shadcn "interactive chart" card: title on the left, clickable metric
 * totals on the right (one is active), optional extra control (e.g. a Select).
 */
export function ChartCard<K extends string>({
  title,
  description,
  metrics,
  active,
  onActive,
  action,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  metrics?: HeaderMetric<K>[];
  active?: K;
  onActive?: (k: K) => void;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className='flex flex-col items-stretch border-b p-0! sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pt-5 pb-4 sm:py-5'>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && (
          <div className='flex items-center px-6 pb-4 sm:py-5 sm:pl-0'>{action}</div>
        )}
        {metrics && metrics.length > 0 && (
          <div className='flex overflow-x-auto'>
            {metrics.map((m) => (
              <button
                key={m.key}
                type='button'
                data-active={active === m.key}
                aria-pressed={active === m.key}
                onClick={() => onActive?.(m.key)}
                className='flex min-w-24 flex-1 flex-col justify-center gap-1 border-t
                  px-5 py-4 text-left transition-colors even:border-l hover:bg-muted/30
                  data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-6
                  sm:py-5'
              >
                <span className='text-xs whitespace-nowrap text-muted-foreground'>
                  {m.label}
                </span>
                <span
                  className='font-heading text-lg leading-none font-bold tabular-nums
                    sm:text-2xl'
                >
                  {m.value}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className='px-2 py-4 sm:p-6'>{children}</CardContent>
    </Card>
  );
}
