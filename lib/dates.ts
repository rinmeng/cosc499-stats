/**
 * Shared date helpers, all built on date-fns. Server, client and scripts use these
 * instead of raw `Date` math so time zones and rounding stay the same everywhere.
 */
import { tz } from '@date-fns/tz';
import { differenceInMilliseconds, format, formatISO, parseISO } from 'date-fns';
import { millisecondsInHour, millisecondsInWeek } from 'date-fns/constants';

import { timezone } from '../sync.config';

/** Term dates and date-only strings (YYYY-MM-DD) are UTC calendar days. */
export const UTC = tz('UTC');
/** Where the course runs (sync.config `timezone`): local hours, weekdays and dates. */
export const LOCAL = tz(timezone);

/** Parse an ISO date or timestamp. Date-only strings are UTC midnight. */
export const parseDate = (iso: string) => parseISO(iso, { in: UTC });

/** Calendar date as YYYY-MM-DD, in UTC unless another zone is given. */
export const isoDate = (d: Date | string, zone = UTC) =>
  format(typeof d === 'string' ? parseDate(d) : d, 'yyyy-MM-dd', { in: zone });

/** Full UTC timestamp, e.g. 2026-11-07T18:00:00Z. */
export const isoTimestamp = (d: Date) => formatISO(d, { in: UTC });

/** Whole weeks from `start` to `d`, rounded down (negative before `start`). */
export const weeksSince = (d: Date | string, start: Date | string) =>
  Math.floor(
    differenceInMilliseconds(
      typeof d === 'string' ? parseDate(d) : d,
      typeof start === 'string' ? parseDate(start) : start
    ) / millisecondsInWeek
  );

/** Hours between two timestamps, with fractions. */
export const hoursBetween = (later: string, earlier: string) =>
  differenceInMilliseconds(parseDate(later), parseDate(earlier)) / millisecondsInHour;
