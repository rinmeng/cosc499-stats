import { ExternalLink } from 'lucide-react';

import { ShareButton } from '@/components/ShareDialog';
import { SmallCohortsDialog } from '@/components/insights/SmallCohortsDialog';
import { PageHeader } from '@/components/stats/Blocks';
import { contributingUrl } from '@/components/stats/HelpComplete';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getSummary } from '@/lib/data';
import type { ShareItem } from '@/lib/types';
import { insightsView } from '@/lib/views';

/**
 * Shared frame for the insights pages: this page's own header, a one-line note on
 * faded cohorts, the page content, and the methodology accordion. Each page passes its own
 * title and intro so the three tabs don't share a heading.
 */
export function InsightsPage({
  title,
  share,
  intro,
  notes,
  children,
}: {
  title: string;
  /** Link preview for the Share button (the page's SEO title, description and path) */
  share: ShareItem;
  intro: React.ReactNode;
  /** Short caveats shown under the intro as "Things to know" */
  notes?: React.ReactNode[];
  children: React.ReactNode;
}) {
  const summary = getSummary();
  if (!summary?.insights) {
    return (
      <PageHeader eyebrow='Insights' title={title}>
        This page appears after the dataset is aggregated.
      </PageHeader>
    );
  }

  const view = insightsView(summary);
  const current = summary.cohorts.find((c) => c.isCurrent)?.label ?? 'the current cohort';

  return (
    <div className='space-y-8'>
      <PageHeader
        eyebrow='Insights'
        title={
          <span className='flex flex-wrap items-center gap-x-4 gap-y-2'>
            {title}
            <ShareButton
              item={{
                path: share.path,
                title: share.title,
                description: share.description,
              }}
            />
          </span>
        }
      >
        {intro}
        {notes && notes.length > 0 && (
          <div className='mt-4 space-y-1.5'>
            <div className='text-xs font-medium tracking-wider uppercase'>
              Things to know
            </div>
            <ul className='list-disc space-y-1 pl-5 text-sm'>
              {notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </PageHeader>

      {view.faded.length > 0 && (
        <p className='text-sm text-muted-foreground'>
          <SmallCohortsDialog cohorts={view.faded} />{' '}
          {view.faded.length === 1 ? 'is' : 'are'} too small to move the medians, so{' '}
          {view.faded.length === 1 ? 'it is' : 'they are'} drawn faded and left out of
          every era median. Repositories that were deleted or made private are missing.
          Click{' '}
          <a
            href={contributingUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 font-medium text-foreground'
          >
            here
            <ExternalLink className='size-3.5' />
          </a>{' '}
          to add a missing team.
        </p>
      )}

      {children}

      <Accordion>
        <AccordionItem value='normalize'>
          <AccordionTrigger>How we normalize</AccordionTrigger>
          <AccordionContent>
            <p>
              Cohorts range from one team to more than twenty, so raw totals would mostly
              measure how many repositories we can still see. Every metric is a rate on a
              team (per commit, per pull request, or per person-week). The cohort number
              is the median of its teams. The era number is the median of those cohort
              numbers, so each cohort counts once.
            </p>
            <p>
              Cohorts with fewer than three teams are drawn faded and left out of the era
              median. The whisker on each bar is an 80% bootstrap interval: resample the
              cohorts, then the teams inside them. The tooltip also shows the median of
              the teams pooled together.
            </p>
            <p>
              Time-based charts use weeks 0–{view.windowWeek} for every cohort, because{' '}
              {current} is only that far in. The commit curve uses the same share of each
              cohort’s own term instead, so summer lines up with a full year. Full-term
              charts draw that cohort as a hollow dot and leave it out of the median.
            </p>
            <p>
              Summer sessions are mixed in, with weekly rates scaled to a full year. A
              summer capstone runs about {view.termScale.summerWeeks} weeks and a full
              year about {view.termScale.fullYearWeeks}, and summer is often a student’s
              only class, so the same project is packed into fewer weeks. A summer
              commits-per-week figure is multiplied by {view.termScale.summerWeeks}/
              {view.termScale.fullYearWeeks} before it joins an era. Shares, such as
              reviews or languages, are not scaled.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='ai'>
          <AccordionTrigger>What counts as AI-assisted</AccordionTrigger>
          <AccordionContent>
            <p>
              Two signals, both incomplete. A co-author trailer is a Co-authored-by line
              that names Claude, Copilot, Cursor, Codex, Gemini, Aider, or Devin. Sync
              reads the commit message to find those names and does not store the message.
              A repository that has not been re-fetched is unknown, not zero.
            </p>
            <p>
              A bot signal is a merged pull request opened by, or reviewed by, Copilot,
              Copilot SWE agent, the Copilot reviewer, or Cursor’s agent. Those accounts
              are still excluded from every human total on the rest of the site.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value='limits'>
          <AccordionTrigger>Limits</AccordionTrigger>
          <AccordionContent>
            <p>
              A difference between eras is not a cause. Courses changed, team sizes
              changed, and so did what instructors asked for. Missing repositories make
              some years look smaller than they were; those years are the faded dots, and
              they do not enter the medians.
            </p>
            <p>
              Trailers only exist when someone left one. Plenty of AI-assisted commits
              have no trailer, and a trailer does not say how the tool was used. Pull
              request rates are proxies, because a commit is not stored as belonging to a
              pull request.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
