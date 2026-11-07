import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { cn } from 'cn';

import { buttonVariants } from '@/components/ui/button';

/**
 * Off-site text link (GitHub, docs) that opens in a new tab and ends in an ExternalLink
 * icon, which nudges up-right on hover. Styled as the shadcn `link` button, minus the
 * button's height and padding so it sits in text. The off-site twin of `ArrowLink`.
 */
export function ExternalLink({
  href,
  children,
  className,
  iconClassName,
  title,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      title={title}
      className={cn(
        buttonVariants({ variant: 'link' }),
        'group h-auto w-fit max-w-full shrink gap-1 rounded-none p-0 text-left',
        'text-[length:inherit] whitespace-normal wrap-anywhere',
        className
      )}
    >
      {children}
      <ExternalLinkIcon
        className={cn(
          'size-[1em] shrink-0 transition-transform',
          'group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
          iconClassName
        )}
      />
    </a>
  );
}
