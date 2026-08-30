import type { NextRequest } from "next/server";
import { docThuHang } from "@/lib/gscRank";

/**
 * Thứ hạng Google của danh sách từ khoá mục tiêu, cho bảng trong `/admin/seo`.
 *
 * Vì sao là route riêng chứ không đọc trong Server Component: gọi Search Console
 * mất vài giây và có thể lỗi (chưa cấp quyền, property sai). Để nó ở route thì
 * trang render ngay, bảng tự tải sau, và một cú lỗi GSC không làm trắng cả trang.
 *
 * KHÔNG cần `requireAdmin`: dữ liệu ở đây là thứ hạng Google của chính site công
 * khai — không phải bí mật, không phải PII, không có giá vốn. Đổi lại route KHÔNG
 * bao giờ trả giá trị biến môi trường, chỉ trả TÊN biến còn thiếu (xem `thieuBien`
 * trong lib), nên kể cả bị gọi từ ngoài cũng không lộ khoá.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const raw = Number(new URL(req.url).searchParams.get("ngay"));
  // Chặn giá trị lạ: GSC chỉ giữ 16 tháng, và số quá nhỏ thì kỳ không có dữ liệu.
  const soNgay = Number.isInteger(raw) && raw >= 7 && raw <= 480 ? raw : 28;

  const ketQua = await docThuHang(soNgay);
  return Response.json(ketQua, { headers: { "Cache-Control": "no-store" } });
}
