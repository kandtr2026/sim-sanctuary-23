"use client";

import { useState, useEffect, useTransition } from "react";
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
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import type { HopTuoiProfile, ScoredSim, SingleSimEvaluation } from "@/lib/simHopTuoi";

interface ApiResponse {
  profile: HopTuoiProfile;
  birth: { ngay: number; thang: number; nam: number };
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
  { label: "Dưới 1 triệu", value: "0" },
  { label: "1 – 3 triệu", value: "1" },
  { label: "3 – 5 triệu", value: "2" },
  { label: "5 – 10 triệu", value: "3" },
  { label: "10 – 50 triệu", value: "4" },
  { label: "Trên 50 triệu", value: "5" },
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

export default function SimHopTuoiTool() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form input state
  const [soCanXem, setSoCanXem] = useState(() => searchParams.get("so") || "");
  const [ngay, setNgay] = useState(() => searchParams.get("ngay") || "15");
  const [thang, setThang] = useState(() => searchParams.get("thang") || "8");
  const [nam, setNam] = useState(() => searchParams.get("nam") || "1990");
  const [gio, setGio] = useState(() => searchParams.get("gio") || "5");
  const [lichType, setLichType] = useState<"dl" | "al">("dl");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">(() => (searchParams.get("gt") === "nu" ? "nu" : "nam"));

  // Secondary filter state
  const [mucTieu, setMucTieu] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score_desc" | "price_asc" | "price_desc">("score_desc");
  const [page, setPage] = useState(1);
  const limit = 30;

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);

  // Auto-search once on mount
  useEffect(() => {
    fetchSims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSims = async (overridePage?: number) => {
    const curPage = overridePage ?? page;
    const offset = (curPage - 1) * limit;

    const ngayN = Number(ngay);
    const thangN = Number(thang);
    const namN = Number(nam);
    if (!ngayN || !thangN || !namN) {
      setError("Vui lòng nhập đủ ngày, tháng và năm sinh.");
      return;
    }
    if (namN < 1950 || namN > 2029) {
      setError("Năm sinh hợp lệ từ 1950 đến 2029.");
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
        limit: String(limit),
        offset: String(offset),
        sortBy,
      });

      if (soCanXem.trim()) {
        params.set("soCanXem", soCanXem.trim());
      }
      if (mucTieu !== "all") {
        params.set("mucTieu", mucTieu);
      }
      if (selectedPrice !== null) {
        params.set("priceRange", selectedPrice);
      }
      if (selectedPrefix !== null) {
        params.set("prefix", selectedPrefix);
      }

      const res = await fetch(`/api/sim-hop-tuoi?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Lỗi khi tải dữ liệu phong thủy");
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Không thể tải dữ liệu, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSims(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchSims(newPage);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="space-y-8">
      {/* ── 1. FORM TRA CỨU PHONG THỦY 2 CHIỀU (CHUẨN BÁT TỰ & BÓI SIM) ───── */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-b from-[#1c1417] via-[#141012] to-[#0e0a0c] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-border/50 pb-4">
            <div>
              <div className="flex items-center gap-2 text-gold">
                <Compass className="h-5 w-5 animate-pulse text-gold" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Công Cụ Bát Tự &amp; Kinh Dịch
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">
                Tra Cứu SIM Hợp Tuổi &amp; Bói Điểm SIM Đang Dùng
              </h2>
            </div>
            <span className="rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs font-semibold text-primary">
              Kho 50.000+ SIM MobiFone
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hàng 1: Ô Bói số đang dùng / Tra cứu nhanh */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Số cần xem phong thủy / Đầu số muốn tìm:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={soCanXem}
                  onChange={(e) => setSoCanXem(e.target.value)}
                  placeholder="Nhập 10 số đang dùng để bói cát hung (ví dụ 0903123456) - hoặc gõ 090*, *68 để lọc..."
                  className="w-full rounded-2xl border border-primary/50 bg-background/90 px-4 py-3.5 pl-11 text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground/60 shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
                <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                {soCanXem && (
                  <button
                    type="button"
                    onClick={() => setSoCanXem("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground/80 flex items-center gap-1">
                <Info className="h-3 w-3 text-gold" />
                <span>Mẹo: Nhập đủ 10 số để hệ thống chấm điểm toàn diện SIM Quý khách đang dùng.</span>
              </p>
            </div>

            {/* Hàng 2: Ngày tháng năm sinh + Giờ sinh + Lịch + Giới tính */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Ngày */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Ngày sinh:
                </label>
                <select
                  value={ngay}
                  onChange={(e) => setNgay(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Ngày {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tháng */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tháng sinh:
                </label>
                <select
                  value={thang}
                  onChange={(e) => setThang(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Năm */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Năm sinh:
                </label>
                <select
                  value={nam}
                  onChange={(e) => setNam(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 75 }, (_, i) => 2024 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Giờ sinh */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-1">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Khung giờ:
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

              {/* Loại lịch */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Loại lịch:
                </label>
                <div className="flex rounded-xl border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setLichType("dl")}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
                      lichType === "dl"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Dương lịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setLichType("al")}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
                      lichType === "al"
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Âm lịch
                  </button>
                </div>
              </div>

              {/* Giới tính */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Giới tính:
                </label>
                <div className="flex rounded-xl border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setGioiTinh("nam")}
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
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
                    className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
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
              <div className="flex items-center gap-2 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Nút bấm hành động chính */}
            <div className="pt-2 flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[280px] rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-8 py-6 text-base font-bold text-primary-foreground shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tính toán phong thủy...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 text-gold" />
                    TÌM SIM HỢP TUỔI &amp; BÓI CÁT HUNG
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ── 2. CARD KẾT QUẢ BÓI SIM ĐANG DÙNG (NẾU NHẬP 10 SỐ) ──────────────── */}
      {data?.singleEvaluation && (
        <section className="relative overflow-hidden rounded-3xl border-2 border-gold/40 bg-gradient-to-br from-[#201815] to-[#120e10] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold/20 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                  Luận giải chi tiết số đang dùng
                </span>
                <h3 className="font-mono text-2xl sm:text-3xl font-black tracking-wide text-foreground">
                  {data.singleEvaluation.formattedNumber}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Điểm phong thủy</div>
                <div className="text-2xl sm:text-3xl font-black text-gold">
                  {data.singleEvaluation.score}
                  <span className="text-sm font-normal text-muted-foreground">/10</span>
                </div>
              </div>
              <span
                className={`rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold border ${
                  data.singleEvaluation.score >= 8
                    ? "bg-gold/15 text-gold border-gold/30"
                    : data.singleEvaluation.score >= 6.5
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-destructive/15 text-destructive border-destructive/30"
                }`}
              >
                {data.singleEvaluation.verdict}
              </span>
            </div>
          </div>

          {/* 4 thông số học thuật cốt lõi */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Quẻ Kinh Dịch */}
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-gold" /> Quẻ Kinh Dịch
              </div>
              <div className="mt-1 text-sm font-bold text-foreground">
                {data.singleEvaluation.hexagram || "Chưa xác định"}
              </div>
              <div className="mt-1">
                <span className="inline-block rounded-md bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
                  {data.singleEvaluation.hexagramLevel}
                </span>
              </div>
            </div>

            {/* Ngũ Hành Sim */}
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary" /> Ngũ Hành Sim
              </div>
              <div className="mt-1 text-sm font-bold text-foreground">
                Hành {data.singleEvaluation.simHanh}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.singleEvaluation.quanHe} với mệnh {data.profile.menh}
              </div>
            </div>

            {/* Bát Cực Linh Số */}
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Bát Cực Linh Số
              </div>
              <div className="mt-1 text-xs font-bold text-foreground flex items-center gap-2">
                <span className="text-emerald-400">✓ {data.singleEvaluation.catStars} sao Cát</span>
                {data.singleEvaluation.hungStars > 0 && (
                  <span className="text-destructive">✗ {data.singleEvaluation.hungStars} sao Hung</span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Chủ đạo: {data.singleEvaluation.nlChuDao || "Hài hòa"}
              </div>
            </div>

            {/* Âm Dương & Nút */}
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Tổng Nút &amp; Âm Dương
              </div>
              <div className="mt-1 text-sm font-bold text-foreground">
                {data.singleEvaluation.nut} Nút · {data.singleEvaluation.evenCount} Âm / {data.singleEvaluation.oddCount} Dương
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {data.profile.cungPhi.amDuong === "Dương" ? "Cần bổ khuyết Âm" : "Cần bổ khuyết Dương"}
              </div>
            </div>
          </div>

          {/* Lời khuyên tư vấn phong thủy */}
          <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4 sm:p-5 flex items-start gap-3">
            <Info className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm leading-relaxed text-foreground/90">
              <strong className="text-gold">Lời khuyên của chuyên gia CHONSOMOBIFONE: </strong>
              <span>{data.singleEvaluation.advice}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HỒ SƠ PHONG THỦY BÁT TỰ CỦA KHÁCH HÀNG ───────────────────────── */}
      {data?.profile && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-bold text-foreground">
              <span className="h-5 w-1 rounded-full bg-primary" />
              Hồ sơ Bát Tự phong thủy: Người sinh năm {data.birth.nam} ({data.profile.napAm})
            </h3>
            <span className="text-xs text-muted-foreground">
              {data.gioiTinh === "nam" ? "Nam mệnh" : "Nữ mệnh"} · Giờ {data.profile.gioLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-xl border border-border/80 bg-background/80 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Bản mệnh nạp âm</div>
              <div className="mt-1 text-base sm:text-lg font-extrabold" style={{ color: MENH_COLORS[data.profile.menh] }}>
                Mệnh {data.profile.menh}
              </div>
              <div className="text-[11px] text-muted-foreground">{data.profile.napAm}</div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Cung phi Bát Trạch</div>
              <div className="mt-1 text-base sm:text-lg font-extrabold text-foreground">
                Cung {data.profile.cungPhi.cung}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Hành {data.profile.cungPhi.nguHanh} · {data.profile.cungPhi.amDuong}
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Tính chất Âm Dương</div>
              <div className="mt-1 text-base sm:text-lg font-extrabold text-foreground">
                {data.profile.cungPhi.amDuong} Mạng
              </div>
              <div className="text-[11px] text-muted-foreground">Ưu tiên số cân bằng năng lượng</div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 p-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase">Con số vượng khí</div>
              <div className="mt-1 text-base sm:text-lg font-extrabold text-gold tracking-widest font-mono">
                {(MENH_LUCKY_DIGITS[data.profile.menh] || []).join(" · ")}
              </div>
              <div className="text-[11px] text-muted-foreground">Kích hoạt tài lộc bản mệnh</div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. BỘ LỌC ĐA CHIỀU MONG CẦU PHONG THỦY (Pills Filter) ───────────── */}
      {data && (
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          {/* Lọc theo Mục tiêu phong thủy */}
          <div>
            <span className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-gold" /> Chọn mục tiêu kích hoạt phong thủy:
            </span>
            <div className="flex flex-wrap gap-2">
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
                      setTimeout(() => fetchSims(1), 50);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-background text-foreground/80 hover:bg-muted border border-border/80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-gold" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc Mức giá + Đầu số + Sắp xếp */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border/50">
            {/* Khoảng giá */}
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-primary" /> Mức giá:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRICE_FILTERS.map((p) => {
                  const active = selectedPrice === p.value;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSelectedPrice(p.value);
                        setPage(1);
                        setTimeout(() => fetchSims(1), 50);
                      }}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
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
              <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" /> Đầu số:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PREFIX_FILTERS.map((p) => {
                  const active = selectedPrefix === p.value;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSelectedPrefix(p.value);
                        setPage(1);
                        setTimeout(() => fetchSims(1), 50);
                      }}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
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
              <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-primary" /> Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSortBy(val);
                  setPage(1);
                  setTimeout(() => fetchSims(1), 50);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="score_desc">Điểm phong thuỷ cao nhất</option>
                <option value="price_asc">Giá từ thấp đến cao</option>
                <option value="price_desc">Giá từ cao đến thấp</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. DANH SÁCH THẺ SIM KẾT QUẢ (CARD UI CHUẨN SIMKINHDICH) ────────── */}
      {data && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Danh sách SIM hợp tuổi ({data.profile.napAm})
              </h3>
              <span className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Tìm thấy {data.total.toLocaleString("vi-VN")} SIM
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Đang hiển thị {data.sims.length > 0 ? (page - 1) * limit + 1 : 0} –{" "}
              {Math.min(page * limit, data.total)} trong tổng số {data.total} SIM
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Đang sàng lọc kho SIM hợp tuổi...</p>
            </div>
          ) : data.sims.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
              <p className="text-base text-muted-foreground">
                Kho tạm hết số khớp tiêu chí này. Quý khách vui lòng nới rộng khoảng giá hoặc đổi đầu số.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPrice(null);
                  setSelectedPrefix(null);
                  setMucTieu("all");
                  setPage(1);
                  setTimeout(() => fetchSims(1), 50);
                }}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary-dark transition-all"
              >
                Xóa bộ lọc &amp; Xem lại toàn bộ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.sims.map((sim) => (
                <div
                  key={sim.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card hover:border-gold/50 hover:shadow-xl transition-all duration-200"
                >
                  <div>
                    {/* Header Thẻ: Số SIM + Hộp Điểm Số */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-2xl font-black tracking-wider text-gold group-hover:text-primary transition-colors">
                          {formatSimQuyAware(sim.digits)}
                        </div>
                        <div className="mt-0.5 text-base font-extrabold text-foreground">
                          {formatPrice(sim.price)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 rounded-xl bg-gold/15 border border-gold/30 px-2.5 py-1 text-xs font-black text-gold">
                          <Star className="h-3 w-3 fill-gold" />
                          <span>{sim.score} /10</span>
                        </div>
                        <span className="mt-1 text-[10px] font-semibold text-emerald-400">
                          {sim.score >= 8.5 ? "★ Rất hợp tuổi" : "★ Hợp tuổi"}
                        </span>
                      </div>
                    </div>

                    {/* 4 Chỉ Số Phong Thủy Vàng */}
                    <div className="mt-4 space-y-2 border-t border-border/50 pt-3 text-xs">
                      {/* Quẻ Kinh Dịch */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <Compass className="h-3 w-3 text-gold" /> Quẻ Dịch:
                        </span>
                        <span className="font-semibold text-foreground text-right truncate">
                          {sim.hexagram || `Quẻ ${sim.que}`}
                        </span>
                      </div>

                      {/* Ngũ Hành Sim */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <Flame className="h-3 w-3 text-primary" /> Ngũ Hành:
                        </span>
                        <span className="font-semibold text-foreground">
                          Hành {sim.simHanh || "Hỏa"} ({sim.quanHe || "Tương sinh"})
                        </span>
                      </div>

                      {/* Bát Cực Linh Số */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <Sparkles className="h-3 w-3 text-gold" /> Bát Cực:
                        </span>
                        <span className="font-semibold text-emerald-400 truncate">
                          NL {sim.nlChuDao || "Sinh Khí"}
                        </span>
                      </div>

                      {/* Nút */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                          <ShieldCheck className="h-3 w-3 text-primary" /> Tổng Nút:
                        </span>
                        <span className="font-semibold text-foreground">
                          {sim.nut} nút ({sim.nut >= 7 ? "Đại cát" : "Cát"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Hành Động */}
                  <div className="mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                    <a
                      href="https://zalo.me/0933686666"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-gold/10 border border-gold/30 py-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-black transition-all"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Chat Zalo
                    </a>
                    <Link
                      href={`/sim/${sim.digits}`}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary-dark transition-all"
                    >
                      Xem luận giải →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="rounded-xl border-border"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trang trước
              </Button>
              <div className="text-xs font-semibold text-muted-foreground px-3">
                Trang {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="rounded-xl border-border"
              >
                Trang sau <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
