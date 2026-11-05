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
      share={fingerprintsSeo()}
      intro={
        <p>
          Sometimes the AI signs its work. These charts count the commits and pull
          requests where it did, and which tools left their name.
        </p>
      }
      notes={[
        'Two signals: commits that name an AI tool in a Co-authored-by line, and pull requests opened or reviewed by an AI bot.',
        'Both undercount. Most AI help happens in the editor and leaves no trace in the history.',
        'A repository that hasn’t been re-fetched since trailers were scanned counts as unknown, not zero.',
      ]}
    >
      <FingerprintCharts view={insightsView(summary)} />
    </InsightsPage>
  );
}
