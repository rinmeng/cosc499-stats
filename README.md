# COSC 499 Capstone Stats

**Live site: [cosc499.rinm.dev](https://cosc499.rinm.dev)**

A dashboard of GitHub contribution highlights for every UBC Okanagan COSC 499 capstone
cohort (`COSC-499-W2023` and later): the top contributors on each team, cohort-wide trends,
and how the current cohort is tracking against past years.

Built with Next.js, shadcn/ui and shadcn charts (Recharts). Data comes from the GitHub API
through a sync script and lives in JSON files, with no database.

## Help fill in your cohort 🙌

Some cohorts are incomplete. For example, only two team repositories from **2024–25**
(`COSC-499-W2024`) are still visible on GitHub, and teams whose repos are private or
moved elsewhere don't show up at all. If you were in one of those cohorts, you can help:

- **You can still see your cohort's repos** (you're still in the org, or a teammate kept
  a copy): sync just your year and open a pull request with the result.

  ```bash
  pnpm install
  gh auth login            # your GitHub account, the one with access
  pnpm sync:year 2024      # only fetches the 2024–25 cohort
  git add data/raw/COSC-499-W2024
  ```

  Only aggregated activity (logins, commit/PR/review/issue counts and dates) ends up in
  `data/raw`. No source code is downloaded.

- **Your team's repo lives somewhere else** (e.g. moved to a personal account): add it to
  that cohort's `extraRepos` in `sync.config.ts`, then run `pnpm sync:year <year>`.

  ```ts
  {
    org: 'COSC-499-W2024',
    year: 2024,
    label: '2024–25',
    extraRepos: [{ repo: 'your-username/capstone-project-team-3', team: 3 }],
  },
  ```

- **You have other info** (what a team built, a missing cohort, wrong team numbers, an
  account that should be excluded): [open an issue](https://github.com/rinmeng/cosc499-stats/issues)
  or a pull request.

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

| Command                 | What it does                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| `pnpm sync`             | Refresh the current cohort; past cohorts come from cache when present |
| `pnpm sync:year <YYYY>` | Re-fetch only one cohort, e.g. `pnpm sync:year 2024`                  |
| `pnpm sync:current`     | Re-fetch only the current cohort (run this for regular updates)       |
| `pnpm sync:all`         | Re-fetch every cohort from scratch (slow)                             |
| `pnpm aggregate`        | Rebuild `data/summary.json` from the raw files (no network)           |

`scripts/sync.ts` writes one file per repo to `data/raw/<org>/<repo>.json`: commits on the
default branch, pull requests with reviews, issues, and languages. It then runs
`scripts/aggregate.ts`, which turns those into `data/summary.json`, the only file the site
reads. The year is the cohort's start year: `2024` is the 2024–25 session
(`COSC-499-W2024`).

### Adding next year's cohort

Edit `sync.config.ts`:

```ts
export const cohorts = [
  // ...
  { org: 'COSC-499-W2027', year: 2027, label: '2027–28' },
];
export const currentYear = 2027;
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
