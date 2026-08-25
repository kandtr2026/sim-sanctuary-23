# HANDOFF → Claude (opencode bàn giao ngược)

> Claude đọc file này để biết opencode đã làm gì và việc cần làm tiếp.
> Cập nhật: 2026-08-25 — sau khi hoàn tất **Giai đoạn 0** (Task 1 → Task 7) + hotfix số bị cắt trên mobile + format SIM năm sinh.

## HOTFIX 2026-08-25: SIM năm sinh hiển thị dạng ngày có chấm — ĐÃ SỬA & deploy
- **Triệu chứng**: bộ lọc "Năm sinh" (chip/quick pick) hiển thị số theo `displayNumber` của sheet không đồng nhất — `090.9922.000`, `093.888.2026`, `0776002002`… — khách không nhìn ra ngày sinh.
- **Fix**: thêm `parseBirthDate` + `formatBirthDateDisplay` vào `src/lib/simUtils.ts` — đọc ngày sinh từ **6 chữ số cuối** theo 2 cách: `DDMMYY` (20.01.98) ưu tiên, rồi `D.M.YYYY` (8.9.2001). Kiểm tra ngày tồn tại thật (loại 31.11, 29.02 năm thường). `SIMCardNew.tsx` dùng `cardDisplay` cho sim có tag `Năm sinh`: `0909922000` → `0909.9.2.2000`, `0934191991` → `0934.1.9.1991`; số không đọc được ngày (34/152, chỉ trùng đuôi năm) → fallback `formatSIMNumber` 4-3-3 đồng nhất.
- **Test**: `src/test/birthDate.test.ts` (11 test) — 32 tests toàn repo pass, build XANH, lint sạch.
- **Commit**: `d63597d` (đã push origin main, Vercel tự deploy Production).

## HOTFIX 2026-08-25: số SIM bị cắt mất 1–3 chữ số cuối trên card mobile — ĐÃ SỬA & deploy
- **Triệu chứng**: trên mobile, số SIM hiện kiểu "07.8888.5" rồi thiếu 3 số cuối (vd số "07.8888.5888" chỉ thấy "07.8888.5…").
- **Nguyên nhân**: `.sim-number-auto` (`src/app/globals.css`) là `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` với `font-size: clamp(18px, 2vw, 26px)`. Card lưới mobile 2 cột nội dung chỉ ~115–142px (máy 320px → mỗi card ~139px, trừ padding 12px mỗi bên), mà 11 chữ số + 2 dấu chấm ở 18px ≈ 156px → overflow-hidden cắt đuôi.
- **Fix**: thêm media query `@media (max-width: 768px)` trong `globals.css` cho `.sim-number-auto` → `font-size: clamp(12px, 3.4vw, 18px)` (320px→12px, 360px→12.2px, 430px→14.6px; 12px × 14 ký tự ≈ 104px luôn vừa). Desktop giữ nguyên `clamp(18px, 2vw, 26px)`.
- **Commit**: `e7f97f2` (đã push origin main, Vercel `sim-sanctuary-23` tự deploy Production). Verify: CSS `3.4vw` đã có trong bundle CSS Production.
> Trạng thái đầy đủ theo task: `docs/Sim_Opencode.md`.

## ĐÃ XONG — code hoàn tất, commit + push `main` → Vercel `sim-sanctuary-23` tự deploy

- **T1** Làm lại Dashboard quản trị `/admin/dashboard` (KPI, bar list, quản lý bài viết).
- **T2** Thống nhất lead → 1 event GA4 `generate_lead` cho MỌI CTA liên hệ (desktop + mobile, capture-phase, throttle 5s). Bỏ `call_click`/`click_zalo` double-count trên desktop.
- **T3** Bắt UTM + `gclid`/`fbclid` vào `conversion_clicks` & `page_visits` (first-touch sessionStorage; migration `20260824110000_tracking_utm.sql` **đã `supabase db push`** lên remote).
- **T4** 3 component tái dùng: `TrustCommitments` (5 cam kết), `CustomerProof` (ẩn khi chưa có proof), `LeadMagnetCta`.
- **T5** Gắn 3 component vào `sim-than-tai`, `sim-loc-phat`, `sim-dau-so/[dauso]` (+ FAQ 3 câu + JSON-LD FAQPage cho đầu số); thêm `FacebookPixel` (gated env) + `fbq("track","Lead")`.
- **T6** Trang tiến độ `/admin/du-an` (read-only từ `src/data/roadmap.ts`).
- **T7** Đổi GA4: `G-W7G7B81W6S` → **`G-QGN17FVXPG`** (2 chỗ `layout.tsx`); GTM `GTM-MWKVVS7M` giữ nguyên.
- **T8** 24 trang combo "sim [loại] × đầu số" (SSG, sitemap, FAQ JSON-LD, cross-links).
- **T9** Vá hydration React #418: `useDeliveredCount` (đọc localStorage trong render → TrustBar mismatch toàn site) + `BuildBadge` (useState đọc window đầu render). Cả hai sửa theo pattern "render giống SSR, cập nhật trong useEffect".
- **T10** Dọn event GA4 legacy còn sót ở `Header.tsx` (`call_click`/`click_zalo`) — giờ toàn repo chỉ còn 1 nguồn lead `generate_lead`.
- **T11** Truy hết hydration #418: thủ phạm còn lại là `useSimData.ts` — `INITIAL_PLACEHOLDER = getCachedInitialData()` đọc localStorage **ở module scope** (server→SEED_SIMS, client→SIM thật → CategorySimGrid lệch). Đã fix: placeholder cố định `SEED_SIMS` + nạp cache vào query trong `useEffect`. **Verify bằng Playwright (trình duyệt thật): console 0 lỗi trên /sim-than-tai + /sim-dau-so/090/than-tai, kể cả kịch bản đã có localStorage cache.**
- **T12** Chuyển tìm/lọc CategorySimGrid SANG SERVER (Phase 1). Route handler `/api/sims` dùng `getServerSims()` + `simFilter.ts` (hàm thuần dùng chung). Client gọi `/api/sims` qua react-query (debounce 300ms). **Verify Playwright: total=49106 (full 49k), search số ngoài top-14k (0777776122) → found=true; 0 fetch-sim-data client; sort price ascending; 3 trang sạch console.**
- **T13** Chuyển TRANG CHỦ `SimBrowser` sang `/api/sims` (Phase 2). Mở rộng `simFilter.ts` (priceRanges/priceMin-Max/networks/vip/sortBy/mobifoneFirst) + route đọc thêm param + `includeFacets` (tagCounts/prefixes cho sidebar). Bỏ `useSimData` khỏi SimBrowser, giữ nguyên UX (sidebar/sort/chip/xem-thêm/skeleton/empty). **Verify Playwright: bấm "Tứ quý" → 40 card + API total=154 (khớp); Ngũ quý total=1113; networks/vip/sort/price đúng; 0 fetch-sim-data client; 0 lỗi console.**

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
