import Image from 'next/image';
import Link from 'next/link';
import { getYear } from 'date-fns';
import { BarChart3 } from 'lucide-react';

import { ExternalLink } from '@/components/ExternalLink';
import { getSummary } from '@/lib/data';
import { fmtDate } from '@/lib/format';
import { repoUrl } from '@/sync.config';

const START_YEAR = 2026;

/** Footer links keep the muted footer color and size instead of the primary link color. */
const footerLink = 'inline-flex font-normal text-muted-foreground hover:text-foreground';

/** Site footer, in the same style as web8th: centered, muted, credit logo at the bottom. */
export function Footer() {
  const currentYear = getYear(new Date());
  const yearLabel =
    currentYear > START_YEAR ? `${START_YEAR} - ${currentYear}` : `${START_YEAR}`;
  const syncedAt = getSummary()?.generatedAt;

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
          capstone. Not affiliated with UBC. Built from GitHub activity
          {syncedAt && `, last synced ${fmtDate(syncedAt)}`}.{' '}
          <ExternalLink href={repoUrl} className={footerLink}>
            Source on GitHub
          </ExternalLink>{' '}
          ·{' '}
          <ExternalLink
            href={`${repoUrl}/blob/main/CONTRIBUTING.md`}
            className={footerLink}
          >
            Add your cohort
          </ExternalLink>
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
