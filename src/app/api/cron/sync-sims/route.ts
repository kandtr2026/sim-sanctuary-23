import { NextRequest } from "next/server";

/**
 * Cron đồng bộ kho SIM: Vercel gọi route này theo lịch trong `vercel.json`, route
 * gọi tiếp edge function `sync-sims` của Supabase.
 *
 * VÌ SAO PHẢI CÓ ROUTE TRUNG GIAN thay vì cho Vercel gọi thẳng edge function:
 * `sync-sims` ghi vào bảng `sims` nên nó đòi `SUPABASE_SERVICE_ROLE_KEY`. Khoá đó
 * tuyệt đối không được nằm ở nơi nào trình duyệt đọc được, còn Vercel Cron thì chỉ
 * gọi được URL của chính project — nên route server-side này là chỗ duy nhất hợp lý
 * để giữ khoá.
 *
 * VÌ SAO CẦN CRON: trước 29/08/2026 KHÔNG có gì gọi `sync-sims` cả — không cron
 * Vercel, không workflow GitHub, không pg_cron. Nghĩa là bảng `sims` chỉ được làm
 * mới khi có người gọi tay, và mọi bản sửa trong job đó (siết parse giá, ghi
 * tags/beauty_score, chặn SIM ẩn) đều nằm im không chạy.
 */

// Route phải chạy động: nó gọi mạng và đọc secret, không được prerender.
export const dynamic = "force-dynamic";
// Sync 51k dòng qua 52 batch không xong trong 10s mặc định.
export const maxDuration = 300;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

/**
 * Vercel gắn `Authorization: Bearer <CRON_SECRET>` khi biến CRON_SECRET tồn tại.
 * Không có cửa này thì bất kỳ ai cũng gọi được và ép chạy upsert 51k dòng.
 *
 * Trả về `true` khi request được phép chạy.
 */
const duocPhep = (req: NextRequest): boolean => {
  const secret = process.env.CRON_SECRET;
  // Chưa đặt CRON_SECRET → từ chối hết. Fail-closed: một endpoint ghi dữ liệu mà
  // mở toang còn tệ hơn là cron không chạy, vì cron không chạy thì thấy ngay.
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
};

export async function GET(req: NextRequest) {
  if (!duocPhep(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceKey) {
    // Nêu TÊN biến còn thiếu, không bao giờ nêu giá trị.
    const thieu = [!SUPABASE_URL && "SUPABASE_URL", !serviceKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
    return Response.json({ error: `Thiếu biến môi trường: ${thieu.join(", ")}` }, { status: 500 });
  }

  // `force=1` cố ý KHÔNG bật: job tự so vân tay nội dung, dữ liệu không đổi thì nó
  // bỏ qua và không tốn 52 batch upsert vô ích.
  const url = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/sync-sims`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      signal: AbortSignal.timeout(280_000),
    });
    const body = await res.text();
    // Trả nguyên phản hồi của job để log cron của Vercel có cái đọc được khi hỏng.
    return new Response(body, {
      status: res.ok ? 200 : 502,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const chiTiet = e instanceof Error ? e.message : String(e);
    console.error("[cron/sync-sims]", chiTiet);
    return Response.json({ error: `Gọi sync-sims thất bại: ${chiTiet}` }, { status: 502 });
  }
}
