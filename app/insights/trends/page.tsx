import { InsightsPage } from '@/components/insights/InsightsPage';
import { TrendCharts } from '@/components/insights/sections';
import { getSummary } from '@/lib/data';
import { pageMetadata, trendsSeo } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(trendsSeo());

export default function TrendsPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  const view = insightsView(summary);
  const current = summary.cohorts.find((c) => c.isCurrent)?.label ?? 'this year';
  return (
    <InsightsPage
      title='Trends across the years'
      intro={
        <p>
          Same course, different rhythm. See how fast teams get going, how much of their
          work goes through pull requests, and whether they code late at night or on
          weekends.
        </p>
      }
      notes={[
        'Each point or line is one cohort, colored by its era.',
        `Time-based charts cover the same early stretch of term for every cohort, because ${current} is only ${view.windowWeek} weeks in.`,
        'Summer sessions are shorter, so they are scaled to line up with a full year.',
      ]}
    >
      <TrendCharts view={view} />
    </InsightsPage>
  );
}
