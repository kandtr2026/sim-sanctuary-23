"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Phone,
  Compass,
  ArrowUpDown,
  Filter,
  DollarSign,
  Briefcase,
  Heart,
  Users,
  Star,
  Info,
  X,
  Flame,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import { NL_META } from "@/lib/batCuc";
import type { HopTuoiProfile, ScoredSim, SingleSimEvaluation, ToneHopTuoi } from "@/lib/simHopTuoi";

interface ApiResponse {
  profile: HopTuoiProfile;
  birth: { ngay: number; thang: number; nam: number; namAm?: number; lich?: "dl" | "al" };
  gioiTinh: "nam" | "nu";
  singleEvaluation: SingleSimEvaluation | null;
  total: number;
  sims: ScoredSim[];
  limit: number;
  offset: number;
}

const GIO_SINH_OPTIONS = [
  { value: "0", label: "Giờ Tý (23h – 01h)" },
  { value: "1", label: "Giờ Sửu (01h – 03h)" },
  { value: "2", label: "Giờ Dần (03h – 05h)" },
  { value: "3", label: "Giờ Mão (05h – 07h)" },
  { value: "4", label: "Giờ Thìn (07h – 09h)" },
  { value: "5", label: "Giờ Tỵ (09h – 11h)" },
  { value: "6", label: "Giờ Ngọ (11h – 13h)" },
  { value: "7", label: "Giờ Mùi (13h – 15h)" },
  { value: "8", label: "Giờ Thân (15h – 17h)" },
  { value: "9", label: "Giờ Dậu (17h – 19h)" },
  { value: "10", label: "Giờ Tuất (19h – 21h)" },
  { value: "11", label: "Giờ Hợi (21h – 23h)" },
];

const MUC_TIEU_OPTIONS = [
  { id: "all", label: "Tất cả mục tiêu", icon: Sparkles },
  { id: "TaiLoc", label: "Tài lộc & Kinh doanh", icon: DollarSign },
  { id: "CongDanh", label: "Công danh & Thăng tiến", icon: Briefcase },
  { id: "TinhDuyen", label: "Tình cảm & Gia đạo", icon: Heart },
  { id: "QuyNhan", label: "Quý nhân & Bình an", icon: Users },
];

const PRICE_FILTERS = [
  { label: "Tất cả giá", value: null },
  { label: "< 1 triệu", value: "0" },
  { label: "1 – 3 triệu", value: "1" },
  { label: "3 – 5 triệu", value: "2" },
  { label: "5 – 10 triệu", value: "3" },
  { label: "10 – 50 triệu", value: "4" },
  // PRICE_RANGES[5] chỉ là 50–100 triệu → phải gộp 5..8 để không giấu số ≥ 100 triệu.
  { label: "> 50 triệu", value: "5,6,7,8" },
];

const PREFIX_FILTERS = [
  { label: "Tất cả đầu số", value: null },
  { label: "Đầu 090", value: "090" },
  { label: "Đầu 093", value: "093" },
  { label: "Đầu 089", value: "089" },
  { label: "Đầu 07x", value: "070,079,077,076,078" },
];

const MENH_COLORS: Record<string, string> = {
  Kim: "#eab308",
  Mộc: "#22c55e",
  Thủy: "#0ea5e9",
  Hỏa: "#ef4444",
  Thổ: "#a16207",
};

const MENH_LUCKY_DIGITS: Record<string, string[]> = {
  Kim: ["2", "5", "8", "6", "7"],
  Mộc: ["0", "1", "3", "4"],
  Thủy: ["6", "7", "0", "1"],
  Hỏa: ["3", "4", "9"],
  Thổ: ["9", "2", "5", "8"],
};

// Năm sinh chọn được: 1940 → năm hiện tại (khớp route API + bảng âm lịch).
const YEAR_MAX = new Date().getFullYear();
const YEAR_MIN = 1940;

type SortKey = "score_desc" | "price_asc" | "price_desc";

// Màu nhãn hợp tuổi — cùng tầng xepLoaiHopTuoi (src/lib/simHopTuoi.ts).
const TONE_TEXT: Record<ToneHopTuoi, string> = {
  gold: "text-gold",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-destructive",
};
const TONE_BADGE: Record<ToneHopTuoi, string> = {
  gold: "bg-gold/15 text-gold border-gold/30",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  red: "bg-destructive/15 text-destructive border-destructive/30",
};

/** Chuẩn hoá tham số số nguyên đọc từ URL ("05" → "5"; ngoài khoảng → fallback). */
const normInt = (v: string | null, min: number, max: number, fb: string): string => {
  const n = Number(v);
  return v && Number.isInteger(n) && n >= min && n <= max ? String(n) : fb;
};

/** Số ngày tối đa của tháng: âm lịch tối đa 30, dương lịch theo tháng/năm thật. */
const maxNgayTrongThang = (lich: "dl" | "al", thang: string, nam: string): number =>
  lich === "al" ? 30 : new Date(Number(nam), Number(thang), 0).getDate();

/** Ngày sinh ban đầu từ URL (link từ /sim-nam-sinh, /sim-hop-tuoi/[nam] …). */
const docNgaySinhTuUrl = (sp: { get(k: string): string | null; has(k: string): boolean }) => {
  const lich: "dl" | "al" = sp.get("lich") === "al" ? "al" : "dl";
  const thang = normInt(sp.get("thang"), 1, 12, "8");
  const nam = normInt(sp.get("nam"), YEAR_MIN, YEAR_MAX, "1990");
  const ngayRaw = normInt(sp.get("ngay"), 1, 31, "15");
  const ngay = String(Math.min(Number(ngayRaw), maxNgayTrongThang(lich, thang, nam)));
  const gio = normInt(sp.get("gio"), 0, 11, "5");
  return { lich, thang, nam, ngay, gio, daNhap: sp.has("nam") };
};

type FetchOverrides = {
  page?: number;
  mucTieu?: string;
  price?: string | null;
  prefix?: string | null;
  sortBy?: SortKey;
  soCanXem?: string;
};

/** Ô số đang LỌC kho (có '*' hoặc 2–9 chữ số) — 10 số là bói, không lọc. */
const soDangLocKho = (so: string): boolean => {
  const d = so.replace(/\D/g, "");
  return so.includes("*") || (d.length >= 2 && d.length < 10);
};

export default function SimHopTuoiTool() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const simListRef = useRef<HTMLDivElement>(null);
  const evalRef = useRef<HTMLDivElement>(null);

  // Form input state — ngày sinh từ URL được chuẩn hoá ("05" → "5") để 3 ô select
  // hiện đúng giá trị đã gửi lên API.
  const [init] = useState(() => docNgaySinhTuUrl(searchParams));
  const [soCanXem, setSoCanXem] = useState(() => searchParams.get("so") || "");
  const [ngay, setNgay] = useState(init.ngay);
  const [thang, setThang] = useState(init.thang);
  const [nam, setNam] = useState(init.nam);
  const [gio, setGio] = useState(init.gio);
  const [lichType, setLichType] = useState<"dl" | "al">(init.lich);
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">(() => (searchParams.get("gt") === "nu" ? "nu" : "nam"));
  // Chưa nhập ngày sinh (đang xem hồ sơ mẫu 15/08/1990) → ghi rõ là "ví dụ".
  const [daNhap, setDaNhap] = useState(init.daNhap);

  // Secondary filter state
  const [mucTieu, setMucTieu] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("score_desc");
  const [page, setPage] = useState(1);
  const limit = 30;

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  // Chỉ nhận kết quả của request MỚI NHẤT (bấm nhanh không bị response cũ ghi đè).
  const reqIdRef = useRef(0);
  // Giá trị ô số đã gửi ở request gần nhất — để biết bộ lọc số có đang áp không.
  const lastSoRef = useRef("");

  // Auto-search on mount
  useEffect(() => {
    fetchSims({ page: 1 }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mọi bộ lọc truyền giá trị VỪA chọn qua `o` — không đọc state trong closure cũ
  // (lỗi cũ: setX() rồi setTimeout(fetchSims) → gửi giá trị trước đó, trễ 1 nhịp).
  // price/prefix dùng `'key' in o` vì null ("Tất cả") là giá trị hợp lệ.
  const fetchSims = async (o: FetchOverrides = {}, shouldScroll = true) => {
    const id = ++reqIdRef.current;
    const curPage = o.page ?? page;
    const curMucTieu = o.mucTieu ?? mucTieu;
    const curPrice = "price" in o ? (o.price ?? null) : selectedPrice;
    const curPrefix = "prefix" in o ? (o.prefix ?? null) : selectedPrefix;
    const curSort = o.sortBy ?? sortBy;
    const curSo = (o.soCanXem ?? soCanXem).trim();
    const offset = (curPage - 1) * limit;

    const ngayN = Number(ngay);
    const thangN = Number(thang);
    const namN = Number(nam);
    if (!ngayN || !thangN || !namN) {
      setError("Vui lòng nhập đủ ngày, tháng và năm sinh.");
      setIsLoading(false);
      return;
    }
    if (namN < YEAR_MIN || namN > YEAR_MAX) {
      setError(`Năm sinh hợp lệ từ ${YEAR_MIN} đến ${YEAR_MAX}.`);
      setIsLoading(false);
      return;
    }
    const soDigits = curSo.replace(/\D/g, "");
    if (!curSo.includes("*") && soDigits.length >= 11 && !(soDigits.length === 11 && soDigits.startsWith("84"))) {
      setError("Số điện thoại cần đúng 10 chữ số (ví dụ 0901234567).");
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        ngay: String(ngayN),
        thang: String(thangN),
        nam: String(namN),
        gio,
        gioitinh: gioiTinh,
        lich: lichType,
        limit: String(limit),
        offset: String(offset),
        sortBy: curSort,
      });

      if (curSo) {
        params.set("soCanXem", curSo);
      }
      if (curMucTieu !== "all") {
        params.set("mucTieu", curMucTieu);
      }
      if (curPrice !== null) {
        params.set("priceRange", curPrice);
      }
      if (curPrefix !== null) {
        params.set("prefix", curPrefix);
      }

      const res = await fetch(`/api/sim-hop-tuoi?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        if (id !== reqIdRef.current) return;
        // Bỏ kết quả cũ để không hiện hồ sơ/danh sách của lần tra trước dưới thông báo lỗi.
        setData(null);
        throw new Error(j?.error || "Lỗi khi tải dữ liệu phong thủy");
      }
      const json: ApiResponse = await res.json();
      if (id !== reqIdRef.current) return;
      lastSoRef.current = curSo;
      setData(json);

      if (shouldScroll) {
        setTimeout(() => {
          if (json.singleEvaluation && evalRef.current) {
            evalRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          } else if (simListRef.current) {
            simListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
      }
    } catch (err: unknown) {
      if (id === reqIdRef.current) {
        setError(err instanceof Error && err.message ? err.message : "Không thể tải dữ liệu, vui lòng thử lại.");
      }
    } finally {
      if (id === reqIdRef.current) setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDaNhap(true);
    setPage(1);
    fetchSims({ page: 1 }, true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchSims({ page: newPage }, true);
  };

  // Giữ ngày hợp lệ khi đổi tháng/năm/loại lịch (31 → 28/29/30…).
  const kepNgay = (lich: "dl" | "al", t: string, y: string) => {
    const max = maxNgayTrongThang(lich, t, y);
    if (Number(ngay) > max) setNgay(String(max));
  };
  const maxNgay = maxNgayTrongThang(lichType, thang, nam);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="space-y-6">
      {/* ── 1. FORM TRA CỨU PHONG THỦY 2 CHIỀU (GỌN GÀNG, CHUẨN THAO TÁC) ──── */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-b from-[#1b1416] to-[#110d0f] p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-gold text-xs font-bold uppercase tracking-wider">
            <Compass className="h-4 w-4 text-gold" />
            <span>Công Cụ Bát Tự &amp; Kinh Dịch</span>
          </div>
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Kho 50.000+ SIM MobiFone
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Ô nhập số điện thoại bói / tìm */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Số điện thoại (đang dùng để bói cát hung / hoặc số cần tìm):
            </label>
            <div className="relative">
              <input
                type="text"
                value={soCanXem}
                onChange={(e) => setSoCanXem(e.target.value)}
                placeholder="Nhập 10 số đang dùng để bói cát hung - hoặc gõ 090*, *79 để tìm trong kho"
                className="w-full rounded-xl border border-primary/40 bg-background/90 px-3.5 py-2.5 pl-10 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              {soCanXem && (
                <button
                  type="button"
                  onClick={() => {
                    setSoCanXem("");
                    // Đang bói / đang lọc theo số → tải lại để bỏ kết quả cũ ngay.
                    if (data && lastSoRef.current) {
                      setPage(1);
                      fetchSims({ page: 1, soCanXem: "" }, false);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Ngày / Tháng / Năm sinh — GOM THÀNH 1 HÀNG 3 CỘT CÂN ĐỐI */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Ngày sinh:
              </label>
              <select
                value={ngay}
                onChange={(e) => setNgay(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {Array.from({ length: maxNgay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Ngày {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Tháng sinh:
              </label>
              <select
                value={thang}
                onChange={(e) => {
                  setThang(e.target.value);
                  kepNgay(lichType, e.target.value, nam);
                }}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Năm sinh:
              </label>
              <select
                value={nam}
                onChange={(e) => {
                  setNam(e.target.value);
                  kepNgay(lichType, thang, e.target.value);
                }}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Khung giờ sinh + Lịch + Giới tính */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Khung giờ sinh:
              </label>
              <select
                value={gio}
                onChange={(e) => setGio(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none truncate"
              >
                {GIO_SINH_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Loại lịch:
              </label>
              <div className="flex rounded-xl border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setLichType("dl");
                    kepNgay("dl", thang, nam);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    lichType === "dl"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dương lịch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLichType("al");
                    kepNgay("al", thang, nam);
                  }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    lichType === "al"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Âm lịch
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Giới tính:
              </label>
              <div className="flex rounded-xl border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => setGioiTinh("nam")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    gioiTinh === "nam"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGioiTinh("nu")}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    gioiTinh === "nu"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nữ
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/15 border border-destructive/30 p-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nút bấm hành động chính */}
          <div className="pt-1 flex justify-center">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-w-[260px] rounded-xl bg-gradient-to-r from-primary to-primary-dark py-5 text-sm sm:text-base font-bold text-primary-foreground shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tính toán phong thủy...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 text-gold" />
                  TÌM SIM HỢP TUỔI &amp; BÓI CÁT HUNG
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* ── 2. CARD KẾT QUẢ BÓI SIM ĐANG DÙNG (NẾU NHẬP 10 SỐ) ──────────────── */}
      {data?.singleEvaluation && (
        <section ref={evalRef} className="relative scroll-mt-6 overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/40 bg-gradient-to-br from-[#1e1715] to-[#120e10] p-4 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Luận giải số đang dùng
                </span>
                <h3 className="font-mono text-xl sm:text-2xl font-black text-foreground">
                  {data.singleEvaluation.formattedNumber}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Điểm số</div>
                <div className="text-xl sm:text-2xl font-black text-gold">
                  {data.singleEvaluation.score}
                  <span className="text-xs font-normal text-muted-foreground">/10</span>
                </div>
              </div>
              <span
                className={`rounded-lg px-2.5 py-1 text-xs font-bold border ${
                  TONE_BADGE[data.singleEvaluation.tone] ?? TONE_BADGE.amber
                }`}
              >
                {data.singleEvaluation.verdict}
              </span>
            </div>
          </div>

          {/* 4 thông số học thuật */}
          <div className="mt-3.5 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Compass className="h-3 w-3 text-gold" /> Quẻ Kinh Dịch
              </div>
              <div className="mt-0.5 text-xs font-bold text-foreground truncate">
                {data.singleEvaluation.hexagram || "Chưa xác định"}
              </div>
              <span className="inline-block mt-0.5 rounded bg-gold/10 px-1.5 py-0.2 text-[10px] font-semibold text-gold">
                {data.singleEvaluation.hexagramLevel}
              </span>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Flame className="h-3 w-3 text-primary" /> Ngũ Hành Sim
              </div>
              <div className="mt-0.5 text-xs font-bold text-foreground">
                Hành {data.singleEvaluation.simHanh}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {data.singleEvaluation.quanHe} với mệnh {data.profile.menh}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-gold" /> Bát Cực Linh Số
              </div>
              <div className="mt-0.5 text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span className="text-emerald-400">✓ {data.singleEvaluation.catStars} Cát</span>
                {data.singleEvaluation.hungStars > 0 && (
                  <span className="text-destructive">✗ {data.singleEvaluation.hungStars} Hung</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Chủ đạo:{" "}
                {data.singleEvaluation.nlChuDao
                  ? NL_META[data.singleEvaluation.nlChuDao].label
                  : "Hài hòa"}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/50 p-2.5">
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" /> Nút &amp; Âm Dương
              </div>
              <div className="mt-0.5 text-xs font-bold text-foreground">
                {data.singleEvaluation.nut} Nút · {data.singleEvaluation.evenCount} Âm / {data.singleEvaluation.oddCount} Dương
              </div>
              <div className="text-[10px] text-muted-foreground">
                {/* Theo cả cung phi lẫn giờ sinh — cùng mục tiêu mà điểm Âm Dương đang chấm */}
                {data.singleEvaluation.amDuongTarget > 0.5
                  ? "Cần bổ khuyết Âm"
                  : data.singleEvaluation.amDuongTarget < 0.5
                  ? "Cần bổ khuyết Dương"
                  : "Âm Dương cân bằng"}
              </div>
            </div>
          </div>

          {/* Lời khuyên tư vấn phong thủy */}
          <div className="mt-3.5 rounded-xl border border-gold/30 bg-gold/5 p-3 flex items-start gap-2.5 text-xs leading-relaxed text-foreground/90">
            <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <div>
              <strong className="text-gold">Lời khuyên chuyên gia: </strong>
              <span>{data.singleEvaluation.advice}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HỒ SƠ PHONG THỦY TINH GỌN (COMPACT STRIP) ────────────────────── */}
      {data?.profile && (
        <section className="rounded-xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                Hồ sơ tuổi {data.profile.thienCan} {data.profile.diaChi} {data.profile.nam} ({data.profile.napAm})
                {data.birth.namAm !== undefined && data.birth.namAm !== data.birth.nam && (
                  <span className="font-normal text-muted-foreground">
                    {" "}· sinh {data.birth.ngay}/{data.birth.thang}/{data.birth.nam} dương lịch, trước Tết âm lịch
                  </span>
                )}
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                · {data.gioiTinh === "nam" ? "Nam mệnh" : "Nữ mệnh"} (Giờ {data.profile.gioLabel})
              </span>
            </div>

            {/* 4 Chỉ số thu gọn trên 1 hàng */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold"
                style={{
                  background: `${MENH_COLORS[data.profile.menh]}20`,
                  color: MENH_COLORS[data.profile.menh],
                }}
              >
                Mệnh {data.profile.menh}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-foreground font-medium">
                Cung {data.profile.cungPhi.cung} ({data.profile.cungPhi.nguHanh})
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-foreground font-medium">
                {data.profile.cungPhi.amDuong} Mạng
              </span>
              <span className="rounded-md bg-gold/15 border border-gold/30 px-2 py-0.5 text-gold font-bold font-mono">
                Số hợp: {(MENH_LUCKY_DIGITS[data.profile.menh] || []).join(", ")}
              </span>
            </div>
          </div>
          {!daNhap && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Ví dụ cho người sinh {data.birth.ngay}/{data.birth.thang}/{data.birth.nam} — Quý khách nhập ngày sinh của mình
              rồi bấm TÌM để xem đúng tuổi.
            </p>
          )}
        </section>
      )}

      {/* ── 4. BỘ LỌC ĐA CHIỀU MONG CẦU (CUỘN NGANG MOBILE) ─────────────────── */}
      {data && (
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4 space-y-3">
          {/* Mục tiêu phong thủy: Cuộn ngang mượt mà trên mobile */}
          <div>
            <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Star className="h-3 w-3 text-gold" /> Chọn mục tiêu kích hoạt:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {MUC_TIEU_OPTIONS.map((m) => {
                const Icon = m.icon;
                const active = mucTieu === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMucTieu(m.id);
                      setPage(1);
                      fetchSims({ page: 1, mucTieu: m.id }, false);
                    }}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-background text-foreground/80 hover:bg-muted border border-border/70"
                    }`}
                  >
                    <Icon className="h-3 w-3 text-gold" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mức giá + Đầu số + Sắp xếp: Gọn gàng */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/40">
            {/* Khoảng giá */}
            <div>
              <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                Mức giá:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {PRICE_FILTERS.map((p) => {
                  const active = selectedPrice === p.value;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSelectedPrice(p.value);
                        setPage(1);
                        fetchSims({ page: 1, price: p.value }, false);
                      }}
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-background text-foreground/70 hover:bg-muted border border-border/60"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Đầu số */}
            <div>
              <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                Đầu số:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {PREFIX_FILTERS.map((p) => {
                  const active = selectedPrefix === p.value;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSelectedPrefix(p.value);
                        setPage(1);
                        fetchSims({ page: 1, prefix: p.value }, false);
                      }}
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                        active
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-background text-foreground/70 hover:bg-muted border border-border/60"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sắp xếp */}
            <div>
              <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value as SortKey;
                  setSortBy(val);
                  setPage(1);
                  fetchSims({ page: 1, sortBy: val }, false);
                }}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="score_desc">Điểm phong thuỷ cao nhất</option>
                <option value="price_asc">Giá từ thấp đến cao</option>
                <option value="price_desc">Giá từ cao đến thấp</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. DANH SÁCH THẺ SIM (ĐẬP THẲNG VÀO TẦM MẮT) ───────────────────── */}
      {data && (
        <section ref={simListRef} className="space-y-3.5 scroll-mt-6">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Kho SIM hợp tuổi ({data.profile.napAm})
              </h3>
              <span className="rounded-full bg-primary/10 border border-primary/30 px-2 py-0.2 text-xs font-semibold text-primary">
                {data.total.toLocaleString("vi-VN")} SIM
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Trang {page} / {totalPages}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Đang sàng lọc kho SIM hợp tuổi...</p>
            </div>
          ) : data.sims.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center space-y-2.5">
              <p className="text-sm text-muted-foreground">
                Kho tạm hết số khớp tiêu chí này. Quý khách vui lòng đổi khoảng giá hoặc đầu số.
              </p>
              <button
                type="button"
                onClick={() => {
                  // Ô số đang lọc kho (có '*' / 2–9 chữ số) cũng là một bộ lọc → xoá luôn.
                  const clearSo = soDangLocKho(lastSoRef.current) || soDangLocKho(soCanXem);
                  setSelectedPrice(null);
                  setSelectedPrefix(null);
                  setMucTieu("all");
                  setPage(1);
                  if (clearSo) setSoCanXem("");
                  fetchSims(
                    { page: 1, mucTieu: "all", price: null, prefix: null, ...(clearSo ? { soCanXem: "" } : {}) },
                    false,
                  );
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow"
              >
                Xóa bộ lọc &amp; Xem lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {data.sims.map((sim) => (
                <div
                  key={sim.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm hover:border-gold/40 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header Thẻ: Số SIM + Điểm số */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <Link
                          href={`/sim/${sim.digits}`}
                          className="font-mono text-xl sm:text-2xl font-black tracking-wide text-gold group-hover:text-primary transition-colors block"
                        >
                          {formatSimQuyAware(sim.digits)}
                        </Link>
                        <div className="mt-0.5 text-sm sm:text-base font-extrabold text-foreground">
                          {formatPrice(sim.price)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 rounded-lg bg-gold/15 border border-gold/30 px-2 py-0.5 text-xs font-black text-gold">
                          <Star className="h-3 w-3 fill-gold" />
                          <span>{sim.score} /10</span>
                        </div>
                        <span className={`mt-0.5 text-[10px] font-semibold ${TONE_TEXT[sim.tone] ?? "text-muted-foreground"}`}>
                          {sim.tone === "gold" || sim.tone === "emerald" ? `★ ${sim.verdict}` : sim.verdict}
                        </span>
                      </div>
                    </div>

                    {/* 4 Chỉ Số Phong Thủy Vàng */}
                    <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0 text-[11px]">
                          <Compass className="h-3 w-3 text-gold" /> Quẻ Dịch:
                        </span>
                        <span className="font-semibold text-foreground text-right truncate text-[11px]">
                          {sim.hexagram || `Quẻ ${sim.que}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0 text-[11px]">
                          <Flame className="h-3 w-3 text-primary" /> Ngũ Hành:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          Hành {sim.simHanh} ({sim.quanHe})
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0 text-[11px]">
                          <Sparkles className="h-3 w-3 text-gold" /> Bát Cực:
                        </span>
                        {sim.nlChuDao ? (
                          <span
                            className={`font-semibold truncate text-[11px] ${
                              NL_META[sim.nlChuDao].loai === "cát" ? "text-emerald-400" : "text-destructive"
                            }`}
                          >
                            NL {NL_META[sim.nlChuDao].label}
                          </span>
                        ) : (
                          <span className="font-semibold text-muted-foreground truncate text-[11px]">Cân bằng</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0 text-[11px]">
                          <ShieldCheck className="h-3 w-3 text-primary" /> Tổng Nút:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {sim.nut} nút ({sim.nut >= 7 ? "Đại cát" : sim.nut >= 5 ? "Trung bình" : "Thấp"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Nút Hành Động To Rõ, Tiện Bấm Bằng Ngón Cái */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 pt-2.5 border-t border-border/40">
                    {/* Mua ngay */}
                    <Link
                      href={`/mua-ngay/${sim.digits}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary-dark active:scale-[0.98] transition-all text-center"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Đặt mua SIM
                    </Link>

                    {/* Xem luận giải */}
                    <Link
                      href={`/sim/${sim.digits}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold/10 border border-gold/30 py-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-black active:scale-[0.98] transition-all text-center"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Luận giải →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="rounded-lg border-border text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Trước
              </Button>
              <div className="text-xs font-semibold text-muted-foreground px-2">
                Trang {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="rounded-lg border-border text-xs"
              >
                Sau <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
