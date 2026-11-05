import { OG_SIZE, ogImage } from '@/lib/og';
import { trendsSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 Capstone Stats: Trends';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogImage(trendsSeo());
}
