import { InsightsPage } from '@/components/insights/InsightsPage';
import { FingerprintCharts } from '@/components/insights/sections';
import { getSummary } from '@/lib/data';
import { fingerprintsSeo, pageMetadata } from '@/lib/seo';
import { insightsView } from '@/lib/views';

export const metadata = pageMetadata(fingerprintsSeo());

export default function FingerprintsPage() {
  const summary = getSummary();
  if (!summary?.insights) return null;
  return (
    <InsightsPage
      title='Traces of AI in the commit history'
      intro={
        <p>
          Two signals GitHub can see: commits that name an AI tool as a co-author, and
          pull requests opened or reviewed by an AI bot. Both undercount, since most AI
          help happens in the editor before anything is committed.
        </p>
      }
    >
      <FingerprintCharts view={insightsView(summary)} />
    </InsightsPage>
  );
}
