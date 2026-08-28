# BÀN GIAO — chonsomobifone (sim-sanctuary-23)

_Cập nhật: 2026-08-26. Dự án: Next.js 16 + Supabase — Kho SIM Mobifone số đẹp._

## 1. ĐÃ XONG phiên này

- **Fix admin đếm chính chủ thành khách** (commit `3347121`): `usePageVisitTracker` (mount ở root layout → chạy cả `/admin`) từng insert `/admin`, `/admin/dashboard` vào `page_visits` như thể khách, và chính admin test web public (`/?q=*2020`, `/sim-nam-sinh`...) cũng bị đếm → "Trang khách đã xem"/"Khách đến từ đâu" toàn giờ nửa đêm, trông vô lý. Fix:
  - `src/hooks/usePageVisitTracker.ts`: bỏ qua `pathname.startsWith("/admin")` + bỏ qua khi `supabase.auth.getSession()` có session (admin đang đăng nhập).
  - `src/hooks/useConversionTracker.ts`: `isOwner` check session 1 lần khi mount → admin test bấm Zalo/gọi không thành lead.
  - ⚠️ Lưu ý: dữ liệu cũ trong `page_visits`/`conversion_clicks` (của chính chủ) VẪN CÒN — nếu muốn sạch, xoá thủ công qua SQL (không có migration kèm).
- **Fix "Xem thêm" giật + sai số liệu — offset pagination** (commit `858112d`): trước đây `SimBrowser` "Xem thêm" tăng `limit` (100→200→300) → đổi `queryKey` → **re-fetch toàn bộ list từ đầu** mỗi lần bấm (giật), và route `MAX_LIMIT=200` clamp → bấm lần 2 không thêm gì nhưng vẫn hiện "Còn N SIM khác" (sai). Đổi sang **`useInfiniteQuery` + offset**: mỗi bấm fetch đúng trang kế `limit=100&offset=100` rồi append qua `data.pages.flatMap`, nút hiện spinner "Đang tải...", `remainingCount` tính từ `total - displayedSIMs.length` chuẩn. `getNextPageParam` = tổng đã load nếu < total. Verify API: `search=*888&offset=0/100` → total=449, 100 items/trang, không overlap. Build XANH, deploy Ready.
- **PERF: load list số nhanh hẳn — push filter xuống PostgREST + crawl song song** (commit `60d8103`):
  - `/api/sims` có **fast path**: criteria đẩy xuống được (search/prefix/suffix/network/price/vip/sort) → **1 request PostgREST** dùng `like`/`eq`/`in`/`gte`/`lte` + `Prefer: count=exact` + `Range` lấy `total` luôn trong `Content-Range`. KHÔNG còn crawl toàn bộ 49k mỗi lần tìm. Cold `search=888` đo: **~1.4s** (trước đơ vài chục giây).
  - Facets/tags/quyType/birthDateOnly/matchAll giữ path cũ (`getServerSims` + `filterSims`).
  - `fetchSimsFromDb` chạy **song song 12 luồng** (đếm count trước bằng `count=exact`, rồi bắn toàn bộ trang cùng lúc) thay vì 98 request tuần tự → facets cold ~0.6s. Bỏ luôn loop 2 pha id→detail, đọc thẳng `SIMS_SELECT` mỗi trang.
  - Chỗ sửa: `src/lib/serverSimData.ts` (thêm `querySimsFromDb` + `DbQueryCriteria` + crawl song song), `src/app/api/sims/route.ts` (thêm fast path `canPushToDb`).
  - ⚠️ Verify: build XANH, `tsc --noEmit` pass, cold test prod `search=888` 1.38s / facets 0.62s / list 100 0.82s.
- **Format quý-aware dùng chung + áp toàn site** (commit `ef38030`): thêm `formatSimQuyAware` trong `src/lib/simDisplay.ts` (tứ quý → 3-3-4 `093.368.6666`, ngược lại 4-3-3). Áp cho: `SIMCardNew` (cardDisplay), `CheckoutClient` (/mua-ngay: số thuê bao + popup xác nhận + title tab), `cheapSimSheet.formatCheapNumber` (kho giá rẻ), `SimHopTuoiTool`, `simValuation.formatPhoneDisplay` (định giá), `SimSnapshot`. `highlightUtils.createQuyHighlightedNumber` dùng longest-run để lục quý không bị cắt 5+1 khi filter ngũ quý. Test `sim-display.test.ts` 7 case.
- **Hotfix build treo vô hạn** (commit `210ddf4`): `fetchSimsFromDb` (đọc bảng `sims` Supabase từ migration) KHÔNG có timeout → Supabase chậm thì static generation treo 4–9 phút rồi Error. Thêm `fetchWithTimeout` (15s, dùng `FETCH_TIMEOUT_MS`) cho cả 2 loop phân trang, fail-fast về CSV. ⚠️ Nếu build treo >3m nữa: soi Supabase bảng `sims` + edge function `sync-sims`.
- **Câu tìm đi theo URL `?q=`** (commit `d45c047`): `SimBrowser` seed `searchQuery` từ `?q=` (nhận cả `?search=` cũ) trong effect, rồi `replaceState` ghi lại — F5/gửi link cho khách không mất câu tìm nữa, xoá ô tìm thì URL sạch lại. `layout.tsx` trả lại `SearchAction` trỏ `/?q={search_term_string}`. **Đừng kỳ vọng SEO**: Google bỏ hiển thị sitelinks searchbox từ 21/11/2024, markup chỉ để khai báo đúng khả năng cho crawler/agent.
- **Tứ quý hiện liền cụm ở mọi nơi** (commit `9722cc1`): bảng "tứ quý nổi bật" đã chữa tay trước đó nhưng lưới card ngay dưới vẫn `0778.67|0.000` và không tô vàng — vì trang không truyền `quyFilter` xuống `SIMCardNew`, và nhánh Tứ quý của `createQuyHighlightedNumber` cố tình giữ 4-3-3. Giờ cả hai đi qua `planSimDisplay` → `077.867.0000`. Ngũ quý/Lục quý giữ cách chấm riêng đã verify (`0.77777.9086`).

- **RULE HIỂN THỊ SỐ DÙNG CHUNG** (`src/lib/simDisplay.ts` — MỚI): khách tìm `*6879` thì mọi lưới SIM phải hiện `.6879` liền một cụm. Trước đây mỗi trang tự `split('.')` nên chỉ chữa được từng ca (`0703.75|6.879`, `090.282.4.|879`).
  - `planSimDisplay(rawDigits, query, preferredDisplay)` → `{ display, hl }`. Suy ra **cụm neo** đúng theo luật lọc của `simFilter.ts` (`*S` đuôi, `P*` đầu, `P*S` hai đầu, gõ trần = đuôi nếu số kết thúc bằng nó, không thì contains). Cách chấm sẵn có mà KHÔNG cắt cụm neo thì giữ nguyên (nhờ vậy dạng ngày sinh `0909.9.2.2000` và `*879` → `0703.756.879` vẫn y cũ); bị cắt mới chấm lại bằng cụm 3–4 số, cụm 4 xếp trước.
  - `highlightUtils.ts` gọn còn dựng span (bỏ `parseSearchQuery`/`findHighlightRanges`/wildcard branch cũ). Test: `src/test/sim-display.test.ts` (23 ca).
  - Nối dây các lưới còn thiếu: `CategorySimGrid` (trước KHÔNG truyền `searchQuery` → mọi trang category tìm xong không tô gì), `MuaSimGiaReTool` (card riêng, không biết câu tìm), `SIMCardNew` (aria-label + popup đặt mua dùng đúng dạng số đang hiện).
  - Verify: build XANH 68/68, `npx vitest run` 69 pass, chạy `next start` bản prod local — `*1368`→`090.664.1368`, `6879`→`090.6879.068`, `*2000`→`0909.9.2.2000`, `*79`→`0902.790.479`, `*68879`→`09385.68879`, category `*39`→`0902.473.339` (trước không tô), `/mua-sim-gia-re` `899`→`090.143.899` vàng.
- **Engine Bát Cực Linh Số** (`src/lib/batCuc.ts`): (đã có từ phiên trước)
- **Shopee Product Sync** (MỚI): đồng bộ lô SIM lên Shopee Open Platform
  - Migration: `supabase/migrations/20260826220000_shopee_sync.sql` (4 bảng: shopee_credential, shopee_settings, shopee_item_map, shopee_sync_log)
  - Shopee lib: `src/lib/shopee/` (crypto, config, credentials, client, sync, http, admin)
  - API routes: `/api/admin/shopee/{status,config,settings,auth-url,exchange,sync,items,items/remove,categories}`
  - Admin page: `/admin/shopee` + `/admin/shopee/callback`
  - Dashboard link: card "Shopee bán hàng" ở `/admin/dashboard`
  - Ảnh sim placeholder: `public/sim-card-default.png` (tạo bằng sharp)
  - Vercel env: SET SUPABASE_SERVICE_ROLE_KEY, SHOPEE_PARTNER_ID=2031725, SHOPEE_PARTNER_KEY
  - Build XANH, migration applied

## 2. CÒN LẠI / việc làm tiếp

- **Shopee**: cần vào open.shopee.com → thêm redirect URL `https://www.chonsomobifone.com/admin/shopee/callback` + bật module Product. Sau đó vào `/admin/shopee` → bấm "Uỷ quyền shop" → đăng nhập shop SIM → đồng ý.
- **Mục tiêu chọn sim** (Tài lộc / Công danh / Tình cảm / Học hành) — chưa có trong bộ lọc.
- **Quick filter chips + lọc nâng cao cho CategorySimGrid** — WIP.
- **Hào động** — engine Kinh Dịch hiện chỉ tính quẻ từ 4 số cuối (mod 80), chưa tính hào động.
- **"Vì sao hợp tuổi"** luận giải tự động — chưa có.
- **"Tốt cho việc" tags** — chưa có.
- **Số thần học** — chưa tính (cộng dồn ngày sinh ra số 1–9).
- **Phân trang** — hiện chỉ trả 12 kết quả. Cần thêm `limit` + `offset` param + pagination UI.
- **So sánh 2 SIM** — cần thêm khay so sánh + trang so sánh.
- **Xem chi tiết SIM phong thủy** — trang `/sim-phong-thuy?so=...` chưa có.
- **Lịch âm/dương toggle** — form nhập giờ sinh hiện chỉ âm lịch, cần thêm toggle.
- **WIP phiên khác (chưa commit)**: `src/lib/serverSimData.ts` (đã merge — `60d8103`). Các file còn WIP: `src/app/globals.css`, `src/lib/blogPosts.ts`, `src/app/tin-tuc/...`, `src/app/sitemap.ts`, blog scripts, blog content.
- **`/mua-sim-gia-re` có 1 lỗi hydrate React #418** (bản build local; prod hiện sạch). Card SIM ở trang này KHÔNG render phía server (SSR ra 0 card, chỉ skeleton) nên không phải do rule hiển thị — nghi số liệu build-time (`stockLabel`/snapshot) lệch với data client fetch. Cần soi riêng.
- **Vào bằng link `?q=` thì ~2–3s đầu khách thấy danh sách CHƯA lọc** (SSR `initialData` hiện trước, `keepPreviousData` giữ nó trong lúc query đã seed đang bay). Muốn sạch: khi có seed thì bỏ qua `initialData` / bật skeleton tới khi fetch đầu tiên về.

## 3. Bẫy phải biết

- **Cách chấm số CHỈ sửa ở `src/lib/simDisplay.ts`.** Đừng `split('.')` trong component nữa — đó là lý do lỗi "đuôi khách tìm bị chấm cắt" tái đi tái lại. Component chỉ gọi `planSimDisplay` / `createHighlightedNumber` và phải TRUYỀN `searchQuery` xuống card.
- **Deploy bắt buộc push GitHub** (auto-deploy từ Vercel Git integration). Không dùng `npx vercel --prod`.
- **Supabase Edge Function fetch-sim-data** timeout 15s, data ~7MB → không cache được.
- **SimNamSinhFinder.tsx** có WIP chưa commit — không stage nếu không liên quan.
- **Bát Cực hóa giải mapping**: TuyệtMệnh→SinhKhí, NgũQuỷ→ThiênY, LụcSát→DiênNiên, HọaHại→PhụcVị.
- **Shopee sync**: partner_id=2031725, partner_key đã set trong Vercel env. Cần thêm redirect URL + uỷ quyền shop trước khi sync.
- **Migration conflict**: `20260826_sims_catalog.sql` (WIP phiên khác) cùng version 20260826 — đã repair remote history, không đụng.