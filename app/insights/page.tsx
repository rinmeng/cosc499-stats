import { FindingText } from '@/components/insights/FindingText';
import { InsightsPage } from '@/components/insights/InsightsPage';
import { Findings, ImpactCharts } from '@/components/insights/sections';
import { Grid, StatTile } from '@/components/stats/Blocks';
import { getSummary } from '@/lib/data';
import { insightsSeo, pageMetadata } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(insightsSeo());

export default function InsightsImpactPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  const view = insightsView(summary);

  return (
    <InsightsPage
      title='How AI changed the way teams code'
      intro={
        <p>
          Cohort medians, compared across three eras: before AI, the Copilot and ChatGPT
          years (2022–23), and the agentic era (2024 on). Numbers are rates per team,
          never a raw total and never a person.
        </p>
      }
    >
      <div className='space-y-8'>
        <Findings items={view.findings.impact} />
        <Grid className='sm:grid-cols-3'>
          {view.ratios.map((ratio) => (
            <StatTile
              key={ratio.label}
              label={ratio.label}
              value={ratio.value}
              unit={ratio.unit}
              hint={<FindingText text={ratio.hint} />}
            />
          ))}
        </Grid>
        <ImpactCharts view={view} />
      </div>
    </InsightsPage>
  );
}
