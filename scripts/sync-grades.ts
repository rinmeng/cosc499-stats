/**
 * Fetch COSC 499 grade data (UBC PAIR, via https://ubcgrades.com/api) for every
 * cohort session into data/raw/pair/<yearsession>.json.
 *
 *   pnpm sync:grades           fetch sessions we don't have yet
 *   pnpm sync:grades --force   re-fetch every session
 *
 * The API serves https://github.com/DonneyF/ubc-pair-grade-data, which is updated
 * about once a year. v3 covers 2021S onward; older sessions come from v2.
 * Sessions PAIR hasn't published yet are skipped and picked up on a later run.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { cohorts } from '../sync.config';

const API = 'https://ubcgrades.com/api';
const PAIR_DIR = path.join(process.cwd(), 'data', 'raw', 'pair');
const force = process.argv.includes('--force');

/** Where the numbers come from, stored in every file. */
const source = (version: string) => ({
  origin: 'UBC PAIR Grade Distribution Report',
  dataset: 'https://github.com/DonneyF/ubc-pair-grade-data',
  api: `${API}/${version}`,
  fetchedAt: new Date().toISOString().slice(0, 10),
});

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'cosc499-stats' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function main() {
  const [v3Sessions, v2Sessions] = await Promise.all(
    ['v3', 'v2'].map((v) => getJson<string[]>(`${API}/${v}/yearsessions/UBCO`))
  );

  mkdirSync(PAIR_DIR, { recursive: true });
  let fetched = 0;

  for (const c of cohorts) {
    const ys = `${c.year}${c.session === 'summer' ? 'S' : 'W'}`;
    const file = path.join(PAIR_DIR, `${ys}.json`);
    if (!force && existsSync(file)) continue;

    const version = v3Sessions.includes(ys)
      ? 'v3'
      : v2Sessions.includes(ys)
        ? 'v2'
        : null;
    if (!version) {
      console.log(`${ys}  not published by PAIR yet, skipped`);
      continue;
    }

    const sections = await getJson<unknown[]>(
      `${API}/${version}/grades/UBCO/${ys}/COSC/499`
    );
    writeFileSync(
      file,
      JSON.stringify({ yearsession: ys, source: source(version), sections }, null, 2) +
        '\n'
    );
    console.log(`${ys}  ${sections.length} rows (${version})`);
    fetched++;
  }

  console.log(`Done: ${fetched} session(s) written to data/raw/pair/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
