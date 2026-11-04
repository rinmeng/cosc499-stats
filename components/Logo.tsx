import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ChevronRight, Infinity } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  onClick?: () => void;
}

export function Logo({ className, iconSize = 20, showText = true, onClick }: LogoProps) {
  return (
    <div className='flex items-center gap-3'>
      <Button variant='link' className='p-0 m-0'>
        <Link
          href='/'
          className={cn('flex items-center gap-2', className)}
          onClick={onClick}
        >
          <Image
            src='/favicon.ico'
            alt='Logo'
            width={iconSize}
            height={iconSize}
            className={cn('h-5 w-5')}
            style={{ width: iconSize, height: iconSize }}
          />
          {showText && <span className={className}>Next Starter</span>}
        </Link>
      </Button>

      <Infinity size={iconSize} className={cn('text-muted-foreground', className)} />
      <Button variant='link' className={cn('p-0 m-0', className)}>
        <div className='flex gap-2 items-center'>
          <Link href='https://web8th.com'>
            <Image
              className='not-dark:invert-100'
              src='/icons/8th_svg.svg'
              alt='Logo'
              width={Math.round(iconSize * 1.5)}
              height={Math.round(iconSize * 1.5 * (1079 / 1905))}
              style={{ width: iconSize * 1.5, height: 'auto' }}
            />
          </Link>

          <ChevronRight
            size={iconSize}
            className={cn('text-muted-foreground', className)}
          />
          <Link href='https://rinm.dev'>
            <Image
              src='/rmlogov2.png'
              alt='Logo'
              className='not-dark:invert-100'
              width={Math.round(iconSize * 1.5)}
              height={Math.round(iconSize * 1.5 * (1079 / 1905))}
              style={{ width: iconSize * 1.5, height: 'auto' }}
            />
          </Link>
        </div>
      </Button>
    </div>
  );
}
