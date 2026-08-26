# BÀN GIAO — chonsomobifone (sim-sanctuary-23)

_Cập nhật: 2026-08-26. Dự án: Next.js 16 + Supabase — Kho SIM Mobifone số đẹp._

## 1. ĐÃ XONG phiên này

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
- **WIP phiên khác (chưa commit)**: `src/lib/serverSimData.ts`.
- **`MuaSimTuQuyTool.tsx` còn tự chấm 3-3-4 bằng tay** (commit `3278bec`) — nên chuyển sang `planSimDisplay` để chỉ còn một nguồn luật.
- **`?search=` trên URL không được đọc lại khi tải trang**: `SimBrowser` ghi `?search=*6879` vào URL nhưng lúc mount chỉ đọc hash (`#ns=`/`#price=`), nên link chia sẻ/F5 mất câu tìm → khách thấy list chưa lọc, chưa chấm theo đuôi. Sửa cùng lúc với việc nối lại `SearchAction` sitelinks.
- **`/mua-sim-gia-re` có 1 lỗi hydrate React #418** (bản build local; prod hiện sạch). Card SIM ở trang này KHÔNG render phía server (SSR ra 0 card, chỉ skeleton) nên không phải do rule hiển thị — nghi số liệu build-time (`stockLabel`/snapshot) lệch với data client fetch. Cần soi riêng.

## 3. Bẫy phải biết

- **Cách chấm số CHỈ sửa ở `src/lib/simDisplay.ts`.** Đừng `split('.')` trong component nữa — đó là lý do lỗi "đuôi khách tìm bị chấm cắt" tái đi tái lại. Component chỉ gọi `planSimDisplay` / `createHighlightedNumber` và phải TRUYỀN `searchQuery` xuống card.
- **Deploy bắt buộc push GitHub** (auto-deploy từ Vercel Git integration). Không dùng `npx vercel --prod`.
- **Supabase Edge Function fetch-sim-data** timeout 15s, data ~7MB → không cache được.
- **SimNamSinhFinder.tsx** có WIP chưa commit — không stage nếu không liên quan.
- **Bát Cực hóa giải mapping**: TuyệtMệnh→SinhKhí, NgũQuỷ→ThiênY, LụcSát→DiênNiên, HọaHại→PhụcVị.
- **Shopee sync**: partner_id=2031725, partner_key đã set trong Vercel env. Cần thêm redirect URL + uỷ quyền shop trước khi sync.
- **Migration conflict**: `20260826_sims_catalog.sql` (WIP phiên khác) cùng version 20260826 — đã repair remote history, không đụng.