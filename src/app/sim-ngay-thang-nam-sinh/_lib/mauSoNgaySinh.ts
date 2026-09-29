import { createAdminClient, hasServiceRoleEnv } from "@/lib/shopee/admin";

/**
 * Vài số ngày sinh THẬT đang bán — hiện dưới form trước khi khách tìm, để khách
 * từ Google Ads thấy ngay kho có hàng thật.
 *
 * CHỈ chạy ở server (page.tsx, ISR 1 giờ): dùng service role vì bảng
 * `sim_birthday_kho` bật RLS không policy. Không bao giờ import file này vào
 * Client Component.
 *
 * Chỉ ĐỌC: `sim_birthday_kho` (hop_le = đuôi 6 số là ngày có thật) để chọn ứng
 * viên, rồi đối chiếu `sims` (status available, có giá) để lấy giá niêm yết thật
 * — số đã bán không bao giờ lọt ra trang. Không ghi, không đổi schema.
 *
 * Tiết kiệm quota Supabase: đúng 2 request / lần dựng lại trang (~vài KB), mỗi
 * năm mẫu chỉ lọc 3 ngày cụ thể nên kết quả bước 1 cỡ vài chục dòng.
 * Mọi lỗi (thiếu env, timeout, RLS…) → [] và trang ẩn khối mẫu, không vỡ build.
 */

export interface MauSoNgaySinh {
  digits: string;
  /** 6 số cuối DDMMYY. */
  ddmmyy: string;
  price: number;
}

// Năm sinh mẫu (2 số cuối) — trải đều 1985–2005, xếp theo thứ tự hiển thị.
const NAM_MAU = [85, 88, 90, 92, 93, 95, 96, 98, 0, 2, 4, 5];
const SO_MAU_TOI_DA = 12;
const UNG_VIEN_MOI_NAM = 3;
const TIMEOUT_MS = 8000;

interface KhoRow {
  digits: string;
  duoi6: string;
  nam_yy: number;
}

interface SimRow {
  raw_digits: string;
  effective_price: number | null;
  network: string | null;
}

export async function layMauSoNgaySinh(): Promise<MauSoNgaySinh[]> {
  if (!hasServiceRoleEnv()) return [];
  try {
    const db = createAdminClient();

    // Mỗi năm lọc 3 ngày khác nhau (trải trong tháng) để mẫu không toàn ngày 01.
    const orExpr = NAM_MAU.map((yy, i) => {
      const days = [0, 9, 18].map((k) => ((i * 5 + k) % 28) + 1);
      return `and(nam_yy.eq.${yy},ngay.in.(${days.join(",")}))`;
    }).join(",");

    const { data: khoData, error: khoErr } = await db
      .from("sim_birthday_kho")
      .select("digits,duoi6,nam_yy")
      .eq("hop_le", true)
      .or(orExpr)
      .order("digits")
      .limit(400)
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
    if (khoErr || !Array.isArray(khoData) || khoData.length === 0) return [];

    const theoNam = new Map<number, KhoRow[]>();
    for (const row of khoData as KhoRow[]) {
      if (!/^\d{10}$/.test(row.digits) || !/^\d{6}$/.test(row.duoi6)) continue;
      if (!row.digits.endsWith(row.duoi6)) continue;
      const list = theoNam.get(row.nam_yy) ?? [];
      list.push(row);
      theoNam.set(row.nam_yy, list);
    }

    // Ứng viên mỗi năm: đầu / giữa / cuối danh sách (đã xếp theo số) → lẫn 090 và 093.
    const ungVien = new Map<number, KhoRow[]>();
    for (const yy of NAM_MAU) {
      const list = theoNam.get(yy);
      if (!list?.length) continue;
      const idx = [...new Set([0, Math.floor(list.length / 2), list.length - 1])];
      ungVien.set(yy, idx.slice(0, UNG_VIEN_MOI_NAM).map((i) => list[i]));
    }
    const digitsCanTra = [...ungVien.values()].flat().map((r) => r.digits);
    if (digitsCanTra.length === 0) return [];

    const { data: simData, error: simErr } = await db
      .from("sims")
      .select("raw_digits,effective_price,network")
      .in("raw_digits", digitsCanTra)
      .eq("status", "available")
      .gt("effective_price", 0)
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
    if (simErr || !Array.isArray(simData)) return [];

    const giaTheoSo = new Map<string, number>();
    for (const s of simData as SimRow[]) {
      if (s.network && s.network !== "Mobifone") continue;
      const price = Number(s.effective_price);
      if (Number.isFinite(price) && price > 0) giaTheoSo.set(s.raw_digits, price);
    }

    const out: MauSoNgaySinh[] = [];
    for (const yy of NAM_MAU) {
      const pick = ungVien.get(yy)?.find((r) => giaTheoSo.has(r.digits));
      if (!pick) continue;
      out.push({ digits: pick.digits, ddmmyy: pick.duoi6, price: giaTheoSo.get(pick.digits)! });
      if (out.length >= SO_MAU_TOI_DA) break;
    }
    return out;
  } catch (e) {
    console.warn("[sim-ngay-thang-nam-sinh] không lấy được số mẫu:", e);
    return [];
  }
}
