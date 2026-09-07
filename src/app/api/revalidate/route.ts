import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { SIM_CACHE_TAG } from "@/lib/cacheTags";

/**
 * Làm tươi kho SIM theo yêu cầu (on-demand revalidation).
 *
 * DÀNH CHO AI: mọi chỗ ĐỔI KHO SIM nằm NGOÀI app Next này — edge function
 * `sync-sims` (khi nhập/bán/sửa/xoá số), n8n, hay A Khoa gọi tay sau khi cập nhật
 * kho khuyến mãi trên Google Sheet. Gọi endpoint này xong, mọi trang phụ thuộc
 * kho (trang chủ + các trang danh mục server-render) được đánh dấu hết hạn NGAY,
 * nên SIM đã bán không kịp hiện "còn". Cron `/api/cron/sync-sims` đã tự gọi
 * `revalidateTag` sau mỗi lần đồng bộ; endpoint này là cửa cho các nguồn khác.
 *
 * VÌ SAO `{ expire: 0 }` chứ không `'max'`: đây là webhook từ hệ thống ngoài, cần
 * HẾT HẠN NGAY để lần tải kế tiếp chắc chắn lấy dữ liệu tươi (đúng khuyến nghị của
 * Next cho webhook). Đánh đổi: request đầu sau khi bust là một lần regenerate
 * blocking — chấp nhận được vì kho chỉ đổi vài lần/ngày, và độ đúng "không bán số
 * đã bán" quan trọng hơn một request chậm.
 *
 * BẢO VỆ: bắt buộc `Authorization: Bearer <REVALIDATE_SECRET>`. Chưa đặt biến →
 * từ chối hết (fail-closed) — một cửa bust cache mở toang để người ngoài spam
 * regenerate là một kiểu DoS.
 *
 * GỌI THỬ:
 *   curl -X POST "https://www.chonsomobifone.com/api/revalidate" \
 *        -H "Authorization: Bearer $REVALIDATE_SECRET"
 * (mặc định tag = "sim"; có thể thêm ?tag=<tag> nếu sau này tách nhãn).
 */

// Endpoint hành động: gọi runtime API, không được prerender.
export const dynamic = "force-dynamic";

const duocPhep = (req: NextRequest): boolean => {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false; // Fail-closed: chưa cấu hình secret thì khoá cửa.
  return req.headers.get("authorization") === `Bearer ${secret}`;
};

const handle = (req: NextRequest): Response => {
  if (!duocPhep(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tag mặc định là kho SIM. Cho phép chỉ định tag khác nhưng chặn giá trị rác
  // (Next giới hạn tag ≤ 256 ký tự).
  const raw = (req.nextUrl.searchParams.get("tag") || SIM_CACHE_TAG).trim();
  if (!raw || raw.length > 256) {
    return Response.json({ error: "Tag không hợp lệ" }, { status: 400 });
  }

  revalidateTag(raw, { expire: 0 });
  return Response.json({ revalidated: true, tag: raw, now: Date.now() });
};

export async function POST(req: NextRequest) {
  return handle(req);
}

// GET cũng chấp nhận để tiện gọi tay/kiểm tra; vẫn đòi đúng secret nên không mở
// thêm bề mặt tấn công.
export async function GET(req: NextRequest) {
  return handle(req);
}
