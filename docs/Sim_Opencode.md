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
