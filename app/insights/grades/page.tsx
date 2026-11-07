import Link from 'next/link';
import { CalendarRange, GraduationCap, Trophy, Users } from 'lucide-react';

import { ExternalLink } from '@/components/ExternalLink';
import { GradeExplorer } from '@/components/charts/GradeExplorer';
import { GradeTrendChart } from '@/components/charts/GradeTrendChart';
import { Reveal } from '@/components/Reveal';
import { ShareButton } from '@/components/ShareDialog';
import { Grid, PageHeader, Section, StatTile } from '@/components/stats/Blocks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSummary } from '@/lib/data';
import { fmt, pct } from '@/lib/format';
import { gradesSeo, pageMetadata } from '@/lib/seo';
import { gradesView } from '@/lib/views';
import { fadeUp, stagger } from '@/utils/animations';

export const metadata = pageMetadata(gradesSeo());

const PAIR_URL =
  'https://reports.im.it.ubc.ca/t/Learner/views/GradeDistributionReport/GradeDistributionReport';

export default function GradesPage() {
  const summary = getSummary();
  const seo = gradesSeo();
  const view = summary ? gradesView(summary) : null;

  if (!view || view.sessions.length === 0)
    return (
      <PageHeader title='How COSC 499 classes finished'>
        This page appears after grade data is synced (pnpm sync:grades).
      </PageHeader>
    );

  const t = view.totals;
  const unlisted = view.sessions
    .filter((x) => !x.grades.instructors.length)
    .map((x) => x.label)
    .reverse();
  const next = stagger(3);

  return (
    <div className='space-y-8'>
      <PageHeader
        action={
          <ShareButton
            item={{ path: seo.path, title: seo.title, description: seo.description }}
          />
        }
        title='How COSC 499 classes finished'
      >
        <p>
          Final grades for every COSC 499 session since {t.since}, from UBC’s public grade
          reports: how big each class was, how it finished and who taught it.
        </p>
        <div className='mt-4 space-y-1.5'>
          <div className='text-xs font-medium tracking-wider uppercase'>
            Things to know
          </div>
          <ul className='list-disc space-y-1 pl-5 text-sm'>
            <li>
              Grades are course-wide. They are never linked to a team, a repository or a
              person.
            </li>
            <li>
              UBC PAIR hides any grade range with fewer than 6 students, and everything
              under 55% is shown as one range.
            </li>
            <li>
              Sessions up to 2020 may list TAs with the instructors.
              {unlisted.length > 0 &&
                ` PAIR lists no instructor for ${unlisted.join(' or ')}.`}
            </li>
          </ul>
        </div>
      </PageHeader>

      <Grid className='grid-cols-2 lg:grid-cols-4'>
        <StatTile
          className={next()}
          icon={Users}
          label='Students graded'
          value={fmt(t.students)}
          unit='students'
          hint={`across ${t.sessions} sessions`}
        />
        <StatTile
          className={next()}
          icon={CalendarRange}
          label='Sessions'
          value={fmt(t.sessions)}
          unit='sessions'
          hint={`year-long and summer, since ${t.since}`}
        />
        {t.largest && (
          <StatTile
            className={next()}
            icon={Trophy}
            label='Largest class'
            value={fmt(t.largest.grades.students)}
            unit='students'
            hint={t.largest.label}
          />
        )}
        <StatTile
          className={next()}
          icon={GraduationCap}
          label='Finished with 80%+'
          value={pct(t.share80)}
          unit='of students'
          hint='every session together'
        />
      </Grid>

      <Reveal className={next()}>
        <GradeTrendChart view={view} />
      </Reveal>

      <Reveal className={next()}>
        <GradeExplorer sessions={view.sessions} />
      </Reveal>

      <Section
        className={next()}
        title='Who taught each session'
        description='As listed by UBC PAIR.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Taught by</TableHead>
              <TableHead className='text-right'>Students</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.sessions.map((x) => (
              <TableRow key={x.slug}>
                <TableCell className='font-medium'>
                  <Link href={`/${x.slug}`} className='hover:underline'>
                    {x.label}
                  </Link>
                </TableCell>
                <TableCell className='whitespace-normal text-muted-foreground'>
                  {x.grades.instructors.join(', ') || 'Not listed'}
                </TableCell>
                <TableCell className='text-right font-mono tabular-nums'>
                  {fmt(x.grades.students)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <p className={`text-sm text-muted-foreground ${fadeUp(12)}`}>
        Source: the{' '}
        <ExternalLink href={PAIR_URL}>UBC PAIR grade distribution report</ExternalLink>,
        via the{' '}
        <ExternalLink href='https://github.com/DonneyF/ubc-pair-grade-data'>
          ubc-pair-grade-data
        </ExternalLink>{' '}
        dataset. It is updated about once a year, so the newest session may be missing.
      </p>
    </div>
  );
}
