/**
 * Turn data/raw/** into data/summary.json, which is the only file the site reads.
 * Pure: no network calls. Run with `pnpm aggregate`.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { TZDate } from '@date-fns/tz';
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  getDay,
  getHours,
  isMonday,
  nextDay,
  nextMonday,
  previousMonday,
  subDays,
  subWeeks,
  type Day,
} from 'date-fns';

import {
  hoursBetween,
  isoDate,
  isoTimestamp,
  LOCAL,
  parseDate,
  weeksSince,
} from '../lib/dates';

import type { CohortGrades, GradeBucket, RawPairFile } from '../lib/types/grades';
import type {
  CohortStats,
  PersonStats,
  RawRepo,
  Summary,
  TeamStats,
  WeekPoint,
} from '../lib/types/stats';
import {
  cohortDir,
  cohortSlug,
  cohorts,
  currentCohort,
  currentYear,
  teamPattern,
  excludeLogins,
  repoExclude,
  lineOutlierThreshold,
  scoreWeights,
  staffTeamShare,
  teamworkBonus,
  termLeadWeeks,
  timezone,
  topN,
} from '../sync.config';
import { buildInsights } from './insights';

/** PRs touching more files than this are almost always vendored/generated code. */
const MEGA_PR_CAP = 1000;
/** Commits bigger than this (lines) are treated as vendored/generated for "biggest commit". */
const BIGGEST_COMMIT_CAP = 20000;

const DATA_DIR = path.join(process.cwd(), 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');

/* --------------------------------- Helpers -------------------------------- */

/** Sunday on/before the first Monday of September (winter) or May (summer), in UTC. */
function termStartFor(year: number, summer = false): Date {
  const first = utcDay(year, summer ? 4 : 8, 1);
  return subDays(isMonday(first) ? first : nextMonday(first), 1);
}

const BOT_NAME = /\[bot\]|github[- ]?actions?|dependabot|github classroom/i;

const isBot = (login: string) =>
  login.endsWith('[bot]') ||
  excludeLogins.some((x) => x.toLowerCase() === login.toLowerCase());

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function gini(values: number[]): number {
  const xs = values.filter((v) => v >= 0).sort((a, b) => a - b);
  const n = xs.length;
  const sum = xs.reduce((a, b) => a + b, 0);
  if (n < 2 || sum === 0) return 0;
  let acc = 0;
  xs.forEach((x, i) => (acc += (2 * (i + 1) - n - 1) * x));
  return acc / (n * sum);
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Teamwork bonus: up to `teamworkBonus.rate` of the team's points, for sharing the
 * work evenly. Collaboration (1 − Gini) can't go below 1/n, so it's rescaled to 0–1
 * per team size first; otherwise small teams would get a head start.
 */
function bonusFor(score: number, collaboration: number, n: number): number {
  if (n < teamworkBonus.minContributors) return 0;
  const adjusted = Math.max(0, (collaboration - 1 / n) / (1 - 1 / n));
  // Rounded down so no team ever gets more than the rate.
  return Math.floor(score * teamworkBonus.rate * adjusted);
}

/** Weekday (0 = Sun) and hour of a timestamp in the configured timezone. */
function localSlot(iso: string): { dow: number; hour: number } {
  const d = parseDate(iso);
  return { dow: getDay(d, { in: LOCAL }), hour: getHours(d, { in: LOCAL }) };
}

/** Local calendar date as YYYY-MM-DD in the configured timezone. */
const localDate = (iso: string) => isoDate(parseDate(iso), LOCAL);

/** A UTC calendar day (month is 0-based), optionally at a time of day. */
const utcDay = (year: number, month: number, day: number, h = 0, m = 0, s = 0) =>
  new TZDate(year, month, day, h, m, s, 'UTC');

/** The nth weekday (0 = Sun) of a month, UTC. */
function nthWeekday(year: number, month: number, dow: Day, n: number): Date {
  const first = nextDay(subDays(utcDay(year, month, 1), 1), dow);
  return addWeeks(first, n - 1);
}
const range = (from: Date, days: number) =>
  eachDayOfInterval({ start: from, end: addDays(from, days - 1) }).map((d) => isoDate(d));

/**
 * BC / UBCO holidays and breaks that fall inside a session, as local dates.
 * Winter: Thanksgiving, Dec 24–26, Dec 31–Jan 1, Family Day reading week (Mon–Fri).
 * Summer: Victoria Day, Canada Day, BC Day.
 */
function holidaysFor(year: number, summer: boolean): Set<string> {
  if (summer) {
    const may24 = utcDay(year, 4, 24);
    const victoria = isMonday(may24) ? may24 : previousMonday(may24);
    return new Set([
      isoDate(victoria),
      `${year}-07-01`,
      isoDate(nthWeekday(year, 7, 1, 1)),
    ]);
  }
  const y2 = year + 1;
  return new Set([
    isoDate(nthWeekday(year, 9, 1, 2)), // Thanksgiving
    `${year}-12-24`,
    `${year}-12-25`,
    `${year}-12-26`,
    `${year}-12-31`,
    `${y2}-01-01`,
    ...range(nthWeekday(y2, 1, 1, 3), 5), // reading week (Family Day week)
  ]);
}

/** Final exam periods (winter only): mid-December and mid-to-late April. */
function examDaysFor(year: number, summer: boolean): Set<string> {
  if (summer) return new Set();
  return new Set([
    ...range(utcDay(year, 11, 8), 14),
    ...range(utcDay(year + 1, 3, 11), 17),
  ]);
}

const emptyPunch = () => Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);

/** Key a commit author: login when linked, otherwise a normalized email/name. */
function authorKey(login: string | null, email: string | null, name: string | null) {
  if (login) return login.toLowerCase();
  if (email && !email.endsWith('noreply.github.com'))
    return `email:${email.toLowerCase()}`;
  return `name:${(name ?? 'unknown').toLowerCase()}`;
}

/* --------------------------------- Grades --------------------------------- */

/** PAIR buckets merged into one "under 55" bar, so no single low result stands out. */
const LOW_BUCKETS = new Set(['<50%', '50-54%']);

/** The cohort's COSC 499 grades from data/raw/pair/<yearsession>.json, if present. */
function loadGrades(cfg: (typeof cohorts)[number]): CohortGrades | null {
  const ys = `${cfg.year}${cfg.session === 'summer' ? 'S' : 'W'}`;
  const file = path.join(RAW_DIR, 'pair', `${ys}.json`);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, 'utf8')) as RawPairFile;

  const sections = raw.sections.filter((s) => s.section !== 'OVERALL');
  // Use the OVERALL roll-up when there is one, otherwise the only section.
  const row =
    raw.sections.find((s) => s.section === 'OVERALL') ??
    (sections.length === 1 ? sections[0] : null);
  if (!row) return null;

  const instructors = [
    ...new Set(
      sections.flatMap((s) =>
        (s.educators ?? '')
          .split(';')
          .map((n) => n.trim())
          .filter(Boolean)
      )
    ),
  ];

  // PAIR hides (null) any range with fewer than 6 students.
  let under55: number | null = null;
  const buckets: GradeBucket[] = [];
  for (const [range, count] of Object.entries(row.grades)) {
    if (LOW_BUCKETS.has(range)) {
      if (count !== null) under55 = (under55 ?? 0) + count;
      continue;
    }
    const [from, to] = range.replace('%', '').split('-').map(Number);
    buckets.push({ label: `${from}–${to}`, from, count });
  }
  buckets.push({ label: '<55', from: 0, count: under55 });
  buckets.sort((a, b) => a.from - b.from);

  const shown = buckets.reduce((a, b) => a + (b.count ?? 0), 0);
  const students = row.enrolled ?? row.reported ?? shown;
  const at80 = buckets
    .filter((b) => b.from >= 80)
    .reduce((a, b) => a + (b.count ?? 0), 0);
  // Section rows carry the median and percentiles; OVERALL rows don't.
  const single = sections.length === 1 ? sections[0] : null;
  const pick = (k: 'median' | 'percentile_25' | 'percentile_75') =>
    row[k] ?? single?.[k] ?? null;

  return {
    yearsession: ys,
    instructors,
    students,
    hidden: Math.max(students - shown, 0),
    sections: sections.length,
    average: round(row.average, 1),
    median: pick('median'),
    p25: pick('percentile_25'),
    p75: pick('percentile_75'),
    high: row.high,
    stdev: row.stdev == null ? null : round(row.stdev, 1),
    share80: students ? round(at80 / students) : 0,
    share80IsMin: buckets.some((b) => b.from >= 80 && b.count === null),
    buckets,
    source: { dataset: raw.source.dataset, fetchedAt: raw.source.fetchedAt },
  };
}

/* ---------------------------------- Main ---------------------------------- */

function loadRaw(org: string): RawRepo[] {
  const dir = path.join(RAW_DIR, org);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')) as RawRepo)
    .filter((repo) => !repoExclude.some((re) => re.test(repo.name)));
}

function buildCohort(cfg: (typeof cohorts)[number], now: Date): CohortStats | null {
  const repos = loadRaw(cohortDir(cfg));
  const summer = cfg.session === 'summer';
  const slug = cohortSlug(cfg);

  const termStart = termStartFor(cfg.year, summer);
  const windowStart = subWeeks(termStart, termLeadWeeks);
  // Winter runs to the end of the following May; summer to mid-September.
  const windowEnd = summer
    ? utcDay(cfg.year, 8, 15, 23, 59, 59)
    : utcDay(cfg.year + 1, 4, 31, 23, 59, 59);
  const inWindow = (iso: string | null) => {
    if (!iso) return false;
    const t = parseDate(iso);
    return t >= windowStart && t <= windowEnd;
  };
  const weekOf = (iso: string) => weeksSince(iso, termStart);
  const weekStart = (w: number) => isoDate(addWeeks(termStart, w));

  const nowWeek = weeksSince(now, termStart);
  // Last week of classes: end of April (winter) or mid-August (summer).
  const termEndWeek = weeksSince(
    summer ? utcDay(cfg.year, 7, 15) : utcDay(cfg.year + 1, 3, 30),
    termStart
  );
  const isCurrent = slug === currentCohort;
  const holidays = holidaysFor(cfg.year, summer);
  const examDays = examDaysFor(cfg.year, summer);

  /* Staff detection: logins committing to many different teams in one cohort. */
  const teamsByLogin = new Map<string, Set<number>>();
  for (const r of repos)
    for (const c of r.commits) {
      if (!c.login || !inWindow(c.date)) continue;
      const k = c.login.toLowerCase();
      if (!teamsByLogin.has(k)) teamsByLogin.set(k, new Set());
      teamsByLogin.get(k)!.add(r.team);
    }
  const teamCount = new Set(repos.map((r) => r.team)).size;
  const staff = new Set(
    [...teamsByLogin]
      .filter(
        ([, t]) => teamCount >= 4 && t.size >= Math.max(3, teamCount * staffTeamShare)
      )
      .map(([k]) => k)
  );
  const skip = (login: string | null) =>
    !!login && (isBot(login) || staff.has(login.toLowerCase()));

  /* Group repos by team */
  const byTeam = new Map<number, RawRepo[]>();
  for (const r of repos) {
    if (!byTeam.has(r.team)) byTeam.set(r.team, []);
    byTeam.get(r.team)!.push(r);
  }

  const teams: TeamStats[] = [];
  const cohortPunch = emptyPunch();
  const cohortWeekly = new Map<number, WeekPoint>();
  const cohortLang = new Map<string, number>();
  const cohortMergeHours: number[] = [];
  // Per term week, for the in-progress "this week" tiles.
  const mergeHoursByWeek = new Map<number, number[]>();
  const linesByWeek = new Map<number, number>();
  let cohortMerged = 0;
  let cohortReviewed = 0;

  for (const [team, teamRepos] of [...byTeam].sort((a, b) => a[0] - b[0])) {
    const people = new Map<string, PersonStats & { weeks: Set<number> }>();
    const person = (key: string, login: string | null, name: string | null) => {
      let p = people.get(key);
      if (!p) {
        p = {
          id: key,
          login,
          name,
          avatarUrl: login ? `https://github.com/${login}.png?size=96` : null,
          commits: 0,
          additions: 0,
          deletions: 0,
          lines: 0,
          prsOpened: 0,
          prsMerged: 0,
          prsClosed: 0,
          reviews: 0,
          issuesOpened: 0,
          issuesClosed: 0,
          issues: 0,
          activeWeeks: 0,
          score: 0,
          activity: 0,
          nightActivity: 0,
          earlyActivity: 0,
          witchingActivity: 0,
          holidayActivity: 0,
          biggestCommit: 0,
          weeks: new Set(),
        };
        people.set(key, p);
      }
      if (!p.name && name) p.name = name;
      return p;
    };

    const weekly = new Map<number, WeekPoint>();
    const wp = (w: number) => {
      if (!weekly.has(w))
        weekly.set(w, {
          week: w,
          start: weekStart(w),
          commits: 0,
          prs: 0,
          reviews: 0,
          score: 0,
          activity: 0,
        });
      return weekly.get(w)!;
    };
    const punch = emptyPunch();
    const langs = new Map<string, number>();
    const mergeHours: number[] = [];
    let merged = 0;
    let reviewed = 0;
    let activity = 0;
    let holidayActivity = 0;
    let examActivity = 0;
    let witchingActivity = 0;
    /** lines changed on the default branch this week (outlier commits skipped) */
    let thisWeekLines = 0;
    /** points since Sunday per author key (merged with the people map below) */
    const thisWeekByAuthor = new Map<string, number>();
    const weekPts = (key: string, iso: string, pts: number) => {
      if (weekOf(iso) === nowWeek)
        thisWeekByAuthor.set(key, (thisWeekByAuthor.get(key) ?? 0) + pts);
    };
    // This team's lines and merge times by term week, for the team's "this week" tiles.
    const teamLinesByWeek = new Map<number, number>();
    const teamMergeHoursByWeek = new Map<number, number[]>();
    let thisWeekIssuesClosed = 0;
    let thisWeekActivity = 0;
    let thisWeekNight = 0;
    let thisWeekEarly = 0;
    let thisWeekWeekend = 0;
    let night = 0;
    let early = 0;
    let weekend = 0;
    /** commits per local calendar day, for the team's biggest day */
    const perDay = new Map<string, number>();
    type PrPick = { number: number; repo: string; value: number } | null;
    let fastest: PrPick = null;
    let slowest: PrPick = null;
    let mega: PrPick = null;
    let closedUnmerged = 0;
    let discussion = 0;
    let issuesTotal = 0;
    let issuesClosedCount = 0;
    let openPrs = 0;
    let openIssues = 0;
    let last: string | null = null;
    const touch = (iso: string | null) => {
      if (iso && (!last || iso > last)) last = iso;
    };
    /**
     * One timed action (commit, PR opened, PR merged, review, issue opened) for the
     * rhythm stats: punchcard, night / early / weekend, 3 am, holidays and exams.
     * `p` is who did it, or null when GitHub doesn't say (the team still gets it).
     */
    const act = (iso: string, p: PersonStats | null) => {
      const { dow, hour } = localSlot(iso);
      const day = localDate(iso);
      const isNight = hour >= 22 || hour < 4;
      const isEarly = hour >= 5 && hour < 9;
      const isWeekend = dow === 0 || dow === 6;
      punch[dow][hour]++;
      activity++;
      wp(weekOf(iso)).activity++;
      if (isNight) night++;
      if (isEarly) early++;
      if (isWeekend) weekend++;
      if (hour === 3) witchingActivity++;
      if (holidays.has(day)) holidayActivity++;
      if (examDays.has(day)) examActivity++;
      if (weekOf(iso) === nowWeek) {
        thisWeekActivity++;
        if (isNight) thisWeekNight++;
        if (isEarly) thisWeekEarly++;
        if (isWeekend) thisWeekWeekend++;
      }
      if (!p) return;
      p.activity++;
      if (isNight) p.nightActivity++;
      if (isEarly) p.earlyActivity++;
      if (hour === 3) p.witchingActivity++;
      if (holidays.has(day)) p.holidayActivity++;
    };

    for (const repo of teamRepos) {
      for (const [lang, bytes] of Object.entries(repo.languages))
        langs.set(lang, (langs.get(lang) ?? 0) + bytes);

      const seen = new Set<string>();
      for (const c of repo.commits) {
        if (seen.has(c.oid) || !inWindow(c.date) || skip(c.login)) continue;
        if (BOT_NAME.test(`${c.name ?? ''} ${c.email ?? ''}`)) continue;
        seen.add(c.oid);
        const key = authorKey(c.login, c.email, c.name);
        const p = person(key, c.login, c.name);
        p.commits++;
        if (c.additions + c.deletions <= lineOutlierThreshold) {
          p.additions += c.additions;
          p.deletions += c.deletions;
        }
        const w = weekOf(c.date);
        if (c.additions + c.deletions <= lineOutlierThreshold) {
          linesByWeek.set(w, (linesByWeek.get(w) ?? 0) + c.additions + c.deletions);
          teamLinesByWeek.set(
            w,
            (teamLinesByWeek.get(w) ?? 0) + c.additions + c.deletions
          );
          if (w === nowWeek) thisWeekLines += c.additions + c.deletions;
        }
        p.weeks.add(w);
        wp(w).commits++;
        wp(w).score += scoreWeights.commits;
        act(c.date, p);
        weekPts(key, c.date, scoreWeights.commits);
        const day = localDate(c.date);
        perDay.set(day, (perDay.get(day) ?? 0) + 1);
        // Biggest hand-written commit: skip huge ones that are vendored/generated code.
        const size = c.additions + c.deletions;
        if (size <= BIGGEST_COMMIT_CAP && size > p.biggestCommit) p.biggestCommit = size;
        touch(c.date);
      }

      for (const pr of repo.prs) {
        if (!inWindow(pr.createdAt)) continue;
        if (pr.state === 'OPEN') openPrs++;
        if (pr.state === 'CLOSED' && !pr.mergedAt) closedUnmerged++;
        if (!skip(pr.login))
          act(
            pr.createdAt,
            pr.login ? person(pr.login.toLowerCase(), pr.login, null) : null
          );
        // Merging is an action of whoever pressed the button (bots and staff skipped).
        if (pr.mergedAt && inWindow(pr.mergedAt) && !skip(pr.mergedBy))
          act(
            pr.mergedAt,
            pr.mergedBy ? person(pr.mergedBy.toLowerCase(), pr.mergedBy, null) : null
          );
        if (pr.login && !skip(pr.login)) {
          const p = person(pr.login.toLowerCase(), pr.login, null);
          p.prsOpened++;
          p.weeks.add(weekOf(pr.createdAt));
          if (pr.mergedAt && inWindow(pr.mergedAt)) {
            p.prsMerged++;
            wp(weekOf(pr.mergedAt)).score += scoreWeights.prsMerged;
            weekPts(pr.login.toLowerCase(), pr.mergedAt, scoreWeights.prsMerged);
          }
          if (pr.state === 'CLOSED' && !pr.mergedAt) p.prsClosed++;
        }
        if (pr.mergedAt && inWindow(pr.mergedAt)) {
          wp(weekOf(pr.mergedAt)).prs++;
          merged++;
          discussion +=
            pr.comments + pr.reviews.filter((r) => !r.login || !isBot(r.login)).length;
          const hours = hoursBetween(pr.mergedAt, pr.createdAt);
          mergeHours.push(hours);
          const mw = weekOf(pr.mergedAt);
          mergeHoursByWeek.set(mw, [...(mergeHoursByWeek.get(mw) ?? []), hours]);
          teamMergeHoursByWeek.set(mw, [...(teamMergeHoursByWeek.get(mw) ?? []), hours]);
          if ((!pr.login || !isBot(pr.login)) && pr.changedFiles <= MEGA_PR_CAP) {
            const pick = (value: number) => ({
              number: pr.number,
              repo: repo.name,
              value,
            });
            if (!fastest || hours < fastest.value) fastest = pick(hours);
            if (!slowest || hours > slowest.value) slowest = pick(hours);
            if (!mega || pr.changedFiles > mega.value) mega = pick(pr.changedFiles);
          }
          touch(pr.mergedAt);
          if (pr.reviews.some((r) => r.login && r.login !== pr.login && !isBot(r.login)))
            reviewed++;
        }
        const reviewers = new Set<string>();
        for (const r of pr.reviews) {
          if (!r.login || r.login === pr.login || skip(r.login)) continue;
          if (r.submittedAt && !inWindow(r.submittedAt)) continue;
          if (reviewers.has(r.login)) continue;
          reviewers.add(r.login);
          const p = person(r.login.toLowerCase(), r.login, null);
          p.reviews++;
          if (r.submittedAt) {
            act(r.submittedAt, p);
            p.weeks.add(weekOf(r.submittedAt));
            wp(weekOf(r.submittedAt)).reviews++;
            wp(weekOf(r.submittedAt)).score += scoreWeights.reviews;
            weekPts(r.login.toLowerCase(), r.submittedAt, scoreWeights.reviews);
            touch(r.submittedAt);
          }
        }
      }

      for (const is of repo.issues) {
        if (!inWindow(is.createdAt)) continue;
        if (is.state === 'OPEN') openIssues++;
        issuesTotal++;
        if (is.state === 'CLOSED') issuesClosedCount++;
        if (is.state === 'CLOSED' && is.closedAt && weekOf(is.closedAt) === nowWeek)
          thisWeekIssuesClosed++;
        if (!skip(is.login))
          act(
            is.createdAt,
            is.login ? person(is.login.toLowerCase(), is.login, null) : null
          );
        if (is.login && !skip(is.login)) {
          person(is.login.toLowerCase(), is.login, null).issuesOpened++;
          wp(weekOf(is.createdAt)).score += scoreWeights.issuesOpened;
          weekPts(is.login.toLowerCase(), is.createdAt, scoreWeights.issuesOpened);
        }
        if (is.state === 'CLOSED')
          for (const a of is.assignees)
            if (a && !skip(a)) {
              person(a.toLowerCase(), a, null).issuesClosed++;
              if (is.closedAt) {
                wp(weekOf(is.closedAt)).score += scoreWeights.issuesClosed;
                weekPts(a.toLowerCase(), is.closedAt, scoreWeights.issuesClosed);
              }
            }
      }
    }

    // Merge unlinked "email:" / "name:" authors into a login with the same display name.
    for (const [key, p] of [...people]) {
      if (p.login || !p.name) continue;
      const match = [...people.values()].find(
        (q) =>
          q.login &&
          (q.name?.toLowerCase() === p.name!.toLowerCase() ||
            q.login.toLowerCase() === p.name!.toLowerCase())
      );
      if (!match) continue;
      match.commits += p.commits;
      match.additions += p.additions;
      match.deletions += p.deletions;
      match.activity += p.activity;
      match.nightActivity += p.nightActivity;
      match.earlyActivity += p.earlyActivity;
      match.witchingActivity += p.witchingActivity;
      match.holidayActivity += p.holidayActivity;
      match.biggestCommit = Math.max(match.biggestCommit, p.biggestCommit);
      p.weeks.forEach((w) => match.weeks.add(w));
      const mk = [...people].find(([, q]) => q === match)![0];
      thisWeekByAuthor.set(
        mk,
        (thisWeekByAuthor.get(mk) ?? 0) + (thisWeekByAuthor.get(key) ?? 0)
      );
      thisWeekByAuthor.delete(key);
      people.delete(key);
    }

    const members: PersonStats[] = [...people.values()]
      .map(({ weeks, ...p }) => {
        const issues = p.issuesOpened + p.issuesClosed;
        const score =
          p.commits * scoreWeights.commits +
          p.prsMerged * scoreWeights.prsMerged +
          p.reviews * scoreWeights.reviews +
          p.issuesOpened * scoreWeights.issuesOpened +
          p.issuesClosed * scoreWeights.issuesClosed;
        return {
          ...p,
          lines: p.additions + p.deletions,
          issues,
          activeWeeks: weeks.size,
          score,
        };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score);

    const sum = (k: keyof PersonStats) =>
      members.reduce((a, p) => a + (p[k] as number), 0);

    const weeklyArr = [...weekly.values()].sort((a, b) => a.week - b.week);
    const commitsIn = (from: number, to: number) =>
      weeklyArr
        .filter((w) => w.week >= from && w.week <= to)
        .reduce((a, w) => a + w.commits, 0);
    let streak = 0;
    let longestStreak = 0;
    for (
      let w = -termLeadWeeks;
      w <= Math.max(termEndWeek, ...weeklyArr.map((x) => x.week));
      w++
    ) {
      streak = (weekly.get(w)?.commits ?? 0) > 0 ? streak + 1 : 0;
      longestStreak = Math.max(longestStreak, streak);
    }
    const peak = weeklyArr.reduce<WeekPoint | null>(
      (best, w) => (!best || w.commits > best.commits ? w : best),
      null
    );
    const totalCommits = sum('commits');
    const teamScore = sum('score');
    // Points, not commits, so teammates who mostly review or close issues count as sharing.
    const collaboration = 1 - gini(members.map((m) => m.score));
    const teamWeek = (w: number) => {
      const m = median(teamMergeHoursByWeek.get(w) ?? []);
      return {
        commits: weekly.get(w)?.commits ?? 0,
        prsMerged: weekly.get(w)?.prs ?? 0,
        reviews: weekly.get(w)?.reviews ?? 0,
        points: weekly.get(w)?.score ?? 0,
        lines: teamLinesByWeek.get(w) ?? 0,
        medianMergeHours: m === null ? null : round(m, 1),
      };
    };
    punch.forEach((row, dow) => row.forEach((n, h) => (cohortPunch[dow][h] += n)));

    for (const w of weeklyArr) {
      const c = cohortWeekly.get(w.week) ?? {
        ...w,
        commits: 0,
        prs: 0,
        reviews: 0,
        score: 0,
        activity: 0,
      };
      c.commits += w.commits;
      c.activity += w.activity;
      c.score += w.score;
      c.prs += w.prs;
      c.reviews += w.reviews;
      cohortWeekly.set(w.week, c);
    }
    langs.forEach((b, l) => cohortLang.set(l, (cohortLang.get(l) ?? 0) + b));
    cohortMergeHours.push(...mergeHours);
    cohortMerged += merged;
    cohortReviewed += reviewed;

    const main = [...teamRepos].sort((a, b) => b.commits.length - a.commits.length)[0];
    teams.push({
      key: `team-${team}`,
      team,
      // Repos without a team number in their name are shown under their repo name.
      name: teamPattern.test(main.name) ? `Team ${team}` : main.name,
      repos: teamRepos.map((r) => ({
        name: r.name,
        url: r.meta.url,
        isPrivate: r.meta.isPrivate,
      })),
      description: main.meta.description,
      contributors: members.length,
      commits: totalCommits,
      additions: sum('additions'),
      deletions: sum('deletions'),
      prsOpened: sum('prsOpened'),
      prsMerged: merged,
      reviews: sum('reviews'),
      issuesOpened: sum('issuesOpened'),
      issuesClosed: sum('issuesClosed'),
      openPrs,
      openIssues,
      score: teamScore,
      teamworkBonus: bonusFor(teamScore, collaboration, members.length),
      collaboration: round(collaboration),
      reviewCoverage: merged ? round(reviewed / merged) : 0,
      medianMergeHours: (() => {
        const m = median(mergeHours);
        return m === null ? null : round(m, 1);
      })(),
      peakWeek: peak
        ? { week: peak.week, start: peak.start, commits: peak.commits }
        : null,
      activity,
      nightOwlShare: activity ? round(night / activity) : 0,
      earlyBirdShare: activity ? round(early / activity) : 0,
      weekendShare: activity ? round(weekend / activity) : 0,
      lastActivity: last,
      languages: [...langs]
        .map(([name, bytes]) => ({ name, bytes }))
        .sort((a, b) => b.bytes - a.bytes),
      weekly: weeklyArr,
      punch,
      members,
      thisWeekCommits: weekly.get(nowWeek)?.commits ?? 0,
      thisWeekActivity,
      thisWeekLines,
      thisWeekPrsMerged: weekly.get(nowWeek)?.prs ?? 0,
      thisWeekReviews: weekly.get(nowWeek)?.reviews ?? 0,
      thisWeekContributors: [...thisWeekByAuthor.values()].filter((n) => n > 0).length,
      // Evenness of this week's points across every member (0 for anyone idle this week).
      thisWeekEvenness: round(
        1 - gini([...people.keys()].map((k) => thisWeekByAuthor.get(k) ?? 0))
      ),
      thisWeekIssuesClosed,
      thisWeekNightActivity: thisWeekNight,
      thisWeekEarlyActivity: thisWeekEarly,
      thisWeekWeekendActivity: thisWeekWeekend,
      thisWeek: teamWeek(nowWeek),
      lastWeek: teamWeek(nowWeek - 1),
      prsClosedUnmerged: closedUnmerged,
      shipRate: merged + closedUnmerged ? round(merged / (merged + closedUnmerged)) : 0,
      discussionPerPr: merged ? round(discussion / merged, 1) : 0,
      issuesTotal,
      issueCloseRate: issuesTotal ? round(issuesClosedCount / issuesTotal) : 0,
      languageCount: langs.size,
      startCommits: commitsIn(0, 3),
      finishCommits: isCurrent ? null : commitsIn(termEndWeek - 3, termEndWeek),
      longestStreak,
      biggestDay: [...perDay].reduce<{ date: string; commits: number } | null>(
        (best, [date, commits]) =>
          !best || commits > best.commits ? { date, commits } : best,
        null
      ),
      holidayActivity,
      examActivity,
      witchingActivity,
      fastestPr: fastest,
      slowestPr: slowest,
      megaPr: mega,
    });
  }

  teams.sort((a, b) => b.score + b.teamworkBonus - (a.score + a.teamworkBonus));

  const weeklyAll = [...cohortWeekly.values()].sort((a, b) => a.week - b.week);
  const t = (k: 'commits' | 'prsMerged' | 'reviews' | 'issuesOpened' | 'contributors') =>
    teams.reduce((a, x) => a + x[k], 0);

  // Average cumulative commits per team, by term week (for "on track" comparison).
  const lastWeek = isCurrent ? nowWeek : Math.max(...weeklyAll.map((w) => w.week), 0);
  const cumulative: { week: number; value: number }[] = [];
  const cumulativeScore: { week: number; value: number }[] = [];
  let running = 0;
  let runningScore = 0;
  for (let w = -termLeadWeeks; w <= lastWeek; w++) {
    running += cohortWeekly.get(w)?.commits ?? 0;
    runningScore += cohortWeekly.get(w)?.score ?? 0;
    cumulative.push({ week: w, value: round(running / Math.max(teams.length, 1), 1) });
    cumulativeScore.push({
      week: w,
      value: round(runningScore / Math.max(teams.length, 1), 1),
    });
  }

  const weekTotals = (w: number) => {
    const m = median(mergeHoursByWeek.get(w) ?? []);
    return {
      commits: cohortWeekly.get(w)?.commits ?? 0,
      prsMerged: cohortWeekly.get(w)?.prs ?? 0,
      reviews: cohortWeekly.get(w)?.reviews ?? 0,
      points: cohortWeekly.get(w)?.score ?? 0,
      lines: linesByWeek.get(w) ?? 0,
      medianMergeHours: m === null ? null : round(m, 1),
    };
  };

  const n = Math.max(teams.length, 1);
  const lines = teams.reduce((a, x) => a + x.additions + x.deletions, 0);

  return {
    org: cfg.org ?? 'Student-owned team repos',
    slug,
    session: summer ? 'summer' : 'winter',
    year: cfg.year,
    label: cfg.label,
    note: cfg.note ?? null,
    hasOrg: !!cfg.org,
    contributors: cfg.contributors ?? [],
    isCurrent,
    termStart: isoDate(termStart),
    teams,
    totals: {
      teams: teams.length,
      contributors: t('contributors'),
      commits: t('commits'),
      prsMerged: t('prsMerged'),
      reviews: t('reviews'),
      issuesOpened: t('issuesOpened'),
      lines,
    },
    avgPerTeam: {
      commits: round(t('commits') / n, 1),
      prsMerged: round(t('prsMerged') / n, 1),
      reviews: round(t('reviews') / n, 1),
      issuesOpened: round(t('issuesOpened') / n, 1),
    },
    weekly: weeklyAll,
    cumulative,
    cumulativeScore,
    punch: cohortPunch,
    languages: [...cohortLang]
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes),
    thisWeek: weekTotals(nowWeek),
    lastWeek: weekTotals(nowWeek - 1),
    medianMergeHours: (() => {
      const m = median(cohortMergeHours);
      return m === null ? null : round(m, 1);
    })(),
    reviewCoverage: cohortMerged ? round(cohortReviewed / cohortMerged) : 0,
    staffExcluded: [...staff].sort(),
    grades: loadGrades(cfg),
  };
}

export function aggregate() {
  const now = new Date();
  const built = cohorts
    .map((c) => buildCohort(c, now))
    .filter((c): c is CohortStats => !!c);

  const summary: Summary = {
    generatedAt: isoTimestamp(now),
    currentYear,
    currentCohort,
    topN,
    scoreWeights,
    teamworkBonus,
    lineOutlierThreshold,
    timezone,
    cohorts: built,
    insights: buildInsights(built, now),
  };
  writeFileSync(path.join(DATA_DIR, 'summary.json'), JSON.stringify(summary));

  for (const c of built) {
    console.log(
      `${c.org}: ${c.totals.teams} teams, ${c.totals.contributors} contributors, ` +
        `${c.totals.commits} commits, ${c.totals.prsMerged} merged PRs, ${c.totals.reviews} reviews` +
        (c.staffExcluded.length ? ` (staff excluded: ${c.staffExcluded.join(', ')})` : '')
    );
  }
  console.log(`Wrote data/summary.json`);
}

// Run directly: `pnpm aggregate`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  aggregate();
}
