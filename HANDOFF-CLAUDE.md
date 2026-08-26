# BÀN GIAO — chonsomobifone (sim-sanctuary-23)

_Cập nhật: 2026-08-26. Dự án: Next.js 16 + Supabase — Kho SIM Mobifone số đẹp._

## 1. ĐÃ XONG phiên này

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
- **WIP phiên khác (chưa commit)**: `src/lib/simDisplay.ts`, `src/test/sim-display.test.ts`, sửa `MuaSimGiaReTool.tsx`, `CategorySimGrid.tsx`, `highlightUtils.ts`.

## 3. Bẫy phải biết

- **Deploy bắt buộc push GitHub** (auto-deploy từ Vercel Git integration). Không dùng `npx vercel --prod`.
- **Supabase Edge Function fetch-sim-data** timeout 15s, data ~7MB → không cache được.
- **SimNamSinhFinder.tsx** có WIP chưa commit — không stage nếu không liên quan.
- **Bát Cực hóa giải mapping**: TuyệtMệnh→SinhKhí, NgũQuỷ→ThiênY, LụcSát→DiênNiên, HọaHại→PhụcVị.
- **Shopee sync**: partner_id=2031725, partner_key đã set trong Vercel env. Cần thêm redirect URL + uỷ quyền shop trước khi sync.
- **Migration conflict**: `20260826_sims_catalog.sql` (WIP phiên khác) cùng version 20260826 — đã repair remote history, không đụng.