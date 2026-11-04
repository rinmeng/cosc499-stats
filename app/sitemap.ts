import type { MetadataRoute } from 'next';

import { getSummary } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const s = getSummary();
  const lastModified = s ? new Date(s.generatedAt) : new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: 'daily', priority: 1 },
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
