import { getCohort, getSummary, getTeam } from '@/lib/data';
import { OG_SIZE, ogImage } from '@/lib/og';
import { teamSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 capstone team';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return (
    getSummary()?.cohorts.flatMap((c) =>
      c.teams.map((t) => ({ cohort: c.slug, team: String(t.team) }))
    ) ?? []
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ cohort: string; team: string }>;
}) {
  const { cohort, team } = await params;
  const c = getCohort(cohort);
  const t = getTeam(cohort, Number(team));
  return ogImage(c && t ? teamSeo(c, t) : { title: 'UBCO COSC 499' });
}
