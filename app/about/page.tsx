import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  Award,
  Ghost,
  Archive,
  Scale,
  Target,
  HeartHandshake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { PageHeader } from '@/components/stats/Blocks';
import { getSummary } from '@/lib/data';
import { aboutSeo, pageMetadata } from '@/lib/seo';
import { currentCohort, repoUrl } from '@/sync.config';
import { cn } from '@/lib/utils';
import { stagger } from '@/utils/animations';

export const metadata = pageMetadata(aboutSeo());

const contributingUrl = `${repoUrl}/blob/main/CONTRIBUTING.md`;
const issuesUrl = `${repoUrl}/issues/new`;

const linkClass =
  'inline-flex items-center gap-1 font-medium underline underline-offset-4 ' +
  'decoration-border hover:decoration-foreground';

function Reason({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-3', className)}>
      <h2 className='flex items-center gap-2 font-heading text-xl font-semibold'>
        <Icon className='size-5 text-chart-1' />
        {title}
      </h2>
      <div className='space-y-3 leading-relaxed'>{children}</div>
    </section>
  );
}

export default function AboutPage() {
  const s = getSummary();
  const cohortCount = s?.cohorts.filter((c) => c.teams.length).length;
  const current = s?.cohorts.find((c) => c.isCurrent);
  const next = stagger();

  return (
    <div className='mx-auto max-w-3xl space-y-10'>
      <PageHeader eyebrow='About' title='Why I made this site'>
        COSC 499 is the biggest thing most of us build at UBC Okanagan: eight months, a
        real client, a team that has to figure out how to work together. Then it ends, the
        repos go quiet, and the next cohort starts from zero. I wanted a place where that
        work is remembered, and where the people coming next can learn from it.
      </PageHeader>

      <Reason
        className={next()}
        icon={Target}
        title='A benchmark for the current and next cohort'
      >
        <p>
          When you&apos;re in week 6 of capstone, it&apos;s hard to tell whether your team
          is on pace. Is 200 commits a lot? Should you be merging more PRs by now? Do
          other teams actually review each other&apos;s code?
        </p>
        <p>
          This site lets the current cohort, and the one after it, see how previous
          cohorts performed at the same point in their term. The tracking chart lines up
          every cohort by week, so you can benchmark your team against what real teams did
          before you, not against a guess.
        </p>
        <p className='flex flex-wrap gap-x-5 gap-y-2'>
          {current && (
            <Link href={`/${currentCohort}`} className={linkClass}>
              See how {current.label} is tracking <ArrowRight className='size-4' />
            </Link>
          )}
          <Link href='/' className={linkClass}>
            Compare every cohort <ArrowRight className='size-4' />
          </Link>
        </p>
      </Reason>

      <Reason className={next()} icon={Award} title='Recognition for the work'>
        <p>
          A final demo shows the product, not the person who reviewed forty pull requests,
          closed the issue backlog, or kept the team shipping every week. Those people
          deserve credit too.
        </p>
        <p>
          Every cohort and team page highlights its top contributors across commits,
          merged PRs, reviews and issues, so the work behind a project is visible, and you
          can point to it after you graduate.
        </p>
      </Reason>

      <Reason
        className={next()}
        icon={Ghost}
        title='Not just the big numbers: the quirky ones too'
      >
        <p>
          This isn&apos;t only a leaderboard. Alongside the most commits and most reviews,
          there are the night owls, the early birds, the 3&nbsp;am regulars, the holiday
          heroes who committed over Christmas, the fastest PR ever merged and the one that
          waited the longest.
        </p>
        <p>
          That means anyone can end up anywhere on this site. You don&apos;t need the most
          commits to show up; you might be the person who kept pushing at 3&nbsp;am, or
          who merged a PR in eleven seconds. Capstone is full of those stories, and
          they&apos;re as much a part of it as the totals.
        </p>
      </Reason>

      <Reason className={next()} icon={Archive} title='Keeping a record'>
        <p>
          Capstone repos get made private, deleted, or moved when people graduate, and
          each year&apos;s work quietly disappears. This site keeps a snapshot of the
          activity
          {cohortCount ? ` from ${cohortCount} cohorts so far` : ''}, back to 2017, so the
          history of the course stays in one place.
        </p>
      </Reason>

      <Reason className={next()} icon={Scale} title='What the numbers don’t show'>
        <p>
          GitHub activity is only part of a capstone. Design, client meetings, planning,
          testing by hand, writing docs and pair programming rarely show up as commits,
          and teams work differently: some squash every PR into one commit, some commit
          every few minutes. So please read these as a picture of activity, not a grade.
          The insights page reads commit messages while syncing, only to note when an AI
          tool is named as a co-author, and the message itself is never stored.
        </p>
        <p>
          That&apos;s also why the site celebrates, and never ranks anyone from the
          bottom. There are no &quot;least active&quot; lists, and personal pages only
          show your own work, never a comparison with your teammates.
        </p>
      </Reason>

      <Reason className={next()} icon={HeartHandshake} title='Help complete it'>
        <p>
          Some cohorts look small because their repos are private or were moved off the
          course organization. If you were on one of those teams, you can probably see
          data I can&apos;t, and adding it takes about 15 minutes with no coding.
        </p>
        <p className='flex flex-wrap gap-x-5 gap-y-2'>
          <a
            href={contributingUrl}
            target='_blank'
            rel='noreferrer'
            className={linkClass}
          >
            Add your cohort <ExternalLink className='size-4' />
          </a>
          <a href={issuesUrl} target='_blank' rel='noreferrer' className={linkClass}>
            Ask for your page to be removed <ExternalLink className='size-4' />
          </a>
        </p>
      </Reason>

      <p className={cn('border-t pt-6 text-sm text-muted-foreground', next())}>
        Built by rin, a COSC 499 student, from public and course GitHub activity. Not
        affiliated with UBC.
      </p>
    </div>
  );
}
