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
      title='Which AI tools show up in the commit history'
      share={fingerprintsSeo()}
      intro={
        <p>
          Sometimes the AI signs its work. When a commit names an AI tool in a
          Co-authored-by line, we count it, so you can see which tools students used most.
        </p>
      }
      notes={[
        'Only tools that sign their commits show up. Claude Code adds a co-author line by default; most editor assistants do not.',
        'This undercounts. Most AI help happens in the editor and leaves no trace in the history.',
        'A repository that hasn’t been re-fetched since trailers were scanned counts as unknown, not zero.',
      ]}
    >
      <FingerprintCharts view={insightsView(summary)} />
    </InsightsPage>
  );
}
