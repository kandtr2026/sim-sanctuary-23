# Kế hoạch migration Vite → Next.js + gói P0 — chonsomobifone.com

Người thiết kế: HaDT (System Architect) · Ngày: 2026-08-20
Đầu vào: `docs/audit-seo.md`, `docs/audit-giao-dien.md` + khảo sát trực tiếp mã nguồn.

> Quyết định đã chốt của chủ dự án (thiết kế bám đúng): (1) migrate toàn bộ sang **Next.js App Router** để có SSR/SSG — mục tiêu số 1 là crawler thấy HTML thật; (2) sửa hết **P0** (SEO + giao diện) trong đợt này; (3) **bỏ cụm "sim năm sinh"** — không dựng `/sim-nam-sinh`.

---

## 0. Bối cảnh kỹ thuật thực tế (chốt trước khi thiết kế)

Đây là điều quan trọng nhất định hình cả kiến trúc, khác với hình dung ban đầu:

- **Supabase KHÔNG có database/RLS trong luồng web.** Không có bảng Postgres nào được query từ FE. Supabase chỉ đóng vai **cổng Edge Function** (`supabase/config.toml`):
  - `fetch-sim-data` — proxy CSV kho SIM chính từ Google Sheet (~49k dòng, ~5,5 MB).
  - `sheet-proxy` — proxy gviz cho kho SIM giá rẻ 229K (`src/lib/cheapSimSheet.ts`).
  - `make-webhook-proxy` — chuyển tiếp đơn hàng sang Make.com (`supabase/functions/make-webhook-proxy/index.ts`).
  - `mcp` — MCP server của Lovable, **độc lập** với frontend, deploy riêng trên Supabase.
- **Không có auth thật.** `client.ts` (supabase-js) **không được import ở đâu để query** (đã grep: chỉ còn comment) → `@supabase/supabase-js` gần như dead weight (~350KB). Mọi lệnh gọi đi qua `fetch` thô trong `src/integrations/supabase/edgeFunctions.ts`.
- **Anon key là public** (đã inline vào bundle, có literal fallback trong `src/integrations/supabase/config.ts:23-33`). Không có bí mật nào ở FE.
- **Ranh giới TIỀN + PII duy nhất** = trang checkout `/mua-ngay/:simId` (`src/pages/Checkout.tsx:343-396`): POST đơn (tên/SĐT/địa chỉ) sang `make-webhook-proxy` **và** Google Apps Script (`ORDER_WEBAPP_URL`, mode no-cors). Đây là chỗ Viet + VK phải soi kỹ khi port — không được làm hỏng luồng đơn.
- **useDeliveredCount** (`src/hooks/useDeliveredCount.ts`) fetch thẳng gviz (CORS-enabled), không qua proxy.

**Hệ quả kiến trúc:** vì SEO chỉ cần crawler thấy *khung + meta + H1 + copy + JSON-LD* (49k SIM là listing client-side, từng SIM đã chủ động `noindex`), ta **không cần** fetch SIM ở server. Chiến lược tối ưu: **trang được SSG (static shell) + "đảo" client (client island) cho phần lưới/lọc SIM giữ nguyên `useSimData`**. Đây là đường rẻ nhất mà vẫn đạt 100% mục tiêu SEO, và giữ lại được toàn bộ logic lọc phức tạp (~1290 dòng `useSimData.ts`) gần như không đụng.

---

## 1. Kiến trúc Next.js đề xuất

### 1.1 Nguyên tắc

- **App Router**, React Server Component (RSC) mặc định. Mỗi `page.tsx` là Server Component: render khung tĩnh + `metadata`/`generateMetadata` + JSON-LD. Phần tương tác gói vào **Client Component** (`"use client"`) làm "đảo".
- **Giữ `src/`**: dùng `src/app/` cho routes (Next hỗ trợ). Nhờ đó `src/components`, `src/lib`, `src/hooks`, `src/integrations`, `src/data`, `src/index.css` **giữ nguyên chỗ** — chỉ `src/pages/*` chuyển thành `src/app/**/page.tsx`. Giảm tối đa xáo trộn import (`@/…` alias giữ nguyên).
- **Tailwind + shadcn/ui giữ nguyên 100%.** `tailwind.config.ts` chỉ đổi `content` (đã trỏ `./src/**/*.{ts,tsx}` — vẫn đúng vì app nằm trong `src/`). `src/index.css` → import trong `app/layout.tsx` (đổi tên khái niệm thành globals, nội dung y nguyên). `components.json` đổi `"rsc": false` → `true`.
- **react-query giữ nguyên**: `QueryClientProvider` chuyển vào `src/app/providers.tsx` (client). Các hook data (`useSimData`, `useCheapSimData`, `useDeliveredCount`) vẫn chạy client-side bên trong các đảo (chúng dùng localStorage/window/refetchInterval — đúng bản chất client).

### 1.2 Chiến lược render theo nhóm trang

| Nhóm | Route | Render | Lý do |
|---|---|---|---|
| **Trang tĩnh nội dung** | 3 policy, `/tin-tuc` + 6 bài, `/thanh-toan`, `/sim-tra-gop` | **SSG** (Server Component, không fetch) | Nội dung hardcode trong component → HTML đầy đủ lúc build. Giải P0-SEO trực tiếp, rủi ro ~0. |
| **Trang chủ** | `/` | **SSG shell + client island lưới SIM** | Meta/H1/Intro/FAQ/JSON-LD tĩnh (SEO). Lưới 49k SIM hydrate client qua `useSimData` (không cần cho SEO). |
| **Landing bán hàng** | `/mua-sim-tu-quy`, `/mua-sim-gia-re` | **SSG shell + client island danh sách** | Copy/H1/FAQ tĩnh; danh sách SIM (kho chính / kho 229K) là đảo client. |
| **Trang công cụ** | `/sim-phong-thuy`, `/dinh-gia-sim` | **SSG shell + client island công cụ** | Copy/H1/FAQ tĩnh; bộ luận số/định giá là đảo client (state, `import.meta.env.DEV`, fetch). |
| **Checkout** | `/mua-ngay/[simId]` | **Client, không SSG, `noindex`** | Per-SIM, giao dịch, fetch 1 SIM lúc request. Giữ nguyên như hiện tại, chỉ đổi routing API. |
| **404** | mọi URL không khớp | **Static 404, trả HTTP 404** | `app/not-found.tsx` → Next trả **đúng status 404** ⇒ **tự khỏi soft-404 (SEO P1-1)**. |

**Không dùng ISR/SSR cho dữ liệu SIM.** Không cần: (a) SEO không cần list SIM; (b) từng SIM đã `noindex`; (c) dữ liệu đổi liên tục + cache/refresh đã xử lý tốt ở client (react-query staleTime/refetchInterval + localStorage). Fetch server-side 5,5 MB mỗi request/build chỉ tăng chi phí, không thêm giá trị. Nếu sau này chủ dự án đổi ý muốn index từng SIM (đảo ngược `noindex`) mới cân nhắc route động ISR — **ngoài scope đợt này**.

### 1.3 Port lớp dữ liệu (Back)

- `src/integrations/supabase/config.ts`: đổi `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*` (giữ nguyên literal fallback). Biến: `NEXT_PUBLIC_SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `import.meta.env.DEV` (ở `useSimData.ts`, `SimPhongThuy.tsx`, `simInventorySheet.ts`, `EmptyStateHelper.tsx`) → `process.env.NODE_ENV !== 'production'`.
- `edgeFunctions.ts`, `cheapSimSheet.ts`, `useDeliveredCount.ts`, `Checkout.tsx` fetch thô → **không đổi logic**, chỉ đảm bảo chạy trong client component (chúng đang gọi từ hook/CSR nên OK).
- **Cân nhắc gỡ `@supabase/supabase-js`** (client.ts không được dùng để query — verify lại bằng grep trước khi xoá). Gỡ giúp nhẹ bundle; không bắt buộc.

---

## 2. Bản đồ chuyển đổi (file cũ → Next mới)

### 2.1 Hạ tầng / entry

| Cũ | Mới | Ghi chú |
|---|---|---|
| `index.html` | `src/app/layout.tsx` (Server) + `src/app/globals.css` | GTM/GA4 → `next/script`; 2 thẻ `google-site-verification` + OG/Twitter/icons → `metadata`; JSON-LD Organization(→Store)+WebSite render trong layout. |
| `src/main.tsx` (`HelmetProvider`, createRoot) | Bỏ. Providers → `src/app/providers.tsx` (Client: QueryClientProvider, TooltipProvider). | `BuildBadge`/build-stamp meta có thể giữ qua env `NEXT_PUBLIC_*` hoặc bỏ. |
| `src/App.tsx` (BrowserRouter + Routes) | Bỏ. Overlay toàn cục (Floating/Messenger/Sticky/BuildBadge/Toaster/Sonner) render trong `layout.tsx`. | Routing do cấu trúc thư mục `app/`. |
| `vite.config.ts`, `index.html`, `vercel.json` | `next.config.js` (redirects), xoá `vercel.json` rewrite | Rewrite `/(.*)→/index.html` **phải xoá** — sẽ phá Next routing. |
| `src/vite-env.d.ts` (`Window.gtag`) | `src/global.d.ts` | Giữ khai báo `Window.gtag`, `__openMessengerChat`, `__showMessengerTemplates`, `FB`. Bỏ `/// <reference types="vite/client" />`. |

### 2.2 Pages → routes

| Route | Cũ (`src/pages`) | Mới (`src/app`) | Loại | Client island cần |
|---|---|---|---|---|
| `/` | `Index.tsx` | `page.tsx` | SSG shell | `SimBrowser` (lưới+lọc+search) |
| `/mua-ngay/:simId` | `Checkout.tsx` | `mua-ngay/[simId]/page.tsx` | Client, noindex | cả trang là client |
| `/dinh-gia-sim` | `DinhGiaSim.tsx` | `dinh-gia-sim/page.tsx` | SSG shell | công cụ định giá |
| `/sim-phong-thuy` | `SimPhongThuy.tsx` | `sim-phong-thuy/page.tsx` | SSG shell | công cụ luận số + list |
| `/sim-tra-gop` | `SimTraGop.tsx` | `sim-tra-gop/page.tsx` | SSG tĩnh | — |
| `/thanh-toan` | `thanh-toan.tsx` | `thanh-toan/page.tsx` | SSG tĩnh | (QR/bank tĩnh) |
| `/tin-tuc` | `TinTuc.tsx` | `tin-tuc/page.tsx` | SSG tĩnh | — |
| `/tin-tuc/*` (6 bài) | `TinTucBai1..6.tsx` | `tin-tuc/<slug>/page.tsx` ×6 | SSG tĩnh | — |
| `/mua-sim-tu-quy` | `MuaSimTuQuy.tsx` | `mua-sim-tu-quy/page.tsx` | SSG shell | list SIM tứ quý |
| `/mua-sim-gia-re` | `MuaSimGiaRe.tsx` | `mua-sim-gia-re/page.tsx` | SSG shell | list kho 229K |
| `/chinh-sach-bao-mat` … (×3) | `PolicyPage.tsx` (1 comp, 3 route) | `chinh-sach-bao-mat/page.tsx` + 2 route nữa, dùng chung `<PolicyArticle doc={…}>` | SSG tĩnh | — |
| `*` (404) | `NotFound.tsx` | `not-found.tsx` | Static 404 (HTTP 404) | — |
| `/:slug`→SimNamSinh | `SimNamSinh.tsx` | **XOÁ** | — | thay bằng redirect (mục 3) |

### 2.3 Components → Client vs Server

**Bắt buộc `"use client"`** (state/effect/browser/Radix/react-query):
`providers.tsx`, `SimBrowser` (đảo mới bọc `useSimData` + `AdvancedFilterSidebar`, `MobileFilterDrawer`, `SearchBarAdvanced`, `QuickPickChips`, `ActiveFilterChips`, `SortDropdown`, `SIMCardNew`, `EmptyStateHelper`, `RightSidebar`), `Navigation` (useState menu), `Header` (gtag/contact), `TrustBar` (useDeliveredCount), `FloatingContactButtons` (usePathname/window), `MessengerChatPlugin`, `MessengerQuickTemplates`, `StickyCtaBottomBar` (usePathname), `BuildBadge`, `QuickContactPopup` (dialog), `FAQSection` (Radix accordion), Checkout, công cụ `SimPhongThuy`/`DinhGiaSim`, các đảo list ở landing.

**Có thể là Server Component** (tĩnh, không state): `Footer`, `PolicyArticle`, 6 bài TinTuc, `TinTuc` index, `ProcessSteps` (nếu không có state), `IntroSection` (nhận `simCount` — nếu để trong island thì client; nếu muốn server thì bỏ prop động), các emitter JSON-LD.

**Đổi API routing** ở mọi component client:
- `import { Link } from "react-router-dom"` → `import Link from "next/link"` (đổi `to=` → `href=`).
- `useNavigate()` → `useRouter()` (`next/navigation`), `navigate('/x')` → `router.push('/x')`.
- `useParams()` (router) → `useParams()` (`next/navigation`).
- `useLocation().pathname` → `usePathname()`.
- `NavLink` tự chế: dùng `usePathname()` để tính active.

### 2.4 Hooks / lib / data (giữ nguyên logic)

`useSimData.ts`, `useCheapSimData.ts`, `useDeliveredCount.ts`, `simUtils.ts`, `simInventorySheet.ts`, `cheapSimSheet.ts`, `cheapSimFacets.ts`, `simValuation.ts`, `highlightUtils.ts`, `faqData.ts`, `utils.ts`, `buildInfo.ts` → **giữ nguyên**, chỉ sửa `import.meta.env.*` như mục 1.3. `src/lib/mcp/*` → xem mục 6 (mặc định bỏ).

---

## 3. SEO trong Next

### 3.1 Metadata (thay `react-helmet-async`)

Mỗi `page.tsx` export `metadata` (tĩnh) hoặc `generateMetadata` (động). Map 1-1 từ `<Helmet>` hiện có (title/description/canonical **đã unique, làm chuẩn rồi**).

- `alternates.canonical` = URL www của trang (bám đúng canonical hiện tại).
- `openGraph`/`twitter` mặc định ở `layout.tsx`, override title/description/url ở từng trang.
- **Checkout** dùng `generateMetadata` → title động theo `simId` + `robots: { index: false, follow: false }` (giữ `noindex` như `Checkout.tsx:241`).
- 2 thẻ `google-site-verification`: đặt trong `metadata.verification` không đủ (Next chỉ nhận 1 google token gọn) → khai cả hai qua `metadata.other` hoặc render thẳng trong `<head>` của layout. **Giữ đủ cả 2 token.**

Bảng title/canonical: lấy nguyên từ Helmet từng trang (VD `Index.tsx:534-536`, `PolicyPage.tsx:222-228`, `TinTucBai1.tsx:11-13`) — không đổi chữ, chỉ đổi cơ chế.

### 3.2 JSON-LD (server-render ⇒ tự vào HTML thô)

- **`layout.tsx` (mọi trang):** Organization → **nâng cấp `Store`/`LocalBusiness`** (P1-3): thêm `address` (43A Đường số 9, Tân Hưng, TPHCM — đã có), `geo` (lat/lng từ Google Maps ở Footer), `openingHoursSpecification` 08:00–21:00, `priceRange`, `telephone`, `sameAs` (Facebook/Zalo). Giữ `WebSite`.
- **FAQPage:** trang có FAQ (home, dinh-gia-sim, mua-sim-tu-quy, mua-sim-gia-re, sim-phong-thuy) — server component sinh `<script type="application/ld+json">` từ **cùng `faqData`** đang render (không tạo bản sao — đúng policy Google).
- **Article (6 bài):** thêm `datePublished`/`dateModified` (ISO) + `image` (P1-6) — trước đây thiếu (`TinTucBai1.tsx:18-26`).
- **BreadcrumbList (P1-4):** mỗi trang con (Home › Danh mục › Trang).

Toàn bộ nhóm này **tự khỏi P1-2** (JSON-LD tàng hình) ngay khi server-render.

### 3.3 robots / sitemap

- `src/app/robots.ts` sinh `robots.txt` (giữ Allow all, Disallow `/mua-ngay/`, khai Sitemap) — thay `public/robots.txt`.
- `src/app/sitemap.ts` sinh `sitemap.xml`: giữ 17 URL tĩnh, **thêm `lastmod` (P1-7)**, **bỏ mọi URL `/sim-nam-sinh-*`** (cụm đã bỏ). Hạ `/thanh-toan` priority thấp (đã đúng 0.5).
- Xoá `public/robots.txt`, `public/sitemap.xml` để tránh trùng (Next ưu tiên file tĩnh trong `public/` hơn route → phải xoá bản tĩnh).

### 3.4 Redirect 301 non-www→www + soft-404

- **non-www→www:** cấu hình ở **Vercel Domains** (đặt `www` là primary, apex → redirect permanent) hoặc `next.config.js` `redirects()` với `permanent: true`. **Lưu ý:** Next/Vercel phát **308** (permanent) — SEO tương đương 301, Google dồn equity như nhau. Nếu chủ dự án bắt buộc literal 301, phải set ở tầng domain Vercel (câu hỏi mục 8).
- **`/sim-nam-sinh-YYYY`:** thêm `next.config.js` redirect `source: '/sim-nam-sinh-:year(\\d{4})'` → `destination: '/'`, `permanent: true` (cụm đã bỏ; dồn về trang chủ). Xoá route động `/:slug` và `SimNamSinh.tsx`.
- **soft-404 (P0/P1-1):** `app/not-found.tsx` khiến mọi URL rác trả **HTTP 404 thật** + trang có `noindex` — **giải quyết dứt điểm**, không cần cấu hình Vercel thêm.

---

## 4. Gói P0 giao diện vào migration

Các sửa này thuần component/CSS, **không phụ thuộc Next**, nên đi kèm ở Phase 5 (sau khi trang đã chạy trên Next để review đúng ngữ cảnh). Trỏ rõ file:

- **P0-UI-1 — Dọn "rừng" CTA nổi mobile + fix chồng lấp (che 31px nút "ĐẶT NGAY"):**
  `src/components/FloatingContactButtons.tsx` — ẩn stack nổi trên mobile (thêm `hidden md:flex` cho `.floating-contact-stack`), giữ **StickyCtaBottomBar** làm lớp liên hệ duy nhất ở đáy mobile. Chọn **một** kênh Messenger (bong bóng FB *hoặc* nút floating). Files liên quan: `StickyCtaBottomBar.tsx`, `MessengerChatPlugin.tsx`, `MessengerQuickTemplates.tsx`.
- **P0-UI-2 — Tôn con số:**
  `src/components/SIMCardNew.tsx:170-184` — **bỏ inline `style={{ fontSize: 'clamp(14px,3.5vw,22px)' }}`** trên `<Link className="sim-number-auto">`; để `.sim-number-auto` (`src/index.css:173-183`) làm chủ, nâng thang lên desktop ~22–26px / mobile ~18–20px, thêm `font-variant-numeric: tabular-nums`. Đổi lưới trang chủ **4→3 cột**: trong đảo `SimBrowser` (port từ `Index.tsx:657`) `xl:grid-cols-4` → `xl:grid-cols-3`.
- **P0-UI-3 — Trả nền + chiều sâu cho thẻ (desktop transparent):**
  `src/index.css:345-374` `.sim-card-compact` — thêm token `--card-elevated` (~12–14%), đảm bảo nền ăn trên desktop (Front chẩn đoán vì sao `bg-card` ra transparent — nghi override/purge), thêm shadow "studio" + hover viền vàng mảnh.

(P1 giao diện — animation tiết chế, nhất quán microcopy/giá, nén chrome sticky mobile — gói kèm nếu rẻ; không chặn P0.)

---

## 5. Kế hoạch theo PHASE (mỗi phase độc lập chạy & review được)

### Phase 0 — Scaffold Next + hạ tầng (Front lead, Back cho env/data)
- **Front:** dựng skeleton `src/app` (layout, providers, globals.css từ index.css), `next.config.js`, `tsconfig` cho Next, đổi `package.json` deps (thêm `next`; gỡ `vite`, `@vitejs/plugin-react-swc`, `react-helmet-async`, `react-router-dom`, `lovable-tagger`, `@lovable.dev/mcp-js`; xoá `vite.config.ts`, `vercel.json` rewrite). Root layout: GTM/GA4 (`next/script`), 2 verification, OG/icons, JSON-LD Organization+WebSite, render overlay toàn cục + Toaster.
- **Back:** port `config.ts` + mọi `import.meta.env.*` → `process.env.*`; tạo `.env.local` (`NEXT_PUBLIC_*`) + set env trên Vercel; xác nhận Edge Function fetch chạy trong 1 client component thử.
- **Done:** `next dev` chạy; trang chủ shell render; **view-source thấy** GTM + meta + JSON-LD Organization; 1 fetch `fetch-sim-data` trả data ở client.

### Phase 1 — Trang tĩnh nội dung (Front) — ROI SEO cao nhất, rủi ro thấp nhất
- Port 3 policy (dùng chung `<PolicyArticle>`), `/tin-tuc` + 6 bài, `/thanh-toan`, `/sim-tra-gop` sang Server Component + `metadata` + JSON-LD (Article + Breadcrumb, thêm datePublished/image cho bài). Port `Header/TrustBar/Navigation/Footer`.
- **Done:** `curl -A Googlebot <url>` cho mỗi trang trả HTML đầy đủ (title/H1/canonical/JSON-LD hiện trong HTML thô); nhìn khớp bản cũ.

### Phase 2 — Trang chủ + data SIM + lọc (Front + Back)
- Port `Index.tsx` → `app/page.tsx` (server shell: H1, IntroSection, FAQSection, FAQPage JSON-LD) + đảo client `SimBrowser` bọc `useSimData` và toàn bộ UI lọc/search/lưới/SIMCardNew. Giữ hash effect (`#ns`/`#price`/`#landing`).
- **Back:** xác nhận hook data + cache localStorage + react-query hoạt động client-side như cũ.
- **Done:** view-source trang chủ có meta/H1/FAQ JSON-LD; lưới tải, search + lọc + "Xem thêm" + relax parity với bản cũ.

### Phase 3 — Landing/công cụ + Checkout (Front + Back)
- Port `sim-phong-thuy`, `dinh-gia-sim`, `mua-sim-tu-quy`, `mua-sim-gia-re` (shell tĩnh + đảo công cụ/list). Port `/mua-ngay/[simId]` (client, `noindex`).
- **⚠ Ranh giới TIỀN/PII:** giữ nguyên payload + 2 đích gửi đơn (`make-webhook-proxy` + Apps Script). VK test 1 đơn thật xuyên suốt; Viet review diff Checkout kỹ.
- **Done:** 4 trang render + công cụ chạy; đặt 1 đơn test → tới Make/Sheet; view-source checkout có `noindex`.

### Phase 4 — SEO/redirect/sitemap/JSON-LD finalize (Front + SEO)
- `app/robots.ts`, `app/sitemap.ts` (thêm lastmod, bỏ sim-nam-sinh), xoá bản tĩnh trong `public/`. `next.config.js` redirect `/sim-nam-sinh-YYYY→/` (permanent). Cấu hình non-www→www permanent ở Vercel. Nâng Organization→Store/LocalBusiness, BreadcrumbList sitewide.
- **Done:** `curl -I` URL rác → **404**; `curl -I` apex → 301/308 → www; sitemap hợp lệ; Rich Results Test pass FAQ/Article/Breadcrumb/LocalBusiness.

### Phase 5 — P0 giao diện (Front + Tram review)
- Thi công P0-UI-1/2/3 (mục 4). Kèm P1 UI nếu rẻ (animation tiết chế, chuẩn hóa giá/CTA, nén sticky mobile).
- **Done:** Tram sign-off; con số là "anh hùng" trong lưới; đáy mobile còn 1 lớp nổi, không che nút; thẻ có chiều sâu trên cả desktop/mobile.

> Thứ tự ưu tiên nếu cần cắt: **Phase 0→1→2** đã giải xong vấn đề SEO số 1 (HTML thật cho crawler) cho phần lớn giá trị. Phase 3–5 hoàn thiện nốt.

---

## 6. Rủi ro & lưu ý

- **Env rename `VITE_`→`NEXT_PUBLIC_`** ở mọi nơi; thiếu → build ra `undefined` URL, mọi call Supabase fail runtime. Literal fallback trong `config.ts` là lưới an toàn — **giữ lại**. Set đủ 3 biến trên Vercel.
- **`@lovable.dev/mcp-js` + `lovable-tagger`** là plugin Vite/Lovable — **gỡ khỏi deps + xoá `vite.config.ts`**. MCP in-app (`src/lib/mcp/*`) chỉ phục vụ qua `mcpPlugin` dev → **mặc định bỏ**. Edge Function `mcp` trên Supabase **độc lập, không bị ảnh hưởng** (vẫn deploy riêng). → Xác nhận chủ dự án (mục 8).
- **`@supabase/supabase-js` gần như dead** (client.ts không được query) → có thể gỡ để nhẹ bundle; **grep verify** trước khi xoá.
- **Deploy Vercel:** framework preset tự đổi Vite→Next khi có `next` trong package.json. **Bắt buộc xoá `vercel.json` rewrite** `/(.*)→/index.html` (sẽ phá routing Next). Giữ `public/` assets (favicon, share-banner, flash-sale, brand-logo, webmanifest, llms.txt); **xoá `public/robots.txt` + `public/sitemap.xml`** (thay bằng route).
- **Giữ SEO khi cutover:** URL giữ **1-1** (không đổi slug), canonical giữ www, 301/308 cho cụm sim-nam-sinh đã bỏ, submit lại sitemap, theo dõi GSC 2–4 tuần. GTM/GA4/2 verification phải có trong HTML server từ ngày đầu (đặt ở layout).
- **`import.meta.env.DEV`** ở ≥4 file → phải đổi hết sang `process.env.NODE_ENV`; sót 1 chỗ = lỗi build.
- **Global window types** (`gtag`, `__openMessengerChat`, `__showMessengerTemplates`, `FB`) → gom vào `src/global.d.ts`.
- **Fonts:** `@import` Google Fonts trong CSS (render-blocking) — tùy chọn chuyển `next/font` để tối ưu LCP; **không bắt buộc**.
- **Test (Vitest):** `vitest.config.ts` gắn Vite. Sau migration: hoặc giữ vitest + `@vitejs/plugin-react` chỉ cho test, hoặc tạm hoãn. Ưu tiên thấp — nêu để không quên (`src/test/*`).
- **`next/image`:** không cần (trang không có hero image; LCP là H1 text). Bỏ qua để giảm churn.
- **CWV (P2-4):** `ITEMS_PER_PAGE=100` → cân nhắc hạ 24–48 khi port `SimBrowser` (không bắt buộc trong đợt này).

---

## 7. Contract FE ↔ BE (shape/kiểu)

- **Đảo `SimBrowser`**: không nhận server prop — tự fetch client qua `useSimData` (giữ `NormalizedSIM`, `FilterState` trong `simUtils.ts`/`useSimData.ts`). Trạng thái loading/error/empty giữ nguyên như `Index.tsx:631-722`.
- **Checkout**: nhận `params.simId` (string) từ route. Trả về 1 `CheckoutSimData | null` qua react-query (giữ nguyên). Payload đơn giữ nguyên schema (`Checkout.tsx:347-368`).
- **Kiểu dữ liệu**: toàn bộ type trong `src/lib/*` + `src/integrations/supabase/types.ts` giữ nguyên.

---

## 8. Câu hỏi cần chủ dự án chốt trước khi code

1. **Bỏ hẳn MCP in-app** (`src/lib/mcp/*` + `mcpPlugin`) khi rời Vite? (Mặc định: **bỏ**; edge function `mcp` trên Supabase giữ nguyên độc lập.)
2. **`/sim-nam-sinh-YYYY`** redirect **permanent → `/`** (đề xuất) đúng ý chứ, hay muốn 410/404?
3. **non-www→www**: chấp nhận **308 permanent** (Next/Vercel phát; SEO tương đương 301) hay bắt buộc literal **301** (cần cấu hình domain-level Vercel)?
4. **Vitest**: giữ bộ test (cần ít config Vite cho riêng test) hay tạm bỏ trong đợt migration?

---

## 9. Tóm tắt cho các agent sau

- Kiến trúc: **App Router, SSG-first**. Mỗi trang = Server Component (khung + metadata + JSON-LD) + **client island** cho phần SIM động. **Không SSR/ISR cho dữ liệu SIM** (không cần cho SEO, từng SIM đã noindex).
- Giữ `src/`; chỉ `src/pages/*`→`src/app/**/page.tsx`. Tailwind/shadcn/react-query/hook data **giữ nguyên**, chỉ đổi `import.meta.env`→`process.env` và routing API (`next/link`, `next/navigation`).
- **6 phase (0–5)**, độc lập; Phase 0–2 đã giải xong vấn đề SEO số 1.
- **Ranh giới nguy hiểm**: checkout `/mua-ngay/[simId]` (tiền + PII, đẩy Make + Apps Script) — Viet/VK soi kỹ Phase 3.
- **Rủi ro lớn nhất**: (a) sót đổi env/`import.meta` gây fail runtime; (b) quên xoá `vercel.json` rewrite phá routing; (c) đứt luồng đơn checkout khi port. Cả ba đều có tiêu chí "done" đo được ở phase tương ứng.
