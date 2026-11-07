import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from 'cn';

import { buttonVariants } from '@/components/ui/button';

/**
 * In-site text link that ends in an ArrowRight, which nudges right on hover. Styled as
 * the shadcn `link` button, minus the button's height and padding so it sits in text.
 */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: 'link' }),
        'group h-auto w-fit gap-1 rounded-none p-0 text-[length:inherit]',
        className
      )}
    >
      {children}
      <ArrowRight className='size-[1em] transition-transform group-hover:translate-x-0.5' />
    </Link>
  );
}
