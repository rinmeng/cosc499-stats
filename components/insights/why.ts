import type { Why } from './WhyDialog';

/**
 * "Why might this be?" copy for every insights chart. Explanations are hedged on
 * purpose: era differences line up with AI tools, but courses, team sizes and
 * projects changed too. Keep numbers out of here (they change on every aggregate);
 * the chart and its finding sentence carry the numbers.
 */
export const WHY = {
  commitSize: {
    measures:
      'How many lines a typical commit changes, and how many commits change more than 300 lines at once.',
    reasons: [
      {
        title: 'Assistants write whole features at once',
        detail:
          'An assistant can produce a full component, route or test file in one go, so one commit holds what used to take several.',
      },
      {
        title: 'Agents commit in bigger chunks',
        detail:
          'Agent tools tend to finish a task and commit it as a single change, rather than committing each small step.',
      },
      {
        title: 'Squash merges',
        detail:
          'Teams that squash a pull request into one commit on main make each commit look larger, with or without AI.',
      },
      {
        title: 'More scaffolding',
        detail:
          'Modern frameworks generate config and boilerplate files, which land in a few large commits early in the term.',
      },
    ],
    method:
      'Commits over 5,000 lines (lockfiles, vendored code) are left out. Each team’s median comes first, then the median cohort in each era.',
  },
  pullRequests: {
    measures:
      'For merged pull requests: how many lines they add, how many files they touch, and how long they stay open before merging.',
    reasons: [
      {
        title: 'Waiting for a reviewer',
        detail:
          'Far more pull requests get reviewed by a teammate now. A review is a real wait, so time to merge goes up even when the code is ready.',
      },
      {
        title: 'Larger changes per request',
        detail:
          'When generating code is quick, a single pull request can carry a bigger feature, which takes longer to read.',
      },
      {
        title: 'Focused file changes',
        detail:
          'Fewer files with more lines each can mean changes are more focused, with less scattered editing across the codebase.',
      },
      {
        title: 'Checks before merging',
        detail:
          'CI pipelines, linters and preview deployments became common in recent cohorts, and they add time before a merge.',
      },
    ],
    method: 'Only merged pull requests count. Time to merge is from opening to merging.',
  },
  output: {
    measures:
      'Work per person in an active week: commits, merged pull requests and lines changed, divided by the weeks each person actually committed or opened a pull request.',
    reasons: [
      {
        title: 'Code is cheaper to produce',
        detail:
          'Lines per week grows much faster than commits per week. That fits each commit carrying more generated code, rather than people committing more often.',
      },
      {
        title: 'A pull-request workflow',
        detail:
          'Recent cohorts route most work through pull requests, so merged pull requests per week rise with the workflow itself.',
      },
      {
        title: 'Bigger, richer stacks',
        detail:
          'Projects now include frontends, APIs, tests and infrastructure, which simply means more files to write.',
      },
    ],
    method:
      'Every cohort is cut to the same weeks of term so the in-progress year is compared fairly. Summer rates are scaled to a full-year term.',
  },
  churn: {
    measures: 'How many lines teams delete for every line they add, over the whole term.',
    reasons: [
      {
        title: 'More new code, less rewriting',
        detail:
          'If assistants add large amounts of new code, additions grow faster than deletions, so the ratio drops even if teams rewrite just as much.',
      },
      {
        title: 'Regenerate instead of edit',
        detail:
          'Asking for a fresh version of a file can replace a slow series of small edits and deletions.',
      },
      {
        title: 'Less cleanup at the end',
        detail:
          'Teams that keep code tidy as they go need fewer large cleanup commits before the final demo.',
      },
    ],
    method:
      'Full term only, so the in-progress cohort is hollow and left out of the era medians.',
  },
  ramp: {
    measures:
      'How quickly teams get going: the share of early-term work done in the first four weeks, and the week a team reaches a quarter of its whole-term work.',
    reasons: [
      {
        title: 'Faster setup',
        detail:
          'Starters, templates and assistants can get a working app running in days, so real feature work starts sooner.',
      },
      {
        title: 'Course milestones',
        detail:
          'Earlier deliverables or demos in some years push teams to build sooner, independent of tools.',
      },
      {
        title: 'Steadier pace',
        detail:
          'Reaching a quarter of the work earlier also means less of it is left for the last weeks of term.',
      },
    ],
    method:
      'The quarter mark needs a finished term, so the in-progress cohort is left out of that measure.',
  },
  review: {
    measures:
      'The share of merged pull requests reviewed by someone other than the author, and the comments plus reviews each one gets.',
    reasons: [
      {
        title: 'Reviews became part of the course',
        detail:
          'Recent cohorts are often asked to review each other’s pull requests, and many turn on branch protection that requires it.',
      },
      {
        title: 'Reviewing generated code',
        detail:
          'When more code is written with an assistant, a teammate’s read-through becomes the main check that it does what the team expects.',
      },
      {
        title: 'Better tooling',
        detail:
          'GitHub’s review interface, suggested changes and review requests make a review quicker to give.',
      },
    ],
    method:
      'Teams with no merged pull requests are left out rather than counted as zero.',
  },
  languages: {
    measures:
      'The share of code in each language, summed across teams in an era. GitHub detects the language of every file.',
    reasons: [
      {
        title: 'TypeScript and modern web stacks',
        detail:
          'Recent projects lean on TypeScript frameworks, which shifts the mix away from older choices.',
      },
      {
        title: 'Config counts as code',
        detail:
          'Dockerfiles, shell scripts and CSS frameworks show up as languages, and modern projects have more of them.',
      },
    ],
    method:
      'Cohorts with fewer than 3 teams and the in-progress year are left out of the bars.',
  },
  languagesPerTeam: {
    measures: 'How many languages a typical team’s repositories contain.',
    reasons: [
      {
        title: 'Full-stack projects',
        detail:
          'A frontend, a backend, a database layer and deployment scripts each bring their own language.',
      },
      {
        title: 'Lower cost of an unfamiliar language',
        detail:
          'An assistant makes it easier to write a script or config file in a language nobody on the team knows well.',
      },
    ],
    method: 'Repositories with no detected language are left out.',
  },
  trailers: {
    measures:
      'The share of commits whose message names an AI tool as a co-author (a “Co-authored-by” line).',
    reasons: [
      {
        title: 'Only some tools add the line',
        detail:
          'Claude Code adds a co-author line by default; most editor assistants do not. So this mostly counts agent-style tools.',
      },
      {
        title: 'People can remove it',
        detail:
          'The line is easy to delete or turn off, so this is a floor on AI-assisted commits, not a count of them.',
      },
    ],
    method:
      'Only repositories re-fetched with trailer scanning are counted; the rest are unknown, not zero. Messages are read during sync and never stored.',
  },
  tools: {
    measures: 'Which AI tools are named in co-author lines, in the agentic era.',
    reasons: [
      {
        title: 'Defaults decide what shows up',
        detail:
          'Tools that add a co-author line by default appear far more often than tools that never do, even if those are used as much.',
      },
    ],
    method:
      'A commit that names two tools counts toward both, and the bar is rescaled to 100%.',
  },
  bots: {
    measures:
      'The share of a typical team’s merged pull requests opened or reviewed by an AI bot, such as Copilot’s reviewer or coding agent.',
    reasons: [
      {
        title: 'Few teams turned bots on',
        detail:
          'AI review bots and coding agents need setup or a paid plan, so the median team has none, even when a few teams use them a lot.',
      },
      {
        title: 'AI mostly happens in the editor',
        detail:
          'Most assistance happens before a commit is made, where GitHub never sees it.',
      },
    ],
    method:
      'Uses the median team, so a handful of heavy users don’t move it. Bot accounts are still left out of every human total on the site.',
  },
  curves: {
    measures:
      'Each line is one cohort’s commits over the same early weeks of term, as a running share. Steeper early means work started sooner.',
    reasons: [
      {
        title: 'Quicker starts',
        detail:
          'Templates and assistants help teams commit working code in the first weeks instead of only planning.',
      },
      {
        title: 'Deadlines shape the curve',
        detail: 'Steps in a line usually line up with milestone due dates in that year.',
      },
    ],
    method: 'Every line ends at 100% of its own window. Summer cohorts are dashed.',
  },
  adoption: {
    measures:
      'How much of the work goes through pull requests: merged pull requests per 100 commits, and the share of active weeks in which a pull request was merged.',
    reasons: [
      {
        title: 'Required by the course',
        detail:
          'Recent cohorts are asked to work on branches and merge through pull requests instead of pushing to main.',
      },
      {
        title: 'Smaller, more frequent merges',
        detail:
          'Merging a pull request every week keeps branches short-lived and conflicts small.',
      },
    ],
    method:
      'These are proxies: commits aren’t linked to pull requests, so this shows how often the two appear together.',
  },
  habits: {
    measures:
      'The share of commits made at night (10 pm–4 am), on weekends, and on holidays or breaks, in Vancouver time.',
    reasons: [
      {
        title: 'Less late-night crunch',
        detail:
          'Steadier progress through the term can mean fewer all-nighters before a deadline.',
      },
      {
        title: 'Weekends fit around other classes',
        detail:
          'Students with full timetables or jobs often save project work for the weekend.',
      },
    ],
    method:
      'Full term only, so the in-progress cohort is hollow and left out of the era medians.',
  },
  session: {
    measures:
      'Commits per person-week in summer and winter sessions, with summer scaled to a full-year term.',
    reasons: [
      {
        title: 'Summer is often the only class',
        detail:
          'With no other courses, summer students can put more of each week into the project.',
      },
      {
        title: 'A shorter term',
        detail:
          'The same project fits into fewer weeks, so weekly pace runs higher before scaling.',
      },
    ],
    method:
      'Summer rates are multiplied by the summer term length over a full-year term before comparing.',
  },
} satisfies Record<string, Why>;
