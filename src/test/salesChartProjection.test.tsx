import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { SalesChart } from '@/components/admin/SalesChart';

/**
 * SalesChart của /admin: chỉ xin những cột biểu đồ dùng, đi qua `sheet-proxy`
 * như mọi chỗ khác, và (từ góp ý A Khoa 13/09) bấm vào một cột thì hiện danh
 * sách từng SIM đã bán trong kỳ đó — số thật + giá + ngày.
 *
 * Projection nay là `A SoldID · C GiaThu · I "STB chuan" (số thật) · ngày`.
 * Cột I được xin THÊM để dựng danh sách chi tiết; vẫn không tải cả 24 cột.
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
  '"SoldID","GiaThu","STB chuan","year(NgayBan)","month(NgayBan)","day(NgayBan)"',
  // month() của gviz đếm từ 0 → "7" là tháng 8. STB rớt số 0 đầu (cột số).
  '"c0b9c4a4","1,500,000","799515759","2026","7","28"',
  '"d1ed7e94","1,650,000","0912345678","2026","7","28"',
  // Cùng SoldID với dòng trên: bán lại sau khi khách trả, chỉ tính một lần.
  '"d1ed7e94","1,650,000","0912345678","2026","7","28"',
  // Ngày trống: gviz trả rỗng, dòng phải bị bỏ chứ không thành Invalid Date.
  '"e56a12f0","29,500,000","988888888","","",""',
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
  const result = render(createElement(SalesChart));
  // Cho effect chạy xong lượt fetch đầu.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return result;
};

afterEach(() => {
  cleanup();
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

  it('xin SoldID + GiaThu + STB chuan + ngày, không xin cả tab', async () => {
    const urls = stubFetch();
    await renderChart();

    const query = gvizQueryOf(urls[0]);
    expect(query.startsWith('select A, C, I, year(D), month(D), day(D)')).toBe(true);
    expect(query).not.toContain('select *');
    // B SoThueBao, E TrangThai, F Kênh bán, G GhiChu, H, J… không cột nào được
    // xin (I nay ĐƯỢC xin có chủ đích cho danh sách chi tiết).
    expect(query.slice(0, query.indexOf('where'))).not.toMatch(/\b[BEFGHJ]\b/);
  });

  it('cộng đúng số đơn, bỏ dòng trùng SoldID và dòng trống ngày', async () => {
    stubFetch();
    const { container } = await renderChart();

    // 2 dòng hợp lệ (1 trùng SoldID bị bỏ, 1 trống ngày bị bỏ).
    const summary = container.textContent ?? '';
    expect(summary).toContain('Tổng 2 SIM');
    expect(summary).not.toContain('Đang tải');
  });

  it('bấm cột hiện danh sách SIM đã bán: số thật + giá + ngày', async () => {
    stubFetch();
    await renderChart();

    // Cột ngày 28/8 có 2 SIM — bấm vào.
    const bar = screen.getByRole('button', { name: /2 SIM đã bán/ });
    fireEvent.click(bar);

    // Số thật: 9 chữ số được thêm "0" đầu và nhóm 4-3-3; số 10 chữ số giữ nguyên nhóm.
    expect(screen.getByText('0799 515 759')).toBeTruthy();
    expect(screen.getByText('0912 345 678')).toBeTruthy();
    // Giá đầy đủ + ngày dd/m/yyyy.
    expect(screen.getByText('1.500.000đ')).toBeTruthy();
    expect(screen.getByText('1.650.000đ')).toBeTruthy();
    expect(screen.getAllByText('28/8/2026').length).toBeGreaterThan(0);
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
