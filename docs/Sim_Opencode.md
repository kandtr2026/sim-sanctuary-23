# Sim_Opencode.md — Sổ giao việc cho opencode (chonsomobifone.com / repo sim-sanctuary-23)

> **Đây là file task chính** của dự án SIM. Claude ra spec ở đây; opencode đọc file này rồi thi công. Mỗi đầu việc là một mục `## Task N`. Làm xong đánh dấu ✅ ở đầu Task, **đừng xoá** (giữ lịch sử).
>
> ⚠️ Repo dùng **Next.js bản có breaking changes** (xem `AGENTS.md`): trước khi viết code Next mới, đọc guide trong `node_modules/next/dist/docs/` và **bám pattern có sẵn trong repo**.
> ⚠️ Deploy: push `main` → Vercel project **`sim-sanctuary-23`** tự build (bản có domain thật). Xem `docs/HANDOFF-opencode.md` về bẫy `vercel.json framework nextjs`.

---

## Task 1 — ✅ ĐÃ LÀM · Làm lại Dashboard quản trị `/admin/dashboard`

**Bối cảnh:** trang `/admin/dashboard` hiện "tệ" — bố cục nghèo, chỉ vài stat card + 2 danh sách `<ul>` phẳng, KHÔNG dùng màu thương hiệu, KHÔNG khai thác dữ liệu sẵn có (giá trị kho, SIM giảm giá, SIM VIP, biểu đồ phân bố). Việc: **thiết kế lại UI dashboard cho ra dáng "trang quản trị thật"**; dữ liệu và luồng auth GIỮ NGUYÊN. Trang này là `"use client"`, không đụng SSR/metadata.

### Phạm vi — chủ yếu 1 file (được tách component con)
- **Sửa:** `src/app/admin/dashboard/page.tsx`
- **Được phép tạo mới** (khuyến khích cho gọn): component con trong `src/components/admin/` — ví dụ `StatCard.tsx`, `BarList.tsx`, `DashboardHeader.tsx`.
- **TUYỆT ĐỐI KHÔNG đụng:**
  - `RequireAdmin`, `useAdminAuth`, luồng đăng nhập, RLS, Supabase.
  - `useSimData.ts` (nguồn dữ liệu kho — Google Sheet → edge function). Chỉ **đọc** từ hook, không sửa hook.
  - Logic tải/xoá bài viết (`blog_posts`) đang có — giữ nguyên hành vi, chỉ làm đẹp phần hiển thị.

### Dữ liệu ĐÃ CÓ SẴN (chỉ bày ra cho đẹp + tính thêm vài chỉ số)
Từ `useSimData()` (đang import sẵn):
- `allSims: NormalizedSIM[]` — mỗi SIM có: `price`, `network` (`'Mobifone' | 'Vinaphone' | 'Gmobile' | 'Khác'`), `tags: string[]`, `isVIP: boolean`, `beautyScore`, `prefix3`, `prefix4`, `rawDigits`, `displayNumber`.
- `tagCounts: Record<tag, number>`, `prefixes: { prefix3: string[]; prefix4: string[] }`.
- `isLoading` (lần đầu), **`isFetching`** (đang refetch nền), **`forceReload()`** (bấm tải lại kho — HIỆN CHƯA DÙNG, hãy thêm nút).

Import thêm:
- `import { getPromotionalData, getLastUpdateInfo } from "@/hooks/useSimData";`
- `import { formatPrice, PRICE_RANGES } from "@/lib/simUtils";`
- `getPromotionalData(sim.id)` → `{ originalPrice, finalPrice, discountType, discountValue }` (đếm SIM giảm giá + tính giá gốc).
- `getLastUpdateInfo()` → `{ timestamp: number | null; isCache: boolean }` (hiển thị "Cập nhật lúc …" + cảnh báo nếu đang dùng cache).

Từ state `posts` đã load sẵn: tổng số, số đã đăng (`published === true`), số nháp.

> Lưu ý: khi kho chưa fetch xong, `allSims` là seed/placeholder và `getPromotionalData` trả `undefined` → coi như "không giảm giá". Dùng `?.` an toàn, không crash.

### Chỉ số cần tính (`useMemo`, deps `[allSims]`)
```
const stats = {
  total:          allSims.length,
  inventoryValue: allSims.reduce((s, sim) => s + (sim.price || 0), 0), // format compact "tỷ"
  avgPrice:       total ? inventoryValue / total : 0,
  maxPrice:       Math.max(0, ...allSims.map(s => s.price || 0)),
  vipCount:       allSims.filter(s => s.isVIP).length,
  discountedCount: allSims.filter(s => {                 // SIM giảm giá thật
    const p = getPromotionalData(s.id);
    return p?.finalPrice && p.originalPrice > 0 && p.finalPrice < p.originalPrice;
  }).length,
};
```
Phân bố (đã có `networkCounts`, `priceBucketCounts`, `topTags` trong file cũ — GIỮ, đổi cách render):
- **Theo mạng** — `networkCounts` (Mobifone đứng đầu, tô đỏ thương hiệu).
- **Theo khoảng giá** — `priceBucketCounts` (lọc `count > 0`).
- **Loại số phổ biến** — `topTags` (top 8).
- **(Thêm) Top đầu số** — `prefixes.prefix3.slice(0, 10)` dạng chip.

Helper tiền gọn cho ô "Tổng giá trị kho":
```
const formatCompactVnd = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
  : n >= 1_000_000   ? `${(n / 1_000_000).toFixed(0)} tr`
  : n.toLocaleString("vi-VN");
```

### Thiết kế UI (dark theme — bám design token của web)
Web nền đen (`--background #0F0F0F`, `--card #1A1A1A`), nhấn **đỏ Mobifone** (`--primary #C4161C`) và **vàng** (`--gold #F5B301`). Dashboard hiện dùng token trung tính nên nhạt nhoà.

**1. Header (app bar gọn, `sticky top-0 z-10`, nền `bg-card/80 backdrop-blur`, viền dưới `border-border`):**
- Trái: tiêu đề **"Bảng điều khiển"** + email admin; dòng phụ **"Cập nhật kho: {giờ} · {N} SIM"** (từ `getLastUpdateInfo`), nếu `isCache` thì badge vàng "dữ liệu tạm".
- Phải: **"Xem website"** (`<a href="/" target="_blank">`, icon `ExternalLink`), **"Làm mới kho"** (gọi `forceReload()`, icon `RefreshCw` xoay khi `isFetching`), **"Đăng xuất"** (giữ nguyên).

**2. Hàng KPI** — grid `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`; card nền `bg-card` viền `border-border` `rounded-xl` `shadow-[var(--shadow-card)]` hover nhấc nhẹ; icon trong ô bo tròn, nhãn `text-muted-foreground`, số `text-2xl font-bold`, số quan trọng tô accent.

| Card | Giá trị | Icon | Màu số |
|---|---|---|---|
| Tổng SIM còn hàng | `total.toLocaleString('vi-VN')` | `Smartphone` | foreground |
| Tổng giá trị kho | `formatCompactVnd(inventoryValue)` | `Wallet` | **gold** |
| SIM đang giảm giá | `discountedCount` (+ `%` trên total) | `BadgePercent` | **đỏ** |
| SIM VIP | `vipCount` | `Crown` | **gold** |
| Giá trung bình | `formatPrice(avgPrice)` | `TrendingUp` | foreground |
| Bài viết | `posts.length` (`{đăng} đăng · {nháp} nháp`) | `FileText` | foreground |

**3. Khu phân bố kho** — grid `md:grid-cols-3`, mỗi khối là card có tiêu đề + danh sách **thanh ngang** thay `<ul>` phẳng:
- Mỗi dòng: nhãn (trái) — thanh nền `bg-muted` với fill `width:{pct}%` (`pct = count/maxCount*100`) — số + `%` (phải).
- Fill: **Theo mạng** → Mobifone `bg-primary`, mạng khác `bg-muted-foreground/40`; **Khoảng giá** & **Loại số** → `bg-gold-soft`.
- Tách component tái dùng `BarList({ title, items, accent })`.
- Dưới khối "Loại số": dòng "Đầu số phổ biến" render **chip** (`prefixes.prefix3.slice(0,10)`, `rounded-full border px-2 py-0.5 text-xs`).

**4. Khu quản lý bài viết** — giữ bảng cũ nhưng: header khu + nút "Đăng bài mới" có viền dưới; bảng bọc card `rounded-xl border`, header `bg-muted/50`, hàng `hover:bg-muted/30`; badge trạng thái đổi sang token hợp nền đen (`bg-emerald-500/15 text-emerald-400` thay `bg-green-100/text-green-800`); empty state có icon + nút tạo bài.

**5. Trạng thái tải** — khi `simsLoading`: **skeleton** (`animate-pulse bg-muted` bo góc) cho hàng KPI + khối phân bố + vài dòng bảng, thay cho 1 dòng "Đang tải…".

### Ràng buộc kỹ thuật
- Giữ `"use client"`. Không thêm `next/metadata` (layout admin đã `robots noindex`).
- Chỉ dùng lib có sẵn: `lucide-react`, `sonner`, `@/components/ui/*` (`Button`, `Badge`…). **KHÔNG thêm dependency mới** (không recharts — bar tự vẽ bằng `div` width %).
- Responsive: mobile 1–2 cột, desktop như bảng trên; kiểm 375px và 1280px.
- Số kiểu Việt: `.toLocaleString("vi-VN")`, tiền qua `formatPrice` / `formatCompactVnd`.
- A11y: nút chỉ-icon có `aria-label`; thanh bar có `title` mô tả count.

### Xong việc thì
1. `npm run build` phải **xanh** (bắt buộc).
2. `npm run dev`, đăng nhập `/admin`, vào `/admin/dashboard` xem KPI + bar + "Làm mới kho" chạy, không lỗi console.
3. Commit + push `main` (Vercel `sim-sanctuary-23` tự deploy).
4. Đánh dấu Task 1 = ✅ trong file này + báo lại ngắn gọn đã đổi gì.

### Checklist tự kiểm
- [x] 6 KPI card đúng số (tổng SIM khớp con số trang chủ đang bán).
- [x] "Làm mới kho" gọi `forceReload`, icon xoay khi tải.
- [x] 3 khối bar list có fill theo %; Mobifone tô đỏ.
- [x] Bảng bài viết vẫn sửa/xoá được; badge không chói trên nền đen.
- [x] Có skeleton lúc tải; không còn `<ul>` phẳng trơ.
- [x] `npm run build` xanh; mobile 375px không tràn ngang.

---

# 🚀 CHIẾN DỊCH "GREAT AGAIN" — Giai đoạn 0: Vá xô + gắn đồng hồ (trước khi bật Ads)

> **Bối cảnh chiến lược (Claude + chủ dự án chốt 24/08):** North Star = **lead Zalo/gọi chất lượng/tháng**. Web hiện **gần như chưa có khách**; chủ dự án **sẵn sàng chi Ads (Google/FB)** + có kênh **Facebook + TikTok**. Kế hoạch chạy 2 đồng hồ song song: (A) bật Ads/social kéo khách nhanh, (B) dựng SEO programmatic gặt về sau. **NHƯNG** trước khi tiêu đồng Ads nào phải xong Giai đoạn 0 này — nếu không sẽ "đổ nước vào xô thủng, lại còn bịt mắt".
>
> **Phát hiện chí mạng khi audit hệ đo (đã verify trong source):** tín hiệu "lead" (click Zalo/gọi/messenger) hiện chỉ ghi vào **bảng Supabase `conversion_clicks`** — nơi **Google Ads KHÔNG đọc được**. Đồng thời event GA4 bị chắp vá: **chỉ `FloatingContactButtons` (desktop) mới bắn** `click_zalo`/`call_click`, còn **`StickyCtaBottomBar` (kênh liên hệ duy nhất trên mobile) KHÔNG bắn GA4**. → Nếu bật Ads bây giờ, Google Ads mù, không tối ưu được về lead.
>
> **Thứ tự làm:** **Task 2 (P0, chặn Ads) → Task 3 (P1) → Task 4 & 5 (P1, spec chi tiết vòng sau).** Làm xong Task nào đánh ✅, đừng xoá.
>
> **Hiện trạng đã xác minh (để khỏi phá):**
> - GA4 `G-W7G7B81W6S` + GTM `GTM-MWKVVS7M` gắn ở `src/app/layout.tsx` (`strategy="beforeInteractive"`).
> - `useConversionTracker` (`src/hooks/useConversionTracker.ts`) + `usePageVisitTracker` đã **mount sống** trong `src/app/providers.tsx`. Listener conversion chạy **capture-phase**, bắt **mọi** click liên hệ toàn site qua selector `a[href^='tel:'] , a[href^='https://zalo.me'] , [data-conversion]` → phủ cả floating desktop, sticky mobile, ZaloChatCard, popup. Có throttle 5s/loại.
> - `window.gtag` đã có type ở `src/global.d.ts` (optional, phải guard `?.`).
> - Bảng Supabase: `conversion_clicks(type,path,source,user_agent,clicked_at)` + `page_visits(path,referrer,source,user_agent,visited_at)`. RLS: anon INSERT `with check (true)` (thêm cột KHÔNG phá policy), chỉ admin SELECT. Migration ở `supabase/migrations/`.
> - Dashboard admin đã đọc lead: `ConversionsSection` (theo loại + %) & `PageVisitsSection` ("khách đến từ đâu").

---

## Task 2 — ✅ ĐÃ LÀM · [P0 · CHẶN ADS] Thống nhất tín hiệu lead → 1 event GA4 `generate_lead` cho MỌI click liên hệ

**Mục tiêu:** một nguồn sự thật duy nhất cho "lead", bắn từ **mọi** nút (desktop + mobile), để đánh dấu Key event trong GA4 và import sang Google Ads. Bỏ event chắp vá đang double-count trên desktop.

### Sửa file
1. **`src/hooks/useConversionTracker.ts`** — trong `onClick`, **sau** khi đã xác định `type` và qua throttle (ngay trước/cạnh chỗ `supabase.from("conversion_clicks").insert(...)`), thêm:
   ```ts
   window.gtag?.("event", "generate_lead", {
     method: type,          // 'zalo' | 'call' | 'messenger'
     lead_source: source,   // kết quả classifySource(document.referrer)
     page_path: path,
   });
   ```
   Giữ nguyên throttle 5s (để GA4 không double-count double-click), giữ nguyên insert Supabase, giữ capture-phase.
2. **`src/components/FloatingContactButtons.tsx`** — **XOÁ** 2 khối `window.gtag?.("event", "call_click", …)` (trong `onClick` nút CALL) và `window.gtag?.("event", "click_zalo", …)` (trong `onClick` nút ZALO). Lý do: listener trung tâm giờ bắn thay; giữ lại sẽ **đếm gấp đôi** trên desktop. Giữ nguyên `href`, `aria-label`, và `handleOpenMessengerChat` (nút messenger vẫn có `data-conversion="messenger"` để listener bắt).

### Ràng buộc
- Tên event **chính xác** là `generate_lead` (event chuẩn GA4 cho lead), param `method` phân kênh. Đừng đổi tên.
- Không thêm dependency. Không đụng bảng/RLS/Supabase ở task này.
- `window.gtag?.` phải guard (ad-blocker có thể chặn gtag).

### Nghiệm thu
1. `npm run build` **xanh**.
2. `npm run dev`, bật GA4 DebugView (hoặc GTM Preview). Bấm **Zalo / Gọi / Messenger** trên **desktop** (nút floating) và **mobile** (sticky bar — dùng devtools responsive 375px): mỗi lần đúng **1** event `generate_lead` với `method` đúng. **Không** còn `click_zalo`/`call_click` cũ.
3. Bảng `conversion_clicks` vẫn ghi bình thường (kiểm ở `/admin/dashboard` mục "Chuyển đổi").
4. Bấm nhanh 2 lần < 5s → chỉ 1 event (throttle).
5. Commit + push `main` → Vercel `sim-sanctuary-23` deploy. Đánh dấu Task 2 = ✅ + báo đã đổi gì.

### Bước cấu hình của CHỦ DỰ ÁN (không phải code — Claude sẽ hướng dẫn từng bước sau khi deploy)
- GA4 → Admin → Events → đánh dấu `generate_lead` là **Key event**.
- Link **Google Ads ↔ GA4**, import `generate_lead` làm **conversion action**, đặt làm mục tiêu tối ưu chiến dịch.

---

## Task 3 — ✅ ĐÃ LÀM · [P1] Bắt UTM + gclid/fbclid vào lead & lượt xem (để dashboard biết campaign nào ra lead)

**Mục tiêu:** attribution nội bộ đang chỉ dựa `document.referrer` → khách Ads (đến với `?gclid=…`, không referrer) bị đếm nhầm "direct". Task này lưu UTM/gclid để **dashboard admin** cho chủ dự án thấy "lead này từ campaign nào" ngay trên web. **KHÔNG chặn việc chạy Ads** (GA4 đã tự bắt gclid/utm cho attribution của Ads) — nên P1.

### Việc
1. **Migration mới** `supabase/migrations/<ngày>_tracking_utm.sql` — additive cho **cả 2 bảng** `conversion_clicks` và `page_visits`:
   ```sql
   alter table public.conversion_clicks
     add column if not exists utm_source text,
     add column if not exists utm_medium text,
     add column if not exists utm_campaign text,
     add column if not exists utm_term text,
     add column if not exists utm_content text,
     add column if not exists gclid text,
     add column if not exists fbclid text;
   -- lặp lại y hệt cho public.page_visits
   ```
   Không đụng RLS (anon insert `check(true)` đã cho phép mọi cột). **Nếu opencode không có quyền `supabase db push`**, để nguyên file migration + ghi rõ trong báo cáo để chủ dự án dán vào Supabase SQL Editor chạy.
2. **Cập nhật types** `src/integrations/supabase/types.ts` — thêm 7 cột mới (nullable) vào `conversion_clicks` & `page_visits` (regen hoặc sửa tay), để TS không đỏ.
3. **Util mới** `src/lib/attribution.ts` (server-safe, guard `typeof window`):
   - `captureAttribution()`: đọc `URLSearchParams` từ `window.location.search`; nếu có bất kỳ `utm_*`/`gclid`/`fbclid` → lưu `sessionStorage['attr']` **first-touch** (chỉ set nếu key chưa tồn tại trong session, để internal nav sau không ghi đè nguồn gốc).
   - `getAttribution(): Record<string,string|null>` đọc lại (rỗng nếu không có / SSR).
4. **Wire:**
   - Gọi `captureAttribution()` một lần lúc vào — trong `src/app/providers.tsx` hoặc effect đầu của `usePageVisitTracker`.
   - `useConversionTracker` + `usePageVisitTracker`: spread `...getAttribution()` vào payload `.insert(...)`.
   - (Tuỳ) kèm `...getAttribution()` vào params event `generate_lead` của Task 2.

### Nghiệm thu
1. Migration chạy được; 7 cột xuất hiện ở cả 2 bảng.
2. Mở `/?utm_source=google&utm_medium=cpc&utm_campaign=than-tai&gclid=TESTgclid` → bấm Zalo → row `conversion_clicks` có `utm_source=google`, `utm_campaign=than-tai`, `gclid=TESTgclid`.
3. Điều hướng nội bộ sang trang khác rồi bấm Zalo lại → **vẫn giữ** campaign gốc (first-touch).
4. `npm run build` **xanh**. Commit + push. Đánh dấu ✅.

---

## Task 4 — ✅ ĐÃ LÀM · [P1 · làm TRƯỚC khi bật Ads] Dựng 3 component tái dùng: cam kết + bằng chứng + CTA nhắc-lại

**Mục tiêu:** khách lạ từ Ads chỉ bấm Zalo/gọi khi TIN. Dựng sẵn 3 component để Task 5 gắn vào các trang đích (thay vì sửa lẻ). **Chỉ tạo component, chưa gắn vào trang** (Task 5 mới gắn).

**Hằng số liên hệ dùng chung** (bám repo): `ZALO_URL = "https://zalo.me/0933356666"`, `CALL = "tel:+84938868868"`. Lưu ý: mọi thẻ `<a href="tel:…">` hoặc `href="https://zalo.me…">` **tự động bắn `generate_lead`** qua listener toàn cục (`useConversionTracker`) — KHÔNG cần thêm onClick tracking.

### 1. `src/components/TrustCommitments.tsx` (Server Component, không cần "use client")
Khối "Cam kết khi mua" — 5 cam kết xoá rủi ro, mỗi cái: icon `lucide-react` + tiêu đề đậm + 1 dòng mô tả. **Thứ tự đúng như dưới** (cái xoá rủi ro mạnh nhất lên đầu):
1. `ShieldCheck` — **Nhận SIM, kiểm tra rồi mới trả tiền** · "Ship COD nội thành: cầm SIM, kích hoạt thử rồi mới thanh toán."
2. `BadgeCheck` — **Sang tên chính chủ 100%** · "Hỗ trợ sang tên qua cửa hàng MobiFone / app My MobiFone."
3. `Tag` — **Giá niêm yết công khai** · "Giá hiện ngay trên số — không phí ẩn, không hét giá."
4. `Truck` — **Giao nhanh toàn quốc** · "Nội thành HCM 30 phút–2 giờ; tỉnh khác 1–3 ngày."
5. `RefreshCw` — **Đổi/hoàn nếu SIM lỗi** · "SIM không kích hoạt được → đổi số khác hoặc hoàn tiền."

- Bọc card `rounded-xl border border-border bg-card p-6 shadow-card md:p-8`, tiêu đề `<h2>` kiểu các section sẵn có (thanh `bg-primary` + text-primary). Grid `sm:grid-cols-2 lg:grid-cols-3`, mỗi item icon trong ô `bg-primary/10 rounded-lg`, tiêu đề `text-foreground font-semibold`, mô tả `text-sm text-muted-foreground`.
- Prop `title?: string` (mặc định "Cam kết khi mua tại CHONSOMOBIFONE.COM").

### 2. `src/components/CustomerProof.tsx` + `src/data/testimonials.ts`
- `src/data/testimonials.ts`:
  ```ts
  export interface Testimonial { quote: string; author: string; role?: string; image?: string; } // image = đường dẫn trong /public, vd "/proof/kh1.jpg"
  // CHỦ DỰ ÁN điền feedback THẬT vào đây (ảnh bỏ vào /public/proof/). Để trống → khối tự ẩn, KHÔNG bịa proof.
  export const TESTIMONIALS: Testimonial[] = [];
  ```
- `CustomerProof.tsx` (Server Component): nếu `TESTIMONIALS.length === 0` → `return null` (không hiện khối rỗng, TUYỆT ĐỐI không bịa review). Nếu có → section "Khách hàng nói gì" grid card: quote + author (+ role); nếu có `image` thì `<img src={t.image} loading="lazy" …>` (không dùng next/image để khỏi cấu hình). Style card đồng bộ web.

### 3. `src/components/LeadMagnetCta.tsx` (Server Component)
Băng CTA nhắc-lại (đặt ngay sau lưới kho ở Task 5): 
- Tiêu đề (prop `title`, mặc định "Chưa tìm được số ưng ý?") + phụ (prop `subtitle`, mặc định "Nhắn Zalo, tụi mình lọc số theo tuổi, mệnh & ngân sách của bạn trong 5 phút.").
- 2 nút: **Chat Zalo chọn số** (`ZALO_URL`, `target="_blank" rel="noopener noreferrer"`, icon `MessageCircle`, nền `bg-gold text-header-bg`) và **Gọi tư vấn** (`CALL`, icon `Phone`, viền).
- Băng nổi bật: nền `bg-gradient-to-b from-primary to-primary-dark text-primary-foreground` `rounded-xl p-6 md:p-8`, canh giữa.

### Ràng buộc & Xong việc
- **Không thêm dependency.** Dark theme, bám token (`--primary`, `--gold`, `--card`, `--border`). Responsive 375/1280.
- `npm run build` **xanh**. Commit + push. Cập nhật `roadmap.ts` T4 (title giữ, `status: "done"`, `updated`) + đánh dấu Task 4 = ✅.

---

## Task 5 — ✅ ĐÃ LÀM · [P1 · làm TRƯỚC khi bật Ads] Gắn component vào 3 trang đích Ads + Facebook Pixel

**Mục tiêu:** 3 trang đích Ads chốt được lead. Trang đích theo chiến thuật Ads đã chốt: **nhóm A phong thuỷ–tài lộc → `sim-than-tai`, `sim-loc-phat`** · **nhóm B đầu số → `sim-dau-so/[dauso]`**. (Phụ thuộc Task 4 xong trước.)

### 1. Gắn component (dùng 3 component từ Task 4)
- **`src/app/sim-than-tai/page.tsx`** và **`src/app/sim-loc-phat/page.tsx`**:
  - Thêm `<LeadMagnetCta />` **ngay sau `<CategorySimGrid … />`** (đúng lúc khách vừa xem kho mà chưa ưng → mời nhắn Zalo).
  - Thêm `<CustomerProof />` sau khối "Giá…" / trước FAQ.
  - **Thay** khối niềm tin inline (mảng `benefits` + section render `benefits.map`) bằng `<TrustCommitments />` (mạnh hơn, đỡ trùng). Xoá luôn mảng `benefits` + import icon thừa.
- **`src/app/sim-dau-so/[dauso]/page.tsx`** (đang MỎNG — nâng lên ngang than-tai):
  - **Bổ sung** `<TrustCommitments />`, `<CustomerProof />`, `<LeadMagnetCta />` (sau `<CategorySimGrid />`).
  - Thêm khối **FAQ ngắn 3 câu** (giá đầu số / sang tên chính chủ / thời gian giao) kèm JSON-LD `FAQPage` — tái dùng đúng mẫu accordion + `faqJsonLd` như `sim-than-tai`, đổi nội dung theo `{dauso}`.

### 2. Facebook Pixel (base, gated env — inert khi chưa set)
- Tạo `src/components/FacebookPixel.tsx`: đọc `process.env.NEXT_PUBLIC_FB_PIXEL_ID`; nếu có → chèn base pixel chuẩn qua `next/script` (`strategy="afterInteractive"`) + `<noscript><img …/></noscript>`; nếu không → `return null`.
- Thêm `<FacebookPixel />` vào `src/app/layout.tsx` (cạnh khối GA4).
- Thêm dòng `NEXT_PUBLIC_FB_PIXEL_ID=` vào `.env.example` (comment: chủ dự án set giá trị trong Vercel env khi chạy FB Ads).

### 3. Bắn `Lead` về Facebook Pixel (parity với generate_lead)
- Trong `src/hooks/useConversionTracker.ts`, ngay cạnh dòng `window.gtag?.("event","generate_lead",…)` đã có, thêm (guard): `window.fbq?.("track", "Lead", { content_name: type });`
- Thêm khai báo `fbq?: (...args: unknown[]) => void;` vào `Window` trong `src/global.d.ts`.

### Ràng buộc & Nghiệm thu
- **Không thêm dependency.** Giữ mọi trang SSG (Server Component), ảnh proof `loading="lazy"` — không làm nặng mobile.
- `npm run build` **xanh**.
- 3 trang đích: có khối cam kết + CTA nhắc-lại sau kho; `sim-dau-so` không còn "mỏng" (có cam kết + FAQ). `CustomerProof` ẩn khi `TESTIMONIALS` rỗng (đúng — chưa bịa).
- Set thử `NEXT_PUBLIC_FB_PIXEL_ID` → có script pixel; bấm Zalo → Network có request `facebook.com/tr` (fbq Lead) + GA4 vẫn có `generate_lead`.
- Commit + push. Cập nhật `roadmap.ts` T5 `status: "done"` + `updated`; đánh dấu Task 5 = ✅.

> **Việc của CHỦ DỰ ÁN (không phải code):** (a) điền feedback thật vào `src/data/testimonials.ts` + bỏ ảnh vào `/public/proof/` để kích hoạt khối bằng chứng; (b) khi chạy FB Ads thì tạo Pixel, lấy ID set vào Vercel env `NEXT_PUBLIC_FB_PIXEL_ID`.

---

## Task 6 — ✅ ĐÃ LÀM · [P1] Trang tiến độ "Dự án — Make Mobi Great Again" trong `/admin` (read-only)

**Bối cảnh:** chủ dự án muốn mở admin ra là thấy cả chiến dịch đang ở đâu, làm gì tiếp — một "trí nhớ sống". Đã chốt kiểu **read-only, opencode tự cập nhật** (không DB). Nguồn sự thật là **một file dữ liệu trong repo**; mỗi khi opencode xong/bắt đầu một task thì cập nhật file đó.

### 🔴 QUY TẮC ĐỨNG (áp dụng từ nay cho MỌI task, không chỉ task này)
> Mỗi khi làm xong / đổi trạng thái bất kỳ Task nào trong file này, **cập nhật luôn `src/data/roadmap.ts`** (đổi `status`, `updated`, `next`) **trong cùng commit**. Đây là cách trang tiến độ luôn khớp thực tế.

### Việc
1. **Tạo `src/data/roadmap.ts`** — nguồn dữ liệu duy nhất cho trang. Kiểu dữ liệu + nội dung khởi tạo (transcribe đúng, cập nhật status theo thực tế hiện tại):
   ```ts
   export type TaskStatus = "done" | "doing" | "todo";
   export interface RoadmapTask { id: string; title: string; status: TaskStatus; priority?: "P0" | "P1" | "P2"; next?: string; updated?: string; }
   export interface RoadmapPhase { id: string; title: string; goal: string; tasks: RoadmapTask[]; }

   export const NORTH_STAR = "Bán được hàng — biến web thành máy ra lead Zalo/gọi";
   export const PILLARS = [
     { name: "Website", note: "chốt lead + SEO organic" },
     { name: "YouTube", note: "nội dung & traffic bền" },
     { name: "Ads", note: "tăng tốc có lead ngay" },
   ];

   export const ROADMAP: RoadmapPhase[] = [
     { id: "GĐ0", title: "Vá xô + gắn đồng hồ", goal: "Web sẵn sàng chốt lead + đo được trước khi bật Ads", tasks: [
       { id: "T1", title: "Làm lại Dashboard quản trị", status: "done", updated: "2026-08-24" },
       { id: "T2", title: "Thống nhất event GA4 generate_lead", status: "todo", priority: "P0", next: "Chặn Ads — làm trước tiên" },
       { id: "T3", title: "Bắt UTM + gclid vào lead", status: "todo", priority: "P1", next: "Dashboard biết campaign nào ra lead" },
       { id: "T4", title: "Vá CTA + lớp niềm tin trên landing", status: "todo", priority: "P1", next: "Chờ ảnh feedback thật + data đầu" },
       { id: "T5", title: "2–3 trang đích đón Ads + FB Pixel", status: "todo", priority: "P1", next: "Chờ bàn từ khoá + ngân sách" },
       { id: "T6", title: "Trang tiến độ Dự án trong admin", status: "doing", updated: "2026-08-24" },
     ]},
     { id: "GĐ1", title: "Bật vòi traffic (Ads + Social)", goal: "Có lead Zalo/gọi ngay trong 90 ngày", tasks: [
       { id: "G1-ads", title: "Google Search Ads từ khoá mua-ngay", status: "todo", next: "Sau khi GA4→Ads nối xong" },
       { id: "G1-social", title: "Đăng số đẹp FB + video TikTok", status: "todo" },
     ]},
     { id: "GĐ2", title: "Khoan giếng: SEO + YouTube", goal: "Khách miễn phí từ Google & YouTube, gặt từ tháng 4+", tasks: [
       { id: "G2-seo", title: "Trang tự sinh: đầu số / ý nghĩa số / loại số / hợp tuổi", status: "todo" },
       { id: "G2-yt", title: "Video YouTube ý nghĩa sim + nhúng lên web", status: "todo" },
     ]},
     { id: "GĐ3", title: "Vòng lặp tối ưu", goal: "Nhân cái ra lead, cắt cái đốt tiền — chi phí/lead giảm dần", tasks: [
       { id: "G3-loop", title: "Đọc số liệu mỗi tuần, điều chỉnh", status: "todo" },
     ]},
   ];
   ```
2. **Tạo trang `src/app/admin/du-an/page.tsx`** (`"use client"`; admin layout đã có `RequireAdmin` + `robots noindex`, không thêm metadata). Render từ `ROADMAP`:
   - **Header chiến dịch:** tiêu đề "Make Mobi Great Again", dòng North Star, 3 chip cột trụ (Website/YouTube/Ads + note).
   - **Tiến độ tổng:** 1 thanh % = tổng task `done` / tổng task (tất cả phase).
   - **Mỗi phase = 1 card:** tiêu đề `id + title`, dòng `goal`, thanh % của riêng phase (done/total), rồi danh sách task.
   - **Mỗi task = 1 dòng:** badge trạng thái (✅ Xong `bg-emerald-500/15 text-emerald-400` · 🔨 Đang làm `bg-amber-500/15 text-amber-400` · ⏳ Chờ `bg-muted text-muted-foreground`), chip `priority` nếu có (P0 đỏ `bg-primary/15 text-primary`), tiêu đề, dòng phụ `next` (nếu có, `text-muted-foreground text-xs`), ngày `updated` bên phải.
3. **Link vào từ dashboard:** ở `src/app/admin/dashboard/page.tsx` thêm 1 nút/card "📋 Dự án — Make Mobi Great Again" trỏ `/admin/du-an` (đặt ở header khu hoặc hàng KPI, tái dùng style card sẵn có). Không phá layout Task 1.

### Ràng buộc
- Dark theme, bám token web (`--primary` đỏ Mobifone, `--gold` vàng, `--card`, `--border`). **Không thêm dependency** — icon `lucide-react`, thanh % tự vẽ bằng `div` width như `BarList` của Task 1.
- Thuần đọc từ `roadmap.ts`, **không** DB, không auth mới (đã bọc trong admin).
- Responsive 375px & 1280px; số/ngày kiểu Việt.

### Nghiệm thu
1. `npm run build` **xanh**.
2. Đăng nhập `/admin` → vào `/admin/du-an`: thấy header chiến dịch + 3 cột trụ, tiến độ tổng, 4 phase với % và task đúng trạng thái (T1 = Xong, T2 = Chờ/P0, T6 = Đang làm → đổi thành Xong khi commit).
3. Từ `/admin/dashboard` bấm được sang trang Dự án.
4. Commit + push `main`. Đổi T6 trong `roadmap.ts` sang `done` + đánh dấu Task 6 = ✅ trong file này.

---

## Task 7 — ✅ ĐÃ LÀM · [P0 nhanh] Đổi mã GA4 sang property mới `G-QGN17FVXPG`

**Bối cảnh:** chủ dự án đã tạo GA4 property mới cho chonsomobifone (Measurement ID **`G-QGN17FVXPG`**, Stream ID 15493718398). Web đang trỏ vào mã CŨ `G-W7G7B81W6S` → dữ liệu (gồm `generate_lead`) vẫn chảy vào property cũ. Đổi sang mã mới để lead chảy về property A Khoa toàn quyền, rồi mới đánh dấu Key event + nối Ads.

### Việc — chỉ 1 file
- **Sửa `src/app/layout.tsx`**: thay chuỗi `G-W7G7B81W6S` → `G-QGN17FVXPG` ở **đúng 2 chỗ**:
  1. `src="https://www.googletagmanager.com/gtag/js?id=G-W7G7B81W6S"` (thẻ `ga4-src`).
  2. `gtag('config', 'G-W7G7B81W6S')` (thẻ `ga4-init`).
- **GIỮ NGUYÊN** container GTM `GTM-MWKVVS7M` (2 chỗ còn lại) — KHÔNG đụng.
- Không đụng file/logic nào khác. `generate_lead` bắn qua `window.gtag` nên tự chảy về mã mới sau khi đổi.

### Nghiệm thu
1. `npm run build` **xanh**.
2. View-source trang chủ (sau deploy) có `gtag/js?id=G-QGN17FVXPG` và `gtag('config', 'G-QGN17FVXPG')`; **không còn** `G-W7G7B81W6S`.
3. Commit + push `main`. Đánh dấu Task 7 = ✅. (Fix ops nhỏ — không cần đổi `roadmap.ts`.)

---

## Task 8 — ✅ ĐÃ LÀM · [GĐ2 SEO] Trang tự sinh combo "sim [loại] × đầu số" (an toàn, ý định mua cao)

**Bối cảnh:** khởi động cỗ máy SEO (nguồn khách free lớn nhất). Bắt đầu bằng set **an toàn, không dính rủi ro phong thủy**: cross **loại số × đầu số** → hàng chục trang bắt truy vấn thương mại kiểu *"sim thần tài 090"*, *"sim lộc phát 093"*. Tái dùng 100% bộ lọc + component sẵn có, không phịa logic mới.
> ⚠️ KHÔNG làm set "sim hợp tuổi theo NĂM SINH" ở task này — cần bảng nạp âm (năm→mệnh) đã kiểm chứng, chủ dự án sẽ cấp sau. Auto-sinh bảng đó dễ sai → mất uy tín với dân phong thủy.

### Việc — 1 route tự sinh + sitemap
- **Tạo `src/app/sim-dau-so/[dauso]/[loai]/page.tsx`** (Server Component, SSG — mirror cấu trúc `src/app/sim-than-tai/page.tsx`).
- **Dữ liệu (khai báo trong file):**
  ```ts
  const PREFIXES = ["090","093","070","076","077","078","079","089"] as const; // khớp trang đầu số hiện có
  const LOAI = {
    "than-tai": { label: "thần tài", suffixes: ["39","79"], y: "đuôi 39 (thần tài nhỏ), 79 (thần tài lớn) — cầu tài lộc, buôn may bán đắt" },
    "loc-phat": { label: "lộc phát", suffixes: ["68","86"], y: "đuôi 68 (lộc phát), 86 (phát lộc) — cầu phát đạt" },
    "ong-dia":  { label: "ông địa", suffixes: ["38","78"], y: "đuôi 38, 78 — ông địa, giữ của" },
  } as const;
  ```
- **`generateStaticParams`**: `PREFIXES × Object.keys(LOAI)` = 24 trang, trả `{ dauso, loai }`.
- **`generateMetadata`**: title `Sim ${label} đầu số ${dauso} Mobifone | Giá tốt, chính chủ`, description theo combo, `alternates.canonical = /sim-dau-so/${dauso}/${loai}`, og:image `/share-banner.png?v=999`. Validate `dauso∈PREFIXES && loai∈LOAI`, sai → `notFound()` (đừng render trang rỗng).
- **Nội dung trang (bám mẫu than-tai):**
  - Hero: H1 `Sim ${label} đầu số ${dauso} Mobifone`, phụ đề dùng `LOAI[loai].y`, 2 nút: `#kho-sim` (gold) + Zalo `https://zalo.me/0933356666`.
  - `SimSnapshot` (server): `getCategorySnapshot({ prefixes:[dauso], suffixes: LOAI[loai].suffixes }, 8)` — hàm này ĐÃ hỗ trợ lọc kết hợp (xem `src/lib/serverSimData.ts`).
  - `CategorySimGrid` (client island) với `matchPrefixes={[dauso]}` + `matchSuffixes={LOAI[loai].suffixes}` (cả 2 filter được AND sẵn trong component).
  - `<TrustCommitments />` + `<LeadMagnetCta />` (component Task 4) — đặt cam kết trước, CTA nhắc-lại sau kho.
  - **FAQ 3 câu** (giá combo / sang tên chính chủ / thời gian giao) + JSON-LD `FAQPage` (mẫu accordion + `faqJsonLd` như than-tai), nội dung theo `${label}` + `${dauso}`.
  - Cross-links: các **loại khác cùng đầu số** (`/sim-dau-so/${dauso}/${otherLoai}`), **cùng loại các đầu số khác** (vài prefix), và link về `/sim-dau-so/${dauso}` + `/sim-${loai}`. + breadcrumb JSON-LD (`buildBreadcrumb`).
- **`src/app/sitemap.ts`**: thêm 24 URL combo theo pattern các trang đầu số hiện có.

### Ràng buộc
- **Không thêm dependency.** Tái dùng: `CategorySimGrid`, `SimSnapshot`, `getCategorySnapshot`, `TrustCommitments`, `LeadMagnetCta`, `buildBreadcrumb`, `ui/accordion`. Giữ SSG, dark theme, responsive, mobile nhanh.
- Message match: tiêu đề/H1/nội dung đúng combo `[loại] + [đầu số]`.

### Nghiệm thu
1. `npm run build` **xanh**, sinh đủ **24 trang tĩnh** `/sim-dau-so/{dauso}/{loai}`.
2. Mở thử `/sim-dau-so/090/than-tai` và `/sim-dau-so/093/loc-phat`: kho lọc đúng (số bắt đầu đúng đầu số + đuôi đúng loại), có cam kết + CTA nhắc-lại + FAQ + JSON-LD.
3. `sitemap.xml` có 24 URL mới. Combo sai (vd `/sim-dau-so/098/than-tai`, `/sim-dau-so/090/abc`) → 404.
4. Commit + push. Cập nhật `roadmap.ts`: `G2-seo` → `status: "doing"` + `next: "combo đầu số×loại xong, tiếp ý nghĩa số + hợp tuổi (chờ bảng nạp âm)"`. Đánh dấu Task 8 = ✅.

---

## Task 9 — ✅ ĐÃ LÀM · [P1 · chất lượng landing] Vá lỗi hydration React #418 toàn site

**Bối cảnh:** Claude verify trên web thật (25/08): console **prod** báo `Uncaught Minified React error #418` (hydration mismatch) trên **mọi trang landing** — reproduce ở `/sim-than-tai` (2 lần) và `/sim-dau-so/090/than-tai`. **KHÔNG phải lỗi Task 8** — lỗi có sẵn ở **tầng layout dùng chung**. Hydration mismatch khiến React **vứt HTML server render lại ở client** → layout shift (CLS) + chậm tương tác → **tụt Core Web Vitals** → **tăng CPC Google Ads (Landing Page Experience) + tụt rank SEO**. Đây là trang đích Ads/SEO đổ khách vào nên đáng vá.

### Cách làm — CHẨN ĐOÁN trước, sửa tối thiểu sau
1. **`npm run dev`**, mở `/sim-than-tai` (và 1 trang combo). Bản **dev** in **đầy đủ** lỗi #418 kèm **component stack** chỉ đúng component/thuộc tính bị lệch — đây là bước chính (prod minified không đọc được, ĐỪNG đoán mò).
2. **Nghi phạm ưu tiên (kiểm trước theo component stack):**
   - **`src/components/BuildBadge.tsx`** — `useState(readInitialVisibility)` đọc `window`/`localStorage`/URL param **ngay lúc render đầu** → SSR trả `false`, client-first-render có thể khác → mismatch. Fix chuẩn: khởi tạo state cố định (`false`), chuyển việc đọc `localStorage`/URL vào `useEffect` (SSR và client-first-render khớp).
   - **`src/app/layout.tsx`** — nếu có ThemeProvider/`next-themes` set class theo localStorage mà `<html>` thiếu `suppressHydrationWarning`.
   - Component tầng layout đọc `window`/`Date`/`Math.random`/`matchMedia` khi render đầu (StickyCtaBottomBar/`useIsMobile`, TrustBar…).
3. **Sửa tối thiểu** đúng chỗ component stack chỉ. Nguyên tắc: giá trị phụ thuộc browser → **render giống server ở lần đầu, cập nhật trong `useEffect`** (hoặc `suppressHydrationWarning` cho chỗ chủ đích khác như build/time).

### Nghiệm thu
1. `npm run dev` mở `/sim-than-tai` + `/sim-dau-so/090/than-tai` → **console KHÔNG còn React #418** (và không phát sinh warning hydration mới).
2. `npm run build` **xanh**; hành vi trang giữ nguyên (kho, CTA, generate_lead vẫn chạy).
3. Commit + push. Đánh dấu Task 9 = ✅. (Fix chất lượng — không cần đổi `roadmap.ts`.)

---

## Task 10 — ✅ ĐÃ LÀM · [P2 dọn dẹp] Xoá event GA4 cũ còn sót ở `Header.tsx` (nhất quán Task 2)

**Bối cảnh:** opencode phát hiện `src/components/Header.tsx` vẫn còn 2 khối `window.gtag?.("event","call_click"…)` và `"click_zalo"…` trong onClick nút gọi/Zalo — Task 2 mới chỉ xoá ở `FloatingContactButtons`. Listener trung tâm `useConversionTracker` ĐÃ bắn `generate_lead` cho các nút này (chúng là `tel:`/`zalo.me` anchor). → 2 event cũ là **legacy dư, KHÔNG thổi phồng conversion `generate_lead`** (số lead vẫn đúng), chỉ gây noise + double event GA4. Dọn cho đúng "một nguồn sự thật".

### Việc — 1 file
- `src/components/Header.tsx`: **xoá** 2 khối `window.gtag?.("event","call_click"…)` và `window.gtag?.("event","click_zalo"…)` trong onClick nút gọi/Zalo. Giữ nguyên `href`, `aria-label`, hành vi. Không đụng gì khác.

### Nghiệm thu
1. `npm run build` **xanh**. `grep -rn "call_click\|click_zalo" src/` → **0 kết quả** (đã sạch toàn repo).
2. Bấm nút Zalo/gọi ở Header → chỉ còn `generate_lead` bắn (qua listener), không còn event cũ.
3. Commit + push. Đánh dấu Task 10 = ✅. (Không đổi `roadmap.ts`.)

---

## Task 11 — ✅ ĐÃ LÀM · [P1] Truy nốt nguyên nhân hydration #418 CÒN SÓT (Task 9 mới vá 1 phần)

**Bối cảnh (Claude verify LIVE 25/08):** deploy `7473799`+`f226f0e` ĐÃ lên (HTML gốc từ server: TrustBar render `…<!-- --> đơn đã giao` — đúng như fix Task 9). **NHƯNG console prod VẪN báo `Uncaught Minified React error #418`** (4 lần) trên `/sim-than-tai` và trang combo. → Task 9 mới xử 1 nguyên nhân (TrustBar `useDeliveredCount`); **còn ≥1 nguồn hydration mismatch khác**, site-wide.

> ⚠️ **BÀI HỌC VERIFY:** nhìn SSR HTML ra `…` **KHÔNG đủ** để kết luận hết #418. Phải **mở trang trong TRÌNH DUYỆT và xác nhận CONSOLE sạch** (dev để đọc lỗi, rồi `next start` để xác nhận bản prod).

### Cách làm — chẩn đoán bằng console, KHÔNG đoán mò
1. **`npm run dev`** → mở `/sim-than-tai` → console dev in **đầy đủ** #418 kèm **diff** (`Server: "X"` ↔ `Client: "Y"`) + **component stack** → chỉ ĐÚNG chỗ lệch. (Nếu dev không lộ rõ: `npm run build && npx next start` rồi mở trang — lỗi prod hiện y hệt live.)
2. **Nghi phạm còn lại** (TrustBar + BuildBadge đã xử ở Task 9, đừng lặp):
   - **`toLocaleString` / `Intl` / format ngày-giờ** khác nhau giữa Node (server) và trình duyệt (client) — vd format giá/số trong một **client component** render lúc hydration.
   - **HTML nesting không hợp lệ** bị trình duyệt tự sửa (`<a>` lồng `<a>`, block-level trong `<p>`, `<button>` lồng nhau…) → DOM lệch SSR → #418. Rà `LeadMagnetCta`, `TrustCommitments`, `Header`, `Footer`, `Navigation`, `SimSnapshot`, `SIMCardNew`.
   - Component `use client` tầng layout đọc `window`/`Date`/`Math.random`/`matchMedia` khi render đầu mà Task 9 chưa rà.
3. Sửa tối thiểu đúng chỗ console chỉ.

### Nghiệm thu (BẮT BUỘC qua console trình duyệt, không phải SSR HTML)
1. Mở `/sim-than-tai` **và** `/sim-dau-so/090/than-tai` (dev hoặc `next start`) → **console 0 lỗi #418, 0 warning hydration**.
2. `npm run build` xanh; kho/CTA/generate_lead giữ nguyên.
3. Commit + push. Đánh dấu Task 11 = ✅. Deploy xong báo Claude verify lại trên live.
