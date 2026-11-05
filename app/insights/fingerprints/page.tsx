import { FingerprintCharts } from '@/components/insights/sections';
import { getSummary } from '@/lib/data';
import { fingerprintsSeo, pageMetadata } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(fingerprintsSeo());

export default function FingerprintsPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  return <FingerprintCharts view={insightsView(summary)} />;
}
