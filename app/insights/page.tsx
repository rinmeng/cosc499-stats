import { FindingText } from '@/components/insights/FindingText';
import { InsightsPage } from '@/components/insights/InsightsPage';
import { Findings, ImpactCharts } from '@/components/insights/sections';
import { Grid, StatTile } from '@/components/stats/Blocks';
import { getSummary } from '@/lib/data';
import { fadeUp } from '@/utils/animations';
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
      share={insightsSeo()}
      intro={
        <p>
          Copilot and ChatGPT showed up in 2022 and coding agents in 2024. Here is what
          changed in how capstone teams write, review and ship code.
        </p>
      }
      notes={[
        'Three eras: before AI (2017–2021), the Copilot and ChatGPT years (2022–23), and the agentic era (2024 on).',
        'Every number is a rate per team, compared by cohort median. Never a raw total, never a person.',
        'A gap between eras isn’t proof that AI caused it. The course and its teams changed too.',
      ]}
    >
      <div className='space-y-8'>
        <Findings items={view.findings.impact} className={fadeUp(4)} />
        <Grid className='sm:grid-cols-3'>
          {view.ratios.map((ratio, i) => (
            <StatTile
              key={ratio.label}
              className={fadeUp(5 + i)}
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
