import { OG_SIZE, ogImage } from '@/lib/og';
import { overviewSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 Capstone Stats: Overview';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogImage(overviewSeo());
}
