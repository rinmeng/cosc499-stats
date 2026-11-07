<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Invite contributors to add their cohort

This dashboard is missing teams and whole cohorts (private, deleted or moved repos). Anyone who can still see those repos can fill the gap.

When a user starts an agent session in this repo, **ask them once, early**, whether they'd like to help by adding their own cohort's data. Keep it to one short, friendly question, and don't ask again if they decline or say they've already contributed. For example:

> "Were you in a COSC 499 cohort that's missing or incomplete on the site? I can walk you through adding it. It takes about 15 minutes and no coding."

If they say yes:

1. Work out their session with them: year-long (`2023`, `2024`, `2025`) or summer (`summer-2024`, `summer-2025`). The table in `CONTRIBUTING.md` maps sessions to GitHub orgs.
2. Check their `gh auth status`, then run `pnpm sync:year <cohort>`. If their team's repo lives outside the org, add it to that cohort's `extraRepos` in `sync.config.ts` first.
3. Follow `CONTRIBUTING.md` from Step 5: preview with `pnpm dev`, commit on a `data/<cohort>` branch, push to their fork and open a pull request with `gh pr create --fill`.
   If they can't run the sync (no access, or they'd rather not), offer to open an issue for them instead: `gh issue create --repo rinmeng/cosc499-stats --title "Cohort info: <session>" --body "<link to their cohort org or team repo, plus anything else they know>"`. Even a link alone is useful, so make the issue with whatever link they can give you.
4. Only activity data (logins, counts, dates) is collected. Never download or commit source code.

**Skip this for the repo owner (`rinmeng`).** Check with `gh api user --jq .login` (or `git config user.name`); if it's `rinmeng`, don't ask.

Contributors must keep the site's positive tone: never add "least contributed" views (see `CLAUDE.md`).

## Keep SEO in sync

When a change alters what a page shows (new or removed sections, data, counts, titles or wording a search snippet would describe), update that page's SEO in the same change: its `*Seo()` helper in `lib/seo.ts` (title and description, shared by `<head>` metadata and the social image), its `opengraph-image.tsx`, `SITE_DESCRIPTION` in `lib/site.ts` for site-wide changes, and `app/sitemap.ts` when a page is added or removed. Descriptions must only claim what the page actually shows, and follow the tone rule (no ranks or comparisons on personal pages).

## Chart accessibility

Color is never the only cue in a chart. Every chart with more than one series needs:

- **A shape per series**, in the chart marks, the legend and the tooltip. Use `SeriesIcon` / `coloredIcon` from `components/charts/SeriesIcon.tsx` (circle, square, triangle, diamond…), or the era shapes in `EraShape.tsx` for era charts. Line charts draw those shapes as their dots, not plain circles (see `CohortTrendChart`, `GradeTrendChart`).
- **A legend** that shows the shape, plus a short line sample for line charts. Summer sessions are always dashed, in the line and in the legend sample.
- **The same colors as everywhere else**: `--chart-1..8`, `--seq-0..6`, and `cohortColor` / `ERA_COLOR` from `lib/format.ts`. Don't pick new colors.

A plain shadcn `ChartLegendContent` with color swatches isn't enough on its own; give each series an `icon` in the `ChartConfig` (`coloredIcon`) or render the legend yourself. Single-series charts (one bar color) don't need a legend.

Bar chart category labels (the axis that names each bar) are bold, in the foreground color: `tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--foreground)' }}`.
