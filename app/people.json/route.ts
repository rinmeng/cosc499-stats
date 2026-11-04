import { peopleIndex } from '@/lib/people';

/** Search index for the navbar's people search, built once at build time. */
export const dynamic = 'force-static';

export function GET() {
  return Response.json(peopleIndex());
}
