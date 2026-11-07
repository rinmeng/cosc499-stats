import Link from 'next/link';
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/utils/animations';

export function PageHeader({
  eyebrow,
  title,
  children,
  meta,
  action,
  start = 0,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** One short intro sentence: what the page is. */
  children?: React.ReactNode;
  /** Facts (counts, dates, links) on a small line below the intro, joined by "·". */
  meta?: React.ReactNode[];
  /**
   * Rendered outside the animated title, for fixed-position things like the Share
   * button: an animated transform would pin them to the title instead of the screen.
   */
  action?: React.ReactNode;
  /** Animation step of the eyebrow; the title and intro follow it. */
  start?: number;
}) {
  const facts = (meta ?? []).filter(Boolean);
  return (
    <header className='space-y-2'>
      {action}
      {eyebrow && (
        <div
          className={cn(
            'text-xs font-medium tracking-wider text-muted-foreground uppercase',
            fadeUp(start)
          )}
        >
          {eyebrow}
        </div>
      )}
      <h1
        className={cn(
          'font-heading text-3xl font-bold tracking-tight wrap-break-word md:text-4xl',
          fadeUp(start + 1)
        )}
      >
        {title}
      </h1>
      {(children || facts.length > 0) && (
        <div className={cn('max-w-3xl space-y-1.5', fadeUp(start + 2))}>
          {children && <div className='text-muted-foreground'>{children}</div>}
          {facts.length > 0 && (
            <ul
              className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm
                text-muted-foreground [&>li+li]:before:mr-2
                [&>li+li]:before:content-["·"]'
            >
              {facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  );
}

/** Small muted word after a number saying what it counts ("commits", "of PRs"). */
function Unit({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <span
      className={cn(
        'ml-1 font-sans text-xs font-normal whitespace-nowrap text-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}

/** A "this week" number next to last week's, for a StatTile's `trend`. */
export interface WeekTrend {
  now: number;
  last: number;
  /** What last week's total counts ("commits"), shown after it */
  unit?: string;
  format?: (n: number) => string;
}

/**
 * Hint for a "this week" tile: a badge with the change ("↘ 44%"), then last week's
 * total ("from last week (513 commits)"). Up is green, down is destructive.
 */
function WeekTrendHint({
  now,
  last,
  unit,
  format = (n) => n.toLocaleString(),
}: WeekTrend) {
  const diff = now - last;
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  // No percentage when last week was 0; the arrow alone says it went up.
  const change =
    diff !== 0 && last > 0
      ? `${Math.max(1, Math.round((Math.abs(diff) / last) * 100))}%`
      : null;
  return (
    <span className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5'>
      <Badge
        variant='outline'
        className={cn(
          'font-sans',
          diff > 0
            ? 'border-success/30 bg-success/10 text-success'
            : diff < 0
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'text-muted-foreground'
        )}
      >
        <Icon />
        {change}
      </Badge>
      <span>
        {diff === 0 ? 'same as' : 'from'} last week ({format(last)}
        {unit && ` ${unit}`})
      </span>
    </span>
  );
}

/**
 * `compact` shrinks the tile on phones (smaller type, no hint line) so charts show sooner.
 * `unit` says what the number is (a count of commits, a share of PRs…) so it is not a guess.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  trend,
  icon: Icon,
  compact = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  hint?: React.ReactNode;
  /** Change from last week, shown as the hint (replacing `hint`) */
  trend?: WeekTrend;
  icon?: LucideIcon;
  compact?: boolean;
  className?: string;
}) {
  const note = trend ? <WeekTrendHint {...trend} /> : hint;
  return (
    <Card size='sm' className={cn(compact && 'py-2.5 md:py-4', className)}>
      <CardContent className={cn('space-y-1', compact && 'px-3 md:px-4 md:space-y-1')}>
        <div
          className={cn(
            'flex items-center gap-1.5 text-muted-foreground',
            compact ? 'text-[11px] md:text-xs' : 'text-xs'
          )}
        >
          {Icon && <Icon className='size-3.5' />}
          {label}
        </div>
        {/* The unit wraps under the number when the tile is narrow (3-across on phones). */}
        <div
          className={cn(
            'flex flex-wrap items-baseline gap-x-1 font-mono font-semibold tabular-nums',
            compact ? 'text-lg md:text-2xl' : 'text-2xl'
          )}
        >
          <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <Unit className='ml-0 leading-tight'>{unit}</Unit>
        </div>
        {note && (
          <div
            className={cn('text-xs text-muted-foreground', compact && 'hidden md:block')}
          >
            {note}
          </div>
        )}
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
  /** What the value is, shown small after it ("commits", "of commits", "per PR") */
  unit?: string;
  sub?: string;
  /** Let the sub-line wrap instead of truncating (e.g. a full list) */
  wrapSub?: boolean;
}

export interface HighlightProps {
  title: string;
  description: string;
  icon: LucideIcon;
  items: HighlightItem[];
  /** Shown under the list, e.g. a "How points are calculated" button */
  footer?: React.ReactNode;
  /** Shown instead of the list when no team qualifies; without it the card is hidden */
  empty?: string;
  className?: string;
}

/** A small "top 3" list for a positive team superlative. */
export function Highlight({
  title,
  description,
  icon: Icon,
  items,
  footer,
  empty,
  className,
}: HighlightProps) {
  return (
    <Card size='sm' className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='size-4 text-chart-1' />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 && empty && (
          <p className='text-sm text-muted-foreground'>{empty}</p>
        )}
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
              <span className='shrink-0 font-mono tabular-nums'>
                {it.value}
                <Unit>{it.unit}</Unit>
              </span>
            </li>
          ))}
        </ol>
        {footer && <div className='mt-3 -ml-2'>{footer}</div>}
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
  return <div className={cn('grid grid-cols-1 gap-4', className)}>{children}</div>;
}
