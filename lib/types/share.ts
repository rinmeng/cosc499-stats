/** What a shared page looks like in a link preview (the same text as its SEO metadata). */
export interface ShareItem {
  /** Site path, e.g. `/2025/3` or `/u/octocat` */
  path: string;
  /** Page title without the site prefix */
  title: string;
  description: string;
}
