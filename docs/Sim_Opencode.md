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

## Task 4 — 🕓 SPEC SAU · [P1] Rà & vá lớp CTA + niềm tin trên các landing

**Định hướng (chốt chi tiết sau khi có ảnh feedback thật từ chủ dự án + xem data đầu tiên):** mỗi landing quan trọng (`sim-than-tai`, `sim-loc-phat`, `sim-ngu-quy`, `sim-dau-so/[dauso]`, `mua-sim-gia-re`) có CTA Zalo/gọi **trong màn đầu** và **nhắc lại cuối trang**; thêm khối **cam kết** (sang tên chính chủ, COD kiểm SIM rồi trả tiền, đổi/hoàn) + khối **bằng chứng thật**. Đây là thứ quyết định khách lạ từ Ads có dám bấm Zalo. *Chưa thi công — chờ Claude spec chi tiết.*

## Task 5 — 🕓 SPEC SAU · [P1] Chuẩn hoá 2–3 trang đích đón Ads + gắn pixel Facebook

**Định hướng (chốt sau khi bàn chiến thuật Ads: nhóm từ khoá + ngân sách):** chọn 2–3 trang đích khớp intent quảng cáo (giá rẻ / thần tài–lộc phát / theo đầu số), message match với mẫu Ads, CTA màn đầu, **tải nhanh trên mobile** (< 2.5s 4G), gắn **Facebook Pixel**. *Chưa thi công — chờ Claude spec chi tiết.*

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
