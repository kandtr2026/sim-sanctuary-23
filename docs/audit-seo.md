# Audit SEO — chonsomobifone.com

Người thực hiện: SEONgon (SEO Strategist) · Ngày: 2026-08-20
Mã nguồn: `sim-sanctuary-23` (Vite + React + shadcn/ui + Supabase, SPA client-side, deploy Vercel)

Ghi chú về mức độ chắc chắn: những mục có gắn **[đã kiểm bằng curl]** là dữ kiện đo được từ HTML thô của site production. Những mục về thứ hạng/volume từ khoá là **suy đoán** — dự án **chưa nối Search Console / Google Ads** vào codebase (không tìm thấy biến môi trường hay module GSC/Ads nào; chỉ có GTM `GTM-MWKVVS7M` + GA4 `G-W7G7B81W6S` gắn tĩnh trong `index.html`). Muốn có cụm từ khoá thật khách đã gõ, phải mở Search Console của domain và lấy query report — chưa có thì mọi map keyword bên dưới là phán đoán theo ý định, không phải số liệu.

---

## 1. Tóm tắt điều hành

- **[P0] Không có SSR/prerender — đây là vấn đề số 1 và nó vô hiệu hoá gần như toàn bộ công sức SEO on-page đã làm.** [đã kiểm bằng curl] `curl -A Googlebot` trang `/sim-phong-thuy` trả về đúng `<title>` generic của `index.html` ("CHONSOMOBIFONE.COM — Kho SIM số đẹp Mobifone uy tín"), **không** có canonical, **không** có H1, **không** có nội dung SIM. Toàn bộ title/description/canonical/H1/FAQPage/Article schema mà 17 trang đã khai báo bằng react-helmet-async chỉ xuất hiện *sau khi JS chạy* → tàng hình với Facebook/Zalo share, với AI crawler, và không đáng tin với Google (Google có render JS ở đợt 2 nhưng chậm và không đảm bảo).
- **[P0] Redirect non-www → www đang 307 (tạm thời).** [đã kiểm bằng curl] Cần đổi thành **301 vĩnh viễn** để dồn link equity về www.
- **[P1] Soft-404: URL không tồn tại trả HTTP 200.** [đã kiểm bằng curl] `/khong-ton-tai-abcxyz` trả `200 OK` (SPA luôn serve `index.html`). Trang NotFound có `<meta robots noindex,follow>` nhưng thẻ này JS-inject nên crawler đọc HTML thô không thấy → Google coi là soft-404, lãng phí crawl budget.
- **On-page cơ bản làm TỐT** (khi JS đã chạy): 17 trang đều có title/description/canonical **UNIQUE**, không copy-paste; mỗi trang có đúng **một H1** riêng, cây heading H1→H2 sạch. Đây là nền tốt — vấn đề chỉ là nó chưa đến được crawler vì thiếu prerender.
- **[P1] Structured data trong HTML thô chỉ có Organization + WebSite** (2 khối tĩnh trong `index.html`). FAQPage, Article, và (đề xuất) BreadcrumbList / LocalBusiness đều chưa hiện diện ở HTML thô. Organization có địa chỉ thật → nên nâng cấp thành LocalBusiness/Store (có địa điểm vật lý ở TPHCM).
- **[P1] Trang động `/sim-nam-sinh-YYYY` không phải landing page thật** — nó chỉ `<Navigate>` redirect về `/#ns=YYYY` (hash filter ở homepage, tàng hình với crawler). Nghĩa là cụm "sim năm sinh 1990/1995/..." **không có trang đích index được nào** phục vụ. Khoảng trống nội dung có chủ đích cần lấp.
- **[P2] Internal linking lệch ưu tiên:** main nav chỉ 4 mục và đang để **THANH TOÁN** (trang tiện ích) trong nav, trong khi 2 trang tiền bạc quan trọng (`/mua-sim-tu-quy`, `/mua-sim-gia-re`) bị đẩy xuống footer. 6 bài tin tức không có internal link ngữ cảnh trỏ về trang landing bán hàng. Chưa có breadcrumb.
- **Tốc độ/CWV:** homepage đổ 100 SIM/lần (`ITEMS_PER_PAGE=100`, DOM ~2100 node, loadComplete ~12s). Đây là vấn đề UX/INP hơn là SEO nội dung (vì SIM render client-side, không phải nội dung index), nhưng ảnh hưởng Core Web Vitals. Thuộc phần Front.

---

## 2. Bảng hành động ưu tiên

Effort: **S** = vài giờ · **M** = 1–2 ngày · **L** = >3 ngày. "Ai làm" phân biệt việc kỹ thuật SEO (SEONgon) với việc cần Front/Back/hạ tầng.

### P0 — Chặn gốc, làm trước

| # | Vấn đề | Tác động SEO | Cách sửa | Effort | Ai |
|---|---|---|---|---|---|
| P0-1 | **Không SSR/prerender.** Mọi meta/JSON-LD/H1/nội dung tàng hình trong HTML thô (`index.html` là khung rỗng: chỉ GTM noscript + `<div id="root">`). Xác nhận: `curl -A Googlebot /sim-phong-thuy` → title generic, 0 canonical. | Rất cao. Vô hiệu hoá toàn bộ on-page đã làm; share Facebook/Zalo hiện title+ảnh chung của homepage cho mọi URL; AI crawler không đọc được gì. | Thêm bước **prerender tĩnh lúc build** cho ~18 route tĩnh. Xem mục 3 để so sánh 4 phương án — khuyến nghị `vite-react-ssg` hoặc `react-snap`. | L | Front + SEONgon |
| P0-2 | **non-www → www trả 307 (tạm).** `curl -I https://chonsomobifone.com/` → `307 Temporary Redirect`. | Trung bình–cao. 307 không chuyển link equity; Google phải đoán canonical. | Đặt **301** ở Vercel: thêm apex domain, set redirect vĩnh viễn về www (Project Settings → Domains, hoặc `redirects` trong `vercel.json`). | S | Front (Vercel) |

### P1 — Sửa sớm

| # | Vấn đề | Tác động SEO | Cách sửa | Effort | Ai |
|---|---|---|---|---|---|
| P1-1 | **Soft-404.** URL rác trả `200 OK` thay vì 404. Thẻ `noindex` của NotFound (`src/pages/NotFound.tsx:24`) JS-inject nên crawler HTML thô không thấy. | Trung bình. Google index/giữ URL rác như soft-404, loãng crawl budget. | Sau khi có prerender: prerender một trang `/404` tĩnh và cấu hình Vercel trả status 404 cho route không khớp; hoặc dùng `vercel.json` để map notFound. Trước mắt: đảm bảo NotFound có `noindex` được prerender ra HTML. | M | Front + SEONgon |
| P1-2 | **JSON-LD phong phú nhưng tàng hình** (FAQPage ở Index/DinhGiaSim/MuaSimTuQuy/MuaSimGiaRe/SimPhongThuy; Article ở 6 bài) vì JS-inject. | Trung bình. Rich result (FAQ, Article) gần như không kích hoạt được. | Tự khắc phục khi P0-1 xong (prerender đưa JSON-LD vào HTML). Không cần code thêm — chỉ cần prerender chạy đúng. | — (đi kèm P0-1) | SEONgon xác nhận |
| P1-3 | **Organization schema nên nâng cấp LocalBusiness/Store.** Hiện `index.html:66` chỉ Organization; có địa chỉ 43A Đường số 9, Tân Hưng, TPHCM + hotline + giờ 08:00–21:00 nhưng chưa khai LocalBusiness. | Trung bình. Bỏ lỡ local pack "cửa hàng sim TPHCM", knowledge panel. | Đổi `@type` thành `Store` (hoặc `LocalBusiness`), thêm `geo` (lat/lng từ Google Maps đã embed ở Footer), `openingHoursSpecification` (08:00–21:00 hằng ngày), `priceRange`, `sameAs` (Facebook/Zalo). Sửa tại `index.html`. | S | SEONgon |
| P1-4 | **Thiếu BreadcrumbList toàn site.** | Thấp–trung bình. Bỏ lỡ breadcrumb rich result + tín hiệu cấu trúc. | Thêm JSON-LD BreadcrumbList vào mỗi trang con (Home › Danh mục › Trang). Đi kèm prerender mới có tác dụng. | M | SEONgon |
| P1-5 | **`/sim-nam-sinh-YYYY` không có landing thật** (`src/pages/SimNamSinh.tsx:28` chỉ Navigate về `/#ns=YYYY`). | Trung bình. Cụm "sim năm sinh 199x/200x" không có trang đích. | Quyết định hướng: (a) dựng 1 trang landing thật `/sim-nam-sinh` giải thích + form nhập năm + list mẫu, index được; (b) hoặc chấp nhận bỏ cụm này. Xem mục 5. | M | SEONgon dựng khung → ChuTot viết → Front build |
| P1-6 | **Article schema thiếu trường thời gian/ảnh.** `src/pages/TinTucBai1.tsx:20` có headline/description/author/publisher/mainEntityOfPage nhưng **thiếu `datePublished`, `dateModified`, `image`**. | Thấp–trung bình. Article rich result cần datePublished; thiếu ảnh giảm khả năng hiển thị. | Thêm `datePublished`/`dateModified` (ISO) và `image` (URL ảnh bài, hoặc share-banner làm fallback) cho cả 6 bài `TinTucBai1–6`. | S | SEONgon |
| P1-7 | **Sitemap thiếu trang động + priority nên soát lại.** `public/sitemap.xml` có đủ 17 URL tĩnh (bao gồm `/sim-tra-gop` — **không thiếu** như nghi ngờ ban đầu). Thiếu `lastmod` cho hầu hết URL; nếu dựng `/sim-nam-sinh` (P1-5) thì bổ sung. | Thấp. | Thêm `<lastmod>` cho các URL còn thiếu; thêm URL mới khi có; cân nhắc hạ `/thanh-toan` xuống priority thấp (đúng rồi: 0.5). | S | SEONgon |

### P2 — Cải thiện

| # | Vấn đề | Tác động SEO | Cách sửa | Effort | Ai |
|---|---|---|---|---|---|
| P2-1 | **Nav để trang tiện ích, giấu trang tiền.** `src/components/Navigation.tsx:10` — nav 4 mục gồm THANH TOÁN; `/mua-sim-tu-quy`, `/mua-sim-gia-re` chỉ nằm ở Footer. | Thấp–trung bình. Trang tiền nhận tín hiệu internal link yếu. | Cân nhắc đưa 1 trang tiền (VD "SIM TỨ QUÝ" hoặc "SIM GIÁ RẺ") lên main nav thay THANH TOÁN (THANH TOÁN vẫn ở footer). **Đụng giọng brand/UX → để user chốt.** | S | SEONgon đề xuất → user chốt |
| P2-2 | **Thiếu internal link ngữ cảnh bài viết → landing.** 6 bài tin tức không trỏ về `/mua-sim-tu-quy`, `/sim-phong-thuy`... | Thấp–trung bình. Bỏ lỡ luồng link nội bộ + điều hướng ý định mua. | Thêm 1–2 link ngữ cảnh trong thân mỗi bài (VD bài "ý nghĩa sim số đẹp" trỏ `/mua-sim-tu-quy`; bài "xem sim phong thủy hợp tuổi" trỏ `/sim-phong-thuy`). Anchor text mô tả, không "bấm vào đây". | S | SEONgon map cặp trang → ChuTot viết câu |
| P2-3 | **Title `/sim-tra-gop` hơi dài (~63 ký tự).** `src/pages/SimTraGop.tsx:8` "Có Nên Mua Sim Số Đẹp Trả Góp? Lợi Ích Và Lưu Ý \| CHONSOMOBIFONE". | Rất thấp. Có thể bị cắt đuôi trên SERP. | Rút còn ~55–60 ký tự, VD bỏ hậu tố brand hoặc gọn "…Lợi Ích Và Lưu Ý". | S | ChuTot viết → SEONgon kiểm |
| P2-4 | **Homepage 100 SIM/lần, ~2100 DOM node, ~12s loadComplete.** `src/pages/Index.tsx` `ITEMS_PER_PAGE=100`. | Thấp (nội dung client-side, không index). Ảnh hưởng INP/LCP → Core Web Vitals. | Giảm `ITEMS_PER_PAGE` xuống ~24–48, dùng "Xem thêm". Thuộc quyết định Front. | S | Front |
| P2-5 | **Trùng title homepage tĩnh vs động.** `index.html:24` "…uy tín" khác Helmet `src/pages/Index.tsx:534` "…giá rẻ". Crawler HTML thô thấy bản "uy tín". | Rất thấp. | Sau prerender sẽ nhất quán. Chọn 1 title chuẩn cho homepage. | S | SEONgon |
| P2-6 | **og:image không set riêng theo trang con** (các trang con chỉ set og:title/description/url, kế thừa share-banner của homepage). | Thấp. Share trang con dùng ảnh chung — chấp nhận được. | Tuỳ chọn: set og:image riêng cho landing chính (tứ quý, phong thủy). Không bắt buộc. | S | SEONgon (tuỳ chọn) |
| P2-7 | **Product/Offer schema cho từng SIM** — hiện `/mua-ngay/:simId` đã cố tình `noindex` (`src/pages/Checkout.tsx:241`) + robots chặn. | Không áp dụng ở scope hiện tại. | Chỉ làm nếu chuyển hướng chiến lược sang index từng SIM (cần Next.js/ISR — xem mục 3). Bỏ qua lúc này. | — | Chờ quyết định chiến lược |

---

## 3. Vấn đề #1 — 4 phương án SSR/Prerender + khuyến nghị

Bối cảnh quyết định: site ~18 route **tĩnh** (homepage, 4 landing danh mục, 6 bài tin tức, trang tin tức index, 3 policy, thanh toán, định giá, trả góp) + 1 route động `/mua-ngay/:simId` (**đã noindex, không cần SEO**) + `/sim-nam-sinh-YYYY` (hiện chỉ redirect). Nội dung SIM ở homepage là dữ liệu động từ Supabase, ~49.000 dòng.

Điểm mấu chốt: cái ta cần crawler thấy là **khung tĩnh + meta + H1 + copy + JSON-LD của từng trang**, KHÔNG phải 49.000 SIM (SIM chỉ là listing client-side, và từng SIM đã chủ động không index). Vì vậy prerender tĩnh lúc build là đủ cho 90% giá trị SEO.

### Phương án A — Prerender tĩnh lúc build (react-snap / @prerenderer)
- **Cách chạy:** sau `vite build`, một trình headless (Puppeteer) duyệt từng route, chụp DOM đã render thành file `.html` tĩnh ghi đè vào `dist`. Vercel serve HTML thật cho mọi crawler.
- **Ưu:** effort thấp nhất trong nhóm "làm đúng"; không đổi kiến trúc; react-helmet-async + JSON-LD hiện tại tự động vào HTML; giữ nguyên toàn bộ code.
- **Nhược:** `react-snap` bảo trì cầm chừng (hợp Vite nhưng cấu hình thủ công); cần liệt kê route thủ công; homepage sẽ snapshot lưới SIM ở trạng thái loading/rỗng (chấp nhận được — meta/H1/copy/FAQ vẫn đủ). Cần xử lý soft-404 riêng.
- **Effort:** M–L.

### Phương án B — vite-react-ssg (SSG native cho Vite + React Router)
- **Cách chạy:** thư viện SSG chuyên cho Vite, tích hợp React Router, render tĩnh từng route lúc build (không cần Puppeteer chụp màn hình — render React thật trên Node).
- **Ưu:** đang được bảo trì tích cực; sạch hơn react-snap; hỗ trợ khai báo route để pre-render; kiểm soát `<head>` tốt; giữ được SPA hydration. Hợp nhất với site "nhiều trang tĩnh + vài chỗ động".
- **Nhược:** cần refactor nhẹ entry (`main.tsx`) sang API của vite-react-ssg; một số component đọc `window`/browser API lúc render phải guard SSR (VD `window.scrollTo`, `navigator.clipboard`, Google Maps iframe). Cần rà các chỗ dùng `window` (đã thấy ở `Index.tsx`, `thanh-toan.tsx`).
- **Effort:** M–L (nhỉnh hơn A vì refactor entry, nhưng bền hơn).

### Phương án C — Prerender qua dịch vụ cho bot (Prerender.io / middleware)
- **Cách chạy:** giữ SPA nguyên; đặt middleware phát hiện bot → phục vụ HTML đã render sẵn (cache) từ dịch vụ như Prerender.io.
- **Ưu:** không đụng build/code nhiều; homepage động vẫn được render đầy đủ cho bot.
- **Nhược:** thêm phụ thuộc bên thứ ba (thường trả phí theo lượng URL); ranh giới "cloaking" cần cẩn thận (phải render y nội dung user thấy); thêm điểm hỏng vận hành; Google khuyến khích dynamic rendering chỉ như giải pháp tạm. Với site nhỏ, chi phí/độ phức tạp không đáng.
- **Effort:** M (nhưng tốn phí vận hành dài hạn).

### Phương án D — Migrate Next.js (App Router, SSR/SSG/ISR)
- **Cách chạy:** viết lại routing sang App Router, `generateMetadata` cho meta động, SSG cho trang tĩnh, và (điểm mạnh riêng) **ISR để sinh trang landing cho từng SIM / từng pattern** — thứ prerender build-time không kham nổi với 49.000 URL.
- **Ưu:** SEO mạnh nhất & bền nhất; meta/JSON-LD server-render 100%; `next/image` tối ưu LCP; mở khoá cơ hội long-tail khổng lồ (mỗi số/đuôi số là 1 trang index được — người ta *có* gõ đúng số cụ thể).
- **Nhược:** effort lớn nhất (viết lại ~24 trang + data fetching + component guard SSR); rủi ro hồi quy; hiện `/mua-ngay/:simId` đã chủ động noindex nghĩa là chủ site *đang chọn không* index từng SIM — nếu giữ quan điểm đó thì phần lớn giá trị riêng của Next.js không được dùng.
- **Effort:** L (lớn).

### Khuyến nghị
**Chọn Phương án B (`vite-react-ssg`), fallback nhanh là A (`react-snap`).**

Lý do: site về bản chất là ~18 trang tĩnh; cái thiếu chỉ là đưa khung + meta + H1 + copy + JSON-LD vào HTML — SSG build-time giải quyết trọn vẹn với effort vừa phải, không phải viết lại. `vite-react-ssg` bền hơn `react-snap` về bảo trì. Sau khi có SSG:
- P1-2 (JSON-LD tàng hình) tự khỏi.
- Share Facebook/Zalo mỗi URL hiện đúng title/ảnh/mô tả riêng.
- Soft-404 (P1-1) xử lý được bằng cách prerender trang 404 + cấu hình status Vercel.

**Chỉ cân nhắc Phương án D (Next.js) nếu** chủ site đổi chiến lược muốn săn long-tail "số cụ thể / đuôi số cụ thể" ở quy mô hàng chục nghìn trang (tức đảo ngược quyết định noindex `/mua-ngay/`). Đó là việc duy nhất SSG không làm kinh tế được. Nếu vẫn giữ quan điểm không index từng SIM → **không cần Next.js**, đừng gánh effort L.

Đây là đánh cược có điều kiện, không phải lời hứa hạng: prerender đảm bảo nội dung *đến được* crawler — điều kiện cần để xếp hạng — chứ không đảm bảo *sẽ* lên hạng.

---

## 4. Chi tiết phát hiện

### 4.1 Technical
- **Prerender:** xem mục 3. [đã kiểm bằng curl]
- **Canonical mỗi trang:** khai báo đầy đủ & unique trong Helmet từng trang (VD `Index.tsx:536`, `SimPhongThuy.tsx:635`, `MuaSimTuQuy.tsx:195`), nhưng **vắng mặt trong HTML thô** vì JS-inject. Sau prerender là ổn.
- **Redirect 301:** xem P0-2. [đã kiểm bằng curl]
- **HTTP status / soft-404:** xem P1-1. [đã kiểm bằng curl] `/sim-tra-gop` → 200 OK (đúng), URL rác → 200 (sai, nên 404).
- **robots.txt:** hợp lý — Allow all, Disallow `/mua-ngay/`, khai Sitemap. Lưu ý kỹ thuật: `/mua-ngay/` vừa bị Disallow (chặn crawl) vừa có `noindex` meta — vì đã Disallow nên Google không crawl để đọc noindex; đây là "belt-and-suspenders", chấp nhận được, không phải lỗi.
- **Sitemap:** 17 URL, khớp routes tĩnh; **không thiếu `/sim-tra-gop`**. Thiếu `lastmod` phần lớn URL. Không liệt kê `/mua-ngay/*` (đúng) và không có `/sim-nam-sinh-*` (vì chưa là trang thật).
- **Route động `/:slug`:** `SimNamSinh.tsx` chỉ resolve `sim-nam-sinh-YYYY` (1900..năm hiện tại), còn lại render NotFound — logic đúng, nhưng NotFound vẫn trả HTTP 200 (soft-404, P1-1).

### 4.2 On-page
- **Title/description/H1 unique:** ĐẠT. 17 trang mỗi trang một bộ riêng, không copy-paste. Một H1 duy nhất/trang, cây H1→H2 sạch (kiểm ở Index, SimPhongThuy, MuaSimTuQuy, MuaSimGiaRe, DinhGiaSim, SimTraGop, thanh-toan, 6 bài tin tức).
- **Độ dài title:** đa số 50–55 ký tự (tốt). Ngoại lệ `/sim-tra-gop` ~63 (P2-3).
- **Ý định tìm kiếm:** phần lớn khớp. Lưu ý lệch: `/sim-tra-gop` là **bài phân tích thông tin** ("có nên mua trả góp") chứ không phải trang bán/list SIM trả góp — người gõ "mua sim trả góp" với ý định *mua* sẽ không thấy list để mua. Ghi nhận, không nhất thiết sửa (bài info vẫn có giá trị top-of-funnel).
- **Trùng lặp nội dung:** không thấy trùng đáng kể; các trang khác chủ đề rõ ràng.

### 4.3 Structured data — trạng thái & đề xuất
| Schema | Trang | Trạng thái | Việc |
|---|---|---|---|
| Organization | tất cả (`index.html`) | Có, tĩnh, crawler thấy | Nâng cấp → Store/LocalBusiness (P1-3) |
| WebSite | tất cả (`index.html`) | Có, tĩnh | Tuỳ chọn thêm SearchAction (cân nhắc — search homepage là hash client-side, có thể không đủ điều kiện) |
| FAQPage | Index, DinhGiaSim, MuaSimTuQuy, MuaSimGiaRe, SimPhongThuy | Có nhưng JS-inject (tàng hình HTML thô); FAQ đều render visible trên trang → **không vi phạm policy** | Khỏi khi prerender (P1-2) |
| Article | 6 bài TinTuc | Có nhưng JS-inject; thiếu datePublished/dateModified/image | Bổ sung trường (P1-6) + prerender |
| BreadcrumbList | — | Thiếu toàn site | Thêm (P1-4) |
| Product/Offer | từng SIM | Không có; trang SIM đã noindex | Bỏ qua (P2-7) trừ khi chọn Next.js |

Nguyên tắc: chỉ đánh dấu schema cho nội dung có thật trên trang (đã kiểm — mọi FAQPage đều có FAQ hiển thị tương ứng, không có markup "ma").

### 4.4 Internal linking
- **Nav** (`Navigation.tsx:10`): 4 mục — SIM SỐ (`/`), SIM PHONG THỦY, THANH TOÁN, TIN TỨC. Trang tiền tứ quý/giá rẻ không ở nav (P2-1).
- **Footer** (`Footer.tsx:8`): cột "DANH MỤC SIM" gánh `/mua-sim-gia-re`, `/mua-sim-tu-quy`, `/sim-tra-gop`, `/dinh-gia-sim` + policy + thanh-toan. Anchor text mô tả tốt ("SIM tứ quý", "SIM đồng giá 229K"). → Mọi trang chính đều reachable & internally linked.
- **Thiếu:** link ngữ cảnh trong thân bài viết trỏ landing (P2-2); breadcrumb (P1-4).

### 4.5 Ảnh & tốc độ (góc SEO)
- **LCP homepage:** là text H1 (`Index.tsx:550`), không có hero image (đã gỡ) → LCP nhẹ, tốt. `index.html` đã có comment giải thích không preload ảnh đã xoá — sạch.
- **Alt text:** cơ bản ổn. `flash-sale.webp` alt="Flash Sale" (thực ra trang trí, để `alt=""` chuẩn hơn nhưng không nghiêm trọng); QR alt="QR Techcombank" ok; Google Maps iframe có `title`, `loading=lazy` — tốt. SIM card là text (không ảnh) → không có gánh nặng alt.
- **share-banner.png ~434KB:** chỉ là OG image (không render trên trang), chấp nhận được.
- **CWV:** 100 SIM/lần là điểm nặng INP/DOM (P2-4, Front).

---

## 5. Map keyword → trang + khoảng trống nội dung

**Cảnh báo:** bảng dưới là **suy đoán theo ý định**, KHÔNG phải volume/độ khó thật (chưa nối GSC/Ads). Việc đầu tiên đáng làm để có số thật: mở Search Console domain, lấy query report 3 tháng, rồi tinh chỉnh map này bằng cụm khách *đã thật sự gõ*.

Ý định: **I** = Informational (muốn biết), **C** = Commercial (so sánh/tìm hiểu để mua), **T** = Transactional (muốn mua ngay).

| Cụm từ khoá chính (suy đoán) | Ý định | Trang đích | Trạng thái | Ghi chú |
|---|---|---|---|---|
| sim mobifone số đẹp / kho sim mobifone | C/T | `/` (homepage) | Có, khớp | Title/H1 đã nhắm đúng |
| sim tứ quý mobifone / mua sim tứ quý | T | `/mua-sim-tu-quy` | Có, khớp tốt | H1 + FAQ + nội dung đủ |
| sim giá rẻ / sim đồng giá | T | `/mua-sim-gia-re` | Có, khớp tốt | — |
| sim phong thủy / bói sim / sim hợp mệnh hợp tuổi | C/I | `/sim-phong-thuy` | Có, khớp tốt | Công cụ + FAQ |
| định giá sim / tra giá sim | I/C | `/dinh-gia-sim` | Có, khớp tốt | Công cụ định giá |
| sim trả góp / mua sim trả góp 0% | C→T | `/sim-tra-gop` | **Lệch**: là bài info, không phải list mua | Cân nhắc bổ sung block "SIM trả góp đang có" hoặc CTA Zalo rõ ý mua |
| sim năm sinh 199x/200x / sim theo năm sinh | C/T | `/sim-nam-sinh-YYYY` | **Thiếu trang thật** (chỉ redirect) | **Khoảng trống — xem đề xuất khung dưới** |
| ý nghĩa sim số đẹp / số điện thoại đẹp | I | `/tin-tuc/y-nghia-sim-so-dep` | Có | Nên trỏ nội bộ về `/mua-sim-tu-quy` |
| ý nghĩa các con số 1–9 phong thủy | I | `/tin-tuc/y-nghia-cac-con-so-1-9` | Có | Trỏ về `/sim-phong-thuy` |
| cách xem sim phong thủy hợp tuổi | I | `/tin-tuc/cach-xem-sim-phong-thuy-hop-tuoi` | Có | Trỏ về `/sim-phong-thuy` |
| đầu số mobifone / các đầu số 089 090 093… | I | `/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat` | Có | — |
| sim tài lộc / sim thần tài (đuôi 39/79/68/86…) | C/T | **Chưa có trang riêng** | **Khoảng trống nhẹ** | Hiện phục vụ qua filter homepage (client-side, không index). Cân nhắc landing riêng nếu GSC cho thấy nhu cầu |
| cửa hàng sim tphcm / mua sim ở đâu uy tín | T (local) | (homepage + LocalBusiness schema) | Một phần | P1-3 LocalBusiness giúp local pack |

### Khoảng trống ưu tiên & khung H1/H2 đề xuất (bàn giao ChuTot viết chữ)

Lưu ý phân vai: dưới đây là **bộ xương + ý định + mỗi mục trả lời câu hỏi gì**. SEONgon dựng khung; **ChuTot viết câu chữ**; không viết sẵn bản nháp để ChuTot sửa.

**A. `/sim-nam-sinh` — trang landing thật (P1-5), ý định C/T**
Mục tiêu: phục vụ cụm "sim năm sinh", thay cho redirect tàng hình hiện tại. Cần một trang index được.
- **H1** (ChuTot): xoay quanh "SIM số đẹp theo năm sinh" — nêu lợi ích chọn số hợp năm sinh.
- **H2 — SIM năm sinh là gì, vì sao chọn theo năm sinh?** → trả lời: người mua muốn số gắn với năm sinh mình/người thân, ý nghĩa cá nhân hoá.
- **H2 — Chọn SIM theo năm sinh của bạn** → khối nhập/chọn năm (1980…2005), dẫn sang kết quả lọc; kèm vài mẫu tĩnh render sẵn để có nội dung index.
- **H2 — SIM năm sinh hợp phong thủy** → cầu nối sang `/sim-phong-thuy` (internal link).
- **H2 — Câu hỏi thường gặp** → tái dùng FAQ mua/giao/đổi trả (đã có `faqData`), gắn FAQPage schema.
- Kỹ thuật (SEONgon): canonical `/sim-nam-sinh`, BreadcrumbList, thêm vào sitemap, cập nhật `SimNamSinh.tsx` để `/sim-nam-sinh-YYYY` trỏ về trang này (kèm bộ lọc năm) thay vì `/#ns=`.

**B. (tuỳ nhu cầu GSC) `/sim-tai-loc-than-tai` — ý định C/T**
Chỉ làm nếu query report cho thấy lượng tìm thực. Khung: H1 "SIM tài lộc, thần tài" → H2 "Đuôi số tài lộc phổ biến (39, 79, 68, 86, 68…)" → H2 "Ý nghĩa từng đuôi" → list SIM mẫu → FAQ. Trước khi dựng, **cần số liệu** — đừng đoán.

---

## 6. Ranh giới bàn giao

- **SEONgon tự làm (sửa metadata/JSON-LD/sitemap/robots/canonical):** P1-3 (LocalBusiness), P1-4 (BreadcrumbList), P1-6 (Article datePublished/image), P1-7 (sitemap lastmod), P2-5 (title homepage), P2-6 (og:image tuỳ chọn); dựng khung H1/H2 cho `/sim-nam-sinh`.
- **Cần Front / hạ tầng Vercel:** P0-1 (prerender — quyết định lớn, làm cùng SEONgon), P0-2 (301 redirect), P1-1 (soft-404 status), P2-4 (ITEMS_PER_PAGE — CWV).
- **Cần ChuTot:** viết chữ cho `/sim-nam-sinh` (từ khung mục 5), rút gọn title `/sim-tra-gop` (P2-3), câu link ngữ cảnh bài→landing (P2-2). SEONgon kiểm độ dài & từ khoá sau.
- **Cần user quyết:** P2-1 (đưa trang tiền lên nav thay THANH TOÁN — đụng UX/brand); hướng đi cho `/sim-nam-sinh` (dựng trang thật hay bỏ cụm); có theo đuổi Next.js (mục 3-D) để index từng SIM hay không.

**Việc đầu tiên nên làm để mọi thứ khác có ý nghĩa:** P0-1 (prerender) + P0-2 (301). Trước khi có prerender, mọi cải thiện on-page/schema vẫn tàng hình với crawler HTML thô — làm schema đẹp mấy cũng không tới đích.
