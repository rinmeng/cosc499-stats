# COSC 499 Capstone Stats

**Live site: [cosc499.rinm.dev](https://cosc499.rinm.dev)**

A dashboard of GitHub contribution highlights for every UBC Okanagan COSC 499 capstone
cohort: the year-long sessions (`COSC-499-W2023` and later) and the summer sessions
(`UBCO-COSC499-Summer-2024` and later): the top contributors on each team, cohort-wide trends,
and how the current cohort is tracking against past years.

Built with Next.js, shadcn/ui and shadcn charts (Recharts). Data comes from the GitHub API
through a sync script and lives in JSON files, with no database.

## Help complete your cohort 🙌

Some cohorts look small because their team repositories are private, were deleted, or
moved off the course org. For example, only two **2024–25** teams are visible right now.
If you were in one of those cohorts, you can probably see repos we can't.

**[Read CONTRIBUTING.md](CONTRIBUTING.md)** for copy-paste steps from start to an open
pull request (about 15 minutes, no coding needed). In short:

```bash
gh repo fork rinmeng/cosc499-stats --clone && cd cosc499-stats
pnpm install
gh auth login
pnpm sync:year 2024          # your cohort's start year
git checkout -b data/2024 && git add data/raw sync.config.ts
git commit -m "Add 2024–25 cohort data" && git push -u origin data/2024
gh pr create --fill
```

No access? **Even just a link to your year of the capstone helps.** [Open an issue](https://github.com/rinmeng/cosc499-stats/issues/new?template=cohort-info.yml) with a link to your cohort's org or your team's repo.

## Setup

```bash
pnpm install
gh auth login          # or put GITHUB_TOKEN=... in .env.local
pnpm sync              # pull data from GitHub
pnpm dev               # http://localhost:3000
```

The token needs read access to the cohort orgs. Private repos (e.g. the current cohort's
team repos) only show up if your account is a member of the org. If `GITHUB_TOKEN` is
unset, the sync falls back to `gh auth token`.

## Syncing data

| Command                 | What it does                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `pnpm sync`             | Refresh the current cohort; past cohorts come from cache when present      |
| `pnpm sync:year <YYYY>` | Re-fetch one cohort: `pnpm sync:year 2024` or `pnpm sync:year summer-2024` |
| `pnpm sync:current`     | Re-fetch only the current cohort (run this for regular updates)            |
| `pnpm sync:all`         | Re-fetch every cohort from scratch (slow)                                  |
| `pnpm aggregate`        | Rebuild `data/summary.json` from the raw files (no network)                |

`scripts/sync.ts` writes one file per repo to `data/raw/<org>/<repo>.json`: commits on the
default branch, pull requests with reviews, issues, and languages. It then runs
`scripts/aggregate.ts`, which turns those into `data/summary.json`, the only file the site
reads. The year is the cohort's start year: `2024` is the 2024–25 session
(`COSC-499-W2024`), and `summer-2024` is the May–August 2024 session
(`UBCO-COSC499-Summer-2024`). Pages live at `/2024` and `/summer-2024`.

### Adding next year's cohort

Edit `sync.config.ts`:

```ts
export const cohorts = [
  // ...
  { org: 'COSC-499-W2027', year: 2027, label: '2027–28' },
  { org: 'UBCO-COSC499-S2027', year: 2027, session: 'summer', label: 'Summer 2027' },
];
export const currentCohort = '2027'; // or 'summer-2027' while that session runs
```

Then update the current-cohort line in `.gitignore` (see Privacy). You can also adjust the
repo exclude list, the bot/staff accounts to skip, and the composite score weights in
`sync.config.ts`.

## How things are counted

- **Commits**: non-merge commits on the default branch, credited to the linked GitHub
  account (or the commit name/email when not linked).
- **Merged PRs / reviews**: a review counts once per PR per reviewer, and reviews on your
  own PR don't count.
- **Issues**: issues opened, plus closed issues you were assigned to.
- **Overall score** = commits ×1 + merged PRs ×3 + reviews ×2 + issues ×1. Lines of code
  are shown but left out of the score, since lockfiles and vendored code distort them.
- **Window**: three weeks before the first Monday of September through May 31. This also
  drops upstream history in repos forked from older projects.
- **Excluded**: bots, plus "staff" accounts that commit to many teams in the same cohort
  (instructors and TAs seeding starter code).

## Tone

This dashboard celebrates contributions. It only highlights top contributors and team
achievements. It never lists the people or teams that contributed least, and it has no
"inactive" flags or ascending rankings. Please keep it that way when contributing.

## Privacy & deployment

- Past cohorts' raw data (`data/raw/COSC-499-W2023` etc.) is committed so contributions
  can be merged.
- The current cohort's repos are private, so `data/raw/COSC-499-W2026/` is gitignored and
  synced fresh on each deploy. The Vercel build (`vercel-build`) runs
  `pnpm sync:current` first, which needs a `GITHUB_TOKEN` environment variable from an
  account in that org.
- `data/summary.json` is always regenerated, by `pnpm build` locally or by the sync.
