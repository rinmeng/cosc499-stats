import { FindingText } from '@/components/insights/FindingText';
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
  );
}
