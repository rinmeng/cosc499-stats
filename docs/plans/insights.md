# Handoff: `/insights` page, "How AI changed capstone coding"

> Written so another agent can build this cold. Read `CLAUDE.md` + `AGENTS.md` first. Next.js in this repo differs from what you know, so check `node_modules/next/dist/docs/` before writing routes. Use pnpm only, and run `pnpm format` after editing.
> The plan has been approved. Branch: `feature/insights`.

## Context

The site covers 15 cohorts from 2017 to 2026 (~52k commits in `data/raw/`). That range spans three periods: before AI tools, the Copilot/ChatGPT era (Copilot GA Jun 2022, ChatGPT Nov 2022), and the agentic era (Cursor, Claude Code and Copilot agent, 2024+). Most capstones now allow and encourage AI. A new `/insights` page will compare eras and show other cross-year trends.

**Eras** (by cohort start year): `pre-ai` ≤ 2021 · `early-ai` 2022–2023 · `agentic` ≥ 2024.

**Tone rule (hard):** only cohort and era-level numbers. Never tag a person or team as an "AI user", and no bottom-N lists or "worst" lists. Any per-team record lists show the top 5 only.

---

## 1. Normalization (applies to every metric — implement once, reuse)

Cohorts range from 1 to 22 repos, so raw totals are biased toward 2023, 2025 and 2026.

1. **Team is the unit.** Compute each metric per team, always as a rate or ratio (per active contributor, per active week, per PR, per commit). Never use raw totals.
2. **Cohort value** = median across that cohort's teams.
3. **Era value** = median of the cohort values, so each cohort counts once. Also store the team-pooled median as `pooled` for the tooltip.
4. **Same time window.** 2026 is in progress (about week 9 as of 2026-11-05). Time-dependent metrics (#3, #5, #8, #10, #11) use term weeks `0..W` for every cohort, where `W` = the current cohort's elapsed week (`currentWeek()` in `lib/views.ts`). Full-term metrics leave out `isCurrent` cohorts and show them as an "in progress" dot.
5. **Small-sample guard.** Cohorts with fewer than 3 teams (`MIN_TEAMS = 3`) are drawn faded with an `n = x teams` label and **left out of the era medians**.
6. **Uncertainty.** For each era, run a bootstrap 80% interval (1000 resamples: resample cohorts, then teams within each cohort, with a fixed seed so builds are deterministic). Store `{ value, lo, hi, nTeams, nCohorts }`.
7. **Unknown ≠ 0.** Fingerprint metrics (#8) count only for repos that were re-fetched with the new field. The rest are `null`/"unknown" and are left out.
8. **Active contributors** have at least 1 commit or PR, and person-weeks count only weeks with activity. Person-level numbers are never shown.

Helpers go in a new file `scripts/lib/stats.ts`: `median`, `quantile`, `bootstrapCI(groups, seed)`, `eraOf(year)`, `windowed(items, termStart, W)`.

---

## 2. Data work

### 2a. Aggregation (no network)

- `scripts/aggregate.ts`: after the cohorts are built, compute `summary.insights`, reading the same raw repos it already loads. It needs per-commit and per-PR rows, which are already in `RawRepo`. Bot detection must run **before** the `excludeLogins` filter (line ~58 `isExcluded`), because metric #9 needs those bot logins.
- New types in `lib/types/insights.ts`, re-exported from the `lib/types` barrel:
  ```ts
  type Era = 'pre-ai' | 'early-ai' | 'agentic';
  interface Estimate {
    value: number;
    lo: number;
    hi: number;
    nTeams: number;
    nCohorts: number;
    pooled: number;
  }
  interface CohortPoint {
    slug: string;
    label: string;
    year: number;
    session: 'winter' | 'summer';
    era: Era;
    value: number | null;
    nTeams: number;
    faded: boolean;
    inProgress: boolean;
  }
  interface InsightMetric {
    key: string;
    label: string;
    unit: string;
    better?: 'up' | 'down' | null;
    eras: Record<Era, Estimate | null>;
    cohorts: CohortPoint[];
  }
  interface Insights {
    window: { week: number };
    eras: { key: Era; label: string; years: string }[];
    metrics: Record<string, InsightMetric>;
    curves: TrendSeries[]; // #10, cumulative % of term total
    languages: Record<Era, { name: string; share: number }[]>; // #7
    records: RecordItem[];
  } // #14 top-5 only
  ```
  Add `insights: Insights` to `Summary` in `lib/types/stats.ts`.

### 2b. Sync change for AI trailers (#8)

- `scripts/sync.ts` (commit `history` node, ~line 88): add `message` to the query. In `toCommit` (~line 274), **do not store the message**. Parse it there and store only `aiTrailers?: string[]`: normalized tool names found in `Co-authored-by:` lines (claude, copilot, cursor, codex, gemini, aider, devin), matched by regex on name or email (e.g. `noreply@anthropic.com`, `*copilot*`, `cursoragent@cursor.com`). Add an optional field to `RawCommit` so committed raw files stay valid.
- Add `RawRepo.meta.trailersScanned?: boolean`, set to true by the new sync. Metric #8 only uses repos where it is true.
- Re-fetch: `pnpm sync` (all cohorts). Repos that can't be reached keep their old files and count as unknown. Commit the refreshed `data/raw/**` in a separate `chore(data)` commit.
- Bot signals (#9) are **already in the raw data**: `copilot-pull-request-reviewer` (23 reviews), `copilot-swe-agent` (14), `cursoragent` (2), `Copilot`. No re-sync is needed for them. Keep a list `AI_BOTS` in `sync.config.ts` next to `excludeLogins`.

---

## 3. Metrics → component map

Page layout uses the existing building blocks in `components/stats/Blocks.tsx`: `PageHeader`, `Section`, `Grid`, `StatTile`, `Highlight`. Charts use shadcn `ChartContainer` (`components/ui/chart.tsx`) + Recharts, wrapped in `ChartCard` (`components/charts/ChartCard.tsx`).

**New chart components** (in `components/charts/`, all `'use client'`):

| Component                 | What it is                                                                                                                                                                                                                                           | Built from                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `EraCompareChart.tsx`     | The main chart for era comparisons: 3 era bars (value) with lo–hi whiskers (`ErrorBar`), plus each cohort as a dot (faded if `faded`, hollow if `inProgress`). The `ChartCard` header metrics switch between related metrics, like `MetricBarChart`. | `ChartCard` + `ChartContainer` + Recharts `ComposedChart`, `Bar`, `ErrorBar`, `Scatter`, `ChartTooltip` |
| `CohortTimelineChart.tsx` | One value per cohort over years (x = term start), with era bands shaded behind it (`ReferenceArea`) and labels for the Copilot GA and ChatGPT dates (`ReferenceLine`).                                                                               | `ChartCard` + Recharts `LineChart`/`ReferenceArea`/`ReferenceLine`; dot color = `cohortColor()`         |
| `StackedShareChart.tsx`   | 100% stacked bars per era (languages, AI-assist share).                                                                                                                                                                                              | `ChartContainer` + `BarChart` stacked, `ChartLegend`                                                    |

**Colors:** eras use `--chart-2`, `--chart-3` and `--chart-5` (one fixed color per era, defined once as `ERA_COLOR` in `lib/format.ts`). Cohort dots use `cohortColor()`. Before choosing, load the `dataviz` skill and check contrast in both themes.

| #   | Analysis                     | Metric definition (per team, then the §1 chain)                                                                                                              | Component                                                                                             |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1   | Commit size                  | median lines/commit (≤ `lineOutlierThreshold`); share of commits > 300 lines                                                                                 | `EraCompareChart` (header toggle: median / large-share)                                               |
| 2   | PR size & speed              | median additions and files per merged PR; median open→merge hours (`fmtHours`)                                                                               | `EraCompareChart` (3 header metrics)                                                                  |
| 3   | Output per person-week       | commits, merged PRs and lines ÷ active person-weeks, windowed                                                                                                | `EraCompareChart` + 3 `StatTile`s showing the agentic vs pre-AI ratio ("×1.8") at the top of the page |
| 4   | Churn                        | deletions ÷ additions                                                                                                                                        | `CohortTimelineChart`                                                                                 |
| 5   | Ramp-up                      | % of windowed output in weeks 0–3; first week reaching 25% of the term total (full-term only)                                                                | `EraCompareChart`                                                                                     |
| 6   | Review culture               | `reviewCoverage`, `discussionPerPr` (already on `TeamStats`)                                                                                                 | `EraCompareChart`                                                                                     |
| 7   | Stack shift                  | language byte share per era (top 6 + "Other"); median languages per team                                                                                     | `StackedShareChart` + reuse `LanguageDonut` for the agentic era alone                                 |
| 8   | AI co-author trailers        | % of a team's commits with ≥1 `aiTrailers`; split by tool                                                                                                    | `CohortTimelineChart` (overall %) + `StackedShareChart` (tool split, agentic era)                     |
| 9   | AI bots in workflow          | % of merged PRs with an AI-bot review or opened by an AI agent                                                                                               | `StatTile` row (era values) + `CohortTimelineChart`                                                   |
| 10  | Deadline curves              | cumulative % of term total by week, one line per cohort                                                                                                      | **Reuse `CohortTrendChart`** (takes `TrendSeries[]`; pass `valueLabel='% of term output'`)            |
| 11  | PR-workflow adoption         | merged PRs per 100 commits, and the % of a team's active weeks with ≥1 merged PR (PR→commit links aren't stored, so these are proxies; say so in the caveat) | `CohortTimelineChart`                                                                                 |
| 12  | Night owls through the years | `nightOwlShare`, `weekendShare`, `holidayCommits`/commits (from `TeamStats`)                                                                                 | `CohortTimelineChart` with header toggle                                                              |
| 13  | Summer vs winter             | commits per person-week, summer vs winter, per era                                                                                                           | `EraCompareChart` with two bar series (summer uses the `--summer-*` ramp)                             |
| 14  | Records wall                 | all-time top 5: biggest day, longest streak, fastest PR, mega PR                                                                                             | **Reuse `Highlight`** cards (`HighlightProps`) inside `Grid`; team names link to `teamHref()`         |

**Other UI pieces (existing shadcn components in `components/ui/`):**

- Section switcher: `Tabs` with tabs **AI impact** (1–7), **AI fingerprints** (8–9) and **Trends** (10–14). Keep the active tab in the URL hash.
- Era legend + definitions: `Badge` per era (color dot + years) in the `PageHeader` description.
- Methodology / caveats: `Accordion` at the bottom ("How we normalize", "What counts as AI-assisted", "Limits": correlation ≠ causation, missing repos, trailers only cover what people chose to record).
- Inline caveats on each chart: `Tooltip` on an `Info` icon in the chart description, plus a `n = x teams · y cohorts` caption.
- Faded/unknown cohorts: show `Alert` once at the top if any cohort is excluded, and link to `CONTRIBUTING.md` with an `ExternalLink` icon (follow the `HelpComplete.tsx` pattern).
- Use `Skeleton` only if anything goes client-side. The page itself is a server component.

---

## 4. Files

**New**

- `app/insights/page.tsx`: server component. `getSummary()` → `insightsView(s)` → sections. Export `metadata` via `pageMetadata(insightsSeo())`.
- `app/insights/opengraph-image.tsx`: copy the pattern in `app/about/opengraph-image.tsx` (uses `lib/og.tsx`).
- `lib/types/insights.ts`, `scripts/lib/stats.ts`
- `components/charts/EraCompareChart.tsx`, `CohortTimelineChart.tsx`, `StackedShareChart.tsx`

**Modified**

- `scripts/aggregate.ts`: build `insights`.
- `scripts/sync.ts`: `message` → `aiTrailers` (never store the message).
- `lib/types/stats.ts`: `RawCommit.aiTrailers?`, `RawRepo.meta.trailersScanned?`, `Summary.insights`.
- `sync.config.ts`: `AI_BOTS`, `ERA_BOUNDS`.
- `lib/views.ts`: `insightsView(s)` (era colors, faded flags, formatted header values, reusing `trendSeries` patterns and `byTermStart`).
- `lib/format.ts`: `ERA_COLOR`, `eraLabel`.
- `lib/seo.ts`: `insightsSeo()`. `app/sitemap.ts`: add `/insights`.
- `components/Navbar.tsx`: add `{ href: '/insights', label: 'Insights' }` to `links`.
- `app/page.tsx`: one teaser card at the bottom ("How AI changed capstone →") using `Card` and a link with `ArrowRight`.
- `app/about/page.tsx`: short paragraph on the trailer parsing: messages are read during sync and never stored.

---

## 5. Build order

1. `stats.ts` helpers + types → `insights` in aggregate for metrics 1–7 and 9–14 (no re-sync needed). Run `pnpm aggregate` and check the JSON.
2. Chart components → `/insights` page with the AI impact and Trends tabs.
3. Sync change for #8 → `pnpm sync` → re-aggregate → Fingerprints tab.
4. Nav, sitemap, OG image, overview teaser, about copy.

## 6. Verification

- `pnpm aggregate`, then check `data/summary.json`. `insights.metrics.*.eras` should have `nTeams` and `nCohorts`, and faded cohorts (e.g. 2024, Summer 2023) should be left out of the era medians. Recompute one metric by hand for one team with `jq` against its raw file.
- Determinism: run `pnpm aggregate` twice and check the output is byte-identical (seeded bootstrap).
- After `pnpm sync`: `grep -c aiTrailers data/raw/COSC-499-W2026/*.json` > 0, and `grep -r '"message"' data/raw` → **no matches**.
- `pnpm dev` → `/insights`: all 3 tabs, light and dark mode, 375px width with no horizontal scroll, tooltips show `n teams`.
- `pnpm lint && pnpm build`.
