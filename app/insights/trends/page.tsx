import { TrendCharts } from '@/components/insights/sections';
import { getSummary } from '@/lib/data';
import { pageMetadata, trendsSeo } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(trendsSeo());

export default function TrendsPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  return <TrendCharts view={insightsView(summary)} />;
}
