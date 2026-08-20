# Audit giao diện — chonsomobifone.com

_Design Director review (Tram). Trải nghiệm live trên chonsomobifone.com: trang chủ (desktop 1280 + mobile 375), /sim-phong-thuy, 1 bài /tin-tuc, và /mua-ngay/:id (checkout). Đối chiếu source `src/components/*`, `src/index.css`, `tailwind.config.ts`. Số liệu trong bài là đo computed CSS thực tế trên site._

---

## 1. Ấn tượng tổng thể

Khung xương thương mại đã đủ và luồng mua chạy được: có ô tìm theo đầu/đuôi số, bộ lọc trái + drawer mobile, lưới thẻ, và checkout một cột gọn gàng. Về mặt "vận hành" trang ổn. Nhưng về **thần thái**, trang đang tự kéo mình xuống hạng "chợ SIM": đông đúc, nhấp nháy, ồn ào — đúng cảm giác chủ site gọi là "lung tung".

Ba thứ giết thần thái:

1. **Rừng nút liên hệ nổi + animation vô hạn.** Đo được **12 phần tử đang chạy animation lặp vô hạn cùng lúc** (3 nút nổi bouncing, badge "HỎA TỐC" cháy, flash-sale nhấp nháy, chấm pulse...). Cùng lúc có tới **~5 kênh liên hệ lặp lại** (header: gọi + Zalo; floating: Messenger + gọi + Zalo; sticky bottom mobile: gọi + Zalo; thêm bong bóng Messenger FB). Tất cả nói cùng một việc "liên hệ đi". Một sản phẩm mà **niềm tin là yếu tố quyết định mua** (SIM online, chuyển tiền cho người lạ) thì sự ồn ào này phản tác dụng — nó khiến trang trông như trang spam, không phải một cửa hàng uy tín.

2. **Con số — "anh hùng" của sản phẩm — đang bị làm nhỏ và chìm.** Trên thẻ, số SIM chỉ render **14px** (đo thực tế cả desktop lẫn mobile), gần bằng cỡ chữ giá (17px) và body (16px). Nghịch lý: ngay trang checkout, chính con số đó được cho **30px đậm** và nổi bật — chứng minh hệ thống *biết* cách tôn con số, nhưng ở lưới sản phẩm (nơi quan trọng nhất để "phải lòng" một số) thì lại bóp nhỏ nó.

3. **Thẻ SIM phẳng và đơn điệu.** Trên desktop, thẻ **không có nền** (đo được `background: transparent`) nên chìm vào khung chứa cùng màu `#1A1A1A`, chỉ còn viền mảng 1px phân cách → nhìn như bảng tính chứ không phải "thẻ". Cộng thêm dữ liệu: gần như toàn bộ 100 thẻ đầu **cùng một giá "3.300.000 đ"**, cùng dòng "GIAO NGAY HÔM NAY", cùng nút "ĐẶT NGAY" — mắt không có điểm bám, cả lưới thành một mảng xám đều đều.

Ngoài ra có **vài điểm bất nhất** làm mất chất "một thương hiệu": màu con số **vàng** ở lưới nhưng **đỏ** ở checkout; nhãn nút **"ĐẶT NGAY"** ở trang chủ nhưng **"Mua ngay"** ở landing phong thủy; định dạng giá **"4.400.000 đ"** (có dấu cách) ở trang chủ nhưng **"1.700.000đ"** (không cách) ở landing.

Tin tốt: **checkout gọn và tử tế** (số 30px đỏ, CTA "MUA NGAY" 44px, form một cột rõ ràng, COD), và **bài tin tức đọc tốt** (16px/line-height 26px). Không có cuộn ngang ở bất kỳ breakpoint nào đã kiểm. Nền tảng tốt — chỉ cần tiết chế và tôn đúng thứ cần tôn.

---

## 2. "Lung tung" nằm chính xác ở đâu

| Vị trí | Hiện trạng đo được | Vì sao thành "lung tung" |
|---|---|---|
| **Đáy màn mobile** | Sticky CTA bar 80px (dính đáy) **+** stack 3 nút nổi cao 164px **+** bong bóng Messenger FB | 3–4 lớp nút nổi chồng nhau ở 1/4 dưới màn hình |
| **Stack nút nổi (mobile)** | x = 315→363; **che 31px mép phải của cả cột thẻ bên phải** | Nút bouncing đè lên vùng nút "ĐẶT NGAY" của nguyên một cột SIM |
| **Chrome dính đầu (mobile)** | nav 65px + sticky search 122px = **~187px** dính khi cuộn | "Ăn" gần 1/4 chiều cao màn, vùng xem thẻ còn hẹp |
| **Animation** | **12 phần tử** chạy lặp vô hạn đồng thời | Bounce + blink + fire + pulse cùng lúc = nhiễu, "rẻ tiền" |
| **Lưới sản phẩm** | 100 thẻ, đa số cùng giá 3.300.000đ, cùng nhãn | Không có nhịp/thứ bậc, mảng đều đều |
| **Kênh liên hệ** | ~5 kênh lặp (header/floating/sticky/zalo card) | Cùng một lời kêu gọi lặp 5 lần |

---

## 3. Hành động ưu tiên

### P0 — Phá tổng thể, phải sửa

**P0-1. Dọn "rừng CTA liên hệ" nổi, ưu tiên mobile.** _(Effort M)_
- **Vấn đề:** Cùng lúc trên mobile có: Header (gọi + Zalo) → `src/components/Header.tsx`; Floating stack 3 nút Messenger/Call/Zalo bouncing → `src/components/FloatingContactButtons.tsx`; Sticky bottom bar gọi + Zalo → `src/components/StickyCtaBottomBar.tsx`; và bong bóng Messenger FB → `src/components/MessengerChatPlugin.tsx`. Đo được stack nổi **che 31px cột thẻ phải**.
- **Vì sao:** Quá nhiều lời kêu gọi cùng nghĩa = nhiễu và mất tin cậy; nút nổi còn che nội dung (nút mua của cả một cột).
- **Chỉ đạo:**
  - Chọn **một** hệ liên hệ nổi. Đề xuất: **giữ sticky bottom bar trên mobile** (2 nút gọi/Zalo full-width, đã đúng touch target) và **ẩn floating stack trên mobile** (`md:flex hidden` cho `.floating-contact-stack`), chỉ hiện floating ở desktop nơi không có sticky bar. Như vậy đáy màn còn 1 lớp thay vì 3.
  - Đồng thời chỉ giữ **1** kênh Messenger: hoặc bong bóng FB, hoặc nút Messenger trong floating — không cả hai.
  - Nếu buộc giữ floating trên mobile: dời sang **bottom-left** hoặc thu còn **1 nút "Liên hệ"** bung ra, và bảo đảm không đè lưới (thêm padding-right cho grid hoặc thu nút ≤ 44px sát mép).

**P0-2. Tôn con số lên làm anh hùng ở lưới sản phẩm.** _(Effort M)_
- **Vấn đề:** `src/components/SIMCardNew.tsx` (dòng ~170–184) đặt inline `style={{ fontSize: 'clamp(14px, 3.5vw, 22px)' }}` cho `<Link className="sim-number-auto">`, ghi đè class `.sim-number-auto` (vốn định nghĩa `clamp(18px,1.6vw,32px)` trong `src/index.css`) xuống **nhỏ hơn** (trần 22px, thực render **14px**). Nguyên nhân gốc: thẻ chỉ rộng **182px desktop / 154px mobile** (vùng chữ ~158/130px) nên số 10–11 chữ số buộc phải nhỏ.
- **Vì sao:** Trong bán SIM, con số LÀ sản phẩm. Số phải "hét" trước, giá/nút nói sau. Hiện số đang thì thầm ngang cỡ body.
- **Chỉ đạo:**
  - **Giảm số cột để thẻ rộng ra** (xem P1-3): desktop `xl:grid-cols-3` thay vì `grid-cols-4`. Thẻ rộng ~250px → số có chỗ thở.
  - **Bỏ inline override**, để số dùng thang riêng: mục tiêu **desktop ~22–26px, mobile ~18–20px**, `font-weight: 700–800`, `letter-spacing: 0.02em`. Đây phải là dòng lớn nhất trong thẻ, giá và nút nhỏ hơn hẳn.
  - Cân nhắc **font tabular/mono cho con số** (ví dụ `font-variant-numeric: tabular-nums`) để các chữ số thẳng hàng, đều nhịp — số nhìn "đắt" hơn hẳn.

**P0-3. Trả lại nền + chiều sâu cho thẻ SIM (desktop).** _(Effort S)_
- **Vấn đề:** `.sim-card-compact` khai báo `@apply bg-card` nhưng đo trên desktop ra `background-color: rgba(0,0,0,0)` (transparent) — thẻ **không có nền**, nằm trên khung chứa cùng màu `#1A1A1A`, chỉ còn viền `rgba(51,51,51,.6)` phân cách. (Trên mobile có gradient nền nên đỡ hơn.) → Cần Front kiểm vì sao `bg-card` không ăn trên desktop (rất có thể bị override/purge).
- **Vì sao:** Thẻ chìm vào nền, cả lưới phẳng như bảng tính, không có cảm giác "món hàng".
- **Chỉ đạo:**
  - Thẻ phải **sáng hơn khung chứa một bậc**: khung chứa `#1A1A1A` thì thẻ nên `#1F1F1F`–`#222` (thêm token `--card-elevated`), viền tinh `hsl(0 0% 100% / 0.06)`, shadow mềm như ánh sáng studio (`0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6)`).
  - Hover: nâng nhẹ + viền vàng mảnh `hsl(var(--gold)/.35)` + glow rất nhẹ — **giữ tinh tế**, không phóng đại.
  - Áp cùng chuẩn nền thẻ này cho desktop lẫn mobile để nhất quán.

### P1 — Nên nâng

**P1-1. Tiết chế animation vô hạn.** _(Effort S)_
- **Vấn đề:** `floating-bounce` (3 nút, 1.4s ∞) trong `FloatingContactButtons.tsx`; `animate-flash-blink` (0.45s ∞ trên **mỗi** thẻ giảm giá) và `animate-fire-badge`, `animate-price-pulse`, `pulse-soft` trong `src/index.css`. Đo được 12 phần tử lặp vô hạn.
- **Vì sao:** Nhiều thứ nhấp nháy/nảy cùng lúc = tín hiệu "spam/chợ", đối nghịch với sự tin cậy cần có.
- **Chỉ đạo:** Nguyên tắc "**tối đa 1 điểm động tại một thời điểm**". Bỏ bouncing vô hạn của nút nổi (đổi sang chỉ scale nhẹ khi hover). Badge flash-sale/HỎA TỐC: đổi từ nhấp nháy 0.45s sang **glow tĩnh** hoặc pulse rất chậm (≥2s), biên độ nhỏ. Giữ đúng tinh thần `prefers-reduced-motion` đã có.

**P1-2. Nhất quán thẻ & microcopy toàn site.** _(Effort S–M)_
- **Vấn đề:** Trang chủ (`SIMCardNew.tsx`) dùng nhãn **"ĐẶT NGAY"**, số **màu vàng**, giá **"4.400.000 đ"**. Landing `/sim-phong-thuy` (`src/pages/SimPhongThuy.tsx`) dùng **"Mua ngay"**, giá **"1.700.000đ"** (không cách). Checkout để số **màu đỏ** 30px.
- **Vì sao:** Bất nhất nhỏ nhưng cộng dồn làm trang trông "chắp vá", mất chất một thương hiệu.
- **Chỉ đạo:** Chốt **một** token cho: nhãn CTA (đề xuất "ĐẶT NGAY" xuyên suốt), **màu con số** (chọn 1: vàng cho "quý"/đắt hay đỏ cho "nóng" — đề xuất giữ **vàng** ở lưới, đỏ chỉ dành cho giá/CTA), và **format giá** dùng chung một helper (đề xuất `4.400.000đ` — thống nhất khoảng cách trước "đ"). Lý tưởng: tách một component `SimCard` dùng chung cho mọi trang.

**P1-3. Nhịp & mật độ lưới — cho thẻ thở.** _(Effort M)_
- **Vấn đề:** `src/pages/Index.tsx` (dòng ~657) `grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. Ở desktop hai sidebar (trái 160px + phải 220px) bóp cột giữa còn 4 thẻ × 182px. 100 thẻ đồng giá lặp "GIAO NGAY HÔM NAY" trên từng thẻ.
- **Vì sao:** Chật + lặp = không có thứ bậc, con số không đủ chỗ (gốc rễ của P0-2).
- **Chỉ đạo:**
  - Desktop tối đa **3 cột** (`xl:grid-cols-3`), gap ≥ 16px. Cân nhắc bỏ bớt 1 sidebar hoặc thu right sidebar để dành đất cho lưới.
  - Bỏ dòng "GIAO NGAY HÔM NAY" lặp trên **mỗi** thẻ — chuyển thành **1 badge nhỏ** chỉ ở thẻ nổi bật, hoặc đưa lên TrustBar/nhãn khu vực. Thẻ chỉ cần: badge mạng/loại → **SỐ (hero)** → giá → 1 nút. Càng ít chữ, số càng nổi.
  - Cho lưới một chút nhịp: thẻ có badge "Số đẹp"/giảm giá được nhấn nhẹ (viền vàng), phần còn lại phẳng — để mắt có điểm bám.

**P1-4. Nén chrome dính đầu trang (mobile).** _(Effort S)_
- **Vấn đề:** Ô search sticky cao **122px** (`Index.tsx` dòng ~559) gồm input + hint "💡 Sử dụng * ...". Cộng nav 65px = ~187px dính khi cuộn.
- **Chỉ đạo:** Đưa dòng hint ra **ngoài** vùng sticky (chỉ input dính), hoặc rút hint thành placeholder/icon "?" bung tooltip. Mục tiêu vùng search dính ≤ ~64px. Giảm `py`, `mb` để vùng dính gọn.

**P1-5. Tiết chế hệ màu — thêm một tầng surface.** _(Effort S)_
- **Vấn đề:** Bộ ba nền `#0F0F0F` + đỏ `#C4161C` (82% sat) + vàng `#F5B301` là đúng "khẩu vị" SIM VN, nhưng đang **bão hòa cao và chỉ có 2 tầng bề mặt** (nền 6% / card 10%) nên mọi thứ hoặc chìm hoặc chói.
- **Chỉ đạo:** Thêm token bề mặt tầng 3 (`--card-elevated` ~12–14%) để tạo chiều sâu (dùng cho thẻ ở P0-3). Đỏ/vàng chỉ dùng làm **điểm nhấn** (giá, CTA, con số) — không dùng làm mảng lớn. Cân nhắc hạ nhẹ độ bão hòa vàng ở nền/viền để bớt "gắt", giữ vàng đậm cho con số.

### P2 — Tinh chỉnh couture

- **P2-1. Off-white cho đọc dài.** _(S)_ Bài tin tức để body `#FFFFFF` thuần trên nền đen (đo 16px/26px). Đổi màu chữ thân bài sang off-white (`hsl(0 0% 88%)` ~ `#E0E0E0`) để giảm chói/halation khi đọc dài; giữ tiêu đề trắng. File các trang `src/pages/TinTucBai*.tsx`.
- **P2-2. Touch target input checkout.** _(S)_ Input checkout cao **40px** (`src/pages/Checkout.tsx`) — nâng lên **44px** cho chuẩn chạm mobile. Số 30px đỏ + CTA 44px đã tốt, giữ nguyên.
- **P2-3. Chuẩn hóa badge trên thẻ.** _(S)_ "⭐ Số đẹp", nhãn mạng, "Giảm x triệu", "Tứ quý" đang mỗi cái một cỡ/bo/nền (`SIMCardNew.tsx` dùng nhiều `clamp(8px..)` inline). Gom về **một** hệ badge (cùng chiều cao, bo, padding, thang chữ) để hàng badge trên thẻ đều tăm tắp.
- **P2-4. Focus-visible nhất quán (a11y).** _(S)_ Bảo đảm mọi nút/thẻ/ô lọc có `focus-visible` ring rõ (vàng `--ring` đã có) — hiện nhiều nút lọc (`.filter-btn-sm`) và thẻ chưa có trạng thái focus thấy được; quan trọng cho điều hướng bàn phím và a11y.
- **P2-5. Contrast chữ phụ.** _(S)_ `muted-foreground` = 70% (`#B3B3B3`) và các nhãn dùng `text-muted-foreground/70` (≈ 49%) như "GIAO NGAY HÔM NAY" ở cỡ 9–12px — dưới ngưỡng WCAG AA cho chữ nhỏ. Nâng tối thiểu về 70% đặc hoặc bỏ bớt (khớp P1-3).

---

## 4. Tách Desktop vs Mobile (những chỗ khác nhau)

**Desktop (≥1024px)**
- Thẻ **không có nền** (transparent) → phẳng như bảng (P0-3). Mobile có gradient nên đỡ hơn.
- Hai sidebar bóp lưới còn 4 cột 182px → số 14px (P0-2, P1-3). Ưu tiên giảm 3 cột và/hoặc thu sidebar.
- Floating stack ở desktop không đè nội dung (bottom-right, 24px) — chấp nhận được; nên là **kênh nổi duy nhất** ở desktop.

**Mobile (375px)**
- Đáy màn quá tải: sticky CTA 80px + floating 164px (che 31px cột thẻ phải) + Messenger FB (P0-1). Đây là "lung tung" rõ nhất, ưu tiên số 1 trên mobile.
- Chrome dính đầu ~187px (P1-4).
- Thẻ 154px, số gần chạm mép (128/130px) → 2 cột đang ép số; nếu giữ 2 cột thì bắt buộc rút gọn chữ trong thẻ (P1-3) để số to lên.
- Không có cuộn ngang — tốt.

---

## 5. Art direction gợi ý (tinh thần muốn tới)

Đích đến: **"kho SIM cao cấp, tĩnh và đáng tin"** — nghĩ Vertu/Apple Store gặp bảng số phong thủy, không phải sạp chợ.
- **Nhân vật chính:** con số. To, đậm, tabular, vàng ánh kim trên bề mặt tối có chiều sâu. Mọi thứ khác lùi lại phục vụ nó.
- **Tĩnh & tiết chế:** tối đa 1 chuyển động tại một thời điểm; đỏ/vàng chỉ là điểm nhấn; nhiều khoảng thở giữa các thẻ.
- **3 tầng bề mặt** (nền → card → card nổi) tạo ánh sáng studio thay vì phẳng lì.
- **Một thương hiệu, một ngôn ngữ:** một thẻ SIM dùng chung, một nhãn CTA, một format giá, một màu con số — xuyên suốt trang chủ, landing, checkout.
- **Tin cậy đến từ sự tĩnh:** ít nút nổi hơn, mỗi cái đặt đúng chỗ, đắt hơn 5 nút nhấp nháy.

---

_Phạm vi: art direction / UX / thị giác. Không đụng logic nghiệp vụ (lọc, quý, giá). Việc thi công thuộc Front._
