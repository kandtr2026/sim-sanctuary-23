# TODO cho opencode — P1/P2 còn lại + việc thủ công (chonsomobifone.com)

> Ngày giao: 2026-08-21. Bối cảnh: đã migrate Next.js + live + vá P0 xong. File này chỉ liệt kê **phần CÒN SÓT** trong 2 audit (`docs/audit-seo.md`, `docs/audit-giao-dien.md`). Đọc `docs/HANDOFF-opencode.md` để nắm tổng thể.
>
> ⚠️ Đây là **Next.js phiên bản có breaking changes** (xem `AGENTS.md`). Trước khi viết code Next mới, đọc guide trong `node_modules/next/dist/docs/` và **bám theo pattern có sẵn trong repo** (ví dụ cách chèn JSON-LD/metadata mà các trang hiện tại đang dùng, helper `src/lib/seo.ts`).

## ✅ ĐÃ XONG (đừng làm lại)
- SEO: P1-3 LocalBusiness/Store, P1-4 BreadcrumbList (helper `buildBreadcrumb` ở `src/lib/seo.ts`, áp cho mọi trang con), P1-6 Article `datePublished/dateModified/image` (helper `buildArticle`, đủ 6 bài), P1-7 sitemap `lastModified` (`src/app/sitemap.ts`), soft-404 (`not-found.tsx` trả 404 thật), redirect 308, robots/sitemap động.
- Giao diện: P0 (dọn CTA nổi, tôn số SIM, depth thẻ) + P1 + P2 đã làm ("Tram sign-off", commit `8ef8613`).

---

## 🔨 CODE — phần còn sót (opencode thi công)

### 1. [P2-2] Link nội bộ ngữ cảnh: bài tin tức → trang landing bán hàng — **CHƯA CÓ**
**Vì sao:** 6 bài `src/app/tin-tuc/*/page.tsx` hiện không có link ngữ cảnh trong thân bài trỏ về trang tiền → mất luồng internal link + điều hướng ý định mua.
**Việc:** Trong thân mỗi bài, chèn **1–2 link** `next/link` với **anchor text mô tả** (KHÔNG dùng "bấm vào đây"). Đặt tự nhiên trong đoạn liên quan, không nhồi. Bản đồ đề xuất:

| Bài (`src/app/tin-tuc/…/page.tsx`) | Trỏ tới | Gợi ý anchor (chỉnh cho tự nhiên) |
|---|---|---|
| `y-nghia-sim-so-dep` | `/mua-sim-tu-quy` | "kho sim tứ quý số đẹp" |
| `y-nghia-cac-con-so-1-9` | `/sim-phong-thuy` | "chọn sim hợp phong thủy" |
| `cach-xem-sim-phong-thuy-hop-tuoi` | `/sim-phong-thuy` | "công cụ xem sim phong thủy hợp tuổi" |
| `cach-tranh-mat-tien-oan-khi-mua-sim-so-dep` | `/mua-sim-gia-re` | "sim số đẹp giá tốt, minh bạch giá" |
| `cac-dau-so-mang-mobifone-moi-nhat` | `/` (kho sim) | "kho sim Mobifone đang có" |
| `so-tong-dai-cac-nha-mang` | `/` hoặc bỏ | (bài info thuần, chèn nếu thấy tự nhiên, không thì bỏ) |

Style: dùng class link đang có trong bài (hoặc thêm underline + màu `--gold` nhạt cho nhất quán). Effort **S**.

### 2. [P2-3] Rút gọn title `/sim-tra-gop` — **CẦN SỬA**
File `src/app/sim-tra-gop/page.tsx` dòng 5: hiện
`const TITLE = "Có Nên Mua Sim Số Đẹp Trả Góp? Lợi Ích Và Lưu Ý | CHONSOMOBIFONE";` (**62 ký tự**, dễ bị cắt trên SERP).
→ Rút ≤ **60 ký tự**, ví dụ: `"Có Nên Mua Sim Trả Góp? Lợi Ích Và Lưu Ý | CHONSOMOBIFONE"` (~57). Giữ từ khoá "sim trả góp" ở đầu. Effort **S**.

### 3. [P2-4] Kiểm số SIM/trang ở TRANG CHỦ (CWV) — **CẦN KIỂM**
Landing con đã ổn (`MuaSimGiaReTool.tsx`: 20 mobile / 30 desktop). Nhưng **đảo client của trang chủ** (`src/app/page.tsx` → component lưới SIM, tìm nơi render danh sách) cần xác nhận không còn đổ 100 SIM/lần. Nếu vẫn 100 → giảm còn **24–48/lần** + nút "Xem thêm" (giữ nguyên logic lọc). Nếu đã phân trang hợp lý thì bỏ qua. Effort **S–M**.

### 4. [P2-6] (TÙY CHỌN) og:image riêng cho landing chính
Các trang landing đang kế thừa `share-banner.png` chung. Nếu có thời gian, set `openGraph.images` riêng cho `/mua-sim-tu-quy` và `/sim-phong-thuy` (ảnh chủ đề). Không bắt buộc. Effort **S**.

---

## 🧭 CẦN CHỦ DỰ ÁN QUYẾT (đừng tự đổi)

### [P2-1] Menu chính vẫn để "THANH TOÁN", giấu trang tiền
`src/components/Navigation.tsx`: nav gồm SIM SỐ / SIM PHONG THỦY / **THANH TOÁN** / TIN TỨC. Hai trang tiền (`/mua-sim-tu-quy`, `/mua-sim-gia-re`) chỉ nằm ở footer → tín hiệu internal link yếu.
**Đề xuất (chờ chủ dự án OK):** thay "THANH TOÁN" bằng **"SIM TỨ QUÝ"** (hoặc "SIM GIÁ RẺ") trên nav; "THANH TOÁN" vẫn giữ ở footer. Đụng UX/brand nên KHÔNG tự đổi.

---

## 🖐️ VIỆC THỦ CÔNG — cần tài khoản đăng nhập (opencode KHÔNG code được, chủ dự án tự làm trên trình duyệt)

Ba việc này thao tác trên tài khoản Google/Facebook đã đăng nhập, không phải code:

1. **Google Search Console** (https://search.google.com/search-console, property `chonsomobifone.com`):
   - Sitemaps → nộp lại `https://www.chonsomobifone.com/sitemap.xml`.
   - URL Inspection → dán `https://www.chonsomobifone.com/` và vài trang landing chính → **Request indexing** (để Google crawl bản Next.js mới sớm).
2. **Facebook Sharing Debugger** (https://developers.facebook.com/tools/debug/): dán từng URL chính → **Scrape Again** để làm mới thẻ share (giờ mới có OG title/ảnh đúng từng trang).
3. **Zalo:** làm mới preview khi share link (Zalo đọc lại OG khi cache hết hạn; nếu có công cụ debug link của Zalo thì scrape lại).

> Nếu chủ dự án muốn, có thể nhờ trợ lý mở trình duyệt đã đăng nhập để làm hộ 3 việc trên — nhưng đó là thao tác tài khoản, cần chủ dự án đồng ý từng bước.

---

## Sau khi code xong (opencode)
1. `npm run build` phải xanh.
2. Commit + push `main` (project Vercel `chonsomobifone` tự deploy — xem HANDOFF về bẫy `vercel.json framework nextjs` đã có sẵn).
3. Kiểm live: `curl` title `/sim-tra-gop` mới ≤60 ký tự; mở 1 bài tin tức xác nhận link nội bộ hiển thị.
