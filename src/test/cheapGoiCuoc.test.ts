import { describe, it, expect } from 'vitest';
import {
  CHEAP_HEADER_GUARD,
  CHEAP_PRICE_BOUNDS,
  buildCheapSim,
  normalizeGoiCuoc,
} from '@/lib/cheapSimSheet';

/**
 * Khoá nhãn gói cước của kho 229k.
 *
 * Thẻ SIM từng in cứng "ĐÃ GỒM GÓI TK179" cho mọi số, trong khi cột `Phân loại`
 * của kho (13.088 dòng) cho thấy chỉ 649 số là TK179 và 8.387 số KHÔNG kèm gói.
 * Hai chốt chặn ở đây: nhãn phải đi ra từ dữ liệu từng dòng, và cột `Phân loại`
 * phải nằm trong projection (bỏ nó khỏi `select` là nhãn lại thành cứng).
 */
describe('normalizeGoiCuoc', () => {
  it('rút tên gói khỏi tiền tố kênh bán và hậu tố đối tác', () => {
    expect(normalizeGoiCuoc('TMDT-TK179_MQ')).toBe('TK179');
    expect(normalizeGoiCuoc('TMDT-TK179')).toBe('TK179');
    expect(normalizeGoiCuoc('TMDT-M125M_MQ')).toBe('M125M');
    expect(normalizeGoiCuoc('TMDT-HN125M_MQ')).toBe('HN125M');
    expect(normalizeGoiCuoc('TMDT-MXH120_ETK')).toBe('MXH120');
    expect(normalizeGoiCuoc('TMDT-12TK159_ZP')).toBe('TK159');
    expect(normalizeGoiCuoc('TMDT-6TK159_MQ')).toBe('TK159');
    expect(normalizeGoiCuoc('TMDT-TK135_MQ')).toBe('TK135');
    expect(normalizeGoiCuoc('TMDT-NA90_ZP')).toBe('NA90');
    expect(normalizeGoiCuoc('PT90_BTG')).toBe('PT90');
    expect(normalizeGoiCuoc('MXH120')).toBe('MXH120');
  });

  it('ô trống nghĩa là SIM không có gói', () => {
    expect(normalizeGoiCuoc('')).toBe('');
    expect(normalizeGoiCuoc('   ')).toBe('');
    expect(normalizeGoiCuoc(undefined as unknown as string)).toBe('');
  });

  it('không suy ra TK179 cho giá trị lạ', () => {
    expect(normalizeGoiCuoc('TMDT-GOILA_MQ')).not.toContain('TK179');
  });
});

describe('buildCheapSim — mang gói cước theo từng dòng', () => {
  const args = ['SIMKM0028542', '0906980162', '229.000'] as const;

  it('gắn đúng gói của dòng đó', () => {
    const sim = buildCheapSim(...args, CHEAP_PRICE_BOUNDS, 'TMDT-TK179_MQ');
    expect(sim?.goiCuoc).toBe('TK179');
    expect(sim?.price).toBe(229_000);
  });

  it('dòng không có gói thì goiCuoc rỗng, không mặc định TK179', () => {
    expect(buildCheapSim(...args, CHEAP_PRICE_BOUNDS, '')?.goiCuoc).toBe('');
    // Gọi thiếu tham số (đường cache cũ) cũng không được bịa ra gói.
    expect(buildCheapSim(...args, CHEAP_PRICE_BOUNDS)?.goiCuoc).toBe('');
  });

  it('cột Phân loại phải nằm trong header guard', () => {
    expect(CHEAP_HEADER_GUARD).toEqual(['simid', 'stb1', 'phanloai', 'giaban']);
  });
});
