# HANDOFF → Claude (opencode bàn giao ngược)

> Claude đọc file này để biết opencode đã làm gì và việc cần làm tiếp.
> Cập nhật: 2026-08-24 — sau khi hoàn tất **Giai đoạn 0** (Task 1 → Task 7).
> Trạng thái đầy đủ theo task: `docs/Sim_Opencode.md`.

## ĐÃ XONG — code hoàn tất, commit + push `main` → Vercel `sim-sanctuary-23` tự deploy

- **T1** Làm lại Dashboard quản trị `/admin/dashboard` (KPI, bar list, quản lý bài viết).
- **T2** Thống nhất lead → 1 event GA4 `generate_lead` cho MỌI CTA liên hệ (desktop + mobile, capture-phase, throttle 5s). Bỏ `call_click`/`click_zalo` double-count trên desktop.
- **T3** Bắt UTM + `gclid`/`fbclid` vào `conversion_clicks` & `page_visits` (first-touch sessionStorage; migration `20260824110000_tracking_utm.sql` **đã `supabase db push`** lên remote).
- **T4** 3 component tái dùng: `TrustCommitments` (5 cam kết), `CustomerProof` (ẩn khi chưa có proof), `LeadMagnetCta`.
- **T5** Gắn 3 component vào `sim-than-tai`, `sim-loc-phat`, `sim-dau-so/[dauso]` (+ FAQ 3 câu + JSON-LD FAQPage cho đầu số); thêm `FacebookPixel` (gated env) + `fbq("track","Lead")`.
- **T6** Trang tiến độ `/admin/du-an` (read-only từ `src/data/roadmap.ts`).
- **T7** Đổi GA4: `G-W7G7B81W6S` → **`G-QGN17FVXPG`** (2 chỗ `layout.tsx`); GTM `GTM-MWKVVS7M` giữ nguyên.

## CHỜ CLAUDE / CHỦ DỰ ÁN (không phải code)

1. **GA4 property mới `G-QGN17FVXPG`** (Stream 15493718398): đánh dấu `generate_lead` là **Key event**; link **Google Ads ↔ GA4** + import `generate_lead` làm conversion action (nếu đã có action "Import" từ gclid/CSV thì **tách riêng**, chỉ 1 cái đặt Primary).
2. **Facebook Pixel**: khi bắt đầu chạy FB Ads → tạo Pixel, set `NEXT_PUBLIC_FB_PIXEL_ID` vào Vercel env rồi redeploy (hiện pixel đang inert).
3. **Testimonials**: chủ dự án điền feedback **THẬT** vào `src/data/testimonials.ts` + bỏ ảnh vào `/public/proof/` → khối "Khách hàng nói gì" tự hiện (đang ẩn vì rỗng, không bịa).
4. **Koi repo (koi-storefront) — Task F**: Google Ads còn chờ 2 giá trị từ chủ shop (`AW-…` + label Zalo) để set env; Task E (sameAs Instagram + hasMap) đã commit `361c99d` nhưng **chưa push** — chờ chủ duyệt.

## VIỆC CODE TIẾP THEO (đã liệt kê trong roadmap — GĐ1/GĐ2/GĐ3)

- **GĐ1** Bật vòi traffic: tối ưu landing theo nhóm từ khoá đã chốt + đăng số đẹp FB/video TikTok (chờ chủ chốt từ khoá + ngân sách).
- **GĐ2** SEO programmatic: trang tự sinh đầu số / ý nghĩa số / loại số / hợp tuổi; video YouTube + nhúng lên web.
- **GĐ3** Vòng lặp tối ưu: đọc số liệu mỗi tuần, cắt chi phí/lead.
- **Verify thủ công chưa làm được** (không có browser): GA4 DebugView double-click <5s → đúng 1 `generate_lead`; mở `/?utm_source=google&utm_medium=cpc&utm_campaign=than-tai&gclid=TESTgclid` → bấm Zalo → row `conversion_clicks` có đủ utm/gclid; Network thấy `facebook.com/tr` khi bấm Zalo.

## BẪY PHẢI NHỚ

- GA4 **đã đổi** sang `G-QGN17FVXPG` — đừng khôi phục `G-W7G7B81W6S`; GTM giữ `GTM-MWKVVS7M`.
- Mọi `<a href="tel:" / zalo.me>` tự bắn `generate_lead` + `fbq Lead` qua listener toàn cục — **KHÔNG** thêm onClick tracking.
- `supabase/.temp/` là state CLI local — không commit.
- Task 2 nghiệm thu đòi hỏi **1 event/1 lần bấm** — throttle 5s giữ nguyên, đừng gỡ.
