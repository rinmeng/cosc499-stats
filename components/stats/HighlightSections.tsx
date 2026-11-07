import { Highlight, type HighlightProps } from '@/components/stats/Blocks';
import { MoreHighlights } from '@/components/stats/MoreHighlights';
import { fadeUp } from '@/utils/animations';

export interface HighlightSection {
  title: string;
  description?: string;
  /** Hidden behind "Show more highlights" */
  more?: boolean;
  /** null entries (e.g. live-only cards) and cards with no teams (and no `empty` text) are skipped */
  cards: (HighlightProps | null)[];
}

function SectionBlock({
  s,
}: {
  s: Omit<HighlightSection, 'cards'> & { cards: HighlightProps[] };
}) {
  return (
    <section className='space-y-3'>
      <div className={fadeUp(0)}>
        <h2 className='font-heading text-lg font-semibold'>{s.title}</h2>
        {s.description && (
          <p className='text-sm text-muted-foreground'>{s.description}</p>
        )}
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {s.cards.map((h, i) => (
          <Highlight key={h.title} {...h} className={fadeUp(i + 1)} />
        ))}
      </div>
    </section>
  );
}

/** Team highlights grouped by theme; some groups are tucked behind a "Show more" toggle. */
export function HighlightSections({ sections }: { sections: HighlightSection[] }) {
  const clean = sections
    .map((s) => ({
      ...s,
      cards: s.cards.filter(
        (h): h is HighlightProps => !!h && (h.items.length > 0 || !!h.empty)
      ),
    }))
    .filter((s) => s.cards.length > 0);
  const shown = clean.filter((s) => !s.more);
  const hidden = clean.filter((s) => s.more);

  return (
    <div className='space-y-8'>
      {shown.map((s) => (
        <SectionBlock key={s.title} s={s} />
      ))}
      <MoreHighlights
        count={hidden.reduce((a, s) => a + s.cards.length, 0)}
        className={fadeUp(4)}
      >
        {hidden.map((s) => (
          <SectionBlock key={s.title} s={s} />
        ))}
      </MoreHighlights>
    </div>
  );
}
