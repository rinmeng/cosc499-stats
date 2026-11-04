import { execSync } from 'node:child_process';

import { Octokit } from 'octokit';

/**
 * Resolve a GitHub token: GITHUB_TOKEN (env or .env.local), else the gh CLI login.
 */
export function getToken(): string {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // no .env.local, that's fine
  }
  const fromEnv = process.env.GITHUB_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(
      'No GitHub token. Set GITHUB_TOKEN in .env.local or run `gh auth login` first.'
    );
  }
}

type Opts = { method: string; url: string };

export function createClient(): Octokit {
  return new Octokit({
    auth: getToken(),
    userAgent: 'cosc499-stats-sync',
    throttle: {
      onRateLimit: (
        retryAfter: number,
        options: Opts,
        _o: unknown,
        retryCount: number
      ) => {
        console.warn(
          `  rate limited on ${options.method} ${options.url}, retry in ${retryAfter}s`
        );
        return retryCount < 3;
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: Opts,
        _o: unknown,
        retryCount: number
      ) => {
        console.warn(`  secondary rate limit on ${options.url}, retry in ${retryAfter}s`);
        return retryCount < 3;
      },
    },
  });
}
