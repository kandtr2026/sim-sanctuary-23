# TODO — chonsomobifone.com

> File điều hành cho dự án `chonsomobifone.com`. Agent nào vào sau đọc file này trước.
> Cập nhật: **30/08/2026**. Source: repo này (`sim-sanctuary-23`, nhánh `main`).
> Deploy: **KHÔNG auto-deploy từ git** — phải `npx vercel --prod --yes` bằng tay.
> Edge function: `npx supabase functions deploy <tên>` (deploy riêng, không đi cùng Vercel).

---

## 1. Kiểm trạng thái trong 30 giây

```bash
curl -s "https://www.chonsomobifone.com/api/admin/seo-status"
```

Trả về 3 cờ. Trạng thái lúc viết file:

| Cờ | Giá trị | Nghĩa |
|---|---|---|
| `cronSecret` | `true` | Cron `sync-sims` chạy được |
| `syncState` | `true` | Bảng `sims_sync_state` đã có |
| `gscConnected` | **`false`** | **Chưa nối Search Console — việc P0 duy nhất còn lại** |

Console cho chủ shop: **`/admin/seo`** — 21 việc, 6 nhóm, mỗi việc ghi *vì sao*, *cách làm*,
*hậu quả nếu bỏ*, *ai làm được*. Ba cờ trên tự chuyển xanh, không cần sửa code.

---

## 2. VIỆC CHỜ CHỦ DỰ ÁN (chỉ chủ shop làm được)

### 2.1. Nối Google Search Console — P0

Chặn toàn bộ việc đo lường SEO. 118 từ khoá đã sẵn sàng nhưng chưa có cột thứ hạng nào.

Cần đúng **2 giá trị** từ Google Cloud service account: `client_email` và `private_key`.
Không cần `GSC_SIM_SITE_URL` — script tự gọi `sites.list` để tìm property.

**Các bước:**
1. Google Cloud Console → tạo service account → tạo key JSON.
2. Search Console → property `chonsomobifone.com` → Cài đặt → Người dùng và quyền → thêm
   `client_email`, quyền "Bị hạn chế" là đủ.
3. Đặt 2 biến (chọn 1 trong 2 cách):

```bash
cd "E:/Claude A Khoa Processing/sim-sanctuary-23" && npx vercel env add GSC_SIM_CLIENT_EMAIL production
```

```bash
cd "E:/Claude A Khoa Processing/sim-sanctuary-23" && npx vercel env add GSC_SIM_PRIVATE_KEY production
```

Và thêm vào `.env.local` (đã bị `.gitignore` chặn) để chạy được `npm run seo:rank` từ máy:

```
GSC_SIM_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GSC_SIM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Giữ nguyên `\n` dạng chữ như trong file JSON — script tự đổi thành dòng mới khi ký.

**CẢNH BÁO cho agent:** private key dán vào chat là key coi như đã lộ (nằm trong transcript).
Nếu chủ shop đã dán, phải xoá key đó trên Google Cloud và tạo key mới.

Xong thì chạy:

```bash
cd "E:/Claude A Khoa Processing/sim-sanctuary-23" && node scripts/seo/rank-check.mjs --ngay 90
```

Property đã xác minh sẵn (2 thẻ `google-site-verification` đang sống trên site) nên Google **đã tích
luỹ số liệu** — rút ra là có lịch sử ngay, không phải chờ.

### 2.2. Khoá 2 Google Sheet — P0 an ninh

Cột giá vốn vẫn đọc được **không cần đăng nhập**:

```bash
curl -s "https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/gviz/tq?tqx=out:csv&gid=139400129&tq=select%20H%20limit%203"
```

Trả về `GIÁ THU VỀ`: 31.200.000 / 12.800.000 / 640.000. Sheet 229k cũng vậy (cột F `Giá Thu`).

**CẠM BẪY — đọc trước khi đổi:** đổi sheet sang "Bị hạn chế" là `sheet-proxy` mất quyền đọc và
**lưới SIM trắng ngay**. Phải làm ĐỦ hai bước cùng lúc:
1. Chủ shop: chia sẻ sheet cho email service account (dùng chung service account với việc 2.1).
2. Dev: cho `sheet-proxy` đọc bằng service account đó thay vì đọc ẩn danh.

Đã bịt được phần trong tầm code: `sheet-proxy` giờ chỉ cho **2 spreadsheet ID của dự án** đi qua
(commit `145fe92`) — trước đó ai cũng dùng được proxy của shop để tải bất kỳ Google Sheet nào.
Việc này **không** che cột giá vốn.

---

## 3. VIỆC KỸ THUẬT CÒN LẠI (dev làm được, chưa làm)

| # | Việc | Chỗ | Vì sao đáng làm |
|---|---|---|---|
| 3.1 | Đếm facet bằng SQL thay vì crawl 49k hàng | `src/app/api/sims/route.ts` (`includeFacets=1`) | Lần gọi lạnh từng treo ~46s → sidebar không có số đếm |
| 3.2 | `/dinh-gia-sim` giảm payload 2,1 MB | `src/lib/simInventorySheet.ts` | Projection đã hết đường; phải query theo dải giá/dạng số của chính số khách tra thay vì tải cả kho |
| 3.3 | Xếp hạng "SIM tương tự" | `src/app/dinh-gia-sim/DinhGiaSimTool.tsx` | Đã lấy ±50% quanh mức tham khảo, nhưng số không có nhãn nào thì mọi ứng viên cùng điểm → thứ tự là thứ tự sheet |
| 3.4 | Dọn dòng có trong DB mà không còn trong sheet | `supabase/functions/sync-sims` | Chưa bao giờ được dọn; cần chủ shop quyết vì là xoá dữ liệu |
| 3.5 | Chuẩn hoá văn phong 158 bài blog trong Supabase | bảng `blog_posts` | Sửa qua `/admin/posts` hoặc SQL — không sửa được trong repo |
| 3.6 | Quẻ 55 `hexagrams.ts` ghi "có có thành công" | `src/lib/hexagrams.ts:69` | Không rõ ý gốc, cần chủ shop đối chiếu bản tra cứu |
| 3.7 | `admin/SalesChart` fetch SIM_SOLD đầy đủ | `src/components/admin/SalesChart.tsx` | Ở `/admin` nên giá vốn là dữ liệu hợp lệ; chỉ là chưa qua proxy |

---

## 4. CẠM BẪY — đọc trước khi sửa bất cứ gì

Đây là phần giá trị nhất của file. Mỗi dòng là một lỗi đã thật sự xảy ra.

**`wc -m` trong shell máy này đếm BYTE với UTF-8 tiếng Việt**, nên mọi dấu thanh bị tính 2–3 lần.
Tôi đã cắt ngắn nhiều title vì tưởng chúng 61–80 ký tự trong khi thật ra 45–54. Đo độ dài chữ Việt
bằng Python/Node, đừng dùng `wc -m`.

**Đừng đọc `process.env.NEXT_PUBLIC_SUPABASE_*`** — hai biến đó KHÔNG tồn tại trên Vercel, repo để
giá trị mặc định trong `src/integrations/supabase/config.ts`. Đọc env trực tiếp là hàm luôn thoát sớm
(đúng lỗi đã làm `/api/admin/seo-status` luôn báo sai).

**Sổ migration lệch KHÔNG suy ra được là bảng thiếu.** `20260828120000` không có trong sổ remote
nhưng bảng `tiktok_tokens` vẫn tồn tại. Kiểm bằng PostgREST, đừng suy từ `supabase migration list`.

**KHÔNG chạy `supabase db push`.** Nó sẽ chạy 4 migration, trong đó `20260828120000_tiktok_tokens`
có `create policy` mà không `drop policy if exists` → lỗi giữa đường, và nó đứng TRƯỚC migration
mình cần. Chạy migration bằng cách dán SQL vào SQL Editor trên dashboard.

**Trong `or=(...)` PostgREST đòi cú pháp DẤU CHẤM** (`col.op.value`). Dạng `=` trả 400 PGRST100 rồi
rơi âm thầm về lọc in-memory quét 49k hàng — kết quả vẫn đúng nên không ai thấy, chỉ đắt.

**Radix `AccordionContent` chỉ đưa nội dung vào DOM khi mở** → FAQPage schema khai câu trả lời không
tồn tại (rủi ro manual action). Dùng `src/components/FaqAccordion.tsx` (`<details>`) cho mọi FAQ mới.

**`sims.status` có BỐN giá trị** (`available | sold | reserved | ẩn`). Lọc bằng `status=eq.available`
(hằng `SELLABLE_STATUS`), đừng dùng `neq.sold`.

**`repo này KHÔNG auto-deploy`** và **có agent khác đẩy commit song song** (blog-bot). Luôn
`git fetch` + `git rebase origin/main` trước khi push; đừng force.

**Commit message ghi "còn lại: X" là trạng thái LÚC VIẾT.** Grep code trước khi đưa một việc vào
danh sách nợ — tôi đã báo sai 3 lần vì đọc lại commit message của chính mình.

---

## 5. ĐÃ XONG (28–30/08/2026)

**138 file, +13.547 / −2.190 dòng.** `tsc` sạch · **152 test** pass · build **290 trang tĩnh**.

### Văn phong
- `9381de4` 54 file sang giọng "Quý khách" (xưng hô sai 224 → 10, cụm AI-typical 13 → 0). Blog-bot có
  cửa chặn không cho đăng bài gọi khách là "bạn".
- `c56a540` kịch bản Zalo + nội dung social sang "Anh/Chị"; sửa 2 chỗ lệch dữ kiện (hứa "kích hoạt
  thử", và bài quảng cáo tứ quý 8888 khi kho chỉ còn 4 số).

### Giá & đơn hàng
- `7bdee82` + `bef70b6` SIM đã bán / đã ẩn thôi đặt mua được (302 số ẩn bị loại khỏi kho).
- `c2969be` ticker trang chủ thôi in **giá vốn** làm giá bán (0779.619.**22: 1.500.000 → 2.000.000đ).
  Payload 14,1 MB → 2,8 KB.
- `e71561a` `/dinh-gia-sim` thôi tải 5,6 MB Sheet1 thô, hết dòng rác, thôi báo giá 2.257 SIM đã bán.
- `7f4d782` xoá hàm bịa giá bằng `Math.random()`; sửa `or=()`; thêm TTL cache.
- `3bdfe94` bảng tứ quý thôi làm tròn lên; badge "Giảm 1 triệu" cho khoản giảm 500k; SIM trắng giá
  thôi hiện form đặt hàng.
- `d42589a` nhãn gói cước theo từng SIM (chỉ 5% kho là TK179 nhưng mọi thẻ từng in TK179).
- `fb4e5ef` nối lại khối khuyến mãi — `originalPrice` đi theo chính SIM, chỉ có giá trị khi thật sự
  cao hơn giá bán.
- `5fab54a` `sync-sims` so vân tay nội dung thay vì số dòng; siết parse giá; ghi `tags`/`beauty_score`.

### SEO
- `1edb36d` **96 trang programmatic mới**: `/sim-hop-tuoi/[nam]` 61 trang, `/sim-hop-menh/[hanh]` 5,
  đầu số 4 chữ số 26 + 66 combo, 7 trang dạng số, 4 trang dải giá. Sitemap 119 → 288 URL.
- `35185a2` hub năm sinh vào sitemap; breadcrumb thôi trùng URL; 38 trang năm sinh có Product schema.
- `09f4acf` tách ý định: `/sim-phong-thuy` giữ "hợp tuổi", `/sim-nam-sinh` chỉ nhắm "số chứa đúng năm
  sinh"; hết hàng thì dẫn khách sang công cụ phong thủy (điền sẵn ngày sinh qua `?nam=&ngay=&thang=`).
- `858d336` FAQ schema: 26 trang thôi khai câu trả lời không có trong DOM.
- `2b64a10` + `b091009` công cụ đo thứ hạng (`npm run seo:rank`) + 118 từ khoá.
- `145fe92` `sheet-proxy` siết theo spreadsheet ID.
- `23b55f6` TTL cho cache kho 229k; sửa check migration luôn báo sai.

---

## 6. Mốc cần theo

Cron `sync-sims`: **`17 1,13 * * *` (UTC)** = 08:17 và 20:17 giờ VN. `CRON_SECRET` đặt lúc
22:15 UTC 29/08.

**Phép thử nhịp sync đầu tiên** — facet VIP, vì đó là lần đầu `beauty_score` và `is_vip` được điền:

```bash
curl -s "https://www.chonsomobifone.com/api/sims?includeFacets=1&limit=1"
```

Trước sync: VIP = **0**. Sau sync phải ra **≈ 2.425**. Kho `total` 49.093 cũng sẽ đổi.

**Hệ quả mong đợi, không phải lỗi:** thứ tự lưới ở nhóm cùng giá sẽ khác đi, vì sort mặc định là
`effective_price.asc,beauty_score.desc` mà tie-break trước giờ toàn 0.
