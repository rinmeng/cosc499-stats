import { InsightsPage } from '@/components/insights/InsightsPage';
import { TrendCharts } from '@/components/insights/sections';
import { getSummary } from '@/lib/data';
import { pageMetadata, trendsSeo } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(trendsSeo());

export default function TrendsPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  return (
    <InsightsPage
      title='Trends across the years'
      intro={
        <p>
          How the rhythm of the work has changed: when it lands in the term, how much goes
          through pull requests, and when teams commit. Each point is one cohort, colored
          by its era.
        </p>
      }
    >
      <TrendCharts view={insightsView(summary)} />
    </InsightsPage>
  );
}
