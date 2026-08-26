# BÀN GIAO — chonsomobifone (sim-sanctuary-23)

_Cập nhật: 2026-08-26. Dự án: Next.js 16 + Supabase — Kho SIM Mobifone số đẹp._

## 1. ĐÃ XONG phiên này

- **Engine Bát Cực Linh Số** (`src/lib/batCuc.ts`): 8 năng lượng (Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh), 64 cặp số, phân tích SIM/CCCD (cặp chồng lấn), đề xuất hóa giải (hung → cát tương ứng), chấm điểm Bát Cực 0–10, bộ lọc NL chủ đạo / NL phải có (≤5) / Loại trừ NL (≤5).
- **Nâng cấp `simHopTuoi.ts`**: thêm `batCucScore`, `nlChuDao`, `nlCounts` vào `ScoredSim`; `scoreInventory` nhận thêm `BatCucFilter` tùy chọn để lọc từ server.
- **Nâng cấp API `/api/sim-hop-tuoi`**: nhận params `cccd`, `nlChuDao`, `nlPhaiCo`, `nlLoaiTru`; trả về `batCuc` object với phân tích CCCD + filter active.
- **Nâng cấp UI `SimHopTuoiTool.tsx`**: form CCCD (12 số), accordion "Kết hợp Bát Cực Linh Số" (NL chủ đạo select, NL phải có toggle, NL loại trừ toggle), panel "Hóa giải CCCD" hiển thị năng lượng hung + đề xuất hóa giải + chi tiết từng cặp, SIM card hiển thị nlChuDao badge + 3 năng lượng nổi bật × count.
- Đã build OK, deploy lên production (commit `2648f25`, push `origin main`).
- **Hotfix crash accordion Bát Cực** (commit `98f2008`): Radix Select v2.2.5 **throw Error** khi render `<SelectItem value="">` → mở accordion "Kết hợp Bát Cực Linh Số" crash trang. Đã đổi thành `value="tat-ca"` + map `v === "tat-ca" → null`. Verify: build XANH, deploy Ready, JS bundle live chứa `tat-ca`.

## 2. CÒN LẠI / việc làm tiếp

- **Mục tiêu chọn sim** (Tài lộc / Công danh / Tình cảm / Học hành) — chưa có trong bộ lọc. Cần thêm vào API + UI.
- **Hào động** — engine Kinh Dịch hiện chỉ tính quẻ từ 4 số cuối (mod 80), chưa tính hào động. Cần thêm bảng 64 quẻ Kinh Dịch + hào động để hiển thị "Hào động" trên card SIM.
- **"Vì sao hợp tuổi"** luận giải tự động — chưa có. Có thể sinh từ điểm ngũ hành + âm dương + quẻ dịch.
- **"Tốt cho việc" tags** — chưa có. Có thể map từ quẻ dịch (mỗi quẻ ứng với 1 số lĩnh vực).
- **Số thần học** — chưa tính (cộng dồn ngày sinh ra số 1–9).
- **Phân trang** — hiện chỉ trả 12 kết quả. Cần thêm `limit` + `offset` param + pagination UI.
- **So sánh 2 SIM** — cần thêm khay so sánh + trang so sánh.
- **Xem chi tiết SIM phong thủy** — trang `/sim-phong-thuy?so=...` chưa có.
- **Lịch âm/dương toggle** — form nhập giờ sinh hiện chỉ âm lịch, cần thêm toggle.

## 3. Bẫy phải biết

- **Deploy bắt buộc push GitHub** (auto-deploy từ Vercel Git integration). Không dùng `npx vercel --prod`.
- **Supabase Edge Function fetch-sim-data** timeout 15s, data ~7MB → không cache được. Build có thể fail nếu Supabase down.
- **SimNamSinhFinder.tsx** có WIP chưa commit — không stage nếu không liên quan.
- **Bát Cực hóa giải mapping**: TuyệtMệnh→SinhKhí, NgũQuỷ→ThiênY, LụcSát→DiênNiên, HọaHại→PhụcVị. Có thể cần điều chỉnh theo ý kiến chuyên gia phong thủy.