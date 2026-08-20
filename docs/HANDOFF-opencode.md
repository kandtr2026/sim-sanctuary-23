# BÀN GIAO — chonsomobifone.com (đọc file này trước)

> File điểm-vào cho AI/opencode tiếp nhận. Đọc theo thứ tự ở mục "Tài liệu" bên dưới.
> Ngày bàn giao: 2026-08-20.

## 1. Dự án là gì
Website bán **SIM số đẹp Mobifone** — `https://chonsomobifone.com` (bản chuẩn: **www**).
Repo hiện tại: **Vite + React 18 + react-router-dom v6 + shadcn/ui + Tailwind + Supabase + @tanstack/react-query + react-helmet-async**. SPA client-side, deploy trên **Vercel** (khởi tạo bởi Lovable).

## 2. Mục tiêu đợt này (chủ dự án đã CHỐT)
1. **Migrate toàn bộ sang Next.js (App Router)** để có SSR/SSG — đây là việc chính.
2. **Sửa hết các lỗi P0** (SEO + giao diện) — xem mục 4.
3. **Bỏ cụm "sim năm sinh"**: KHÔNG dựng trang `/sim-nam-sinh` mới. Route động `/:slug`→`SimNamSinh` hiện chỉ redirect hash — xử lý gọn (giữ redirect tối thiểu hoặc bỏ).
4. Hướng render: dùng **Next.js**, KHÔNG chọn giải pháp prerender-tĩnh trên Vite. (Đã cân nhắc vite-react-ssg nhưng chủ dự án chọn Next.js để mạnh về SEO.)

## 3. Vấn đề gốc cần giải quyết (đã kiểm chứng bằng `curl`)
- **SPA không SSR/prerender** → `curl -A Googlebot` mọi trang trả về HTML **giống hệt**: cùng một `<title>` generic, **0 số SIM**, **không canonical**, **không `<h1>` thật**. Toàn bộ SEO per-page (react-helmet) chỉ xuất hiện *sau khi JS chạy* → tàng hình với Facebook/Zalo/AI crawler và không đáng tin với Google. → **Migrate Next.js chính là để sửa cái này.**
- **Redirect non-www → www đang 307 (tạm thời)** — phải đổi thành **301 (vĩnh viễn)**.
- **Soft-404**: URL rác đang trả HTTP **200** thay vì 404.
- **Điểm sáng cần GIỮ khi migrate:** phần on-page đã làm chuẩn — cả 17 trang trong `src/pages/*` đều có title/description/canonical **UNIQUE** + mỗi trang một H1 + cây heading sạch. Khi chuyển sang Next.js phải **bê nguyên tính unique này sang Metadata API** (`generateMetadata`), đừng để mất.

## 4. Danh sách P0 (bắt buộc trong đợt này)
**SEO**
- [ ] Prerender/SSR — chính là việc migrate Next.js.
- [ ] Đổi redirect non-www→www: **307 → 301**.
- [ ] Sửa soft-404 (URL rác trả 200 → trả 404 đúng).

**Giao diện** (chi tiết + file/class trong `audit-giao-dien.md`)
- [ ] Dọn "rừng" nút liên hệ nổi trên **mobile** + fix chồng lấp — stack nút nổi đang **che 31px** nút "ĐẶT NGAY" của thẻ.
- [ ] **Tôn con số SIM lên**: bỏ `style` inline ghi đè trong `SIMCardNew`, giảm lưới 4→3 cột (số hiện chỉ **14px** ở lưới, nhưng 30px ở checkout).
- [ ] **Trả nền + chiều sâu cho thẻ SIM** (desktop đang transparent, chìm vào khung).

> P1/P2 (schema LocalBusiness/BreadcrumbList/FAQPage, tiết chế animation, nhất quán thương hiệu, v.v.) — xem 2 file audit. Nên gói vào cùng migration nếu rẻ.

## 5. Tài liệu (đọc theo thứ tự)
1. **`docs/plan-migration-nextjs.md`** — ⭐ Kế hoạch migration Next.js chi tiết theo PHASE (kiến trúc App Router, bản đồ chuyển đổi file cũ→mới, chiến lược render từng nhóm trang, cách port SEO/JSON-LD/redirect, gói P0 UI, rủi ro). *Do HaDT dựng — đây là roadmap thi công chính.*
2. **`docs/audit-seo.md`** — Audit SEO đầy đủ (bảng P0/P1/P2 kèm `file:line`, phân tích phương án, bảng map keyword→trang, khung H1/H2).
3. **`docs/audit-giao-dien.md`** — Audit giao diện/UX (desktop + mobile), chỉ rõ "lung tung" nằm đâu, mỗi mục kèm file/class/giá trị gợi ý + effort.

## 6. Thông tin kỹ thuật cần biết
- **Env** (xem `.env.example`): `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — đều là publishable (anon key), có fallback về project production nếu để trống (`src/integrations/supabase/config.ts`). Khi sang Next.js: đổi tiền tố `VITE_` → `NEXT_PUBLIC_`.
- **Nguồn dữ liệu SIM**: Supabase + Google Sheet (`src/hooks/useSimData.ts`, `useCheapSimData.ts`; `src/lib/simInventorySheet.ts`, `cheapSimSheet.ts`, `simValuation.ts`, `simUtils.ts`). Trang chủ đổ 100 SIM/lần (`ITEMS_PER_PAGE=100`), dữ liệu đổi thường xuyên → cân nhắc ISR/SSR (xem plan).
- **Tracking cần giữ**: GTM `GTM-MWKVVS7M`, GA4 `G-W7G7B81W6S`, 2 thẻ `google-site-verification` (trong `index.html`) → port sang `app/layout` + `next/script`.
- **MCP tích hợp**: `src/lib/mcp/*` dùng `@lovable.dev/mcp-js` — kiểm tra còn dùng không khi rời Vite/Lovable.
- **public/**: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `llms.txt`, ảnh — cân nhắc chuyển sang `app/robots.ts` + `app/sitemap.ts`.
- **Test**: Vitest (`src/test/*`).
- **Git**: đang ở nhánh `main`, remote `github.com/kandtr2026/sim-sanctuary-23`. **Khuyến nghị làm migration trên nhánh riêng** (vì thay đổi rất lớn), review xong mới merge.

## 7. Thứ tự thi công gợi ý cho opencode
Bám theo các **Phase trong `plan-migration-nextjs.md`** (6 phase, 0→5, mỗi phase độc lập chạy & review được). Nguyên tắc: mỗi phase chạy được + review được trước khi sang phase sau; **không để mất canonical/redirect/tracking** trong lúc đổi khung; kiểm lại `curl -A Googlebot` sau khi lên Next.js để xác nhận HTML thô đã có nội dung + title/canonical đúng từng trang. Phase 0→1→2 là đã giải xong vấn đề SEO số 1.

## 8. Kiến trúc đã chốt (tóm tắt — chi tiết trong plan)
- **App Router, SSG-first + "client island".** Mỗi trang = Server Component render khung tĩnh + `metadata`/`generateMetadata` + JSON-LD (giải đúng vấn đề crawler thấy HTML rỗng). Phần SIM động (lưới + lọc + search) gói thành **một "đảo" client** bọc nguyên `useSimData` → giữ ~100% logic lọc (~1290 dòng).
- **KHÔNG SSR/ISR cho dữ liệu SIM**: 49k SIM là listing client-side, từng SIM đã `noindex`; fetch server-side ~5,5 MB chỉ tốn chi phí vô ích, không lợi SEO.
- **Supabase ở đây KHÔNG có DB/RLS/auth** — chỉ là 3 Edge Function proxy (`fetch-sim-data`, `sheet-proxy`, `make-webhook-proxy`) + `mcp`; anon key public; `@supabase/supabase-js` gần như dead (chỉ `edgeFunctions.ts` fetch thô dùng). → Phần "Back" của migration chủ yếu là **đổi `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`** và `import.meta.env.DEV` → `process.env.NODE_ENV`, không cần xử lý bí mật server. Giữ nguyên `src/`, chỉ `src/pages/*` → `src/app/**/page.tsx`; Tailwind/shadcn/react-query giữ nguyên.

## 9. Rủi ro lớn nhất khi thi công (opencode chú ý)
1. **Đứt luồng checkout** `/mua-ngay/[simId]` — ranh giới tiền + thông tin cá nhân duy nhất (đẩy Make webhook + Google Apps Script). Soi kỹ ở Phase 3, **test 1 đơn thật** trước khi coi là xong.
2. **Sót đổi env / `import.meta`** → fail runtime. (Literal fallback trong `src/integrations/supabase/config.ts` là lưới an toàn — giữ lại.)
3. **Quên xoá `vercel.json`** rewrite `/(.*)→/index.html` sẽ phá routing Next; và phải **xoá `public/robots.txt` + `public/sitemap.xml`** (thay bằng `app/robots.ts` + `app/sitemap.ts`).

## 10. Quyết định còn mở — mặc định đã chọn sẵn cho opencode
> opencode cứ theo MẶC ĐỊNH dưới đây trừ khi chủ dự án dặn khác.
1. **MCP in-app** (`src/lib/mcp/*` + `mcpPlugin`): **MẶC ĐỊNH = bỏ** khi rời Vite (edge function `mcp` trên Supabase vẫn giữ độc lập).
2. **`/sim-nam-sinh-YYYY`**: **MẶC ĐỊNH = redirect permanent về `/`** (đã chốt "bỏ cụm sim năm sinh"). *(Lựa chọn khác: trả 410 Gone.)*
3. **non-www → www**: **MẶC ĐỊNH = 308 permanent** (SEO tương đương 301). Nếu bắt buộc literal 301 thì cấu hình ở domain-level trên Vercel.
4. **Bộ test Vitest**: **MẶC ĐỊNH = giữ**, port sang môi trường Next trong đợt migration.
