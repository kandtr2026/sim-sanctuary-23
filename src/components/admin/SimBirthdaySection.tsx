"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarHeart,
  Check,
  Copy,
  Download,
  Loader2,
  MessageSquareQuote,
  Package,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { BarList } from "./BarList";
import { StatCard } from "./StatCard";
import { cn } from "@/lib/utils";

/**
 * Tab "Sim sinh nhật" — dự án ghép khách có ngày sinh với sim mang đúng ngày đó.
 *
 * ⚠️ Dự án RIÊNG chạy song song với kho số đang bán. Số liệu ở đây đọc từ hai
 * bảng `sim_birthday_*`, KHÔNG dính tới bảng `sims` của web và không được trộn
 * vào đó cho tới khi A Khoa lệnh sáp nhập.
 *
 * Mọi phép ghép chạy trong SQL, màn này chỉ gửi bộ lọc lên rồi vẽ lại — đổi
 * ngưỡng hay dải năm là thấy kết quả ngay, không phải chạy lại script dưới máy.
 */

interface KichBan {
  ma: string;
  ten: string;
  mo_ta: string;
  thu_tu: number;
  suc_manh: "manh" | "kha" | "loang";
  so_khach: number;
  so_sim: number;
  so_cap: number;
}

interface ThongKe {
  tong: {
    kho: number;
    kho_hop_le: number;
    kho_co_gia: number;
    khach_tat_ca: number;
    khach_sau_loc: number;
    khach_tron_ngay: number;
    khach_bat_ky: number;
  };
  kich_ban: KichBan[];
  phan_bo_nam: { nam: number; so_khach: number }[];
  phan_bo_dau_so: { dau_so: string; so_khach: number }[];
}

interface TopSim {
  digits: string;
  dau_so: string;
  duoi6: string;
  ngay_dai_dien: string;
  gia: number | null;
  so_khach: number;
}

interface KhachRow {
  msisdn: string;
  dob: string;
  dau_so: string;
  so_sim: number;
  sim_goi_y: string | null;
}

/** Khách đang dùng số có đuôi là chính ngày sinh của mình (#41). */
interface TuTrungRow {
  msisdn: string;
  dob: string;
  loai: string;
  tong: number;
}

/**
 * Khách có 6 số đuôi SĐT đang dùng trùng ĐÚNG số trong kho chonso (cả kho web
 * lẫn kho sinh nhật) — A Khoa yêu cầu tách mục riêng. `so_web`/`so_sn` là các số
 * kho chonso trùng đuôi để Sale chào.
 */
interface TrungKhoRow {
  msisdn: string;
  dob: string;
  duoi6: string;
  so_web: string[];
  so_sn: string[];
  tong: number;
}

const NHAN_LOAI: Record<string, string> = {
  ddmmyy: "Trùng ngày sinh",
  yymmdd: "Ngược yy-mm-dd",
  ddmm: "Ngày + tháng",
};

/** Trạng thái check Zalo của khách (#47) — 3 trạng thái, tách màu rõ. */
const NHAN_TT: Record<string, { label: string; cls: string }> = {
  chua_check: { label: "Chưa check Zalo", cls: "bg-gold/15 text-gold" },
  co_zalo: { label: "Zalo OK", cls: "bg-emerald-500/15 text-emerald-400" },
  ko_zalo: { label: "Ko có Zalo", cls: "bg-primary/15 text-primary" },
};

const NGUONG_LO = [
  { v: 0, label: "Lấy tất", mo_ta: "kể cả sim đại lý đăng ký hàng loạt" },
  { v: 100, label: "Lọc nhẹ", mo_ta: "bỏ số dính sát nhau dưới 100 đơn vị" },
  { v: 1000, label: "Khuyến nghị", mo_ta: "bỏ sạch lô đại lý, giữ người thật" },
  { v: 10000, label: "Khắt khe", mo_ta: "chỉ giữ số thật sự rời rạc" },
];

/**
 * Câu chào mẫu theo từng kịch bản. ⚠️ Góp ý #50: KHÔNG nhắc "ngày sinh / sinh
 * nhật của anh/chị" (nhạy cảm) — đảo thành "bên em chuyên sim số ngày tháng" rồi
 * để số tự nói. Đuôi số vẫn đúng ngày của khách, khách tự nhận ra.
 */
const CAU_CHAO: Record<string, string> = {
  ddmmyy: "Chào anh/chị, bên em chuyên sim số dạng ngày tháng của các nhà mạng — có số {sim}, anh/chị xem thử ạ.",
  yymmdd: "Chào anh/chị, bên em có sim số dạng ngày tháng {sim}, em gửi anh/chị tham khảo.",
  ddmm: "Chào anh/chị, bên em chuyên sim số ngày tháng — đang có số {sim}, anh/chị ngắm thử nhé.",
};

const NHAN_SUC_MANH: Record<string, { text: string; cls: string }> = {
  manh: { text: "Mạnh", cls: "bg-gold/15 text-gold" },
  kha: { text: "Khá", cls: "bg-primary/10 text-primary" },
  loang: { text: "Loãng", cls: "bg-muted text-muted-foreground" },
};

const soVn = (n: number) => n.toLocaleString("vi-VN");

/**
 * Kiểu SĐT KHÁCH (#45): tô vàng + glow để tách khỏi số sim chào bán / số khác.
 * Dùng ở mọi chỗ hiện số điện thoại của chính khách.
 */
const CLS_SDT_KHACH = "font-mono font-bold text-gold [text-shadow:0_0_8px_rgba(245,179,1,0.55)]";

/**
 * Mẫu tin nhắn Zalo XOAY VÒNG: mỗi khách lấy 1 mẫu theo chỉ số toàn cục nên tin
 * gửi ra không lặp y hệt liên tục → nền tảng đỡ gắn cờ spam (góp ý #39).
 *
 * ⚠️ Góp ý #50: TUYỆT ĐỐI không nhắc "ngày sinh / trùng ngày sinh của anh/chị"
 * (thông tin nhạy cảm — khách thấy mình bị soi ngày sinh sẽ ngại). Đảo thành
 * "bên em chuyên cung cấp sim số ngày tháng của các nhà mạng" rồi list số ra;
 * đuôi số vẫn đúng ngày của khách nên khách tự nhận ra, mình không cần nói.
 * Chỉ còn placeholder {ds} = danh sách số. Thêm/sửa mẫu tuỳ ý — càng nhiều càng đỡ trùng.
 */
const MAU_TIN_NHAN: string[] = [
  "Chào anh/chị 👋 Bên em chuyên cung cấp sim số đẹp dạng ngày tháng của các nhà mạng. Hiện bên em còn mấy số này: {ds}. Anh/chị xem có số nào ưng em giữ liền cho mình nhé!",
  "Dạ em chào anh/chị. Bên em chuyên sim số ngày tháng đủ các nhà mạng, đang có sẵn: {ds}. Anh/chị tham khảo giúp em nha.",
  "Anh/chị ơi, bên em có mấy sim số dạng ngày tháng khá đẹp: {ds}. Số nào hợp anh/chị nhắn em để lại giá tốt ạ.",
  "Gửi anh/chị vài sim số đẹp dạng ngày tháng bên em đang có: {ds}. Cần em tư vấn thêm cứ nhắn nhé 😊",
  "Em chào anh/chị ạ. Bên em chuyên cung cấp sim số ngày tháng của các nhà mạng, hiện còn: {ds}. Anh/chị ngắm thử xem có số nào ưng không ạ?",
  "Anh/chị xem giúp em mấy số này với, sim số dạng ngày tháng bên em: {ds}. Có số nào thích em ưu tiên giữ cho mình.",
  "Dạ bên em có sẵn ít sim số đẹp ngày tháng: {ds}. Anh/chị tham khảo, ưng số nào em gửi thông tin chi tiết nha.",
  "Chào anh/chị, bên em chuyên sim số ngày tháng các nhà mạng. Vài số đang có: {ds}. Anh/chị cần số nào cứ nhắn em ạ 👍",
];

/** Tách chuỗi sim_goi_y ("093…, 093…") thành mảng số. */
const dsSoTuGoiY = (goiY: string | null): string[] =>
  (goiY ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** dob 'YYYY-MM-DD' → 'DD/MM/YYYY'. */
const ngaySinhVn = (dob: string): string => {
  const [y, m, d] = dob.split("-");
  return d && m && y ? `${d}/${m}/${y}` : dob;
};

/** ISO → giờ VN "HH:mm:ss" (có giây theo yêu cầu #53). */
const gioVn = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(d);
};

/** ISO → "HH:mm:ss DD/MM" giờ VN (cho dòng log đầy đủ). */
const gioNgayVn = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "2-digit", month: "2-digit", hour12: false,
  }).format(d).replace(",", "");
};

/**
 * Chấm số để lộ rõ ngày sinh (góp ý #40): 6 số cuối (ddmmyy/yymmdd) hay 4 số cuối
 * (ddmm) tách theo cặp — vd 0938150701 → 0938.15.07.01, thấy ngay là ngày sinh.
 */
const chamSo = (digits: string, kb: string): string => {
  const n = kb === "ddmm" ? 4 : 6;
  if (!digits || digits.length <= n) return digits;
  const head = digits.slice(0, digits.length - n);
  const nhom = (digits.slice(-n).match(/.{2}/g) ?? []).join(".");
  return `${head}.${nhom}`;
};

/**
 * Đuôi cần so khớp với KHO WEB theo kịch bản (góp ý #50): ddmmyy/yymmdd → 6 số,
 * ddmm → 4 số. Cùng luật với đuôi mà kho sinh nhật đã ghép, để hai nguồn số nói
 * về cùng một "ngày tháng" của khách.
 */
const duoiTheoDob = (dob: string, kb: string): string => {
  const [y, m, d] = dob.split("-");
  if (!y || !m || !d) return "";
  const yy = y.slice(-2);
  if (kb === "yymmdd") return `${yy}${m}${d}`;
  if (kb === "ddmm") return `${d}${m}`;
  return `${d}${m}${yy}`; // ddmmyy (mặc định)
};

/**
 * Dựng tin nhắn cho 1 khách theo mẫu xoay vòng (chỉ số toàn cục để đỡ trùng).
 * `dsSo` đã gộp sẵn số kho sinh nhật + số Available khớp trên kho web (#50).
 */
const soanTin = (chiSo: number, dsSo: string[], kb: string): string =>
  MAU_TIN_NHAN[chiSo % MAU_TIN_NHAN.length].replace(
    "{ds}",
    dsSo.map((s) => chamSo(s, kb)).join(", "),
  );

/**
 * Mẫu tin cho mục "trùng 6 số đuôi với kho": chào số kho chonso có đuôi giống
 * đuôi số khách đang dùng. Xoay vòng đỡ spam. {d6} = 6 số đuôi, {ds} = danh sách số.
 */
const MAU_TIN_TRUNG: string[] = [
  "Chào anh/chị 👋 Bên em có mấy sim số đẹp đuôi {d6} dễ nhớ: {ds}. Anh/chị xem có số nào ưng em giữ liền cho mình nhé!",
  "Dạ em chào anh/chị. Bên em đang có sim đuôi {d6} khá đẹp: {ds}. Anh/chị tham khảo giúp em nha.",
  "Anh/chị ơi, bên em có số đuôi {d6}: {ds}. Số nào hợp anh/chị nhắn em để lại giá tốt ạ.",
  "Gửi anh/chị vài số đẹp đuôi {d6} bên em đang có: {ds}. Cần em tư vấn thêm cứ nhắn nhé 😊",
];

/** Đuôi 6 số chấm thành cặp cho dễ đọc (0775000886 → 0775.00.08.86). */
const cham6 = (digits: string): string => chamSo(digits, "ddmmyy");

const soanTinTrung = (chiSo: number, d6: string, dsSo: string[]): string =>
  MAU_TIN_TRUNG[chiSo % MAU_TIN_TRUNG.length]
    .replace("{d6}", d6)
    .replace("{ds}", dsSo.map(cham6).join(", "));

/**
 * Dãy số part cần hiện (1-based): luôn có 1, part cuối, và cửa sổ quanh part hiện
 * tại; chèn '…' vào chỗ đứt để không phải in cả trăm nút (#42).
 */
const danhSachPart = (cur: number, tong: number): (number | "…")[] => {
  const co = new Set<number>();
  for (const p of [1, tong, cur - 2, cur - 1, cur, cur + 1, cur + 2]) {
    if (p >= 1 && p <= tong) co.add(p);
  }
  const arr = [...co].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i]);
    if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
  }
  return out;
};

/** Phân trang part có ĐÁNH SỐ (part 1, part 2…) + nhảy nhanh — dùng cho mọi list. */
function PartNav({ part, soPart, doiPart }: { part: number; soPart: number; doiPart: (p: number) => void }) {
  const cur = part + 1;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={part === 0}
        onClick={() => doiPart(part - 1)}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
      >
        ← Trước
      </button>
      {danhSachPart(cur, soPart).map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-0.5 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => doiPart(n - 1)}
            aria-current={n === cur ? "page" : undefined}
            title={`Part ${n}`}
            className={cn(
              "min-w-[30px] rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
              n === cur ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/40",
            )}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={part >= soPart - 1}
        onClick={() => doiPart(part + 1)}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
      >
        Sau →
      </button>
      {soPart > 10 && (
        <input
          type="number"
          min={1}
          max={soPart}
          placeholder="tới part…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = Number((e.target as HTMLInputElement).value);
              if (v >= 1 && v <= soPart) doiPart(v - 1);
            }
          }}
          className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-xs tabular-nums text-foreground"
        />
      )}
    </div>
  );
}

/**
 * TẠM ẨN phần "ghép kịch bản" (góp ý #38): A Khoa muốn ẩn từ dòng "Năm sinh"
 * trong bộ lọc trở xuống (kịch bản ghép / chi tiết / phân bố) để nêu lại kịch bản
 * dần dần. Code giữ NGUYÊN — chỉ không render. Đổi thành true để hiện lại.
 */
const HIEN_GHEP = false;

export function SimBirthdaySection({ token }: { token?: string }) {
  const [nguongLo, setNguongLo] = useState(1000);
  const [namTu, setNamTu] = useState(1950);
  const [namDen, setNamDen] = useState(2015);
  const [bo0101, setBo0101] = useState(false);
  const [dauSo, setDauSo] = useState<string[]>([]);
  const [kichBan, setKichBan] = useState("ddmmyy");

  const [thongKe, setThongKe] = useState<ThongKe | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const [topSim, setTopSim] = useState<TopSim[]>([]);
  const [khach, setKhach] = useState<KhachRow[]>([]);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [dangXuat, setDangXuat] = useState(false);

  // Outreach (#39): danh sách khách theo part 100 để Sale gửi Zalo từng người.
  const [part, setPart] = useState(0);
  const [dsKhach, setDsKhach] = useState<KhachRow[]>([]);
  const [dangTaiDs, setDangTaiDs] = useState(false);
  const [daCopy, setDaCopy] = useState<string | null>(null);
  // Số Available khớp đuôi trên KHO WEB (#50): map đuôi → danh sách raw_digits.
  const [khoKhop, setKhoKhop] = useState<Record<string, string[]>>({});

  // Khách tự-trùng: đang dùng số có đuôi là ngày sinh của chính họ (#41).
  const [tuTrung, setTuTrung] = useState<TuTrungRow[]>([]);
  const [partTt, setPartTt] = useState(0);
  const [dangTaiTt, setDangTaiTt] = useState(false);

  // Khách trùng 6 số đuôi với kho chonso (mục mới): part 100, lọc lô theo nguongLo.
  const [trungKho, setTrungKho] = useState<TrungKhoRow[]>([]);
  const [partTk, setPartTk] = useState(0);
  const [dangTaiTk, setDangTaiTk] = useState(false);

  // Trạng thái khách: cờ Ko Zalo (#43) + Đã gửi (#46). Lọc theo trạng thái.
  const [koZalo, setKoZalo] = useState<Set<string>>(new Set());
  const [coZalo, setCoZalo] = useState<Set<string>>(new Set());
  // Cờ ĐỘC LẬP "đã bấm Mở Zalo" (#52): để lần sau biết số nào đã tiếp xúc.
  const [daMo, setDaMo] = useState<Set<string>>(new Set());
  // "Đã gửi tin Zalo" (#53): lưu lúc gửi + user bấm để hiện log.
  const [daNhan, setDaNhan] = useState<Record<string, { at: string; by: string | null }>>({});
  const [locTt, setLocTt] = useState<"all" | "chua_check" | "co_zalo" | "ko_zalo">("all");

  const query = useMemo(() => {
    const p = new URLSearchParams({
      nguong_lo: String(nguongLo),
      nam_tu: String(namTu),
      nam_den: String(namDen),
    });
    if (bo0101) p.set("bo_0101", "1");
    if (dauSo.length) p.set("dau_so", dauSo.join(","));
    return p.toString();
  }, [nguongLo, namTu, namDen, bo0101, dauSo]);

  const goi = useCallback(
    async <T,>(duong: string): Promise<T> => {
      const res = await fetch(duong, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      return (await res.json()) as T;
    },
    [token],
  );

  // Thống kê tổng + mọi kịch bản. Dải năm gõ tay nên hoãn một nhịp cho khỏi
  // bắn request theo từng phím.
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!token) return;
    if (hen.current) clearTimeout(hen.current);
    hen.current = setTimeout(() => {
      setDangTai(true);
      setLoi(null);
      goi<ThongKe>(`/api/admin/sim-birthday?${query}`)
        .then(setThongKe)
        .catch((e: unknown) => setLoi(e instanceof Error ? e.message : "Không tải được số liệu"))
        .finally(() => setDangTai(false));
    }, 350);
    return () => {
      if (hen.current) clearTimeout(hen.current);
    };
  }, [token, query, goi]);

  // Chi tiết kịch bản đang chọn: số nào đắt khách nhất + vài khách đầu danh sách.
  useEffect(() => {
    if (!token) return;
    let bo = false;
    setDangTaiChiTiet(true);
    Promise.all([
      goi<{ rows: TopSim[] }>(`/api/admin/sim-birthday?view=top-sim&kich_ban=${kichBan}&limit=20&${query}`),
      goi<{ rows: KhachRow[] }>(
        `/api/admin/sim-birthday?view=khach&kich_ban=${kichBan}&limit=20&moi_ngay=1&${query}`,
      ),
    ])
      .then(([a, b]) => {
        if (bo) return;
        setTopSim(a.rows ?? []);
        setKhach(b.rows ?? []);
      })
      .catch(() => {
        if (!bo) {
          setTopSim([]);
          setKhach([]);
        }
      })
      .finally(() => {
        if (!bo) setDangTaiChiTiet(false);
      });
    return () => {
      bo = true;
    };
  }, [token, kichBan, query, goi]);

  // Đổi kịch bản / bộ lọc thì về part đầu (offset cũ có thể vượt tổng khách).
  useEffect(() => {
    setPart(0);
  }, [kichBan, query]);

  // Nạp 100 khách của part đang xem (không dùng moi_ngay — lấy đủ danh sách).
  useEffect(() => {
    if (!token) return;
    let bo = false;
    setDangTaiDs(true);
    goi<{ rows: KhachRow[] }>(
      `/api/admin/sim-birthday?view=khach&kich_ban=${kichBan}&limit=100&offset=${part * 100}&${query}`,
    )
      .then((r) => { if (!bo) setDsKhach(r.rows ?? []); })
      .catch(() => { if (!bo) setDsKhach([]); })
      .finally(() => { if (!bo) setDangTaiDs(false); });
    return () => { bo = true; };
  }, [token, kichBan, query, part, goi]);

  // Nạp số Available khớp đuôi ngày tháng trên KHO WEB cho part đang xem (#50):
  // gom các đuôi khác nhau của 100 khách rồi hỏi một lần, nhét vào tin cho Sale.
  useEffect(() => {
    if (!token || dsKhach.length === 0) {
      setKhoKhop({});
      return;
    }
    const duoi = [...new Set(dsKhach.map((k) => duoiTheoDob(k.dob, kichBan)).filter(Boolean))];
    if (duoi.length === 0) {
      setKhoKhop({});
      return;
    }
    let bo = false;
    goi<{ khop: Record<string, string[]> }>(
      `/api/admin/sim-birthday?view=kho-khop&duoi=${duoi.join(",")}`,
    )
      .then((r) => { if (!bo) setKhoKhop(r.khop ?? {}); })
      .catch(() => { if (!bo) setKhoKhop({}); });
    return () => { bo = true; };
  }, [token, dsKhach, kichBan, goi]);

  // Nạp khách tự-trùng (part 100). Không phụ thuộc bộ lọc kịch bản.
  useEffect(() => {
    if (!token) return;
    let bo = false;
    setDangTaiTt(true);
    goi<{ rows: TuTrungRow[] }>(`/api/admin/sim-birthday?view=tu-trung&limit=100&offset=${partTt * 100}`)
      .then((r) => { if (!bo) setTuTrung(r.rows ?? []); })
      .catch(() => { if (!bo) setTuTrung([]); })
      .finally(() => { if (!bo) setDangTaiTt(false); });
    return () => { bo = true; };
  }, [token, partTt, goi]);

  // Đổi ngưỡng lô (query) thì mục trùng-kho về part đầu (tổng khách đổi).
  useEffect(() => { setPartTk(0); }, [query]);

  // Nạp khách trùng 6 số đuôi với kho (part 100). Chỉ dùng nguong_lo trong query.
  useEffect(() => {
    if (!token) return;
    let bo = false;
    setDangTaiTk(true);
    goi<{ rows: TrungKhoRow[] }>(
      `/api/admin/sim-birthday?view=trung-kho&limit=100&offset=${partTk * 100}&${query}`,
    )
      .then((r) => { if (!bo) setTrungKho(r.rows ?? []); })
      .catch(() => { if (!bo) setTrungKho([]); })
      .finally(() => { if (!bo) setDangTaiTk(false); });
    return () => { bo = true; };
  }, [token, partTk, query, goi]);

  // Nạp trạng thái đã gắn (Ko Zalo + Đã gửi) một lần.
  useEffect(() => {
    if (!token) return;
    goi<{ rows: string[] }>("/api/admin/sim-birthday/trang-thai?loai=ko_zalo")
      .then((r) => setKoZalo(new Set(r.rows ?? [])))
      .catch(() => {});
    goi<{ rows: string[] }>("/api/admin/sim-birthday/trang-thai?loai=co_zalo")
      .then((r) => setCoZalo(new Set(r.rows ?? [])))
      .catch(() => {});
    goi<{ rows: string[] }>("/api/admin/sim-birthday/trang-thai?loai=da_mo")
      .then((r) => setDaMo(new Set(r.rows ?? [])))
      .catch(() => {});
    goi<{ rows: { msisdn: string; created_at: string; created_by: string | null }[] }>(
      "/api/admin/sim-birthday/trang-thai?loai=da_nhan&full=1",
    )
      .then((r) => {
        const m: Record<string, { at: string; by: string | null }> = {};
        for (const row of r.rows ?? []) m[row.msisdn] = { at: row.created_at, by: row.created_by };
        setDaNhan(m);
      })
      .catch(() => {});
  }, [token, goi]);

  // Đánh dấu "đã mở Zalo" khi Sale bấm Mở Zalo (#52) — chỉ thêm, không gỡ, để
  // luôn nhớ số đã tiếp xúc. Optimistic; idempotent (upsert theo msisdn).
  const danhDauDaMo = (msisdn: string) => {
    if (daMo.has(msisdn)) return;
    setDaMo((s) => new Set(s).add(msisdn));
    fetch("/api/admin/sim-birthday/trang-thai", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ msisdn, loai: "da_mo" }),
    }).catch(() => {});
  };

  // Bấm "Đã gửi Zalo" (#53): toggle. Bật → ghi giờ + user (server trả về);
  // bấm lại → gỡ (sửa lỡ tay). Optimistic, có giờ tạm trước khi server phản hồi.
  const danhDauDaNhan = async (msisdn: string) => {
    const dangCo = Boolean(daNhan[msisdn]);
    if (dangCo) {
      setDaNhan((m) => {
        const n = { ...m };
        delete n[msisdn];
        return n;
      });
      fetch("/api/admin/sim-birthday/trang-thai", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ msisdn, loai: "da_nhan" }),
      }).catch(() => {});
      return;
    }
    setDaNhan((m) => ({ ...m, [msisdn]: { at: new Date().toISOString(), by: null } }));
    try {
      const res = await fetch("/api/admin/sim-birthday/trang-thai", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ msisdn, loai: "da_nhan" }),
      });
      const d = (await res.json().catch(() => ({}))) as { created_at?: string; created_by?: string | null };
      if (res.ok && d.created_at) {
        setDaNhan((m) => ({ ...m, [msisdn]: { at: d.created_at as string, by: d.created_by ?? null } }));
      }
    } catch {
      toast.error("Không lưu được 'đã gửi'.");
    }
  };

  // Đặt trạng thái check Zalo (#47): 3 trạng thái LOẠI TRỪ nhau — chua_check /
  // co_zalo / ko_zalo. Set cái được chọn, xoá cái kia (cả local lẫn DB), optimistic.
  const datTrangThai = async (msisdn: string, tt: "chua_check" | "co_zalo" | "ko_zalo") => {
    setCoZalo((s) => {
      const n = new Set(s);
      if (tt === "co_zalo") n.add(msisdn);
      else n.delete(msisdn);
      return n;
    });
    setKoZalo((s) => {
      const n = new Set(s);
      if (tt === "ko_zalo") n.add(msisdn);
      else n.delete(msisdn);
      return n;
    });
    const goiCo = (loai: "co_zalo" | "ko_zalo", bat: boolean) =>
      fetch("/api/admin/sim-birthday/trang-thai", {
        method: bat ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ msisdn, loai }),
      });
    try {
      const [a, b] = await Promise.all([goiCo("co_zalo", tt === "co_zalo"), goiCo("ko_zalo", tt === "ko_zalo")]);
      if (!a.ok || !b.ok) throw new Error("save");
    } catch {
      toast.error("Không lưu được trạng thái.");
      // Nạp lại từ server cho khớp thật.
      goi<{ rows: string[] }>("/api/admin/sim-birthday/trang-thai?loai=co_zalo").then((r) => setCoZalo(new Set(r.rows ?? []))).catch(() => {});
      goi<{ rows: string[] }>("/api/admin/sim-birthday/trang-thai?loai=ko_zalo").then((r) => setKoZalo(new Set(r.rows ?? []))).catch(() => {});
    }
  };

  const trangThaiKhach = (msisdn: string): "ko_zalo" | "co_zalo" | "chua_check" =>
    koZalo.has(msisdn) ? "ko_zalo" : coZalo.has(msisdn) ? "co_zalo" : "chua_check";
  const khopLoc = (msisdn: string) => locTt === "all" || trangThaiKhach(msisdn) === locTt;

  const copyTin = async (msisdn: string, tin: string) => {
    try {
      await navigator.clipboard.writeText(tin);
      setDaCopy(msisdn);
      setTimeout(() => setDaCopy((v) => (v === msisdn ? null : v)), 1500);
    } catch {
      toast.error("Trình duyệt chặn sao chép — copy tay giúp em.");
    }
  };

  const xuatCsv = async () => {
    if (!token) return;
    setDangXuat(true);
    const t = toast.loading("Đang gom danh sách khách…");
    try {
      const res = await fetch(`/api/admin/sim-birthday/export?kich_ban=${kichBan}&${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const dem = res.headers.get("X-Row-Count") ?? "";
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = /filename="?([^"]+)"?/.exec(cd);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = m?.[1] || `sim-birthday_${kichBan}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(dem ? `Đã xuất ${soVn(Number(dem))} khách` : "Đã xuất danh sách", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xuất thất bại", { id: t });
    } finally {
      setDangXuat(false);
    }
  };

  const tong = thongKe?.tong;
  const kbDangChon = thongKe?.kich_ban.find((k) => k.ma === kichBan);
  const soPart = Math.max(1, Math.ceil((kbDangChon?.so_khach ?? 0) / 100));
  const tongTt = tuTrung[0]?.tong ?? 0;
  const soPartTt = Math.max(1, Math.ceil(tongTt / 100));
  const tongTk = trungKho[0]?.tong ?? 0;
  const soPartTk = Math.max(1, Math.ceil(tongTk / 100));
  const dsHienThi = dsKhach.filter((kh) => khopLoc(kh.msisdn));
  const ttHienThi = tuTrung.filter((kh) => khopLoc(kh.msisdn));
  const tkHienThi = trungKho.filter((kh) => khopLoc(kh.msisdn));
  const dauSoPhoBien = (thongKe?.phan_bo_dau_so ?? []).filter((d) => d.so_khach >= 1000);

  return (
    <div className="space-y-6">
      {/* Nhắc rõ ranh giới dự án — kẻo sau này có người tưởng đây là kho đang bán */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-gold">Dự án riêng.</strong> Kho sim và danh sách khách ở tab này
        nằm tách hẳn kho số đang bán trên web — không số nào của tab này xuất hiện ngoài
        storefront, và cũng không trộn ngược lại. Khi nào A Khoa lệnh sáp nhập thì mới tính.
      </div>

      {/* ── Thẻ tổng quan ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kho sim ngày sinh"
          value={tong ? soVn(tong.kho) : "—"}
          sub={tong ? `${soVn(tong.kho_hop_le)} số có đuôi là ngày có thật` : undefined}
          icon={Package}
        />
        <StatCard
          label="Khách sau khi lọc"
          value={tong ? soVn(tong.khach_sau_loc) : "—"}
          sub={tong ? `trên tổng ${soVn(tong.khach_tat_ca)} thuê bao có ngày sinh` : undefined}
          icon={Users}
        />
        <StatCard
          label="Trùng trọn ngày sinh"
          value={tong ? soVn(tong.khach_tron_ngay) : "—"}
          sub="nhóm đáng gọi trước nhất"
          icon={CalendarHeart}
          iconClass="bg-gold/15 text-gold"
          valueClass="text-gold"
        />
        <StatCard
          label="Chào được (mọi kịch bản)"
          value={tong ? soVn(tong.khach_bat_ky) : "—"}
          sub={
            tong && tong.khach_sau_loc > 0
              ? `${Math.round((tong.khach_bat_ky / tong.khach_sau_loc) * 100)}% số khách đã lọc`
              : undefined
          }
          icon={Target}
        />
      </div>

      {/* ── Bộ lọc chất lượng khách ── */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="text-sm font-semibold text-foreground">Lọc khách trước khi ghép</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Hơn nửa danh sách gốc là sim đại lý đăng ký hàng loạt — cả lô cùng một ngày sinh do
          người ta gõ cho có, số thì nối đuôi nhau. Ngưỡng dưới đây đo khoảng cách dãy số tới
          thuê bao gần nhất cùng ngày sinh: càng xa càng giống người thật.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Lọc lô đại lý</span>
            <div className="flex flex-wrap gap-1.5">
              {NGUONG_LO.map((n) => (
                <button
                  key={n.v}
                  type="button"
                  onClick={() => setNguongLo(n.v)}
                  title={n.mo_ta}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    nguongLo === n.v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {HIEN_GHEP && (
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Năm sinh</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={namTu}
                min={1900}
                max={2100}
                onChange={(e) => setNamTu(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs tabular-nums text-foreground"
              />
              <span className="text-xs text-muted-foreground">đến</span>
              <input
                type="number"
                value={namDen}
                min={1900}
                max={2100}
                onChange={(e) => setNamDen(Number(e.target.value))}
                className="w-20 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs tabular-nums text-foreground"
              />
            </div>
          </div>
          )}

          {HIEN_GHEP && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={bo0101}
              onChange={(e) => setBo0101(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border"
            />
            Bỏ người khai sinh 01/01
          </label>
          )}
        </div>

        {HIEN_GHEP && dauSoPhoBien.length > 0 && (
          <div className="mt-4">
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Đầu số khách {dauSo.length > 0 && `(đang chọn ${dauSo.length})`}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dauSoPhoBien.map((d) => {
                const chon = dauSo.includes(d.dau_so);
                return (
                  <button
                    key={d.dau_so}
                    type="button"
                    onClick={() =>
                      setDauSo((prev) =>
                        prev.includes(d.dau_so) ? prev.filter((x) => x !== d.dau_so) : [...prev, d.dau_so],
                      )
                    }
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs tabular-nums transition-colors",
                      chon
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {d.dau_so}
                    <span className="ml-1 opacity-60">{soVn(d.so_khach)}</span>
                  </button>
                );
              })}
              {dauSo.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDauSo([])}
                  className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  bỏ chọn hết
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Gửi Zalo theo part 100 khách (#39) ── */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              Gửi Zalo cho khách — mỗi part 100 người
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Mỗi khách có sẵn tin nhắn (xoay vòng đỡ dính spam, KHÔNG nhắc ngày sinh) + danh sách số
              đẹp dạng ngày tháng. Sale mở Zalo khách, dán tin rồi gửi.
            </p>
            {/* Chú giải màu số (góp ý #51): tách rõ nguồn số để A Khoa nhìn phát biết. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70 ring-1 ring-emerald-500/40" />
                <b className="text-emerald-300">Số xanh</b> — còn bán trên web (có giá, chốt ngay)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold/70 ring-1 ring-gold/40" />
                <b className="text-gold">Số vàng</b> — kho sim sinh nhật (chưa có giá)
              </span>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {(["ddmmyy", "yymmdd", "ddmm"] as const).map((kb) => (
              <button
                key={kb}
                type="button"
                onClick={() => setKichBan(kb)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  kichBan === kb ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {kb === "ddmmyy" ? "Trùng ngày sinh" : kb === "yymmdd" ? "Ngược yy-mm-dd" : "Ngày + tháng"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">
            {kbDangChon ? (
              <>
                Tổng <b className="text-foreground">{soVn(kbDangChon.so_khach)}</b> khách ·{" "}
              </>
            ) : null}
            Part <b className="text-foreground">{part + 1}</b>/{soPart}
          </span>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            Lọc:
            <select
              value={locTt}
              onChange={(e) => setLocTt(e.target.value as typeof locTt)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">Tất cả</option>
              <option value="chua_check">Chưa check</option>
              <option value="co_zalo">Zalo OK</option>
              <option value="ko_zalo">Ko có Zalo</option>
            </select>
          </label>
          <div className="ml-auto">
            <PartNav part={part} soPart={soPart} doiPart={setPart} />
          </div>
        </div>

        {dangTaiDs ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : dsKhach.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Không có khách trong part này.</p>
        ) : (
          <ul className="divide-y divide-border">
            {dsHienThi.map((kh) => {
              const chiSo = part * 100 + dsKhach.indexOf(kh);
              // Gộp 2 nguồn số (#50): số THẬT còn bán trên kho web (đánh dấu xanh,
              // xếp trước vì bán được ngay) + số kho sinh nhật. Dedupe, tối đa 8.
              const duoi = duoiTheoDob(kh.dob, kichBan);
              const soKho = duoi ? khoKhop[duoi] ?? [] : [];
              const webSet = new Set(soKho);
              const soGop = [...new Set([...soKho, ...dsSoTuGoiY(kh.sim_goi_y)])].slice(0, 8);
              const tin = soanTin(chiSo, soGop, kichBan);
              const tt = trangThaiKhach(kh.msisdn);
              const koZ = tt === "ko_zalo";
              const coZ = tt === "co_zalo";
              const nhan = daNhan[kh.msisdn] ?? null;
              return (
                <li key={kh.msisdn} className={cn("p-4", koZ && "opacity-60")}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={cn("text-sm", CLS_SDT_KHACH)}>{kh.msisdn}</span>
                    <span className="text-xs text-muted-foreground">Sinh {ngaySinhVn(kh.dob)}</span>
                    <span className="text-xs text-muted-foreground">· {soVn(kh.so_sim)} số khớp</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", NHAN_TT[tt].cls)}>
                      {NHAN_TT[tt].label}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      mẫu #{(chiSo % MAU_TIN_NHAN.length) + 1}
                    </span>
                  </div>

                  {soGop.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {soGop.map((s) => {
                        const web = webSet.has(s);
                        return (
                          <span
                            key={s}
                            title={web ? "Số còn bán trên web (có giá)" : "Số kho sim sinh nhật"}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-xs ring-1",
                              web
                                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                                : "bg-gold/15 text-gold ring-gold/30",
                            )}
                          >
                            {chamSo(s, kichBan)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-2 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
                    {tin}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyTin(kh.msisdn, tin)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {daCopy === kh.msisdn ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {daCopy === kh.msisdn ? "Đã copy" : "Copy tin nhắn"}
                    </button>
                    {!koZ && (
                      <a
                        href={`https://zalo.me/${kh.msisdn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => danhDauDaMo(kh.msisdn)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          daMo.has(kh.msisdn)
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                            : "border-border text-foreground hover:border-primary/40",
                        )}
                      >
                        {daMo.has(kh.msisdn) ? "✓ Đã mở Zalo" : "Mở Zalo khách"}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void danhDauDaNhan(kh.msisdn)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        nhan
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                          : "border-border text-foreground hover:border-violet-500/40",
                      )}
                    >
                      {nhan ? `✓ Đã gửi ${gioVn(nhan.at)}` : "Đã gửi Zalo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void datTrangThai(kh.msisdn, coZ ? "chua_check" : "co_zalo")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        coZ
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : "border-border text-foreground hover:border-emerald-500/40",
                      )}
                    >
                      {coZ ? "✓ Zalo OK" : "Zalo OK"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void datTrangThai(kh.msisdn, koZ ? "chua_check" : "ko_zalo")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        koZ
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40",
                      )}
                    >
                      {koZ ? "✓ Ko có Zalo" : "Ko có Zalo"}
                    </button>
                  </div>
                  {nhan && (
                    <p className="mt-1.5 text-[11px] text-violet-300/90">
                      🕐 Đã nhắn lúc {gioNgayVn(nhan.at)}
                      {nhan.by ? ` · ${nhan.by}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Khách đang dùng số sinh nhật của mình (#41) ── */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Users className="h-4 w-4 text-primary" />
            Khách đang dùng số sinh nhật của mình
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Người đã tự chọn số có đuôi chính là ngày sinh của họ — bằng chứng nhu cầu có thật, nhóm dễ chào thêm / giới thiệu.
            {tongTt > 0 && (
              <>
                {" "}Có <b className="text-foreground">{soVn(tongTt)}</b> khách.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">
            Part <b className="text-foreground">{partTt + 1}</b>/{soPartTt}
          </span>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            Lọc:
            <select
              value={locTt}
              onChange={(e) => setLocTt(e.target.value as typeof locTt)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">Tất cả</option>
              <option value="chua_check">Chưa check</option>
              <option value="co_zalo">Zalo OK</option>
              <option value="ko_zalo">Ko có Zalo</option>
            </select>
          </label>
          <div className="ml-auto">
            <PartNav part={partTt} soPart={soPartTt} doiPart={setPartTt} />
          </div>
        </div>

        {dangTaiTt ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : tuTrung.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Chưa tìm thấy khách nào tự dùng số sinh nhật.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Số đang dùng</th>
                  <th className="px-4 py-2.5 font-medium">Ngày sinh</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Kiểu trùng</th>
                  <th className="px-4 py-2.5 text-right font-medium">Zalo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ttHienThi.map((kh) => {
                  const tt = trangThaiKhach(kh.msisdn);
                  const koZ = tt === "ko_zalo";
                  const coZ = tt === "co_zalo";
                  const nhan = daNhan[kh.msisdn] ?? null;
                  return (
                    <tr key={kh.msisdn} className={cn("transition-colors hover:bg-muted/30", koZ && "opacity-60")}>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className={CLS_SDT_KHACH}>{chamSo(kh.msisdn, kh.loai)}</span>
                        <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium", NHAN_TT[tt].cls)}>
                          {NHAN_TT[tt].label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{ngaySinhVn(kh.dob)}</td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold">
                          {NHAN_LOAI[kh.loai] ?? kh.loai}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!koZ && (
                            <a
                              href={`https://zalo.me/${kh.msisdn}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => danhDauDaMo(kh.msisdn)}
                              className={cn(
                                "text-xs font-medium hover:underline",
                                daMo.has(kh.msisdn) ? "text-sky-300" : "text-primary",
                              )}
                            >
                              {daMo.has(kh.msisdn) ? "✓ Đã mở" : "Mở Zalo"}
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => void danhDauDaNhan(kh.msisdn)}
                            title={nhan ? `Đã nhắn lúc ${gioNgayVn(nhan.at)}${nhan.by ? " · " + nhan.by : ""}` : undefined}
                            className={cn("text-xs font-medium", nhan ? "text-violet-300" : "text-muted-foreground hover:text-foreground")}
                          >
                            {nhan ? `✓ Đã gửi ${gioVn(nhan.at)}` : "Đã gửi"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void datTrangThai(kh.msisdn, coZ ? "chua_check" : "co_zalo")}
                            className={cn("text-xs font-medium", coZ ? "text-emerald-400" : "text-muted-foreground hover:text-foreground")}
                          >
                            {coZ ? "✓ Zalo OK" : "Zalo OK"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void datTrangThai(kh.msisdn, koZ ? "chua_check" : "ko_zalo")}
                            className={cn("text-xs font-medium", koZ ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                          >
                            {koZ ? "✓ Ko có Zalo" : "Ko có Zalo"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Khách trùng 6 số đuôi với kho chonso (A Khoa yêu cầu tách mục riêng) ── */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-primary" />
            Khách trùng 6 số đuôi với kho chonso
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Khách đang dùng số mà <b className="text-foreground">6 số đuôi trùng đúng</b> một số bên
            kho chonso — chào họ số &ldquo;đuôi giống hệt&rdquo; dễ chốt.
            {tongTk > 0 && (
              <> Có <b className="text-foreground">{soVn(tongTk)}</b> khách (đã lọc lô).</>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70 ring-1 ring-emerald-500/40" />
              <b className="text-emerald-300">Số xanh</b> — kho web (có giá, chốt ngay)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold/70 ring-1 ring-gold/40" />
              <b className="text-gold">Số vàng</b> — kho sim sinh nhật
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5 text-xs">
          <span className="text-muted-foreground">
            Part <b className="text-foreground">{partTk + 1}</b>/{soPartTk}
          </span>
          <label className="flex items-center gap-1.5 text-muted-foreground">
            Lọc:
            <select
              value={locTt}
              onChange={(e) => setLocTt(e.target.value as typeof locTt)}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="all">Tất cả</option>
              <option value="chua_check">Chưa check</option>
              <option value="co_zalo">Zalo OK</option>
              <option value="ko_zalo">Ko có Zalo</option>
            </select>
          </label>
          <div className="ml-auto">
            <PartNav part={partTk} soPart={soPartTk} doiPart={setPartTk} />
          </div>
        </div>

        {dangTaiTk ? (
          <div className="grid place-items-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : trungKho.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Không có khách trùng đuôi trong part này.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tkHienThi.map((kh) => {
              const chiSo = partTk * 100 + trungKho.indexOf(kh);
              const webSet = new Set(kh.so_web);
              const soGop = [...new Set([...kh.so_web, ...kh.so_sn])].slice(0, 8);
              const tin = soanTinTrung(chiSo, kh.duoi6, soGop);
              const tt = trangThaiKhach(kh.msisdn);
              const koZ = tt === "ko_zalo";
              const coZ = tt === "co_zalo";
              const nhan = daNhan[kh.msisdn] ?? null;
              return (
                <li key={kh.msisdn} className={cn("p-4", koZ && "opacity-60")}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className={cn("text-sm", CLS_SDT_KHACH)}>{cham6(kh.msisdn)}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      đuôi {kh.duoi6}
                    </span>
                    <span className="text-xs text-muted-foreground">Sinh {ngaySinhVn(kh.dob)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", NHAN_TT[tt].cls)}>
                      {NHAN_TT[tt].label}
                    </span>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      mẫu #{(chiSo % MAU_TIN_TRUNG.length) + 1}
                    </span>
                  </div>

                  {soGop.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {soGop.map((s) => {
                        const web = webSet.has(s);
                        return (
                          <span
                            key={s}
                            title={web ? "Số còn bán trên web (có giá)" : "Số kho sim sinh nhật"}
                            className={cn(
                              "rounded-md px-2 py-0.5 font-mono text-xs ring-1",
                              web
                                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                                : "bg-gold/15 text-gold ring-gold/30",
                            )}
                          >
                            {cham6(s)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <p className="mt-2 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
                    {tin}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void copyTin(kh.msisdn, tin)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {daCopy === kh.msisdn ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {daCopy === kh.msisdn ? "Đã copy" : "Copy tin nhắn"}
                    </button>
                    {!koZ && (
                      <a
                        href={`https://zalo.me/${kh.msisdn}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => danhDauDaMo(kh.msisdn)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          daMo.has(kh.msisdn)
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                            : "border-border text-foreground hover:border-primary/40",
                        )}
                      >
                        {daMo.has(kh.msisdn) ? "✓ Đã mở Zalo" : "Mở Zalo khách"}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => void danhDauDaNhan(kh.msisdn)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        nhan
                          ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                          : "border-border text-foreground hover:border-violet-500/40",
                      )}
                    >
                      {nhan ? `✓ Đã gửi ${gioVn(nhan.at)}` : "Đã gửi Zalo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void datTrangThai(kh.msisdn, coZ ? "chua_check" : "co_zalo")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        coZ
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                          : "border-border text-foreground hover:border-emerald-500/40",
                      )}
                    >
                      {coZ ? "✓ Zalo OK" : "Zalo OK"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void datTrangThai(kh.msisdn, koZ ? "chua_check" : "ko_zalo")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        koZ
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40",
                      )}
                    >
                      {koZ ? "✓ Ko có Zalo" : "Ko có Zalo"}
                    </button>
                  </div>
                  {nhan && (
                    <p className="mt-1.5 text-[11px] text-violet-300/90">
                      🕐 Đã nhắn lúc {gioNgayVn(nhan.at)}
                      {nhan.by ? ` · ${nhan.by}` : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {HIEN_GHEP && (
      <>
      {/* ── Bảng kịch bản ── */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Các kịch bản ghép</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Mỗi dòng là một cách &ldquo;số mang ngày sinh của khách&rdquo;. Bấm để xem chi tiết bên dưới.
          </p>
        </div>

        {loi ? (
          <p className="p-4 text-sm text-destructive">{loi}</p>
        ) : dangTai && !thongKe ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tính…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Kịch bản</th>
                  <th className="px-4 py-2.5 text-right font-medium">Khách chào được</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sim dùng tới</th>
                  <th className="px-4 py-2.5 text-right font-medium">TB sim/khách</th>
                </tr>
              </thead>
              <tbody className={cn(dangTai && "opacity-50 transition-opacity")}>
                {(thongKe?.kich_ban ?? []).map((k) => {
                  const chon = k.ma === kichBan;
                  const nhan = NHAN_SUC_MANH[k.suc_manh] ?? NHAN_SUC_MANH.kha;
                  const tyLe =
                    tong && tong.khach_sau_loc > 0 ? (k.so_khach / tong.khach_sau_loc) * 100 : 0;
                  return (
                    <tr
                      key={k.ma}
                      onClick={() => setKichBan(k.ma)}
                      className={cn(
                        "cursor-pointer border-b border-border/60 transition-colors last:border-0",
                        chon ? "bg-primary/5" : "hover:bg-muted/40",
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "font-medium",
                              chon ? "text-primary" : "text-foreground",
                            )}
                          >
                            {k.ten}
                          </span>
                          <span className={cn("rounded px-1.5 py-px text-[10px] font-medium", nhan.cls)}>
                            {nhan.text}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{k.mo_ta}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold tabular-nums text-foreground">
                          {soVn(k.so_khach)}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          {Math.round(tyLe)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {soVn(k.so_sim)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {k.so_khach > 0 ? (k.so_cap / k.so_khach).toFixed(1) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Chi tiết kịch bản đang chọn ── */}
      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Chi tiết: {kbDangChon?.ten ?? kichBan}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {kbDangChon ? `${soVn(kbDangChon.so_khach)} khách · ${soVn(kbDangChon.so_sim)} số trong kho` : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void xuatCsv()}
            disabled={dangXuat || !kbDangChon?.so_khach}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
          >
            {dangXuat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {dangXuat ? "Đang xuất…" : "Xuất CSV danh sách chào"}
          </button>
        </div>

        {/* Câu chào mẫu */}
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <span className="font-medium text-foreground">Câu chào gợi ý: </span>
              {CAU_CHAO[kichBan] ?? CAU_CHAO.ddmmyy}
            </span>
          </p>
        </div>

        <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-border">
          {/* Số đắt khách nhất */}
          <div className="p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Số đắt khách nhất
            </h4>
            {dangTaiChiTiet ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </div>
            ) : topSim.length === 0 ? (
              <p className="text-sm text-muted-foreground">Kịch bản này không ghép được số nào.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {topSim.map((s) => (
                  <div key={s.digits} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-medium tabular-nums text-foreground">{s.digits}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{s.ngay_dai_dien}</span>
                    <span className="shrink-0 text-xs font-semibold text-gold">
                      {soVn(s.so_khach)} khách
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Khách đầu danh sách */}
          <div className="p-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Khách nên gọi trước
            </h4>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Mỗi ngày sinh lấy một người cho dễ hình dung — bản xuất CSV vẫn đủ danh sách.
            </p>
            {dangTaiChiTiet ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </div>
            ) : khach.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có khách nào khớp.</p>
            ) : (
              <div className="divide-y divide-border/60">
                {khach.map((k) => (
                  <div key={k.msisdn} className="py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium tabular-nums text-foreground">{k.msisdn}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {k.dob.split("-").reverse().join("/")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs tabular-nums text-muted-foreground">
                      {k.sim_goi_y ?? ""}
                      {k.so_sim > 5 ? ` … (+${k.so_sim - 5})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Phân bố năm sinh ── */}
      {thongKe && thongKe.phan_bo_nam.length > 0 && (
        <BarList
          title="Khách theo năm sinh (sau khi lọc)"
          items={thongKe.phan_bo_nam
            .slice()
            .sort((a, b) => b.so_khach - a.so_khach)
            .slice(0, 12)
            .map((n) => ({ label: String(n.nam), count: n.so_khach }))}
          footer={
            <span className="text-xs text-muted-foreground">
              12 năm đông nhất trong dải {namTu}–{namDen}.
            </span>
          }
        />
      )}
      </>
      )}
    </div>
  );
}
