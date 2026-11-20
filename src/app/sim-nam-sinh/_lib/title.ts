import { formatTrieu } from "@/lib/simDangSo";

/** Title cũ, dùng khi kho không có số/giá để nêu (không hứa thứ trang không có). */
export const buildBaseTitle = (year: string): string =>
  `Sim Năm Sinh ${year} MobiFone Giá Tốt — Kho Số Đẹp Đuôi ${year} Chính Chủ`;

/**
 * Title có "giá từ" + số lượng THẬT trong kho. GSC 90d: 7 trang /sim-nam-sinh/*
 * pos 4–9.6, 22 imp, 0 click — title "Giá Tốt" chung chung không cho khách lý do
 * bấm. `minPrice` phải là giá thấp nhất trong ĐÚNG bảng trang đang hiện.
 * Độ dài ≤ 65 ký tự để không bị cắt trên SERP mobile.
 */
export const buildNamSinhTitle = (year: string, minPrice: number, count: number): string => {
  if (!(minPrice > 0) || !(count > 0)) return buildBaseTitle(year);
  const giaTu = formatTrieu(minPrice);
  const soLuong = count.toLocaleString("vi-VN");
  const full = `Sim Năm Sinh ${year} MobiFone Giá Từ ${giaTu} — ${soLuong} Số Có ${year}`;
  if (full.length <= 65) return full;
  return `Sim Năm Sinh ${year} MobiFone Giá Từ ${giaTu}`;
};
