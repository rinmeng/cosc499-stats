# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Package Manager

Always use **pnpm**. Never use `npm` or `yarn`.

## Commands

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm lint      # ESLint (eslint-config-next/core-web-vitals + typescript)
pnpm format    # Prettier — formats all files
pnpm sync            # fetch GitHub data → data/raw, then aggregate → data/summary.json
pnpm sync:year 2024  # re-fetch one cohort only
pnpm aggregate       # rebuild data/summary.json from raw files only
```

## Code Style

Prettier is enforced via `.prettierrc`. Key non-default settings:

- `printWidth: 90` (not 80)
- `singleQuote: true` and `jsxSingleQuote: true`
- `endOfLine: "lf"` — always LF, even on Windows
- Import order is auto-sorted by `@ianvs/prettier-plugin-sort-imports`:
  1. `react` and `react-*`
  2. Third-party packages
  3. `@/components/*`
  4. `@/hooks/*`
  5. `@/utils/*`
  6. Relative imports

Run `pnpm format` after edits rather than sorting imports manually.

## Tailwind v4

There is no `tailwind.config.js`. Tailwind v4 is configured entirely via PostCSS (`postcss.config.mjs`). All theme customization (colors, dark mode, animations) lives in `app/globals.css` using `@theme inline` CSS variables. Do not create a `tailwind.config.js`.

## Environment Setup

`pnpm sync` needs a GitHub token: `GITHUB_TOKEN` in `.env.local`, or falls back to `gh auth token`. No other env vars.

## Data Flow

- `sync.config.ts`: cohorts (orgs), repo filters, excluded logins, score weights.
- `scripts/sync.ts`: GitHub GraphQL → `data/raw/<org>/<repo>.json` (types: `RawRepo` in `lib/types/stats.ts`).
- `scripts/aggregate.ts`: raw → `data/summary.json` (`Summary` type). Pure, no network.
- `lib/data.ts` (server-only) reads the summary; `lib/views.ts` shapes it into client props.
- Pages: `/` overview, `/[year]` cohort, `/[year]/[team]` team detail.
- All cohorts' `data/raw/<org>/` is committed (contributions welcome); `data/summary.json` and logs are gitignored.
- Repos outside a cohort org go in that cohort's `extraRepos` (sync.config.ts).

## Tone Rule (important)

Never add a "who contributed the least" view: no bottom-N lists, ascending sorts, inactivity flags, or "worst" records. Rank only the top N (default 5); frame team metrics as achievements.

Personal pages (`/u/<login>`) show only that person's own output: no ranks, team shares, averages or comparisons with anyone.

## Links

Any link or link-style button that takes you to another page ends with a lucide icon: `ArrowRight` for pages on this site, `ExternalLink` (box with the up-right arrow) for anything that leaves the site (GitHub, docs), including names that link to GitHub. Back links use a leading `ArrowLeft`. Internal names inside lists and tables (team names) don't need one.

## Charts

Use shadcn `ChartContainer` + Recharts. Colors come from `--chart-1..8` (validated categorical palette) and `--seq-0..6` (sequential, for heatmaps) in `app/globals.css`. A cohort keeps the same color everywhere (`cohortColor` in `lib/format.ts`).

## Architecture Patterns

**Types**: All TypeScript interfaces live in `lib/types/` (per-feature files). Import via the barrel: `import { Summary } from '@/lib/types'`.

**Shadcn UI**: All 40+ components are pre-installed in `components/ui/`. Do not recreate them — import from there directly.

**Path alias**: `@/` maps to the project root. Use it for all non-relative imports.

## Branch & PR Conventions

Use prefixed branches: `feature/*`, `fix/*`, `chore/*`.
