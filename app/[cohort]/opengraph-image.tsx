import { getCohort, getSummary } from '@/lib/data';
import { OG_SIZE, ogImage } from '@/lib/og';
import { cohortSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 capstone cohort';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return getSummary()?.cohorts.map((c) => ({ cohort: c.slug })) ?? [];
}

export default async function Image({ params }: { params: Promise<{ cohort: string }> }) {
  const { cohort } = await params;
  const c = getCohort(cohort);
  return ogImage(c ? cohortSeo(c) : { title: 'UBCO COSC 499' });
}
