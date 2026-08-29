import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import SIMCardNew from '@/components/SIMCardNew';
import { normalizeSIM } from '@/lib/simUtils';

/**
 * Đường khuyến mãi của thẻ SIM chỉ sống lại khi có `promotional`, mà hôm nay
 * không lưới nào truyền vào (mọi lưới đọc `/api/sims`, còn
 * `promotionalDataStore` chỉ được `useSimData` nạp). Test này là chỗ duy nhất
 * chạy được nhánh đó: khách sẽ đọc nhãn nào nếu shop bật khuyến mãi lại.
 */
describe('SIMCardNew — nhãn khuyến mãi', () => {
  const sim = normalizeSIM('0906123456', '0906.123.456', 1_500_000, 'SIM000001');

  it('giảm 500.000đ hiện đúng "Giảm 500.000đ", không phải "Giảm 1 triệu"', () => {
    render(
      createElement(SIMCardNew, {
        sim,
        promotional: { originalPrice: 2_000_000, finalPrice: 1_500_000 },
      }),
    );

    expect(screen.getByText('Giảm 500.000đ')).toBeTruthy();
    expect(screen.queryByText('Giảm 1 triệu')).toBeNull();
    // Giá gạch (giá gốc) và giá bán vẫn in đủ số.
    expect(screen.getByText('2.000.000đ')).toBeTruthy();
    expect(screen.getByText('1.500.000đ')).toBeTruthy();
  });

  it('không có dữ liệu khuyến mãi thì không có nhãn giảm nào', () => {
    const { container } = render(createElement(SIMCardNew, { sim }));
    expect(container.textContent).not.toContain('Giảm');
    expect(container.querySelector('img[alt="Flash Sale"]')).toBeNull();
  });
});
