import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className='space-y-2'>
      {eyebrow && (
        <div
          className='text-xs font-medium tracking-wider text-muted-foreground uppercase'
        >
          {eyebrow}
        </div>
      )}
      <h1 className='font-heading text-3xl font-bold tracking-tight md:text-4xl'>
        {title}
      </h1>
      {children && <div className='max-w-3xl text-muted-foreground'>{children}</div>}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Card size='sm'>
      <CardContent className='space-y-1'>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          {Icon && <Icon className='size-3.5' />}
          {label}
        </div>
        <div className='font-mono text-2xl font-semibold tabular-nums'>{value}</div>
        {hint && <div className='text-xs text-muted-foreground'>{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='space-y-1'>
            <CardTitle className='text-base'>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export interface HighlightItem {
  label: string;
  href?: string;
  value: string;
  sub?: string;
  /** Let the sub-line wrap instead of truncating (e.g. a full list) */
  wrapSub?: boolean;
}

export interface HighlightProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items: HighlightItem[];
}

/** A small "top 3" list for a positive team superlative. */
export function Highlight({ title, description, icon: Icon, items }: HighlightProps) {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='size-4 text-chart-1' />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className='space-y-2'>
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`} className='flex items-baseline gap-2 text-sm'>
              <span className='w-3 shrink-0 font-mono text-xs text-muted-foreground'>
                {i + 1}
              </span>
              <div className='min-w-0 flex-1'>
                {it.href ? (
                  <Link href={it.href} className='font-medium hover:underline'>
                    {it.label}
                  </Link>
                ) : (
                  <span className='font-medium'>{it.label}</span>
                )}
                {it.sub && (
                  <div
                    className={cn(
                      'text-xs text-muted-foreground',
                      it.wrapSub ? 'leading-relaxed' : 'truncate'
                    )}
                  >
                    {it.sub}
                  </div>
                )}
              </div>
              <span className='shrink-0 font-mono tabular-nums'>{it.value}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function LanguageBars({
  languages,
  limit = 8,
}: {
  languages: { name: string; bytes: number }[];
  limit?: number;
}) {
  const total = languages.reduce((a, l) => a + l.bytes, 0) || 1;
  const shown = languages.slice(0, limit);
  const best = shown[0]?.bytes || 1;
  return (
    <ul className='space-y-2.5'>
      {shown.map((l) => (
        <li key={l.name} className='space-y-1'>
          <div className='flex justify-between text-sm'>
            <span>{l.name}</span>
            <span className='font-mono text-xs tabular-nums text-muted-foreground'>
              {((l.bytes / total) * 100).toFixed(1)}%
            </span>
          </div>
          <div className='h-1.5 bg-muted'>
            <div
              className='h-full rounded-r-[4px] bg-chart-1'
              style={{ width: `${(l.bytes / best) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState() {
  return (
    <div className='mx-auto max-w-xl space-y-4 border p-8 text-center'>
      <h2 className='font-heading text-xl font-semibold'>No data yet</h2>
      <p className='text-muted-foreground'>
        Run the sync to pull contribution data from GitHub. It uses your{' '}
        <code className='font-mono'>gh</code> login or a{' '}
        <code className='font-mono'>GITHUB_TOKEN</code> in{' '}
        <code className='font-mono'>.env.local</code>.
      </p>
      <pre className='bg-muted p-3 text-left font-mono text-sm'>pnpm sync</pre>
    </div>
  );
}

export function Grid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('grid gap-4', className)}>{children}</div>;
}
