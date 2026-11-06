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
      'The share of teams with at least one commit whose message names an AI tool as a co-author (a “Co-authored-by” line).',
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
      'The share of teams with at least one merged pull request opened or reviewed by an AI bot, such as Copilot’s reviewer or coding agent.',
    reasons: [
      {
        title: 'Few teams turned bots on',
        detail:
          'AI review bots and coding agents need setup or a paid plan, so only some teams have one.',
      },
      {
        title: 'AI mostly happens in the editor',
        detail:
          'Most assistance happens before a commit is made, where GitHub never sees it.',
      },
    ],
    method:
      'A team counts once, however many bot pull requests it has. Bot accounts are still left out of every human total on the site.',
  },
  curves: {
    measures:
      'Each line is one cohort’s commits over the same early share of its own term, as a running share. Summer terms are shorter, so this lines a summer week up with the matching point of a full year. Steeper early means work started sooner.',
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
  prsPer100: {
    measures:
      'How many pull requests a team merges for every 100 commits it makes. A higher number means the work is split into more, smaller merges.',
    reasons: [
      {
        title: 'Required by the course',
        detail:
          'Recent cohorts are asked to work on branches and merge through pull requests instead of pushing straight to main.',
      },
      {
        title: 'Smaller, more frequent merges',
        detail:
          'Merging often keeps branches short-lived and conflicts small, which raises the number of merges per commit.',
      },
      {
        title: 'Squashed commits',
        detail:
          'Squashing a pull request into one commit lowers the commit count, which raises this number with no change in how the team works.',
      },
      {
        title: 'Tooling that nudges you',
        detail:
          'Branch protection and review requests make a direct push harder than opening a pull request.',
      },
    ],
    method:
      'A proxy: pull requests aren’t linked to individual commits, so this shows how often the two appear together, not which commits went through review. Only merged pull requests count.',
  },
  prWeeks: {
    measures:
      'The share of a team’s active weeks in which at least one pull request was merged. 100% means that every week the team worked, something was merged.',
    reasons: [
      {
        title: 'A weekly rhythm',
        detail:
          'Sprint-style courses ask for something working each week, which pushes teams to merge weekly.',
      },
      {
        title: 'Smaller changes',
        detail:
          'When a change takes less time to build, it is easier to finish and merge it within the same week.',
      },
      {
        title: 'Continuous deployment',
        detail:
          'Teams that deploy every merge to a live site have a reason to merge often.',
      },
      {
        title: 'Few weeks to count',
        detail:
          'A team with only a handful of active weeks can hit 0% or 100% easily, which is why this is shown as a median across teams.',
      },
    ],
    method:
      'Active weeks are weeks with at least one commit or opened pull request. A proxy for how steadily work is merged, not for how well it is reviewed.',
  },
  nightOwl: {
    measures:
      'The share of a team’s commits made between 10 pm and 4 am, in Vancouver time.',
    reasons: [
      {
        title: 'Steadier progress',
        detail:
          'Work that is spread across the term leaves fewer all-nighters before a deadline.',
      },
      {
        title: 'Faster to finish a task',
        detail:
          'When a feature takes an hour instead of an evening, it is easier to stop before midnight.',
      },
      {
        title: 'Deadlines and demos',
        detail:
          'Late-night spikes usually line up with a milestone due date, which changes by year.',
      },
      {
        title: 'Time zones',
        detail:
          'A teammate working from another time zone can make late commits look like night work.',
      },
    ],
    method:
      'Full term only, so the in-progress cohort is hollow and left out of the era medians.',
  },
  weekend: {
    measures: 'The share of a team’s commits made on a Saturday or Sunday.',
    reasons: [
      {
        title: 'Weekdays are full',
        detail:
          'Students with a full timetable or a job often save project work for the weekend.',
      },
      {
        title: 'Working in blocks',
        detail:
          'Longer, less frequent sessions fit a weekend better than a few spare hours in a weekday.',
      },
      {
        title: 'Remote teamwork',
        detail:
          'Teams that meet online instead of on campus can schedule work sessions on weekends more easily.',
      },
      {
        title: 'Summer terms',
        detail:
          'A summer capstone is often the only class, so there is less reason to wait for the weekend.',
      },
    ],
    method:
      'Full term only, so the in-progress cohort is hollow and left out of the era medians.',
  },
  holiday: {
    measures:
      'The share of a team’s commits made on a holiday or break: Thanksgiving, Christmas and New Year, reading week, and in summer Victoria Day, Canada Day and BC Day.',
    reasons: [
      {
        title: 'Fewer commits to begin with',
        detail:
          'Holidays are only a few days a term, so even small changes in a handful of commits move this share.',
      },
      {
        title: 'Breaks are catch-up time',
        detail:
          'Reading week and winter break are the longest stretches free of other classes, so teams use them to catch up.',
      },
      {
        title: 'Deadlines near a break',
        detail:
          'A milestone due just after a holiday pulls work into it, and that changes by year.',
      },
    ],
    method:
      'Full term only, so the in-progress cohort is hollow and left out of the era medians. A holiday that falls on a weekend is counted once.',
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
