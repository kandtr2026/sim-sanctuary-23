import { describe, it, expect, vi, afterEach } from 'vitest';
import { createElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SeoRankTable from '@/components/admin/SeoRankTable';
import type { KetQuaHang } from '@/lib/gscRank';

/**
 * Bảng thứ hạng nằm trong `/admin/seo` — trang bị `RequireAdmin` chặn, nên không
 * xem được bằng browser mà không có đăng nhập. Test render là chỗ duy nhất kiểm
 * được hai trạng thái quan trọng nhất của bảng.
 */
const traLoi = (body: KetQuaHang) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => body }) as unknown as Response),
  );
};

const goc = {
  tuKhoa: 'sim thần tài mobifone',
  nhom: 'danh mục',
  urlDich: '/sim-than-tai',
  trangThai: 'co',
};

afterEach(() => vi.unstubAllGlobals());

describe('SeoRankTable', () => {
  it('chưa nối GSC: cảnh báo + nêu TÊN biến thiếu, và vẫn liệt kê từ khoá', async () => {
    traLoi({
      daNoiGsc: false,
      thieuBien: ['GSC_SIM_CLIENT_EMAIL', 'GSC_SIM_PRIVATE_KEY'],
      site: null,
      khoang: null,
      soNgay: 28,
      loi: null,
      tuKhoa: [{ ...goc, hang: null, urlThucTe: null, hienThi: 0, click: 0, lechUrl: false }],
    });

    render(createElement(SeoRankTable));

    await waitFor(() => expect(screen.getByText(/Chưa nối Search Console/)).toBeTruthy());
    // Nêu tên biến để chủ shop biết đặt gì — nhưng KHÔNG bao giờ là giá trị.
    expect(screen.getByText(/GSC_SIM_CLIENT_EMAIL/)).toBeTruthy();
    // Từ khoá vẫn hiện dù chưa có thứ hạng: bảng còn dùng để xem trang đích.
    expect(screen.getByText('sim thần tài mobifone')).toBeTruthy();
  });

  it('đã nối: hiện số hạng và gắn cờ khi xếp hạng bằng trang khác trang đích', async () => {
    traLoi({
      daNoiGsc: true,
      thieuBien: [],
      site: 'https://www.chonsomobifone.com/',
      khoang: { tuNgay: '2026-08-01', denNgay: '2026-08-29' },
      soNgay: 28,
      loi: null,
      tuKhoa: [
        { ...goc, hang: 2.4, urlThucTe: 'https://www.chonsomobifone.com/sim-than-tai', hienThi: 120, click: 8, lechUrl: false },
        {
          ...goc,
          tuKhoa: 'sim thần tài 39 79',
          hang: 12.7,
          urlThucTe: 'https://www.chonsomobifone.com/tin-tuc/y-nghia-sim-so-dep',
          hienThi: 40,
          click: 0,
          lechUrl: true,
        },
      ],
    });

    render(createElement(SeoRankTable));

    await waitFor(() => expect(screen.getByText('2.4')).toBeTruthy());
    expect(screen.getByText('12.7')).toBeTruthy();
    // Cờ lệch trang đích: dấu hiệu hai trang tranh nhau cùng một cụm.
    expect(screen.getByText(/xếp hạng bằng trang khác/)).toBeTruthy();
    // Không hiện khối "chưa nối" khi đã có dữ liệu.
    expect(screen.queryByText(/Chưa nối Search Console/)).toBeNull();
  });
});
