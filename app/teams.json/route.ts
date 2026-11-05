import { teamIndex } from '@/lib/people';

/** Search index for the navbar's team search, built once at build time. */
export const dynamic = 'force-static';

export function GET() {
  return Response.json(teamIndex());
}
