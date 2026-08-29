import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import SIMCardNew from '@/components/SIMCardNew';
import { normalizeSIM } from '@/lib/simUtils';

/**
 * Khuyến mãi của thẻ SIM đọc từ `sim.originalPrice` — field chỉ tồn tại khi giá
 * gốc THẬT SỰ cao hơn giá bán (luật chốt ở tầng dữ liệu, xem `NormalizedSIM`).
 *
 * Vì sao test này là chỗ duy nhất chạy được nhánh đó: sheet hiện có **0 dòng giảm
 * giá** (51.636 dòng đều `Final_Price = GIÁ BÁN`), nên không thể thấy khối này
 * trên site thật. Test giữ đúng hai điều: nhãn in ĐÚNG số tiền giảm, và không có
 * dữ liệu giảm thì không vẽ gì.
 */
describe('SIMCardNew — nhãn khuyến mãi', () => {
  const sim = normalizeSIM('0906123456', '0906.123.456', 1_500_000, 'SIM000001');

  it('giảm 500.000đ hiện đúng "Giảm 500.000đ", không phải "Giảm 1 triệu"', () => {
    render(createElement(SIMCardNew, { sim: { ...sim, originalPrice: 2_000_000 } }));

    expect(screen.getByText('Giảm 500.000đ')).toBeTruthy();
    expect(screen.queryByText('Giảm 1 triệu')).toBeNull();
    // Giá gạch (giá gốc) và giá bán vẫn in đủ số.
    expect(screen.getByText('2.000.000đ')).toBeTruthy();
    expect(screen.getByText('1.500.000đ')).toBeTruthy();
  });

  it('không có originalPrice thì không có nhãn giảm nào', () => {
    const { container } = render(createElement(SIMCardNew, { sim }));
    expect(container.textContent).not.toContain('Giảm');
    expect(container.querySelector('img[alt="Flash Sale"]')).toBeNull();
  });

  /**
   * Chốt chặn cho luật "chỉ khi cao hơn": tầng dữ liệu đã lọc, nhưng nếu một
   * đường nào đó lỡ đưa giá gốc BẰNG giá bán tới đây thì tuyệt đối không được
   * hiện "Giảm 0đ" — đó là quảng cáo sai.
   */
  it('giá gốc bằng giá bán thì không hiện "Giảm 0đ"', () => {
    const { container } = render(
      createElement(SIMCardNew, { sim: { ...sim, originalPrice: 1_500_000 } }),
    );
    expect(container.textContent).not.toContain('Giảm 0đ');
  });
});
