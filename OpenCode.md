# Task cho OpenCode — Bot viết bài blog tự động hàng ngày

> Ghi bởi Claude. OpenCode đọc và thực thi, không cần hỏi lại Claude.
> Ngày ghi: 2026-08-22.

## 1. Bối cảnh

`chonsomobifone.com` (Next.js, repo này) vừa có thêm 1 trang quản trị (`/admin`) cho phép đăng
bài blog vào bảng `blog_posts` trên Supabase (project riêng cho admin/blog, KHÁC với project
Supabase chạy kho SIM — xem `src/integrations/supabase/config.ts` để phân biệt
`SUPABASE_URL` (kho SIM) vs `ADMIN_SUPABASE_URL` (admin/blog) — chỉ dùng `ADMIN_SUPABASE_URL`
cho việc này).

> **CẬP NHẬT 2026-08-22 (v3):** Pipeline đã chạy thành công (bài `sim-hop-tuoi-1988` viết tay,
> `sim-kep-la-gi` do bot tự viết qua Groq `openai/gpt-oss-20b`). Chủ shop đã đổi quyết định ban
> đầu — xem mục 3 và "Ràng buộc" bên dưới đã được cập nhật lại, KHÔNG còn là draft-only nữa.

Chủ shop muốn có 1 bot **tự viết + tự đăng công khai 2 bài blog SEO mỗi ngày** vào `blog_posts`
(`published = true` ngay khi tạo — không cần duyệt tay nữa, đã đổi từ quyết định draft-only ban
đầu).

## 2. Đã thử và bị chặn — lý do cần OpenCode thay vì Claude scheduled task

Claude Code đã thử dùng 2 cơ chế lịch trình riêng, cả 2 đều không phù hợp:
1. **Cloud routine** (agent chạy trên hạ tầng cloud của Anthropic): bị egress proxy chặn
   kết nối ra `*.supabase.co` (403 Forbidden) — không sửa được vì đó là chính sách bảo mật
   platform, không phải lỗi cấu hình.
2. **Local scheduled task** (chạy trong app Claude Code trên máy chủ shop): hoạt động được
   (đã test thành công, tạo ra bài `sim-hop-tuoi-1988`), nhưng **chỉ chạy khi app Claude Code
   đang mở trên máy** — không đủ tin cậy cho việc chạy nền hàng ngày không người canh.

→ Cần OpenCode dựng một pipeline **không phụ thuộc Claude Code hay máy cá nhân đang bật**.
Khuyến nghị: **GitHub Actions scheduled workflow** (repo đã có sẵn trên GitHub:
`kandtr2026/sim-sanctuary-23`, nhánh `main`) — chạy độc lập trên hạ tầng GitHub, không cần máy
chủ shop bật, không cần app nào mở. Nếu OpenCode thấy cách khác tốt hơn (VPS cron, Vercel Cron
Job, v.v.) thì tự quyết, miễn đạt được: chạy hàng ngày, không phụ thuộc thiết bị cá nhân.

## 3. Việc cần làm

Dựng 1 job chạy **2 lần/ngày** (giờ đề xuất: 8:00 sáng và 20:00 tối giờ Việt Nam / 01:00 UTC và
13:00 UTC — sửa `cron` trong `.github/workflows/blog-bot.yml` thành 2 dòng lịch), thực hiện
đúng luồng đã kiểm chứng thủ công (xem `supabase/migrations/20260820091254_admin_blog_schema.sql`
để biết schema đầy đủ của `blog_posts`/`profiles`):

1. Đăng nhập Supabase Auth bằng tài khoản bot (email/password lấy từ biến môi trường — xem mục 4,
   **không hardcode secret vào code hay commit**).
   `POST {ADMIN_SUPABASE_URL}/auth/v1/token?grant_type=password` với `apikey` header + body
   `{"email":..., "password":...}` → lấy `access_token`.
2. Lấy danh sách slug đã có: `GET {ADMIN_SUPABASE_URL}/rest/v1/blog_posts?select=slug` (kèm
   `Authorization: Bearer <access_token>`).
3. Chọn 1 chủ đề trong kho chủ đề bên dưới (mục 5) — chủ đề đầu tiên có slug CHƯA tồn tại. Nếu
   hết kho, tự nghĩ chủ đề mới cùng tinh thần (SIM số đẹp, phong thủy theo năm sinh, ý nghĩa đầu
   số Mobifone), slug mới không trùng.
4. Sinh nội dung bài viết — đang dùng **Groq, model `openai/gpt-oss-20b`** (`LLM_PROVIDER=groq`,
   `LLM_MODEL=openai/gpt-oss-20b`, secret `LLM_API_KEY` là key Groq miễn phí, không cần thẻ). Đây
   là lựa chọn ĐÃ CHẠY ỔN — không tự đổi model trừ khi model này lỗi thật.
   **KHÔNG dùng `llama-3.3-70b-versatile`** — model này thuộc nhóm Enterprise của Groq, tài khoản
   miễn phí không có quyền gọi (đã test, lỗi 404 "does not exist or you do not have access to
   it"). Nếu cần model dự phòng khi `openai/gpt-oss-20b` lỗi, dùng `openai/gpt-oss-120b` (cũng
   free-tier trên Groq).
5. Lưu bài: `POST {ADMIN_SUPABASE_URL}/rest/v1/blog_posts` với `apikey` + `Authorization: Bearer
   <access_token>` + body JSON `{slug, title, meta_title, meta_description, content_html,
   category, published: true}`.

**Cập nhật ràng buộc (đã đổi so với bản v1/v2):** `published` giờ mặc định là `true` — bot tự
đăng công khai ngay, không cần duyệt tay. Set secret `BOT_AUTO_PUBLISH=true` trên GitHub Actions
(dùng `gh secret set BOT_AUTO_PUBLISH --body true` — `gh` đã cài và đăng nhập sẵn trên máy chủ
shop) để kích hoạt logic auto-publish đã có sẵn trong `scripts/blog-bot/index.mjs`. Vẫn giữ
nguyên toàn bộ validate nội dung (đếm từ, link nội bộ, độ dài meta) đã có — KHÔNG bỏ bớt kiểm tra
chất lượng chỉ vì giờ tự đăng thẳng, ngược lại càng cần chắc để tránh bài lỗi lên web thật không
ai duyệt trước.

## 4. Credentials

Nằm trong `.env.opencode-bot` ở gốc repo (đã có sẵn, **không commit** — đã nằm trong
`.gitignore` qua pattern `.env.*`): `BOT_SUPABASE_URL`, `BOT_SUPABASE_APIKEY` (publishable/anon
key — key này bản thân đã an toàn để lộ vì được thiết kế public + có RLS chặn, nhưng
`BOT_PASSWORD` thì không), `BOT_EMAIL`, `BOT_PASSWORD`.

Nếu dùng GitHub Actions: chuyển các giá trị này thành **GitHub Actions repository secrets**
(Settings → Secrets and variables → Actions), KHÔNG paste plaintext vào file workflow `.yml`
hay bất kỳ file được commit nào.

## 5. Kho chủ đề (chọn theo thứ tự, bỏ qua slug đã tồn tại)

Chuỗi sim hợp tuổi theo phong thủy (category "Phong thuỷ"), mẫu tiêu đề "Sim hợp tuổi {năm} –
Chọn số theo phong thủy hợp mệnh", mẫu slug "sim-hop-tuoi-{năm}":
`1989, 1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000`
(1988 đã dùng — slug `sim-hop-tuoi-1988` đã tồn tại, không lặp lại.)

Chuỗi giải thích đầu số Mobifone (category "Đầu số"), mẫu tiêu đề "Đầu số {đầu số} là mạng gì?
Ý nghĩa và cách chọn sim đầu {đầu số}", mẫu slug "dau-so-{đầu số}-la-mang-gi":
`090, 093, 089, 070, 076, 077, 078, 079`

Chuỗi **các dạng số đẹp** (category "Ý nghĩa sim") — đây là nhóm ưu tiên cao nhất, dựa theo đúng
phân loại từ khóa mà đối thủ simthanglong.vn đang khai thác mạnh nhất (mục "SIM THEO LOẠI" trên
trang chủ họ). Mỗi bài giải thích 1 dạng số: định nghĩa, ý nghĩa phong thủy/thị trường, cách nhận
biết, ai nên mua. Site đã có sẵn trang danh mục cho vài dạng — bài blog PHẢI link về đúng trang đó
nếu có (xem whitelist link ở mục 6), KHÔNG phải trang trùng lặp mà là nội dung dẫn dắt vào trang
bán hàng:
- `sim-tu-quy-la-gi-y-nghia` — "Sim tứ quý là gì? Ý nghĩa và cách phân biệt tứ quý thật – tứ quý giữa – tứ quý lệch"
- `sim-luc-quy-la-gi-y-nghia` — "Sim lục quý là gì? Vì sao là dạng số đẹp hiếm và đắt giá nhất"
- `sim-tam-hoa-la-gi-y-nghia` — "Sim tam hoa là gì? Phân biệt tam hoa thường và tam hoa kép"
- `sim-loc-phat-la-gi-y-nghia` — "Sim lộc phát là gì? Ý nghĩa và cách chọn số đuôi lộc phát hợp mệnh" (link `/sim-loc-phat`)
- `sim-than-tai-la-gi-y-nghia` — "Sim thần tài là gì? Ý nghĩa phong thủy và cách chọn số đuôi thần tài" (link `/sim-than-tai`)
- `sim-ong-dia-la-gi-y-nghia` — "Sim ông địa là gì? Ý nghĩa và cách chọn số hợp phong thủy kinh doanh" (link `/sim-ong-dia`)
- `sim-ngu-quy-la-gi-y-nghia` — "Sim ngũ quý là gì? Vì sao sim ngũ quý luôn có giá trị cao" (link `/sim-ngu-quy`)
- `sim-taxi-la-gi-y-nghia` — "Sim taxi là gì? Vì sao được giới kinh doanh vận tải săn đón"
- `sim-ganh-dao-la-gi-y-nghia` — "Sim gánh đảo là gì? Cách nhận biết sim gánh đảo đẹp"
- `sim-tien-len-la-gi-y-nghia` — "Sim tiến lên (số tiến) là gì? Ý nghĩa và các dạng phổ biến"
- `sim-lap-kep-la-gi-y-nghia` — "Sim lặp kép là gì? Vì sao dễ nhớ và được ưa chuộng"
- `sim-so-doc-la-gi-y-nghia` — "Sim số độc là gì? Vì sao càng độc lạ càng có giá trị cao"
- `sim-de-nho-la-gi-y-nghia` — "Sim dễ nhớ là gì? Tiêu chí chọn số dễ nhớ cho kinh doanh"
- `sim-dau-so-co-la-gi-y-nghia` — "Sim đầu số cổ là gì? Vì sao đầu số cổ luôn có giá trị cao hơn"

Bài kiến thức chung khác (category "Kiến thức mua sim"):
- `cach-kiem-tra-sim-mobifone-chinh-chu` — "Cách kiểm tra sim Mobifone chính chủ trước khi mua, tránh mua phải sim lỗi"
- `nen-mua-sim-tra-gop-hay-tra-thang` — "Nên mua sim trả góp hay trả thẳng? So sánh ưu nhược điểm"
- `thu-tuc-sang-ten-sim-chinh-chu-mobifone` — "Thủ tục sang tên sim chính chủ Mobifone mới nhất"

**Lưu ý bắt buộc:** tiêu đề và nội dung mỗi bài phải khác biệt hoàn toàn với các bài đã có (đã
kiểm slug ở bước 2) — không viết lại gần giống 1 bài cũ dưới tên khác, không dùng lại cùng mở bài
hay cùng bố cục câu chữ giữa các bài liên tiếp.

**KHÔNG BAO GIỜ dùng các slug này** — đã tồn tại là trang riêng viết cứng trên site
(`src/app/tin-tuc/*/page.tsx`), không phải hàng trong `blog_posts`: `y-nghia-sim-so-dep`,
`so-tong-dai-cac-nha-mang`, `y-nghia-cac-con-so-1-9`, `cach-xem-sim-phong-thuy-hop-tuoi`,
`cach-tranh-mat-tien-oan-khi-mua-sim-so-dep`, `cac-dau-so-mang-mobifone-moi-nhat`.

## 6. Văn phong bài viết

Tiếng Việt, giọng ấm áp nhưng có căn cứ — tham khảo bài mẫu đã đăng thành công:
`sim-hop-tuoi-1988` trong bảng `blog_posts` (đọc qua REST API hoặc `/admin/dashboard`), và các
bài tĩnh trong `src/app/tin-tuc/y-nghia-sim-so-dep/page.tsx`.

- `content_html`: 700–1100 từ. Cấu trúc: đoạn mở đầu, 3–5 mục `<h2>` + `<p>` + `<ul><li>` khi hợp
  lý. KHÔNG bọc `<html>/<head>/<body>`.
- Phong thủy/số học trình bày như niềm tin dân gian ("theo quan niệm dân gian/phong thủy",
  "nhiều người tin rằng"), không khẳng định tuyệt đối, không phải lời khuyên y tế/tài chính.
- Không bịa số liệu, tên khách hàng, đánh giá giả. Không nói xấu đối thủ theo tên.
- Chèn đúng 1 link nội bộ `<a href="...">` — chọn URL khớp nhất với chủ đề bài, chỉ trong danh
  sách sau (không tự bịa URL khác, kiểm tra route thật đã tồn tại trong `src/app/` trước khi
  dùng vì site có thể có thêm trang mới): `/sim-phong-thuy` (phong thủy/năm sinh),
  `/sim-loc-phat` (bài về lộc phát), `/sim-than-tai` (bài về thần tài), `/sim-ong-dia` (bài về
  ông địa), `/sim-ngu-quy` (bài về ngũ quý), `/sim-dau-so/{đầu số}` (bài về 1 đầu số cụ thể, ví
  dụ `/sim-dau-so/090`), `/sim-tra-gop` (trả góp), `/mua-sim-gia-re` (mua sim nói chung),
  `/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat` (đầu số/nhà mạng nói chung), hoặc `/` (mặc định
  nếu không có trang nào khớp).
- `meta_title` ≤ 60 ký tự, có từ khóa chính. `meta_description` 140–160 ký tự, tự nhiên.

## 7. Sau khi dựng xong

Test bằng cách chạy job 1 lần thủ công, xác nhận có bài mới xuất hiện trong `/admin/dashboard`
với trạng thái "Nháp" (không phải "Đã đăng"), rồi mới bật lịch chạy tự động hàng ngày.
