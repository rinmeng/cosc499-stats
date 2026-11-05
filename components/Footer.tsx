import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, BarChart3 } from 'lucide-react';

import { repoUrl } from '@/sync.config';

const START_YEAR = 2026;

/** Site footer, in the same style as web8th: centered, muted, credit logo at the bottom. */
export function Footer() {
  const currentYear = new Date().getFullYear();
  const yearLabel =
    currentYear > START_YEAR ? `${START_YEAR} - ${currentYear}` : `${START_YEAR}`;

  return (
    <footer className='border-t'>
      <div className='page-container flex flex-col items-center gap-3 py-8 text-center'>
        <p className='text-sm text-muted-foreground'>&copy; {yearLabel} rin</p>

        <Link
          href='/'
          className='flex items-center gap-2 font-heading text-lg font-semibold'
        >
          <BarChart3 className='size-5 text-chart-1' />
          UBCO COSC 499 Capstone Stats
        </Link>

        <p className='max-w-md text-xs text-muted-foreground'>
          A student-made project for COSC 499 (COSC_O 499), the UBC Okanagan (UBCO)
          capstone. Not affiliated with UBC. Built from GitHub activity.{' '}
          <a
            href={repoUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-0.5 underline-offset-4
              hover:underline'
          >
            Source on GitHub <ExternalLink className='size-3' />
          </a>{' '}
          ·{' '}
          <a
            href={`${repoUrl}/blob/main/CONTRIBUTING.md`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-0.5 underline-offset-4
              hover:underline'
          >
            Add your cohort <ExternalLink className='size-3' />
          </a>
        </p>

        <p className='text-muted-foreground'>brought to you by</p>
        <Link
          href='https://rinm.dev'
          target='_blank'
          rel='noreferrer'
          aria-label='rinm.dev'
          className='transition-opacity hover:opacity-80'
        >
          <Image
            src='/rmlogov2.png'
            alt='Rin logo'
            width={52}
            height={29}
            className='h-auto w-13 object-contain not-dark:invert'
          />
        </Link>
      </div>
    </footer>
  );
}
