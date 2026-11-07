import { OG_SIZE, ogImage } from '@/lib/og';
import { gradesSeo } from '@/lib/seo';

export const alt = 'UBCO COSC 499 Capstone Stats: Grades';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return ogImage(gradesSeo());
}
