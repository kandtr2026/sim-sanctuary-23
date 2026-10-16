import { describe, expect, it } from 'vitest';
import { normalizePhone, parseSoldCsv } from '../../supabase/functions/_shared/simSold';

// Header + dòng đúng như tab SIM_SOLD xuất CSV qua gviz (16/10/2026).
const HEADER = '"SoldID","SoThueBao","GiaThu","NgayBan","TrangThai","Kênh bán","GhiChu","Ngày nhập liệu","STB chuan","Status","",""';
const line = (id: string, stb: string) => `"x","${id}","350,000","1/22/2026","Sold","Tiktok","","2/1/2026 12:18:28","${stb}","Đã xóa Appsim","",""`;

describe('parseSoldCsv (tab SIM_SOLD)', () => {
  it('lấy cả SimID (cột SoThueBao) lẫn số điện thoại (cột STB chuan, thêm số 0 đầu)', () => {
    const { ids, phones } = parseSoldCsv([HEADER, line('SIM036227', '799515759'), line('sim037559', '0799681878')].join('\n'));
    expect([...ids]).toEqual(['SIM036227', 'SIM037559']);
    expect([...phones]).toEqual(['0799515759', '0799681878']);
  });

  it('số bán dưới SimID khác SimID trên web vẫn bị bắt nhờ số điện thoại', () => {
    const { ids, phones } = parseSoldCsv([HEADER, line('SIM999999', '938868868')].join('\n'));
    // Web giữ số này dưới SimID khác (vd SIMBS0938868868) — so SimID thì lọt.
    expect(ids.has('SIMBS0938868868')).toBe(false);
    expect(phones.has('0938868868')).toBe(true);
  });

  it('bỏ ô STB chuan trống hoặc không phải số; CSV rỗng thì sổ rỗng', () => {
    const { phones } = parseSoldCsv([HEADER, line('SIM1', ''), line('SIM2', 'abc'), line('SIM3', '12345')].join('\n'));
    expect(phones.size).toBe(0);
    expect(parseSoldCsv('').ids.size).toBe(0);
  });
});

describe('normalizePhone', () => {
  it('chỉ giữ chữ số, 9 chữ số thì thêm 0', () => {
    expect(normalizePhone('0938.868.868')).toBe('0938868868');
    expect(normalizePhone(938868868)).toBe('0938868868');
    expect(normalizePhone(null)).toBe('');
  });
});
