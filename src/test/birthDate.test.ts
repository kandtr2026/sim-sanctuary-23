import { describe, it, expect } from 'vitest';
import { parseBirthDate, formatBirthDateDisplay, tryParseBirthDateLenient, formatBirthDateDisplayLenient } from '@/lib/simUtils';

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

describe('tryParseBirthDateLenient — parser linh hoạt nhiều định dạng', () => {
  it('DDMMYY (2-2-2): 0903.20.01.98 → 20/01/1998', () => {
    expect(tryParseBirthDateLenient('0903200198')).toMatchObject({ d: 20, m: 1, y: 1998 });
  });

  it('DDMYY (2-1-2): 090920213 → 20/02/2013', () => {
    expect(tryParseBirthDateLenient('090920213')).toMatchObject({ d: 20, m: 2, y: 2013 });
  });

  it('D.M.YYYY (1-1-4): 0908892001 → 08/09/2001', () => {
    expect(tryParseBirthDateLenient('0908892001')).toMatchObject({ d: 8, m: 9, y: 2001 });
  });

  it('D.M.YYYY: 0909922000 → 09/02/2000', () => {
    expect(tryParseBirthDateLenient('0909922000')).toMatchObject({ d: 9, m: 2, y: 2000 });
  });

  it('display chuẩn dd.mm.yyyy: 0909922000 → 09.02.2000', () => {
    const r = tryParseBirthDateLenient('0909922000');
    expect(r?.display).toBe('09.02.2000');
  });

  it('31.11 không tồn tại → null', () => {
    expect(tryParseBirthDateLenient('0938311113')).toBeNull();
  });

  it('29.02 năm không nhuận → null', () => {
    expect(tryParseBirthDateLenient('0909290201')).toBeNull();
  });

  it('năm 30-49 mơ hồ → null', () => {
    expect(tryParseBirthDateLenient('0909150845')).toBeNull();
  });

  it('không đủ số → null', () => {
    expect(tryParseBirthDateLenient('0909')).toBeNull();
  });
});

describe('formatBirthDateDisplayLenient — hiển thị chuẩn dd.mm.yyyy', () => {
  it('0909922000 → 0909.09.02.2000', () => {
    expect(formatBirthDateDisplayLenient('0909922000')).toBe('0909.09.02.2000');
  });

  it('090920213 → 0909.20.02.2013', () => {
    expect(formatBirthDateDisplayLenient('090920213')).toBe('0909.20.02.2013');
  });

  it('0938882026 → 0938.08.08.2026', () => {
    expect(formatBirthDateDisplayLenient('0938882026')).toBe('0938.08.08.2026');
  });

  it('0776002002 (không thành ngày) → null', () => {
    expect(formatBirthDateDisplayLenient('0776002002')).toBeNull();
  });
});
