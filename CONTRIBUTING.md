# Contributing: help put your team on the site

Is your team missing from [cosc499.rinm.dev](https://cosc499.rinm.dev)? Some team
repositories are private, were deleted, or moved off the course organization, so we can't
see them. Some whole cohorts look small for the same reason. If you were on one of those
teams, you can probably see repos we can't, and you can send us the data. This guide walks you
from zero to an open pull request. It takes about 15 minutes, and you don't need to write
any code.

> **What gets collected?** Only activity: GitHub usernames, commit/PR/review/issue counts
> and their dates, and language percentages. No source code is downloaded.

## Which year am I?

The year is when your session **started**. Summer sessions use `summer-` plus the year:

| You took COSC 499 in… | Use this      | GitHub org                 |
| --------------------- | ------------- | -------------------------- |
| Sept 2023 – Apr 2024  | `2023`        | `COSC-499-W2023`           |
| May – Aug 2024        | `summer-2024` | `UBCO-COSC499-Summer-2024` |
| Sept 2024 – Apr 2025  | `2024`        | `COSC-499-W2024`           |
| May – Aug 2025        | `summer-2025` | `UBCO-COSC499-S2025`       |
| Sept 2025 – Apr 2026  | `2025`        | `COSC-499-W2025`           |
| May – Aug 2026        | `summer-2026` | `UBCO-COSC499-S2026`       |

The examples below use `2024`. Swap in yours wherever you see it (e.g. `summer-2025`
and `COSC-499-W2024` → `UBCO-COSC499-S2025`).

---

## Step 1: Install the tools (one time)

You need **Node.js 20+**, **pnpm** and the **GitHub CLI**.

- Node.js: download the LTS version from [nodejs.org](https://nodejs.org).
- pnpm: after Node is installed, run
  ```bash
  corepack enable
  ```
- GitHub CLI: install from [cli.github.com](https://cli.github.com) (on Windows,
  `winget install GitHub.cli`; on macOS, `brew install gh`).

Check that everything works:

```bash
node -v     # v20 or newer
pnpm -v
gh --version
```

## Step 2: Log in to GitHub

Use the GitHub account that was in your capstone org:

```bash
gh auth login
```

Pick **GitHub.com**, then **HTTPS**, then **Login with a web browser**, and follow the
prompts.

Now check that you can see your cohort's repos:

```bash
gh repo list COSC-499-W2024 --limit 100
```

If you see team repos that are missing from the site, you can help. 🎉 If the list is
empty or matches what's already on the site, skip to
[Other ways to help](#other-ways-to-help): **just opening an issue with a link to your
cohort or team repo is a big help too.**

## Step 3: Get your own copy of this project

This creates a fork under your account and downloads it:

```bash
gh repo fork rinmeng/cosc499-stats --clone
cd cosc499-stats
pnpm install
```

## Step 4: Sync your cohort

```bash
pnpm sync:year 2024
```

This reads your cohort's repos with your GitHub login and saves the results to
`data/raw/COSC-499-W2024/`. Large cohorts can take a few minutes. A `✓` line means a repo
was saved; a `✗` line means it couldn't be read (that's okay, the rest still count).

## Step 5: Check it looks right (optional, but nice)

```bash
pnpm dev
```

Open [http://localhost:3000/2024](http://localhost:3000/2024). Your teams should be there.
Press `Ctrl + C` in the terminal to stop the server.

## Step 6: Save your changes

```bash
git checkout -b data/2024
git add data/raw/COSC-499-W2024 sync.config.ts
git commit -m "Add 2024–25 cohort data"
```

## Step 7: Open the pull request

```bash
git push -u origin data/2024
gh pr create --fill
```

That's it! 🙌 The command prints a link to your pull request. Once it's merged, your
cohort shows up on the live site.

---

## Your team's repo isn't in the org?

If your team's repo was moved to a personal account (or never lived in the org), add it
to your cohort in `sync.config.ts` **before Step 4**:

```ts
{
  org: 'COSC-499-W2024',
  year: 2024,
  label: '2024–25',
  extraRepos: [{ repo: 'your-username/capstone-project-team-3', team: 3 }],
},
```

`repo` is `owner/name` from the repo's URL, and `team` is your team number. Then continue
from Step 4.

## Other ways to help

No access, or don't want to run anything? **Even just a link to your year of the
capstone helps.** Open an issue and paste a link to your cohort's GitHub org, your team's
repo, or your course page. That's all we need, and we'll take it from there. If you know
more, add it too: what your team built, repos that moved or were renamed, wrong team
numbers, or an account that should be left out (like a TA or bot).

👉 [Open an issue](https://github.com/rinmeng/cosc499-stats/issues/new?template=cohort-info.yml) (the form asks for your session and a link)

## Stuck?

| Problem                                | Fix                                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `No GitHub token`                      | Run `gh auth login` again (Step 2).                                                           |
| `gh repo list` shows nothing           | Your account no longer has access to that org; see [Other ways to help](#other-ways-to-help). |
| `pnpm: command not found`              | Run `corepack enable`, then open a new terminal.                                              |
| `secondary rate limit … retry in 300s` | GitHub is slowing things down. Leave it running; it continues on its own.                     |
| `No cohort matches 2024`               | Check the year table above (summer is `summer-2024`), or open an issue.                       |

## Ground rules

This site celebrates contributions. It highlights top contributors and team achievements,
and never shows who contributed the least. Please keep any changes in that spirit.
