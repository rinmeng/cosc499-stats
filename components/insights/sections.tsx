import { CohortTimelineChart } from '@/components/charts/CohortTimelineChart';
import { EraShape } from '@/components/charts/EraShape';
import { CohortTrendChart } from '@/components/charts/CohortTrendChart';
import { EraCompareChart } from '@/components/charts/EraCompareChart';
import { StackedShareChart } from '@/components/charts/StackedShareChart';
import { Grid, StatTile } from '@/components/stats/Blocks';
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
  return (
    <div className='space-y-4'>
      <EraCompareChart
        title='Commit size'
        why={WHY.commitSize}
        series={view.commitSize}
      />
      <EraCompareChart
        title='Pull requests'
        why={WHY.pullRequests}
        series={view.pullRequests}
      />
      <EraCompareChart
        title='Output per person-week'
        why={WHY.output}
        series={view.output}
      />
      <CohortTimelineChart title='Churn' why={WHY.churn} series={view.churn} />
      <EraCompareChart title='Ramp-up' why={WHY.ramp} series={view.ramp} />
      <EraCompareChart title='Review culture' why={WHY.review} series={view.review} />
      <StackedShareChart
        title='Languages by era'
        description='Share of code by language: the top six, plus everything else.'
        why={WHY.languages}
        rows={view.languages}
        nTeams={view.languageSample.nTeams}
        nCohorts={view.languageSample.nCohorts}
      />
      <EraCompareChart
        title='Languages per team'
        why={WHY.languagesPerTeam}
        series={view.languagesPerTeam}
      />
    </div>
  );
}

export function FingerprintCharts({ view }: { view: InsightsView }) {
  return (
    <div className='space-y-4'>
      <Findings items={view.findings.fingerprints} />
      {!view.trailersScanned && (
        <Alert>
          <AlertTitle>AI co-author trailers are not scanned yet</AlertTitle>
          <AlertDescription>
            Sync reads commit messages for Co-authored-by lines and stores only the tool
            name. Until that re-fetch, this chart stays unknown. It does not show zero.
          </AlertDescription>
        </Alert>
      )}
      <CohortTimelineChart
        title='AI co-authors'
        why={WHY.trailers}
        series={view.trailers}
        empty='Not scanned yet'
      />
      <StackedShareChart
        title='Which tools get named'
        description='Agentic era, by the tool named in the co-author line.'
        why={WHY.tools}
        rows={view.tools}
        nTeams={view.toolSample.nTeams}
        nCohorts={view.toolSample.nCohorts}
        empty='Not scanned yet'
      />
      <div className='space-y-3'>
        <Grid className='sm:grid-cols-3'>
          {view.botTiles.map((tile) => (
            <StatTile
              key={tile.label}
              label={
                <span className='inline-flex items-center gap-1.5'>
                  <EraShape era={tile.era} size={11} />
                  {tile.label}
                </span>
              }
              value={tile.value}
              unit='of merged PRs'
              hint={tile.hint}
            />
          ))}
        </Grid>
        <CohortTimelineChart
          title='AI bots in the workflow'
          why={WHY.bots}
          series={view.bots}
        />
      </div>
    </div>
  );
}

export function TrendCharts({ view }: { view: InsightsView }) {
  return (
    <div className='space-y-4'>
      <Findings items={view.findings.trends} />
      <CohortTrendChart
        series={view.curves}
        currentWeek={view.windowWeek}
        title='When the work lands'
        description={`Running share of each cohort’s commits in weeks 0–${view.windowWeek}.`}
        valueLabel={view.curveLabel}
        action={<WhyDialog title='When the work lands' why={WHY.curves} />}
      />
      <CohortTimelineChart
        title='Pull request adoption'
        why={WHY.adoption}
        series={view.adoption}
      />
      <CohortTimelineChart
        title='Night owls through the years'
        why={WHY.habits}
        series={view.habits}
      />
      <EraCompareChart
        title='Summer and winter'
        why={WHY.session}
        series={view.session}
      />
    </div>
  );
}
