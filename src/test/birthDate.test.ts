import { describe, it, expect } from 'vitest';
import { parseBirthDate, formatBirthDateDisplay } from '@/lib/simUtils';

describe('parseBirthDate — đọc ngày sinh từ đuôi số', () => {
  it('DDMMYY: 20.01.98 từ 0909.200198', () => {
    expect(parseBirthDate('0909200198')).toEqual({ d: 20, m: 1, y: 1998, display: '20.1.98' });
  });

  it('D.M.YYYY: 8.9.2001 từ 0908.892001', () => {
    expect(parseBirthDate('0908892001')).toEqual({ d: 8, m: 9, y: 2001, display: '8.9.2001' });
  });

  it('D.M.YYYY: 9.2.2000 từ 0909922000', () => {
    expect(parseBirthDate('0909922000')).toEqual({ d: 9, m: 2, y: 2000, display: '9.2.2000' });
  });

  it('31.11 là ngày không tồn tại → null', () => {
    expect(parseBirthDate('0938311113')).toBeNull();
  });

  it('29.02 năm không nhuận → null', () => {
    expect(parseBirthDate('0909290201')).toBeNull();
  });

  it('yy 30–49 mơ hồ → null', () => {
    expect(parseBirthDate('0909150845')).toBeNull();
  });

  it('không đủ 6 số → null', () => {
    expect(parseBirthDate('0909')).toBeNull();
  });
});

describe('formatBirthDateDisplay — dùng cho card sim năm sinh', () => {
  it('0909922000 → 0909.9.2.2000', () => {
    expect(formatBirthDateDisplay('0909922000')).toBe('0909.9.2.2000');
  });

  it('0934191991 → 0934.1.9.1991', () => {
    expect(formatBirthDateDisplay('0934191991')).toBe('0934.1.9.1991');
  });

  it('0938882026 → 0938.8.8.2026', () => {
    expect(formatBirthDateDisplay('0938882026')).toBe('0938.8.8.2026');
  });

  it('0776002002 (không thành ngày) → null', () => {
    expect(formatBirthDateDisplay('0776002002')).toBeNull();
  });
});
