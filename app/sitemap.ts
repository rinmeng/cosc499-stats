import type { MetadataRoute } from 'next';

import { getSummary } from '@/lib/data';
import { parseDate } from '@/lib/dates';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const s = getSummary();
  const lastModified = s ? parseDate(s.generatedAt) : new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    {
      url: `${SITE_URL}/insights`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/insights/fingerprints`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/insights/trends`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  for (const c of s?.cohorts ?? []) {
    pages.push({
      url: `${SITE_URL}/${c.slug}`,
      lastModified,
      changeFrequency: c.isCurrent ? 'daily' : 'monthly',
      priority: c.isCurrent ? 0.9 : 0.7,
    });
    for (const t of c.teams) {
      pages.push({
        url: `${SITE_URL}/${c.slug}/${t.team}`,
        lastModified,
        changeFrequency: c.isCurrent ? 'weekly' : 'yearly',
        priority: 0.5,
      });
    }
  }
  return pages;
}
