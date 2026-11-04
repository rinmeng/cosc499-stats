import 'server-only';

import { getSummary } from '@/lib/data';
import { displayName } from '@/lib/format';
import type { CohortStats, PersonStats, TeamStats } from '@/lib/types/stats';
import { hiddenPeople } from '@/sync.config';

import { byTermStart } from '@/lib/views';

/** One capstone a person was part of: their own stats on that team. */
export interface Capstone {
  cohort: Pick<CohortStats, 'slug' | 'label' | 'session' | 'year' | 'isCurrent'>;
  team: Pick<TeamStats, 'team' | 'name'>;
  stats: PersonStats;
}

export interface Person {
  /** GitHub login as GitHub spells it */
  login: string;
  name: string;
  avatarUrl: string | null;
  /** Oldest first */
  capstones: Capstone[];
}

/** Entry in /people.json, the client-side search index. */
export interface PersonIndexEntry {
  login: string;
  name: string;
  /** Cohort labels, e.g. ["Summer 2024", "2024–25"] */
  cohorts: string[];
}

const hidden = new Set(hiddenPeople.map((l) => l.toLowerCase()));

/**
 * Everyone with a GitHub login, keyed by lowercase login. People whose commits
 * aren't linked to a GitHub account have no stable page, so they're left out.
 */
export function getPeople(): Map<string, Person> {
  const s = getSummary();
  const people = new Map<string, Person>();
  if (!s) return people;
  for (const c of [...s.cohorts].sort(byTermStart)) {
    for (const t of c.teams) {
      for (const m of t.members) {
        if (!m.login || hidden.has(m.login.toLowerCase())) continue;
        const key = m.login.toLowerCase();
        const p = people.get(key) ?? {
          login: m.login,
          name: displayName(m),
          avatarUrl: m.avatarUrl,
          capstones: [],
        };
        p.avatarUrl ??= m.avatarUrl;
        p.capstones.push({
          cohort: {
            slug: c.slug,
            label: c.label,
            session: c.session,
            year: c.year,
            isCurrent: c.isCurrent,
          },
          team: { team: t.team, name: t.name },
          stats: m,
        });
        people.set(key, p);
      }
    }
  }
  return people;
}

export function getPerson(login: string): Person | null {
  return getPeople().get(login.toLowerCase()) ?? null;
}

export function peopleIndex(): PersonIndexEntry[] {
  return [...getPeople().values()]
    .map((p) => ({
      login: p.login,
      name: p.name,
      cohorts: p.capstones.map((x) => x.cohort.label),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
