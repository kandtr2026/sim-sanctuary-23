import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Khoá hai luật của kho dùng cho /dinh-gia-sim.
 *
 * 1. PROJECTION. Tab kho có 15 cột, trong đó H "GIÁ THU VỀ" và L "Giá Thu Điều
 *    Chỉnh" là giá vốn. Bản cũ tải `export?format=csv` của cả tab (5.630 KB)
 *    xuống trình duyệt mọi khách nên hai cột đó đọc được bằng DevTools. Test này
 *    soi đúng chuỗi query gửi lên Google, vì đó là chỗ duy nhất quyết định cột
 *    nào rời khỏi Google.
 * 2. DÒNG KHÔNG BÁN ĐƯỢC. Giá typo, SIM đã bán và số rụng số 0 đầu đều từng lọt
 *    vào khối "SIM tương tự" dưới dạng thẻ bấm không được.
 *
 * Module cache kho 5 phút trong biến module-scope, nên mỗi test nạp lại module
 * bằng `vi.resetModules()` để không ăn cache của test trước.
 */

const csvResponse = (body: string) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'text/csv' }),
    text: async () => body,
  }) as unknown as Response;

const INVENTORY_HEADER = '" SimID ","SỐ THUÊ BAO"," GIÁ BÁN "';
const SOLD_HEADER = '"SoThueBao"';

/** Kho thật đưa về 5 dòng đại diện, giữ nguyên cách Google format ô giá. */
const INVENTORY_CSV = [
  INVENTORY_HEADER,
  '"SIM128989","0799977799","  39,000,000 "',
  '"SIM135790","937749068","  10 "', // giá typo — dòng rác trên site thật
  '"SIM128791","0789999993","  68,000,000 "', // đã bán
  '"SIM133228","0777997999",""', // trống giá
  '"SIM999001","901942752","  5,000,000 "', // Google rụng số 0 đầu
].join('\n');

const SOLD_CSV = [SOLD_HEADER, '"SIM128791"', '"SIM036227"'].join('\n');

const stubSheets = (inventoryCsv = INVENTORY_CSV, soldCsv = SOLD_CSV) => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      return csvResponse(url.includes('SIM_SOLD') ? soldCsv : inventoryCsv);
    }),
  );
  return urls;
};

/** Lấy phần `tq=` của URL gviz đã bị bọc hai lần bởi sheet-proxy. */
const gvizQueryOf = (proxyUrl: string): string => {
  const target = decodeURIComponent(new URL(proxyUrl).searchParams.get('url') ?? '');
  return decodeURIComponent(new URL(target).searchParams.get('tq') ?? '');
};

const freshModule = async () => {
  vi.resetModules();
  return import('@/lib/simInventorySheet');
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('kho /dinh-gia-sim: projection cột', () => {
  it('chỉ xin SimID + số thuê bao + GIÁ BÁN, không xin cột giá vốn', async () => {
    const urls = stubSheets();
    const { loadSimInventory } = await freshModule();
    await loadSimInventory();

    const inventoryUrl = urls.find((u) => !u.includes('SIM_SOLD'));
    expect(inventoryUrl).toBeDefined();
    const query = gvizQueryOf(inventoryUrl!);

    expect(query.startsWith('select A, C, D ')).toBe(true);
    // H = GIÁ THU VỀ, L = Giá Thu Điều Chỉnh, G = Final_Price: không cột nào
    // được đứng trong danh sách select.
    expect(query.slice(0, query.indexOf('where'))).not.toMatch(/\b[BEFGHIJKLMNO]\b/);
    expect(query).not.toContain('select *');
  });

  it('lọc giá lỗi và dòng ẨN ngay trong query, không lọc ở trình duyệt', async () => {
    const urls = stubSheets();
    const { loadSimInventory, INVENTORY_MIN_PRICE } = await freshModule();
    await loadSimInventory();

    const query = gvizQueryOf(urls.find((u) => !u.includes('SIM_SOLD'))!);
    expect(query).toContain(`D >= ${INVENTORY_MIN_PRICE}`);
    // Thiếu nhánh `K is null` là rơi sạch 51.334 dòng đang bán, vì gviz coi ô
    // trống là null và `null != 'ẩn'` không đúng.
    expect(query).toContain("K is null or lower(K) != 'ẩn'");
  });

  it('sổ SIM_SOLD chỉ xin cột SimID', async () => {
    const urls = stubSheets();
    const { loadSimInventory } = await freshModule();
    await loadSimInventory();

    const soldUrl = urls.find((u) => u.includes('SIM_SOLD'));
    expect(soldUrl).toBeDefined();
    expect(gvizQueryOf(soldUrl!)).toBe('select B');
  });
});

describe('kho /dinh-gia-sim: dòng không bán được', () => {
  it('bỏ giá typo, bỏ SIM đã bán, bù số 0 đầu cho số 9 chữ số', async () => {
    stubSheets();
    const { loadSimInventory } = await freshModule();
    const inventory = await loadSimInventory();

    expect(inventory.map((i) => i.simId)).toEqual(['SIM128989', 'SIM999001']);
    expect(inventory.every((i) => i.phone.length === 10)).toBe(true);
    expect(inventory.every((i) => i.carrier !== 'Unknown')).toBe(true);
    expect(inventory.every((i) => i.price >= 10_000)).toBe(true);

    const padded = inventory.find((i) => i.simId === 'SIM999001');
    expect(padded?.phone).toBe('0901942752');
    expect(padded?.carrier).toBe('Mobi');
  });

  it('không đưa dòng rác 937749068 vào khối SIM tương tự', async () => {
    stubSheets();
    const { getSimilarSims } = await freshModule();
    const similar = await getSimilarSims({
      phone: '0907891189',
      carrier: 'Mobi',
      tags: [],
      range: [2_000_000, 20_000_000],
    });

    expect(similar.some((s) => s.phone.includes('937749068'))).toBe(false);
    expect(similar.every((s) => s.price > 0 && s.carrier !== 'Unknown')).toBe(true);
  });

  it('sổ SIM_SOLD lỗi thì kho vẫn hiện (fail-safe)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes('SIM_SOLD')) throw new Error('proxy down');
        return csvResponse(INVENTORY_CSV);
      }),
    );
    const { loadSimInventory } = await freshModule();
    const inventory = await loadSimInventory();
    expect(inventory.map((i) => i.simId)).toContain('SIM128791');
  });
});

describe('kho /dinh-gia-sim: guard thứ tự cột', () => {
  it('ném lỗi khi sheet chèn cột làm lệch projection', async () => {
    // Chữ cái cột là theo vị trí: chèn một cột trước GIÁ BÁN là `select A, C, D`
    // trả về cột khác — và cột cạnh D chính là nhóm giá vốn.
    const shifted = [
      '" SimID ","SỐ THUÊ BAO","GIÁ THU VỀ"',
      '"SIM128989","0799977799","31,200,000"',
    ].join('\n');
    stubSheets(shifted);
    const { loadSimInventory } = await freshModule();
    await expect(loadSimInventory()).rejects.toThrow(/đổi thứ tự/);
  });
});
