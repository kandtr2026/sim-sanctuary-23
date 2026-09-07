/**
 * Nhãn (tag) và cửa sổ revalidate dùng chung cho dữ liệu kho SIM.
 *
 * VÌ SAO CÓ FILE NÀY: các truy vấn kho SIM (crawl toàn kho ở `serverSimData`,
 * kho khuyến mãi 229k ở `serverCheapSims`) được cache ở tầng Data Cache của
 * Next bằng `fetch(..., { next: { revalidate, tags } })`. Nhờ đó:
 *
 *   1. Trang chủ + các trang danh mục vẫn TĨNH/ISR (TTFB thấp) — dữ liệu kho
 *      không phải fetch lại từ Supabase trên mỗi lần regenerate/cold start,
 *      mà đọc từ Data Cache đã tag.
 *   2. Sau MỖI lần đồng bộ kho (`sync-sims`) hoặc khi kho khuyến mãi đổi, gọi
 *      `revalidateTag(SIM_CACHE_TAG, { expire: 0 })` là toàn bộ trang phụ thuộc
 *      kho được đánh dấu hết hạn NGAY — SIM đã bán biến mất trong lần tải kế
 *      tiếp, không phải chờ hết cửa sổ ISR.
 *
 * MỘT nhãn duy nhất cho cả kho chính lẫn kho khuyến mãi để chỗ mutation chỉ cần
 * bust một tag là sạch tất cả (xem `/api/revalidate` và `/api/cron/sync-sims`).
 */
export const SIM_CACHE_TAG = "sim" as const;

/**
 * Cửa sổ revalidate (giây) của dữ liệu kho ở tầng Data Cache. Khớp
 * `export const revalidate = 300` của các route tiêu thụ và TTL cache module
 * trong `serverSimData`/`serverCheapSims`, để độ tươi ba tầng cùng một nhịp.
 * Đây chỉ là LƯỚI AN TOÀN theo thời gian; độ tươi tức thời sau mutation do
 * `revalidateTag` lo.
 */
export const SIM_DATA_REVALIDATE = 300 as const;
