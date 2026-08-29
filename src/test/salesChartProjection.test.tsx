import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * SalesChart của /admin: chỉ được xin đúng những cột biểu đồ dùng, và phải đi
 * qua `sheet-proxy` như mọi chỗ khác của site.
 *
 * Bản cũ `fetch` thẳng gviz với `sheet=SIM_SOLD` không kèm query, tức tải cả 24
 * cột × 2.274 dòng (383.825 byte) về trình duyệt, trong đó `GhiChu`, `Kênh bán`,
 * `STB chuan`… biểu đồ không dùng đến.
 */

const csvResponse = (body: string) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'text/csv' }),
    text: async () => body,
  }) as unknown as Response;

const SOLD_CSV = [
  '"SoldID","GiaThu","year(NgayBan)","month(NgayBan)","day(NgayBan)"',
  '"c0b9c4a4","1,500,000","2026","7","28"',
  '"d1ed7e94","1,650,000","2026","7","28"',
  // Cùng SoldID với dòng trên: bán lại sau khi khách trả, chỉ tính một lần.
  '"d1ed7e94","1,650,000","2026","7","28"',
  // Ngày trống: gviz trả rỗng, dòng phải bị bỏ chứ không thành Invalid Date.
  '"e56a12f0","29,500,000","","",""',
].join('\n');

const stubFetch = () => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return csvResponse(SOLD_CSV);
    }),
  );
  return urls;
};

/** Lấy phần `tq=` của URL gviz đã bị bọc bởi sheet-proxy. */
const gvizQueryOf = (proxyUrl: string): string => {
  const target = decodeURIComponent(new URL(proxyUrl).searchParams.get('url') ?? '');
  return decodeURIComponent(new URL(target).searchParams.get('tq') ?? '');
};

const renderChart = async () => {
  vi.resetModules();
  const [{ SalesChart }, { render }, React] = await Promise.all([
    import('@/components/admin/SalesChart'),
    import('@testing-library/react'),
    import('react'),
  ]);
  const result = render(React.createElement(SalesChart));
  // Cho effect chạy xong lượt fetch đầu.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return result;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SalesChart — projection qua sheet-proxy', () => {
  it('không gọi thẳng Google, mà đi qua sheet-proxy', async () => {
    const urls = stubFetch();
    await renderChart();

    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/functions/v1/sheet-proxy?url=');
    expect(urls[0].startsWith('https://docs.google.com/')).toBe(false);
  });

  it('chỉ xin SoldID + GiaThu + ngày, không xin cả tab', async () => {
    const urls = stubFetch();
    await renderChart();

    const query = gvizQueryOf(urls[0]);
    expect(query.startsWith('select A, C, year(D), month(D), day(D)')).toBe(true);
    expect(query).not.toContain('select *');
    // B SoThueBao, E TrangThai, F Kênh bán, G GhiChu… không cột nào được xin.
    expect(query.slice(0, query.indexOf('where'))).not.toMatch(/\b[BEFGHIJ]\b/);
  });

  it('cộng đúng số đơn và giá trị, bỏ dòng trùng SoldID và dòng trống ngày', async () => {
    stubFetch();
    const { container } = await renderChart();

    // 2 dòng hợp lệ (1 trùng SoldID bị bỏ, 1 trống ngày bị bỏ) = 3,15 tr.
    const summary = container.textContent ?? '';
    expect(summary).toContain('Tổng 2 SIM');
    expect(summary).not.toContain('Đang tải');
  });

  it('header lệch cột thì báo lỗi thay vì vẽ bằng cột sai', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        csvResponse(['"SoldID","SoThueBao","GiaThu","NgayBan"', '"c0b9c4a4","SIM128989","1,500,000","8/28/2026"'].join('\n')),
      ),
    );
    const { container } = await renderChart();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.textContent).toContain('đổi thứ tự');
  });
});
