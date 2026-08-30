/**
 * Đọc thứ hạng Google (Search Console) cho danh sách từ khoá mục tiêu.
 *
 * NGUỒN SỰ THẬT dùng chung với CLI `scripts/seo/rank-check.mjs`:
 *   - danh sách từ khoá: `scripts/seo/keywords.json` (một file, hai nơi đọc)
 *   - biến môi trường:   GSC_SIM_CLIENT_EMAIL, GSC_SIM_PRIVATE_KEY
 * Sửa danh sách thì sửa file JSON, KHÔNG copy sang đây.
 *
 * VÌ SAO CÓ FILE NÀY khi đã có CLI: CLI chỉ chạy được từ máy có `.env.local`, nên
 * chủ shop không xem được. Route `/api/admin/seo-rank` + bảng trong `/admin/seo`
 * là đường để chủ shop tự đọc. Hai bên KHÔNG chia tầng thứ hạng riêng: route trả
 * số `hang` thô, việc tô màu do UI quyết — nhờ vậy không có hai bảng ngưỡng để
 * lệch nhau.
 *
 * GIỚI HẠN của số liệu (phải nói lại ở UI): GSC chỉ có dữ liệu cho truy vấn site
 * ĐÃ TỪNG hiện ra. Từ khoá chưa bao giờ có impression sẽ không có dòng nào — ô
 * thứ hạng trống KHÔNG phải "hạng kém". Và `position` là VỊ TRÍ TRUNG BÌNH có
 * trọng số theo impression trong cả kỳ, nên 1,4 nghĩa là phần lớn lần hiện ở
 * hạng 1-2.
 */

import { createSign } from "node:crypto";
import keywordsFile from "../../scripts/seo/keywords.json";

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const CHO_MS = 20_000;

export interface TuKhoaMucTieu {
  tuKhoa: string;
  nhom: string;
  urlDich: string;
  /** "co" = trang đã có · "moi-p" = cần trang programmatic · "moi-b" = cần viết mới */
  trangThai: string;
  ghiChu?: string;
}

export interface HangTuKhoa extends TuKhoaMucTieu {
  /** Vị trí trung bình có trọng số impression. `null` = GSC không có dòng nào. */
  hang: number | null;
  /** URL đang thật sự xếp hạng cho truy vấn này (nhiều impression nhất). */
  urlThucTe: string | null;
  hienThi: number;
  click: number;
  /** URL thật khác trang đích → hai trang đang tranh nhau cùng một cụm. */
  lechUrl: boolean;
}

export interface KetQuaHang {
  daNoiGsc: boolean;
  /** Tên biến còn thiếu — chỉ TÊN, không bao giờ là giá trị. */
  thieuBien: string[];
  site: string | null;
  khoang: { tuNgay: string; denNgay: string } | null;
  soNgay: number;
  tuKhoa: HangTuKhoa[];
  loi: string | null;
}

const BIEN = { email: "GSC_SIM_CLIENT_EMAIL", key: "GSC_SIM_PRIVATE_KEY" } as const;

export const danhSachTuKhoa = (): TuKhoaMucTieu[] =>
  ((keywordsFile as { keywords?: TuKhoaMucTieu[] }).keywords ?? []).map((k) => ({
    tuKhoa: k.tuKhoa,
    nhom: k.nhom ?? "",
    urlDich: k.urlDich ?? "",
    trangThai: k.trangThai ?? "co",
    ghiChu: k.ghiChu,
  }));

const thieuBien = (): string[] =>
  [BIEN.email, BIEN.key].filter((b) => !String(process.env[b] ?? "").trim());

const b64url = (buf: Buffer | string): string =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** GSC tính ngày theo giờ Thái Bình Dương — sinh chuỗi ngày theo đúng múi đó. */
const ngayPT = (lui: number): string =>
  new Date(Date.now() - lui * 86_400_000).toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });

const layAccessToken = async (): Promise<string> => {
  const email = process.env[BIEN.email] as string;
  // Trên Vercel private key thường dán một dòng với "\n" literal.
  const key = String(process.env[BIEN.key]).replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(sign.sign(key))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(CHO_MS),
  });
  const data = (await res.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Không lấy được access token (HTTP ${res.status}): ${data.error_description ?? data.error ?? "không rõ"}`,
    );
  }
  return data.access_token;
};

/**
 * Tìm property của chonsomobifone.com trong danh sách service account được cấp
 * quyền. Search Console có hai dạng property tên khác nhau hoàn toàn
 * (`sc-domain:...` vs `https://www.../`) nên đoán sai là 404 mà không nói vì sao.
 */
const chonProperty = async (token: string): Promise<string> => {
  const res = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(CHO_MS),
  });
  if (!res.ok) throw new Error(`Không đọc được danh sách property (HTTP ${res.status})`);

  const danh = (((await res.json()) as { siteEntry?: { siteUrl: string }[] }).siteEntry ?? []).map(
    (s) => s.siteUrl,
  );
  if (!danh.length) {
    throw new Error(
      "Service account chưa được cấp quyền trên property nào. Search Console → Cài đặt → " +
        "Người dùng và quyền → thêm email service account.",
    );
  }
  const ghim = String(process.env.GSC_SIM_SITE_URL ?? "").trim();
  if (ghim && danh.includes(ghim)) return ghim;

  const khop = danh.find((u) => u.includes("chonsomobifone.com"));
  if (!khop) {
    throw new Error(
      `Service account có quyền trên: ${danh.join(", ")} — nhưng không property nào là chonsomobifone.com.`,
    );
  }
  return khop;
};

const chuanHoa = (s: string): string => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Đọc thứ hạng cho toàn bộ danh sách từ khoá trong `soNgay` ngày gần nhất. */
export const docThuHang = async (soNgay = 28): Promise<KetQuaHang> => {
  const ds = danhSachTuKhoa();
  const thieu = thieuBien();
  const rong: KetQuaHang = {
    daNoiGsc: false,
    thieuBien: thieu,
    site: null,
    khoang: null,
    soNgay,
    tuKhoa: ds.map((k) => ({ ...k, hang: null, urlThucTe: null, hienThi: 0, click: 0, lechUrl: false })),
    loi: null,
  };
  if (thieu.length) return rong;

  try {
    const token = await layAccessToken();
    const site = await chonProperty(token);
    // Bỏ "hôm nay" (lùi 0): GSC chưa có dữ liệu.
    const khoang = { startDate: ngayPT(soNgay + 1), endDate: ngayPT(1) };

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...khoang,
          dimensions: ["query", "page"],
          rowLimit: 25_000,
          dataState: "final",
        }),
        signal: AbortSignal.timeout(CHO_MS),
      },
    );
    if (!res.ok) {
      const chiTiet = (await res.text().catch(() => "")).slice(0, 200);
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Search Console từ chối (${res.status}). Kiểm quyền của service account. ${chiTiet}`);
      }
      throw new Error(`Search Console lỗi HTTP ${res.status}. ${chiTiet}`);
    }

    type Row = { keys: [string, string]; position: number; impressions: number; clicks: number };
    const rows = (((await res.json()) as { rows?: Row[] }).rows ?? []) as Row[];

    // Một truy vấn khớp nhiều URL — giữ URL nhiều impression nhất.
    const theoTuKhoa = new Map<string, Row>();
    for (const r of rows) {
      const k = chuanHoa(r.keys[0]);
      const cu = theoTuKhoa.get(k);
      if (!cu || r.impressions > cu.impressions) theoTuKhoa.set(k, r);
    }

    return {
      daNoiGsc: true,
      thieuBien: [],
      site,
      khoang: { tuNgay: khoang.startDate, denNgay: khoang.endDate },
      soNgay,
      loi: null,
      tuKhoa: ds.map((k) => {
        const d = theoTuKhoa.get(chuanHoa(k.tuKhoa));
        const urlThucTe = d ? d.keys[1] : null;
        return {
          ...k,
          hang: d ? Number(d.position.toFixed(1)) : null,
          urlThucTe,
          hienThi: d ? d.impressions : 0,
          click: d ? d.clicks : 0,
          lechUrl: Boolean(k.urlDich && urlThucTe && !urlThucTe.includes(k.urlDich)),
        };
      }),
    };
  } catch (e) {
    return { ...rong, daNoiGsc: true, loi: e instanceof Error ? e.message : String(e) };
  }
};
