/**
 * Nguồn sự thật duy nhất cho trang "Dự án — Make Mobi Great Again" (/admin/du-an).
 *
 * Kế hoạch chiến dịch bán hàng đa kênh. Mỗi khi làm xong / đổi trạng thái một
 * task, cập nhật file này (status / updated / next) TRONG CÙNG commit — trang
 * tiến độ nhờ đó luôn khớp thực tế. Read-only, không đọc DB.
 *
 * `utm`: slug gắn vào link chiến dịch (utm_campaign) để bảng "Hiệu quả chiến dịch"
 * trong dashboard gom được lead theo từng chiến dịch.
 */

export type TaskStatus = "done" | "doing" | "todo";

export interface RoadmapTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: "P0" | "P1" | "P2";
  kpi?: string; // chỉ số đo (đo ở đâu)
  utm?: string; // utm_campaign slug gắn vào link
  next?: string;
  updated?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  goal: string;
  tasks: RoadmapTask[];
}

export const NORTH_STAR =
  "Mỗi kênh phải tự chứng minh bằng lead Zalo/gọi đo được theo utm_campaign — nhân cái ra đơn rẻ, cắt cái đốt tiền. Chốt qua mô hình nhận SIM rồi mới trả tiền.";

export const PILLARS = [
  { name: "Website", note: "chốt lead + SEO organic — nơi mọi kênh đổ về" },
  { name: "Google Ads", note: "lead ngay từ người đang gõ 'mua sim…'" },
  { name: "Social/Video", note: "FB · TikTok · YouTube — phủ nhận diện + kho remarketing" },
  { name: "Zalo CRM", note: "broadcast/ZNS + referral khách cũ, chi phí gần 0" },
];

export const ROADMAP: RoadmapPhase[] = [
  {
    id: "GĐ-A",
    title: "Nền tảng đo lường",
    goal: "Mọi kênh đo được lead theo nguồn + chi phí TRƯỚC khi đổ tiền.",
    tasks: [
      { id: "A1", title: "Chuẩn hoá event generate_lead + GA4 property mới", status: "done", priority: "P0", kpi: "100% CTA bắn 1 event; lead GA4 khớp conversion_clicks", updated: "2026-08-24" },
      { id: "A2", title: "Bắt UTM/gclid/fbclid vào lead + lượt xem", status: "done", priority: "P0", kpi: "Mỗi lead có nguồn + campaign; dashboard lọc theo utm_campaign", updated: "2026-08-24" },
      { id: "A3", title: "Nối GA4 → Google Ads + conversion action Zalo/gọi", status: "doing", priority: "P0", kpi: "Ads nhận chuyển đổi 'lead' → đấu thầu theo chuyển đổi", next: "Code sẵn (inert): chủ shop cấp AW-… + label Zalo, set NEXT_PUBLIC_GADS_AW_ID + NEXT_PUBLIC_GADS_CONV_LABEL trong Vercel rồi redeploy", updated: "2026-08-26" },
      { id: "A4", title: "Kích hoạt Facebook Pixel (set NEXT_PUBLIC_FB_PIXEL_ID)", status: "todo", priority: "P1", kpi: "Pixel Helper xanh; có event Lead khi bấm Zalo", next: "Pixel đang inert — set env ở Vercel rồi redeploy" },
      { id: "A5", title: "Search Console: verify + nộp sitemap + đọc query thật", status: "doing", priority: "P1", kpi: "100+ URL indexed; có bảng query thay suy đoán từ khoá", next: "Bảng query ĐÃ DỰNG: /admin/seo (118 từ khoá, nguồn scripts/seo/keywords.json). Còn chờ chủ shop cấp GSC_SIM_CLIENT_EMAIL + GSC_SIM_PRIVATE_KEY để cột thứ hạng có số. Verify + sitemap đã xong (288 URL).", updated: "2026-08-30" },
      { id: "A6", title: "Sổ chốt đơn thủ công (lead → đơn)", status: "done", priority: "P0", kpi: "Ghép SĐT/Zalo + utm_campaign với 'đã bán' → tính CPL & CPA", next: "Chủ shop set ORDERS_WEBHOOK_SECRET ở Vercel + cấu hình AppSheet automation (payload theo hợp đồng trong TODO_CHONSO) + thêm cột 'Mã campaign' vào sổ chốt đơn", updated: "2026-08-31" },
    ],
  },
  {
    id: "GĐ-B",
    title: "Bật Google Search Ads (lead ngay)",
    goal: "Lead Zalo/gọi ngay từ người đang tìm mua sim; CPL đo theo nhóm.",
    tasks: [
      { id: "B1", title: "Chiến dịch sim tứ quý / ngũ quý → /mua-sim-tu-quy, /sim-ngu-quy", status: "todo", priority: "P0", kpi: "lead & CPL theo utm_campaign", utm: "gg-search-tuquy" },
      { id: "B2", title: "Chiến dịch sim đầu số 09x/07x/08x → /sim-dau-so/[dauso]", status: "todo", priority: "P1", kpi: "lead theo đầu số; đầu số nào CPL rẻ nhất", utm: "gg-search-dauso" },
      { id: "B3", title: "Chiến dịch sim năm sinh / hợp tuổi → /sim-nam-sinh/[year]", status: "todo", priority: "P1", kpi: "lead + CPL; đối chiếu năm query nhiều (GSC)", utm: "gg-search-namsinh" },
      { id: "B4", title: "Chiến dịch phong thủy / thần tài lộc phát", status: "todo", priority: "P2", kpi: "lead + CPL", utm: "gg-search-phongthuy" },
      { id: "B5", title: "Sim giá rẻ / trả góp (mở rộng tệp)", status: "todo", priority: "P2", kpi: "volume lead — theo dõi CHẤT LƯỢNG (tệp rẻ dễ lead rác)", utm: "gg-search-giare" },
      { id: "B6", title: "Brand 'chọn số MobiFone'", status: "todo", priority: "P2", kpi: "CTR brand cao, CPL rất thấp", utm: "gg-brand", next: "KHÔNG đặt tên đối thủ trong mẫu QC; luôn cài danh sách phủ định" },
    ],
  },
  {
    id: "GĐ-C",
    title: "Social + Video",
    goal: "Phủ nhận diện + lead rẻ từ nội dung; dựng kho video cho remarketing.",
    tasks: [
      { id: "C1", title: "Đăng số đẹp hằng ngày FB/Zalo (giá + ý nghĩa + CTA Zalo)", status: "todo", priority: "P1", kpi: "lead từ source=facebook; số inbox", utm: "fb-sodep-daily" },
      { id: "C2", title: "TikTok/Reels 'ý nghĩa dãy số / sim hợp tuổi 199x'", status: "todo", priority: "P1", kpi: "page_visits source=tiktok → lead", utm: "tiktok-ynghia" },
      { id: "C3", title: "YouTube video bền + nhúng vào /tin-tuc/*", status: "todo", priority: "P2", kpi: "watch time; traffic youtube → lead; hỗ trợ SEO", utm: "yt-ynghia" },
      { id: "C4", title: "FB Retargeting người xem sim chưa bấm Zalo", status: "todo", priority: "P2", kpi: "CPL retargeting vs cold", utm: "fb-rmk-viewsim", next: "Phụ thuộc A4 (Pixel sống)" },
    ],
  },
  {
    id: "GĐ-D",
    title: "Zalo remarketing khách cũ",
    goal: "Khai thác data khách cũ → đơn lặp lại + giới thiệu, chi phí gần 0.",
    tasks: [
      { id: "D1", title: "Gom & phân nhóm data khách cũ (đã mua / đã hỏi)", status: "todo", priority: "P1", kpi: "số liên hệ gom; % có SĐT", next: "Từ log Zalo + sổ chốt đơn (A6)" },
      { id: "D2", title: "Broadcast Zalo OA / ZNS đợt số mới + ưu đãi khách cũ", status: "todo", priority: "P1", kpi: "tỉ lệ mở/bấm; lead quay lại (source=zalo); đơn lặp", utm: "zns-khachcu" },
      { id: "D3", title: "Chương trình giới thiệu (referral)", status: "todo", priority: "P2", kpi: "số lead giới thiệu; đơn từ giới thiệu", utm: "zalo-referral" },
    ],
  },
  {
    id: "GĐ-E",
    title: "Vòng lặp tối ưu",
    goal: "Mỗi tuần đọc lead theo utm_campaign, dồn tiền cái CPL thấp, cắt cái đốt tiền.",
    tasks: [
      { id: "E1", title: "Báo cáo tuần: lead theo utm_campaign × loại + ghép chi phí Ads (tay) → CPL & CPA", status: "todo", priority: "P1", kpi: "≥1 quyết định nhân/cắt mỗi tuần" },
      { id: "E2", title: "CRO: trang lượt xem cao nhưng ít lead → sửa CTA/nội dung", status: "todo", priority: "P2", kpi: "tỉ lệ lead/lượt xem theo trang tăng", next: "Giao ChuTot (chữ) + Front (nút)" },
      { id: "E3", title: "Từ khoá thật thay suy đoán (GSC + search terms Ads)", status: "doing", priority: "P1", kpi: "số cụm mới có lead; giảm chi cho truy vấn không ra lead", next: "Phần GSC đã có bảng ở /admin/seo (xem A5). CÒN THIẾU: search terms từ Google Ads, và ghép từ khoá với lead để biết cụm nào ra đơn — bảng hiện chỉ đo thứ hạng, không biết từ khoá nào bán được.", updated: "2026-08-30" },
    ],
  },
];
