/** Site-wide constants used for SEO metadata, the sitemap and social images. */

/** Public URL of the deployed site. Override with NEXT_PUBLIC_SITE_URL (e.g. a preview deploy). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cosc499.rinm.dev'
).replace(/\/$/, '');

export const SITE_NAME = 'UBCO COSC 499 Capstone Stats';
export const SITE_SHORT_NAME = 'UBCO COSC 499 Stats';

export const SITE_DESCRIPTION =
  'Contribution stats for every UBCO COSC 499 capstone cohort at UBC Okanagan: top contributors on each team, commits, pull requests and code reviews, and how the current cohort is tracking against past years.';

export const SITE_KEYWORDS = [
  'UBCO',
  'UBCO COSC 499',
  'UBCO COSC499',
  'COSC 499',
  'COSC499',
  'UBC Okanagan',
  'capstone',
  'capstone project',
  'software engineering capstone',
  'GitHub contributions',
  'computer science',
];
