import {
  Circle,
  Diamond,
  Hexagon,
  Square,
  Star,
  Triangle,
  type LucideIcon,
} from 'lucide-react';
import { createElement } from 'react';

/** A different shape per series, so color is never the only cue in a legend. */
const ICONS: LucideIcon[] = [Circle, Square, Triangle, Diamond, Hexagon, Star];

function iconProps(color: string, className: string) {
  return { 'aria-hidden': true, className, style: { color, fill: color } };
}

/** Filled legend icon in the series color (decorative: the label carries the name). */
export function SeriesIcon({
  index,
  color,
  className = 'size-3.5',
}: {
  index: number;
  color: string;
  className?: string;
}) {
  return createElement(ICONS[index % ICONS.length], {
    ...iconProps(color, `shrink-0 ${className}`),
  });
}

/** For shadcn ChartConfig `icon`, which ChartLegendContent renders in place of the swatch. */
export function coloredIcon(index: number, color: string) {
  return function ColoredIcon() {
    return createElement(ICONS[index % ICONS.length], iconProps(color, 'size-3.5'));
  };
}
