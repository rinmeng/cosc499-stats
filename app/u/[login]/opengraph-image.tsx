import { OG_SIZE, ogImage } from '@/lib/og';
import { getPeople, getPerson } from '@/lib/people';
import { personSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 capstone contributor';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return [...getPeople().values()].map((p) => ({ login: p.login }));
}

/** Name, latest team and cohort, and their own numbers from that capstone. */
export default async function Image({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  const p = getPerson(login);
  if (!p) return ogImage({ title: 'UBCO COSC 499' });
  const seo = personSeo(p);
  return ogImage({ title: seo.title, description: seo.subtitle, stats: seo.stats });
}
