import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formatPrice } from '@/lib/simUtils';
import { formatDiscountAmount } from '@/components/SIMCardNew';
import { isOrderablePrice } from '@/app/mua-ngay/[simId]/CheckoutClient';
import { validatePayload } from '../../supabase/functions/make-webhook-proxy/_validators';

/**
 * Ba luật "con số nói đúng" của site.
 *
 * 1. GIÁ trên trang tứ quý phải bằng giá ở trang đặt hàng.
 * 2. NHÃN GIẢM GIÁ phải bằng số tiền giảm thật.
 * 3. GIÁ 0 thì không cho đặt hàng, vì webhook từ chối `priceVnd <= 0`.
 *
 * Cả ba đều từng sai theo cùng một kiểu: giao diện tự nghĩ ra cách nói về tiền
 * thay vì đi qua `formatPrice` / đi theo luật của webhook.
 */

const readSource = (relative: string): string =>
  readFileSync(resolve(process.cwd(), relative), 'utf8');

/** Chính là công thức cũ ở MuaSimTuQuyTool.tsx:161-163, giữ để đo độ lệch. */
const oldMillionLabel = (price: number): string =>
  `${(price / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;

/** "3,9 triệu" → 3.900.000 */
const labelToVnd = (label: string): number =>
  Number(label.replace(' triệu', '').replace(',', '.')) * 1_000_000;

describe('LỖI 1 — bảng tứ quý không được làm tròn giá', () => {
  it('dạng "triệu" 1 chữ số thập phân nói cao hơn giá thật', () => {
    // Độ chia của `maximumFractionDigits: 1` trên đơn vị triệu là 100.000đ, nên
    // nhãn lệch tới ±50.000đ so với giá thật.
    expect(oldMillionLabel(3_860_000)).toBe('3,9 triệu');
    expect(labelToVnd(oldMillionLabel(3_860_000)) - 3_860_000).toBe(40_000);

    expect(oldMillionLabel(1_950_000)).toBe('2 triệu');
    expect(labelToVnd(oldMillionLabel(1_950_000)) - 1_950_000).toBe(50_000);
  });

  it('formatPrice in đủ số, không lệch một đồng', () => {
    expect(formatPrice(3_860_000)).toBe('3.860.000đ');
    expect(formatPrice(1_950_000)).toBe('1.950.000đ');
    expect(formatPrice(39_000_000)).toBe('39.000.000đ');
    // Giá trắng vẫn là "Liên hệ", không phải "0đ".
    expect(formatPrice(0)).toBe('Liên hệ');
  });

  it('cột Giá của bảng tứ quý đi qua formatPrice (qua SIMCardNew)', () => {
    const srcTool = readSource('src/app/mua-sim-tu-quy/MuaSimTuQuyTool.tsx');
    const srcCard = readSource('src/components/SIMCardNew.tsx');
    // MuaSimTuQuyTool render SIMCardNew (chứa formatPrice). Kiểm tra cả 2.
    expect(srcTool).toContain('SIMCardNew');
    expect(srcCard).toContain('formatPrice(sim.price)');
    // Chốt chặn: không được quay lại tự quy ra "triệu" trong trang này.
    expect(srcTool).not.toContain('maximumFractionDigits');
    expect(srcTool).not.toContain('1_000_000');
  });
});

describe('LỖI 2 — nhãn giảm giá phải bằng số tiền giảm thật', () => {
  it('giảm 500.000đ không được thành "Giảm 1 triệu"', () => {
    expect(formatDiscountAmount(500_000)).toBe('Giảm 500.000đ');
    expect(formatDiscountAmount(500_000)).not.toContain('1 triệu');
  });

  it('mọi bậc cũ đều nói đúng số tiền', () => {
    // Bậc "k" cũ: Math.round(amount / 1000) nên 499.600đ hiện "Giảm 500k".
    expect(formatDiscountAmount(499_600)).toBe('Giảm 499.600đ');
    // Bậc "triệu" cũ: 3.860.000đ hiện "Giảm 3,9 triệu".
    expect(formatDiscountAmount(3_860_000)).toBe('Giảm 3.860.000đ');
    expect(formatDiscountAmount(1_000_000)).toBe('Giảm 1.000.000đ');
    expect(formatDiscountAmount(12_500_000)).toBe('Giảm 12.500.000đ');
  });

  it('không bao giờ quảng cáo số lớn hơn số tiền giảm thật', () => {
    const readVnd = (label: string): number =>
      Number(label.replace('Giảm ', '').replace(/\./g, '').replace('đ', ''));

    for (const amount of [1_000, 99_000, 499_600, 500_000, 999_999, 1_000_000, 3_860_000, 64_500_000]) {
      expect(readVnd(formatDiscountAmount(amount))).toBe(amount);
    }
  });

  it('nhãn dùng chung một nguồn định dạng với giá bán trên cùng thẻ', () => {
    expect(formatDiscountAmount(3_860_000)).toBe(`Giảm ${formatPrice(3_860_000)}`);
  });
});

describe('LỖI 3 — SIM trắng giá không được mở form đặt hàng', () => {
  const orderPayload = (priceVnd: unknown) => ({
    orderCode: 'DH260829-1234',
    simId: 'SIM133091',
    fullName: 'Nguyễn Văn A',
    phone: '0909123456',
    address: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
    note: '',
    priceVnd,
    originalPriceVnd: 0,
  });

  it('giá trắng / 0 / âm / NaN đều không đặt được', () => {
    // 3 số thật đang trắng cả GIÁ BÁN và Final_Price: SIM133091 (0779.168.168),
    // SIM133228 (0777.997.999), SIM133251 (0789.999.919) — `parsePrice('')`
    // của các nhánh CSV/edge-function trả về 0 cho cả ba.
    expect(isOrderablePrice(0)).toBe(false);
    expect(isOrderablePrice(-1)).toBe(false);
    expect(isOrderablePrice(NaN)).toBe(false);
    expect(isOrderablePrice(undefined)).toBe(false);
    expect(isOrderablePrice(null)).toBe(false);
  });

  it('giá thật thì đặt được', () => {
    expect(isOrderablePrice(229_000)).toBe(true);
    expect(isOrderablePrice(3_860_000)).toBe(true);
    expect(isOrderablePrice(39_000_000)).toBe(true);
  });

  it('khớp đúng guard của webhook: web chặn đúng những gì webhook sẽ từ chối', () => {
    // Đây là điểm của cả lỗi 3: trước đây web cho đi tiếp còn webhook chặn, nên
    // khách điền xong form mới nhận toast "Có lỗi xảy ra. Vui lòng thử lại."
    for (const price of [0, -1, 100_000, 3_860_000]) {
      const webhookAccepts = validatePayload(orderPayload(price)) === null;
      expect(webhookAccepts).toBe(isOrderablePrice(price));
    }
  });

  it('trang đặt hàng không dựng form khi giá không đặt được', () => {
    const src = readSource('src/app/mua-ngay/[simId]/CheckoutClient.tsx');
    // Guard phải nằm TRƯỚC nhánh render form (dấu hiệu là thẻ <form ...>).
    const guardAt = src.indexOf('if (!isOrderablePrice(displayPrice))');
    const formAt = src.indexOf('<form onSubmit={handleSubmit}');
    expect(guardAt).toBeGreaterThan(-1);
    expect(formAt).toBeGreaterThan(guardAt);
    // Và đường liên hệ phải có mặt trong nhánh đó.
    expect(src).toContain('zalo.me/0933356666');
    expect(src).toContain('tel:0938868868');
  });
});
