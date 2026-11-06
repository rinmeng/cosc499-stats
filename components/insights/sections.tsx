import { CohortTimelineChart } from '@/components/charts/CohortTimelineChart';
import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { EraCompareChart } from '@/components/charts/EraCompareChart';
import { HorizontalShareChart } from '@/components/charts/HorizontalShareChart';
import { StackedShareChart } from '@/components/charts/StackedShareChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InsightsView } from '@/lib/views';

import { FindingText } from './FindingText';
import { WHY } from './why';
import { WhyDialog } from './WhyDialog';

/** "Here's what we found": the tab's headline numbers as plain sentences. */
export function Findings({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Here’s what we found</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='grid gap-x-8 gap-y-3 text-sm text-muted-foreground md:grid-cols-2'>
          {items.map((item) => (
            <li key={item} className='flex gap-2.5'>
              <span
                aria-hidden
                className='mt-2 size-1.5 shrink-0 rounded-full bg-(--chart-3)'
              />
              <FindingText text={item} />
            </li>
          ))}
        </ul>
        <p className='mt-4 text-xs text-muted-foreground'>
          Agentic era (2024+) compared with the years before AI, using the median cohort.
          A difference between eras is not proof that AI caused it.
        </p>
      </CardContent>
    </Card>
  );
}

export function ImpactCharts({ view }: { view: InsightsView }) {
  // Two cards per row on desktop so the era bars stay close enough to compare.
  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <EraCompareChart
        compact
        title='Commit size'
        why={WHY.commitSize}
        series={view.commitSize}
      />
      <EraCompareChart
        compact
        title='Pull requests'
        why={WHY.pullRequests}
        series={view.pullRequests}
      />
      <EraCompareChart
        compact
        title='Output per person-week'
        why={WHY.output}
        series={view.output}
      />
      <EraCompareChart compact title='Ramp-up' why={WHY.ramp} series={view.ramp} />
      <EraCompareChart
        compact
        title='Review culture'
        why={WHY.review}
        series={view.review}
      />
      <CohortTimelineChart title='Churn' why={WHY.churn} series={view.churn} />
      <EraCompareChart
        compact
        title='Languages per team'
        why={WHY.languagesPerTeam}
        series={view.languagesPerTeam}
      />
      <StackedShareChart
        title='Languages by era'
        description='Share of code by language: the top six, plus everything else.'
        why={WHY.languages}
        rows={view.languages}
        nTeams={view.languageSample.nTeams}
        nCohorts={view.languageSample.nCohorts}
      />
    </div>
  );
}

export function FingerprintCharts({ view }: { view: InsightsView }) {
  return (
    <div className='space-y-4'>
      {!view.trailersScanned && (
        <Alert>
          <AlertTitle>AI co-author trailers are not scanned yet</AlertTitle>
          <AlertDescription>
            Sync reads commit messages for Co-authored-by lines and stores only the tool
            name. Until that re-fetch, this chart stays unknown. It does not show zero.
          </AlertDescription>
        </Alert>
      )}
      <HorizontalShareChart
        title='Which AI tools get named'
        description='Agentic era (2024 onward), by the tool named in the co-author line. Hover a bar for the commit and team counts.'
        why={WHY.tools}
        slices={view.tools[0]?.slices ?? []}
        nTeams={view.toolSample.nTeams}
        nCohorts={view.toolSample.nCohorts}
        empty='Not scanned yet'
      />
    </div>
  );
}

export function TrendCharts({ view }: { view: InsightsView }) {
  return (
    <div className='space-y-4'>
      <Findings items={view.findings.trends} />
      <CohortTrendChart
        series={view.curves}
        currentWeek={view.curveMid}
        markerLabel='Halfway'
        xUnit='term'
        title='When the work lands'
        description={`How each cohort’s early-term commits built up: the first ${view.curveSpan}% of its term, or about ${view.windowWeek} weeks of a full year. Summer is scaled to match.`}
        valueLabel={view.curveLabel}
        action={<WhyDialog title='When the work lands' why={WHY.curves} />}
      />
      <CohortTimelineChart
        title='Pull requests per 100 commits'
        why={WHY.prsPer100}
        series={view.prsPer100}
      />
      <CohortTimelineChart
        title='Weeks with a merged pull request'
        why={WHY.prWeeks}
        series={view.prWeeks}
      />
      <CohortTimelineChart title='Night owls' why={WHY.nightOwl} series={view.nightOwl} />
      <CohortTimelineChart title='Weekends' why={WHY.weekend} series={view.weekend} />
      <CohortTimelineChart
        title='Holidays and breaks'
        why={WHY.holiday}
        series={view.holiday}
      />
      <EraCompareChart
        title='Summer and winter'
        why={WHY.session}
        series={view.session}
      />
    </div>
  );
}
