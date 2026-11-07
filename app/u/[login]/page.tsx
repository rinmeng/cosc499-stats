import { notFound } from 'next/navigation';
import {
  ExternalLink,
  CalendarDays,
  CircleDot,
  FileCode2,
  GitMerge,
  GitPullRequest,
  MessageSquareCode,
} from 'lucide-react';

import { ArrowLink } from '@/components/ArrowLink';
import { ShareButton } from '@/components/ShareDialog';
import { Grid, PageHeader, Section, StatTile } from '@/components/stats/Blocks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fmt, fmtCompact, pct } from '@/lib/format';
import { getPeople, getPerson, type Capstone } from '@/lib/people';
import { pageMetadata, personSeo } from '@/lib/seo';
import { fadeUp } from '@/utils/animations';
import { cn } from '@/lib/utils';

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
  if (!p) return { title: 'Person not found', robots: { index: false } };
  return {
    ...pageMetadata(personSeo(p)),
    // Share previews work, but the page is kept out of search engines: it's found
    // through the site's own search, not by googling someone's name.
    robots: { index: false, follow: true },
  };
}

const share = (n: number, d: number) => (d ? n / d : 0);

/** `step` is this section's animation step; its stat tiles follow it. */
function CapstoneSection({ c, step }: { c: Capstone; step: number }) {
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
      className={fadeUp(step)}
      title={`${c.team.name} · ${c.cohort.label}`}
      description={
        <>
          {c.cohort.isCurrent ? 'In progress. ' : ''}
          <ArrowLink href={`/${c.cohort.slug}/${c.team.team}`}>
            See the team
          </ArrowLink> ·{' '}
          <ArrowLink href={`/${c.cohort.slug}`}>
            See the {c.cohort.label} cohort
          </ArrowLink>
        </>
      }
    >
      <div className='space-y-4'>
        <Grid className='grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-6'>
          <StatTile
            className={fadeUp(step + 1)}
            icon={GitPullRequest}
            label='Commits'
            value={fmt(m.commits)}
            unit='commits'
          />
          <StatTile
            className={fadeUp(step + 2)}
            icon={GitMerge}
            label='Merged PRs'
            value={fmt(m.prsMerged)}
            unit='PRs'
            hint={m.prsOpened ? `${fmt(m.prsOpened)} opened` : undefined}
          />
          <StatTile
            className={fadeUp(step + 3)}
            icon={MessageSquareCode}
            label='Code reviews'
            value={fmt(m.reviews)}
            unit='reviews'
          />
          <StatTile
            className={fadeUp(step + 4)}
            icon={CircleDot}
            label='Issues'
            value={fmt(m.issuesOpened)}
            unit='opened'
            hint={m.issuesClosed ? `${fmt(m.issuesClosed)} closed` : undefined}
          />
          <StatTile
            className={fadeUp(step + 5)}
            icon={FileCode2}
            label='Lines changed'
            value={fmtCompact(m.lines)}
            unit='lines'
            hint={`+${fmtCompact(m.additions)} / −${fmtCompact(m.deletions)}`}
          />
          <StatTile
            className={fadeUp(step + 6)}
            icon={CalendarDays}
            label='Active weeks'
            value={fmt(m.activeWeeks)}
            unit='weeks'
            hint='weeks with at least one commit'
          />
        </Grid>
        {habits.length > 0 && (
          <ul className={cn('flex flex-wrap gap-2 text-sm', fadeUp(step + 7))}>
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
        action={
          <ShareButton
            item={{
              path: personSeo(p).path,
              title: personSeo(p).title,
              description: personSeo(p).description,
            }}
          />
        }
        eyebrow='COSC 499 capstone'
        title={
          <span className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            <Avatar className='size-12 md:size-14'>
              {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt='' />}
              <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {p.name}
          </span>
        }
        meta={[
          <a
            key='gh'
            href={`https://github.com/${p.login}`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
          >
            @{p.login} <ExternalLink className='size-3.5' />
          </a>,
          `${n === 1 ? '1 capstone' : `${n} capstones`}: ${p.capstones
            .map((c) => c.cohort.label)
            .join(', ')}`,
        ]}
      />

      {p.capstones.map((c, i) => (
        <CapstoneSection key={`${c.cohort.slug}-${c.team.team}`} c={c} step={3 + i * 2} />
      ))}

      <p className={cn('text-xs text-muted-foreground', fadeUp(4 + n * 2))}>
        Counts cover the team&apos;s default branch (merge commits excluded), pull
        requests, reviews and issues during the term. Commits made under an email that
        isn&apos;t linked to this GitHub account aren&apos;t included. Want this page
        removed? Open an issue on the project&apos;s GitHub.
      </p>
    </div>
  );
}
