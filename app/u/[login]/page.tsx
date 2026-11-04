import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  ExternalLink,
  CalendarDays,
  CircleDot,
  FileCode2,
  GitMerge,
  GitPullRequest,
  MessageSquareCode,
} from 'lucide-react';

import { Grid, PageHeader, Section, StatTile } from '@/components/stats/Blocks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fmt, fmtCompact, pct } from '@/lib/format';
import { getPeople, getPerson, type Capstone } from '@/lib/people';
import { pageMetadata, personSeo } from '@/lib/seo';

/**
 * A person's own output in each capstone they were part of. It never ranks them
 * or compares them with anyone else: no team share, no position, no averages.
 */

export function generateStaticParams() {
  return [...getPeople().values()].map((p) => ({ login: p.login }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/u/[login]'>) {
  const { login } = await params;
  const p = getPerson(login);
  if (!p) return { title: 'Person not found' };
  return {
    ...pageMetadata(personSeo(p)),
    // Share previews work, but the page is kept out of search engines: it's found
    // through the site's own search, not by googling someone's name.
    robots: { index: false, follow: true },
  };
}

const share = (n: number, d: number) => (d ? n / d : 0);

function CapstoneSection({ c }: { c: Capstone }) {
  const m = c.stats;
  const habits = [
    m.nightCommits > 0 &&
      `${pct(share(m.nightCommits, m.commits))} of commits between 10 pm and 4 am`,
    m.earlyCommits > 0 &&
      `${pct(share(m.earlyCommits, m.commits))} of commits between 5 and 9 am`,
    m.witchingCommits > 0 && `${fmt(m.witchingCommits)} commits between 3 and 4 am`,
    m.holidayCommits > 0 && `${fmt(m.holidayCommits)} commits on holidays and breaks`,
    m.biggestCommit > 0 &&
      `Biggest single commit: ${fmtCompact(m.biggestCommit)} lines changed`,
  ].filter(Boolean) as string[];

  return (
    <Section
      title={`${c.team.name} · ${c.cohort.label}`}
      description={
        <>
          {c.cohort.isCurrent ? 'In progress. ' : ''}
          <Link
            href={`/${c.cohort.slug}/${c.team.team}`}
            className='inline-flex items-center gap-1 font-medium text-foreground
              underline-offset-2 hover:underline'
          >
            See the team <ArrowRight className='size-3.5' />
          </Link>{' '}
          ·{' '}
          <Link
            href={`/${c.cohort.slug}`}
            className='inline-flex items-center gap-1 font-medium text-foreground
              underline-offset-2 hover:underline'
          >
            See the {c.cohort.label} cohort <ArrowRight className='size-3.5' />
          </Link>
        </>
      }
    >
      <div className='space-y-4'>
        <Grid className='grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-6'>
          <StatTile
            icon={GitPullRequest}
            label='Commits'
            value={fmt(m.commits)}
            unit='commits'
          />
          <StatTile
            icon={GitMerge}
            label='Merged PRs'
            value={fmt(m.prsMerged)}
            unit='PRs'
            hint={m.prsOpened ? `${fmt(m.prsOpened)} opened` : undefined}
          />
          <StatTile
            icon={MessageSquareCode}
            label='Code reviews'
            value={fmt(m.reviews)}
            unit='reviews'
          />
          <StatTile
            icon={CircleDot}
            label='Issues'
            value={fmt(m.issuesOpened)}
            unit='opened'
            hint={m.issuesClosed ? `${fmt(m.issuesClosed)} closed` : undefined}
          />
          <StatTile
            icon={FileCode2}
            label='Lines changed'
            value={fmtCompact(m.lines)}
            unit='lines'
            hint={`+${fmtCompact(m.additions)} / −${fmtCompact(m.deletions)}`}
          />
          <StatTile
            icon={CalendarDays}
            label='Active weeks'
            value={fmt(m.activeWeeks)}
            unit='weeks'
            hint='weeks with at least one commit'
          />
        </Grid>
        {habits.length > 0 && (
          <ul className='flex flex-wrap gap-2 text-sm'>
            {habits.map((h) => (
              <li key={h} className='rounded-full border px-3 py-1'>
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

export default async function PersonPage({ params }: PageProps<'/u/[login]'>) {
  const { login } = await params;
  const p = getPerson(login);
  if (!p) notFound();

  const n = p.capstones.length;
  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='COSC 499 capstone'
        title={
          <span className='flex items-center gap-4'>
            <Avatar className='size-12 md:size-14'>
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt='' />}
              <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {p.name}
          </span>
        }
      >
        <a
          href={`https://github.com/${p.login}`}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
        >
          @{p.login} <ExternalLink className='size-3.5' />
        </a>
        {' · '}
        {n === 1 ? '1 capstone' : `${n} capstones`}:{' '}
        {p.capstones.map((c) => c.cohort.label).join(', ')}
      </PageHeader>

      {p.capstones.map((c) => (
        <CapstoneSection key={`${c.cohort.slug}-${c.team.team}`} c={c} />
      ))}

      <p className='text-xs text-muted-foreground'>
        Counts cover the team&apos;s default branch (merge commits excluded), pull
        requests, reviews and issues during the term. Commits made under an email that
        isn&apos;t linked to this GitHub account aren&apos;t included. Want this page
        removed? Open an issue on the project&apos;s GitHub.
      </p>
    </div>
  );
}
