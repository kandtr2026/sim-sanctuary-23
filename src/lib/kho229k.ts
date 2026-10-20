/**
 * Công tắc kho khuyến mãi 229K (Google Sheet riêng 1gwlG7…, tab Tongkho, Kho='0đ').
 *
 * TẮT 20/10/2026 theo lệnh A Khoa ("off hết kho 229k"): số đã bán lọt vào kho
 * này. Kho chỉ loại số đã bán theo mã SIMKM trong tab Sim_Sold của chính nó và
 * chưa theo luật bảng số Excel (16/10) như kho chính, nên số bán dưới mã khác
 * hoặc ghi ở SIM_SOLD kho chính vẫn hiện.
 *
 * Khi tắt (false):
 *  - không đọc sheet 229K ở đâu cả: trang /mua-sim-gia-re, trang đặt hàng
 *    /mua-ngay/SIMKM…, bộ chọn số gói cước Shopee trong admin, cờ inKho Shopee;
 *  - /mua-sim-gia-re chuyển tạm (307) về /sim-gia;
 *  - gỡ link tới /mua-sim-gia-re khỏi menu, footer, trang 404, sitemap và các
 *    khối "xem thêm" (link trong bài tin tức đi qua chuyển hướng ở trên).
 *
 * Bật lại: đổi thành true.
 */
export const KHO_229K_BAT = false;

export const TRANG_229K = "/mua-sim-gia-re";

/** Đích chuyển hướng của /mua-sim-gia-re khi kho tắt: trang tổng "SIM theo giá". */
export const DICH_KHI_TAT_229K = "/sim-gia";

/** Dùng trong `.filter()` của các danh sách link: bỏ link tới trang 229K khi kho tắt. */
export const conLink229K = (link: { href?: string; to?: string; path?: string }): boolean =>
  KHO_229K_BAT || (link.href ?? link.to ?? link.path) !== TRANG_229K;
