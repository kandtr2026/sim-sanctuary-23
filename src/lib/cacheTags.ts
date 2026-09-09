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
 * Cửa sổ revalidate (giây) của kho KHUYẾN MÃI (`serverCheapSims`) ở tầng Data
 * Cache. Nguồn của kho đó là một Google Sheet do người sửa tay, không có
 * mutation nào gọi `revalidateTag` khi sheet đổi, nên cửa sổ thời gian ở đây
 * CHÍNH LÀ độ tươi — giữ ngắn. Đọc sheet không tính vào quota Supabase.
 */
export const SIM_DATA_REVALIDATE = 300 as const;

/**
 * Cửa sổ revalidate (giây) của KHO CHÍNH đọc từ Supabase (`serverSimData`).
 *
 * Dài hơn hẳn kho khuyến mãi, và đó là chủ ý — đo ngày 09/09/2026:
 *
 *   • Một lần crawl toàn kho = 49 request × 18.165 B gzip ≈ **890 KB**.
 *   • Ở mức 300s, Data Cache cho phép tới 288 lần crawl/ngày ≈ 250 MB/ngày
 *     ≈ 7,5 GB/tháng egress Supabase — một mình nó đã vượt hạn mức miễn phí.
 *   • Nhưng kho chỉ ĐỔI 2 lần/ngày: cron `sync-sims` chạy 01:17 và 13:17
 *     (vercel.json), và ngay sau mỗi lần sync nó gọi `revalidateTag('sim')`.
 *
 * Tức 287/288 lượt crawl kia tải lại đúng bộ dữ liệu vừa tải, không đem thêm
 * một chút tươi mới nào: số đã bán vốn phải chờ lần sync kế tiếp mới biến mất,
 * cửa sổ 5 phút không rút ngắn được điều đó. Độ tươi thật do `revalidateTag`
 * lo; con số này chỉ là LƯỚI AN TOÀN cho trường hợp bust tag thất bại (chỗ gọi
 * bắt lỗi rồi bỏ qua — xem api/cron/sync-sims). 1 giờ vẫn bắt kịp thừa so với
 * nhịp 12 giờ của sync, mà egress giảm 12 lần.
 */
export const SIM_CATALOGUE_REVALIDATE = 3600 as const;
