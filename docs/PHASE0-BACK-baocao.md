# PHASE 0 — Báo cáo Back Engineer (port env/data)

> Lưu ngày: 2026-08-20 · Nhánh: `nextjs-migration` · Dự án: chonsomobifone.com (Vite → Next.js)

## 1. File đã đổi

| File | Thay đổi |
|---|---|
| `src/integrations/supabase/config.ts` | `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*` (3 biến: `NEXT_PUBLIC_SUPABASE_PROJECT_ID` / `_URL` / `_PUBLISHABLE_KEY`), **giữ nguyên literal fallback** + update comment. Lines 26, 29, 32 |
| `src/hooks/useSimData.ts` | `import.meta.env.DEV` → `process.env.NODE_ENV !== 'production'` (4×) — lines 441, 453, 470, 540 |
| `src/pages/SimPhongThuy.tsx` | `import.meta.env.DEV` → `process.env.NODE_ENV !== 'production'` (10×) — lines 307, 318, 331, 341, 346, 354, 361, 370, 424, 611 |
| `src/lib/simInventorySheet.ts` | `import.meta.env.DEV` → `process.env.NODE_ENV !== 'production'` (7×) — lines 238, 248, 260, 265, 273, 277, 391 |
| `src/components/EmptyStateHelper.tsx` | `import.meta.env.DEV` → `process.env.NODE_ENV !== 'production'` (1×) — line 50 |
| `.env.example` | Đổi 3 biến `VITE_*` → `NEXT_PUBLIC_*` + update NOTE comment |
| `.env.local` | **Tạo mới** (3 biến `NEXT_PUBLIC_*`, copy giá trị từ `.env` — anon key public). Đã nằm trong `.gitignore` (`.env.*`) → không bị commit |
| `src/integrations/supabase/client.ts` | **Đã xoá** (dead: không nơi nào query, chỉ còn comment self-reference) |
| `src/lib/mcp/` (5 file) | **Đã xoá** (MCP in-app — quyết định mặc định đã chốt) |

## 2. Kết quả grep `import.meta`

**0 match còn sót** trong toàn `src/`. Tổng 25 chỗ đã xử lý: 22 `NODE_ENV` + 3 `NEXT_PUBLIC_*`. `src/lib/buildInfo.ts` **không có** `import.meta.env` (dùng globals `__BUILD_TIME__`/`__BUILD_COMMIT__` — xem rủi ro mục 5).

## 3. Verdict `@supabase/supabase-js` → **GỠ (dead)**

- File duy nhất import `@supabase/supabase-js` là `client.ts` (đã xoá).
- Luồng data thật chạy qua `edgeFunctions.ts` (raw `fetch`) + `config.ts` (`EDGE_FUNCTIONS_URL`, `SUPABASE_PUBLISHABLE_KEY`), dùng bởi: `useSimData.ts`, `Checkout.tsx`, `SimPhongThuy.tsx`, `simInventorySheet.ts`, `cheapSimSheet.ts`.
- → **Back khuyến nghị Front gỡ `@supabase/supabase-js` khỏi `package.json`.** `types.ts` giữ lại (type-only).

## 4. MCP in-app đã xoá (5 file)

- `src/lib/mcp/index.ts`
- `src/lib/mcp/tools/search-sims.ts`, `get-sim-details.ts`, `get-shop-info.ts`
- `src/lib/mcp/lib/inventory.ts`

Grep `@lovable.dev/mcp-js|lib/mcp` trong `src/` → **0 match**. Giữ nguyên: `supabase/functions/mcp/index.ts` (edge function độc lập, deploy riêng).

## 5. Rủi ro runtime cần xử lý (việc của Front/Viet/VK)

1. **`src/lib/buildInfo.ts` sẽ vỡ trong Next.js** ⚠️ — `__BUILD_TIME__`/`__BUILD_COMMIT__` do vite `define` inject, Next.js không có → ReferenceError nếu import. Import bởi `BuildBadge.tsx`, `main.tsx` (đang xoá), `src/test/buildInfo.test.ts`. → Front xử lý (plan mục 2.1: giữ qua `NEXT_PUBLIC_*` hoặc bỏ).
2. `types.ts` nay orphan (vô hại, Front có thể xoá kèm).
3. Cutover: `process.env.NODE_ENV` là idiom Next (replace tĩnh); ai chạy Vite cũ lúc chuyển tiếp sẽ fail — không phải vấn đề khi Front bỏ Vite.
4. `edgeFunctions.ts` fetch raw, dùng toàn `NEXT_PUBLIC_*` — đúng chuẩn client, không có biến non-public dùng ở client.

## 6. Điểm cần các thành viên chốt

- **Viet:** confirm `process.env.NODE_ENV` đúng ý đồ dev-log; xoá `client.ts` + `src/lib/mcp/` không đụng luồng checkout (checkout chỉ dùng `edgeFunctions.ts` + `config.ts`).
- **VK:** sau khi Front lên Next, xác nhận 1 fetch `fetch-sim-data` trả CSV client-side (done-criteria Phase 0) + view-source không còn lỗi `import.meta`/`process is not defined`.