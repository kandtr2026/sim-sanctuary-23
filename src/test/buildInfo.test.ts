import { describe, it, expect } from 'vitest';
import { formatBuildAge, formatBuildTime } from '@/lib/buildInfo';

describe('formatBuildTime', () => {
  it('renders a UTC instant in Vietnam time (UTC+7) as HH:mm DD/MM/YYYY', () => {
    // 13:15 UTC on 4 Aug 2026 is 20:15 the same day in Ho Chi Minh City.
    expect(formatBuildTime('2026-08-04T13:15:00.000Z')).toBe('20:15 04/08/2026');
  });

  it('rolls the date forward when UTC+7 crosses midnight', () => {
    // 18:30 UTC is 01:30 the NEXT day in Vietnam — the date must advance, which is
    // the case a naive UTC-only formatter gets wrong.
    expect(formatBuildTime('2026-08-04T18:30:00.000Z')).toBe('01:30 05/08/2026');
  });

  it('uses 24-hour time rather than a 12-hour clock', () => {
    expect(formatBuildTime('2026-01-31T17:00:00.000Z')).toBe('00:00 01/02/2026');
  });

  it('returns "unknown" for an unparseable timestamp instead of NaN', () => {
    expect(formatBuildTime('not-a-date')).toBe('unknown');
  });
});

describe('formatBuildAge', () => {
  const built = '2026-08-04T13:15:00.000Z';
  const at = (msAfter: number) => new Date(built).getTime() + msAfter;

  it('reports seconds below one minute', () => {
    expect(formatBuildAge(built, at(30_000))).toBe('30 giây trước');
  });

  it('reports whole minutes below one hour', () => {
    expect(formatBuildAge(built, at(5 * 60_000))).toBe('5 phút trước');
  });

  it('reports whole hours below one day', () => {
    expect(formatBuildAge(built, at(3 * 3_600_000))).toBe('3 giờ trước');
  });

  it('reports days beyond 24 hours', () => {
    expect(formatBuildAge(built, at(50 * 3_600_000))).toBe('2 ngày trước');
  });

  it('does not render a negative age when clocks disagree', () => {
    // The viewer's clock can legitimately sit behind the build machine's.
    expect(formatBuildAge(built, at(-60_000))).toBe('vừa xong');
  });

  it('returns an empty string for an unparseable timestamp', () => {
    expect(formatBuildAge('not-a-date', at(0))).toBe('');
  });
});
