"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Sparkles,
  Loader2,
  AlertCircle,
  UserRound,
  Moon,
  Sun,
  ChevronDown,
  ChevronUp,
  IdCard,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import type { HopTuoiProfile, ScoredSim } from "@/lib/simHopTuoi";
import {
  NANG_LUONG_LIST,
  NL_META,
  NL_ORDER,
  type NangLuong,
} from "@/lib/batCuc";

// ===================== API RESPONSE =====================
interface ApiResponse {
  profile: HopTuoiProfile;
  birth: { ngay: number; thang: number; nam: number };
  total: number;
  sims: ScoredSim[];
  batCuc?: {
    filter: {
      nlChuDao: NangLuong | null;
      nlPhaiCo: NangLuong[];
      nlLoaiTru: NangLuong[];
      hoaGiaiCccd: NangLuong[];
    };
    cccd: {
      cccd: string;
      nangLuongHung: NangLuong[];
      hoaGiai: NangLuong[];
      capCuc: { cau: string; giaiThich: string }[];
    } | null;
  } | null;
}

// ===================== COUTURE STYLE TOKENS (giữ đồng bộ trang /sim-phong-thuy) =====================
const CHAMPAGNE = "#D9B778";
const HAIRLINE = "rgba(255,255,255,0.08)";

const panelBase = "relative rounded-2xl p-6 md:p-9";
const panelHeroStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #1B1517 0%, #151113 100%)",
  border: "1px solid rgba(217,183,120,0.30)",
  boxShadow:
    "0 24px 60px -34px rgba(217,183,120,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
};
const panelNeutralStyle: React.CSSProperties = {
  background: "#161214",
  border: `1px solid ${HAIRLINE}`,
};
const ctaStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #C0392B 0%, #9E2A20 100%)",
  boxShadow: "0 10px 24px -12px rgba(192,57,43,0.65)",
  borderRadius: "12px",
};

// Màu badge theo mức độ cát/hung (khớp phong cách của tool cũ)
const LEVEL_CLASS: Record<string, string> = {
  "Đại cát": "bg-[#D4AF6E] text-[#1A1512] border-transparent",
  Cát: "bg-white/[0.12] text-[#EDEDED] border-white/10",
  "Bình thường": "bg-white/[0.06] text-[rgba(237,237,237,0.75)] border-white/10",
  Hung: "bg-[rgba(192,57,43,0.16)] text-[#E8A79F] border-[rgba(192,57,43,0.4)]",
  "Đại hung": "bg-[rgba(192,57,43,0.28)] text-[#F0B7AF] border-[rgba(192,57,43,0.55)]",
};

// Số may mắn theo mệnh (khớp bảng trang hợp mệnh + blog)
const MENH_LUCKY_DIGITS: Record<HopTuoiProfile["menh"], string[]> = {
  Kim: ["2", "5", "8", "6", "7"],
  Mộc: ["0", "1", "3", "4"],
  Thủy: ["6", "7", "0", "1"],
  Hỏa: ["3", "4", "9"],
  Thổ: ["9", "2", "5", "8"],
};

// Màu badge năng lượng Bát Cực (cát = vàng, hung = đỏ)
const NL_BADGE_CLASS: Record<NangLuong, string> = {
  SinhKhí: "bg-[rgba(217,183,120,0.18)] text-[#E8CD9A] border-[rgba(217,183,120,0.45)]",
  ThiênY: "bg-[rgba(217,183,120,0.14)] text-[#E8CD9A] border-[rgba(217,183,120,0.35)]",
  DiênNiên: "bg-[rgba(217,183,120,0.10)] text-[#E8CD9A] border-[rgba(217,183,120,0.3)]",
  PhụcVị: "bg-white/[0.08] text-[#EDEDED] border-white/15",
  HọaHại: "bg-[rgba(192,57,43,0.14)] text-[#E8A79F] border-[rgba(192,57,43,0.4)]",
  LụcSát: "bg-[rgba(192,57,43,0.16)] text-[#E8A79F] border-[rgba(192,57,43,0.45)]",
  NgũQuỷ: "bg-[rgba(192,57,43,0.18)] text-[#F0B7AF] border-[rgba(192,57,43,0.5)]",
  TuyệtMệnh: "bg-[rgba(192,57,43,0.26)] text-[#F0B7AF] border-[rgba(192,57,43,0.6)]",
};

const scoreColor = (score: number): string =>
  score >= 8 ? "#D9B778" : score >= 6.5 ? "#EDEDED" : "#E8A79F";

const toggleNl = (list: NangLuong[], nl: NangLuong): NangLuong[] => {
  if (list.includes(nl)) return list.filter((x) => x !== nl);
  if (list.length >= 5) return list;
  return [...list, nl];
};

const SimHopTuoiTool = () => {
  const router = useRouter();

  // Form state
  const [ngay, setNgay] = useState("1");
  const [thang, setThang] = useState("1");
  const [nam, setNam] = useState("1990");
  const [gio, setGio] = useState("0");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");

  // Bát Cực Linh Số + CCCD
  const [cccd, setCccd] = useState("");
  const [nlChuDao, setNlChuDao] = useState<NangLuong | null>(null);
  const [nlPhaiCo, setNlPhaiCo] = useState<NangLuong[]>([]);
  const [nlLoaiTru, setNlLoaiTru] = useState<NangLuong[]>([]);
  const [batCucOpen, setBatCucOpen] = useState(false);

  // Result state
  const [isLooking, setIsLooking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLooking) return;

    const ngayN = Number(ngay);
    const thangN = Number(thang);
    const namN = Number(nam);
    if (!ngayN || !thangN || !namN) {
      setError("Vui lòng nhập đầy đủ ngày, tháng, năm sinh.");
      return;
    }
    if (namN < 1950 || namN > 2029) {
      setError("Năm sinh nên từ 1950 đến 2029.");
      return;
    }
    const cccdClean = cccd.replace(/\D/g, "");
    if (cccdClean.length > 0 && cccdClean.length !== 12) {
      setError("CCCD phải đủ 12 chữ số để phân tích hóa giải.");
      return;
    }

    setError("");
    setIsLooking(true);
    try {
      const params = new URLSearchParams({
        ngay: String(ngayN),
        thang: String(thangN),
        nam: String(namN),
        gio,
        gioitinh: gioiTinh,
      });
      if (cccdClean.length === 12) params.set("cccd", cccdClean);
      if (nlChuDao) params.set("nlChuDao", nlChuDao);
      if (nlPhaiCo.length) params.set("nlPhaiCo", nlPhaiCo.join(","));
      if (nlLoaiTru.length) params.set("nlLoaiTru", nlLoaiTru.join(","));

      const res = await fetch(`/api/sim-hop-tuoi?${params.toString()}`, {
        method: "GET",
      });
      const body = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok || body.error) {
        setError(body.error ?? "Không thể tra cứu, vui lòng thử lại.");
        setResult(null);
      } else {
        setResult(body);
      }
    } catch {
      setError("Kết nối thất bại, vui lòng thử lại.");
      setResult(null);
    } finally {
      setIsLooking(false);
    }
  };

  const handleBuyNow = (sim: ScoredSim) => {
    router.push(`/mua-ngay/${encodeURIComponent(sim.id)}`);
  };

  const profile = result?.profile ?? null;
  const luckyDigits = profile ? MENH_LUCKY_DIGITS[profile.menh] : [];
  const cccdInfo = result?.batCuc?.cccd ?? null;

  return (
    <>
      <style>{`
        @keyframes spt-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes spt-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .spt-rise { animation: spt-rise 300ms cubic-bezier(0.16,1,0.3,1) both; }
        .spt-card { transition: transform 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms cubic-bezier(0.4,0,0.2,1); }
        @media (hover: hover) { .spt-card:hover { transform: translateY(-2px); border-color: rgba(217,183,120,0.35); box-shadow: 0 16px 38px -20px rgba(0,0,0,0.8); } }
        .spt-cta { transition: transform 180ms cubic-bezier(0.4,0,0.2,1), filter 180ms cubic-bezier(0.4,0,0.2,1); }
        @media (hover: hover) { .spt-cta:hover { filter: brightness(1.08); } }
        .spt-cta:active { transform: scale(0.98); }
        .spt-skel { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 37%, rgba(255,255,255,0.04) 63%); background-size: 200% 100%; animation: spt-shimmer 1200ms ease-in-out infinite; }
        .spt-nl-btn { transition: border-color 160ms ease-out, background-color 160ms ease-out, opacity 160ms ease-out; }
        .spt-nl-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>

      {/* ── PANEL HERO: form nhập bát tự ───────────────────────────────── */}
      <div className={panelBase} style={panelHeroStyle}>
        <div className="flex items-center gap-3 mb-6">
          <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
          <h2 className="text-[22px] md:text-2xl font-semibold flex items-center gap-2" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
            <Search className="w-5 h-5" style={{ color: CHAMPAGNE }} />
            Tìm SIM hợp tuổi của bạn
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ngày / tháng / năm sinh */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="ngay" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
                Ngày
              </Label>
              <Select value={ngay} onValueChange={setNgay}>
                <SelectTrigger id="ngay" className="h-12 md:h-14 rounded-xl text-base md:text-lg bg-black/40 border-white/10 text-white focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <SelectItem key={d} value={String(d)} className="text-white text-base">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thang" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
                Tháng
              </Label>
              <Select value={thang} onValueChange={setThang}>
                <SelectTrigger id="thang" className="h-12 md:h-14 rounded-xl text-base md:text-lg bg-black/40 border-white/10 text-white focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)} className="text-white text-base">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nam" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
                Năm
              </Label>
              <Select value={nam} onValueChange={setNam}>
                <SelectTrigger id="nam" className="h-12 md:h-14 rounded-xl text-base md:text-lg bg-black/40 border-white/10 text-white focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
                  {Array.from({ length: 80 }, (_, i) => 1950 + i)
                    .reverse()
                    .map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-white text-base">
                        {y}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Giờ sinh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label htmlFor="gio" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
                Giờ sinh (âm lịch)
              </Label>
              <Select value={gio} onValueChange={setGio}>
                <SelectTrigger id="gio" className="h-12 md:h-14 rounded-xl text-base md:text-lg bg-black/40 border-white/10 text-white focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
                  {[
                    "Tý (23h–1h)", "Sửu (1h–3h)", "Dần (3h–5h)", "Mão (5h–7h)",
                    "Thìn (7h–9h)", "Tỵ (9h–11h)", "Ngọ (11h–13h)", "Mùi (13h–15h)",
                    "Thân (15h–17h)", "Dậu (17h–19h)", "Tuất (19h–21h)", "Hợi (21h–23h)",
                  ].map((label, idx) => (
                    <SelectItem key={label} value={String(idx)} className="text-white text-base">
                      Giờ {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Giới tính */}
            <div className="space-y-2">
              <Label style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm block">
                Giới tính
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGioiTinh("nam")}
                  aria-pressed={gioiTinh === "nam"}
                  className={`flex items-center justify-center gap-2 h-12 md:h-14 rounded-xl border text-base font-semibold transition-colors ${
                    gioiTinh === "nam"
                      ? "border-[#D9B778] bg-[#D9B778]/15 text-[#F5F5F5]"
                      : "border-white/10 bg-black/40 text-[rgba(237,237,237,0.6)] hover:border-white/25"
                  }`}
                >
                  <UserRound className="w-5 h-5" style={{ color: CHAMPAGNE }} />
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGioiTinh("nu")}
                  aria-pressed={gioiTinh === "nu"}
                  className={`flex items-center justify-center gap-2 h-12 md:h-14 rounded-xl border text-base font-semibold transition-colors ${
                    gioiTinh === "nu"
                      ? "border-[#D9B778] bg-[#D9B778]/15 text-[#F5F5F5]"
                      : "border-white/10 bg-black/40 text-[rgba(237,237,237,0.6)] hover:border-white/25"
                  }`}
                >
                  <UserRound className="w-5 h-5" style={{ color: CHAMPAGNE }} />
                  Nữ
                </button>
              </div>
            </div>
          </div>

          {/* ── Bát Cực Linh Số: CCCD + bộ lọc năng lượng ─────────────── */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(217,183,120,0.25)", background: "rgba(0,0,0,0.25)" }}
          >
            <button
              type="button"
              onClick={() => setBatCucOpen((v) => !v)}
              aria-expanded={batCucOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-2.5">
                <Zap className="w-4.5 h-4.5 w-5 h-5" style={{ color: CHAMPAGNE }} />
                <span className="font-semibold text-[15px]" style={{ color: "#F5F5F5" }}>
                  Kết hợp Bát Cực Linh Số
                </span>
                {(cccd || nlChuDao || nlPhaiCo.length > 0 || nlLoaiTru.length > 0) && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(217,183,120,0.18)", color: "#E8CD9A" }}
                  >
                    đang lọc
                  </span>
                )}
              </span>
              {batCucOpen ? (
                <ChevronUp className="w-4 h-4" style={{ color: CHAMPAGNE }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: CHAMPAGNE }} />
              )}
            </button>

            {batCucOpen && (
              <div className="px-4 pb-4 space-y-4 spt-rise">
                {/* CCCD */}
                <div className="space-y-2">
                  <Label htmlFor="cccd" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm flex items-center gap-2">
                    <IdCard className="w-4 h-4" style={{ color: CHAMPAGNE }} />
                    Căn cước công dân (tự động đề xuất hóa giải)
                  </Label>
                  <input
                    id="cccd"
                    inputMode="numeric"
                    maxLength={12}
                    value={cccd}
                    onChange={(e) => setCccd(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="Nhập 12 số CCCD (tùy chọn)"
                    className="h-12 md:h-13 w-full rounded-xl text-base md:text-lg bg-black/40 border border-white/10 text-white px-4 placeholder:text-white/25 focus:outline-none focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30"
                  />
                  <p style={{ color: "rgba(237,237,237,0.5)" }} className="text-xs">
                    CCCD phải đủ 12 chữ số. Hệ thống tìm năng lượng hung trong CCCD và gợi ý SIM có năng lượng cát hóa giải tương ứng.
                  </p>
                </div>

                {/* NL chủ đạo */}
                <div className="space-y-2">
                  <Label style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm block">
                    Năng lượng chủ đạo của SIM
                  </Label>
                  <Select
                    value={nlChuDao ?? "tat-ca"}
                    onValueChange={(v) => setNlChuDao(v === "tat-ca" ? null : (v as NangLuong))}
                  >
                    <SelectTrigger className="h-12 rounded-xl text-base bg-black/40 border-white/10 text-white focus:border-[#D9B778]">
                      <SelectValue placeholder="Tùy chọn" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
                      <SelectItem value="tat-ca" className="text-white text-base">
                        Tùy chọn
                      </SelectItem>
                      {NANG_LUONG_LIST.map((nl) => (
                        <SelectItem key={nl.id} value={nl.id} className="text-white text-base">
                          {nl.label} – {nl.yNghia.join(" • ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NL phải có */}
                <div className="space-y-2">
                  <Label style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm block">
                    Năng lượng phải có
                    <span className="ml-2 text-[11px]" style={{ color: "rgba(237,237,237,0.5)" }}>
                      {nlPhaiCo.length}/5
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {NANG_LUONG_LIST.map((nl) => {
                      const active = nlPhaiCo.includes(nl.id);
                      return (
                        <button
                          key={`p-${nl.id}`}
                          type="button"
                          onClick={() => setNlPhaiCo((l) => toggleNl(l, nl.id))}
                          aria-pressed={active}
                          className={`spt-nl-btn rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? NL_BADGE_CLASS[nl.id]
                              : "border-white/10 bg-black/30 text-[rgba(237,237,237,0.65)]"
                          }`}
                        >
                          {nl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NL loại trừ */}
                <div className="space-y-2">
                  <Label style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm block">
                    Loại trừ năng lượng
                    <span className="ml-2 text-[11px]" style={{ color: "rgba(237,237,237,0.5)" }}>
                      {nlLoaiTru.length}/5
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {NANG_LUONG_LIST.map((nl) => {
                      const active = nlLoaiTru.includes(nl.id);
                      return (
                        <button
                          key={`e-${nl.id}`}
                          type="button"
                          onClick={() => setNlLoaiTru((l) => toggleNl(l, nl.id))}
                          aria-pressed={active}
                          className={`spt-nl-btn rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? "bg-[rgba(192,57,43,0.22)] text-[#F0B7AF] border-[rgba(192,57,43,0.55)]"
                              : "border-white/10 bg-black/30 text-[rgba(237,237,237,0.65)]"
                          }`}
                        >
                          {nl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(nlPhaiCo.length > 0 || nlLoaiTru.length > 0 || nlChuDao || cccd) && (
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCccd("");
                        setNlChuDao(null);
                        setNlPhaiCo([]);
                        setNlLoaiTru([]);
                      }}
                      className="text-xs font-medium underline underline-offset-4"
                      style={{ color: "rgba(237,237,237,0.6)" }}
                    >
                      Xóa bộ lọc Bát Cực
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <p style={{ color: "rgba(237,237,237,0.5)" }} className="text-xs">
            Nhập ngày sinh dương lịch + giờ sinh âm lịch + giới tính. Hệ thống tự động tính mệnh (nạp âm),
            cung phi, âm dương, Bát Cực Linh Số và chấm điểm SIM trong kho của CHONSOMOBIFONE.
          </p>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 text-sm rounded-xl p-3"
              style={{ color: "#E8A79F", background: "rgba(192,57,43,0.12)", border: "1px solid rgba(192,57,43,0.4)" }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isLooking}
            aria-busy={isLooking}
            className="spt-cta w-full md:w-auto text-white border-0 text-base font-semibold"
            style={ctaStyle}
          >
            {isLooking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tra cứu…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Tìm sim hợp tuổi
              </>
            )}
          </Button>
        </form>
      </div>

      {/* ── KẾT QUẢ: hồ sơ phong thủy ───────────────────────────────────── */}
      {result && profile && (
        <div className={`${panelBase} spt-rise mt-10 md:mt-14`} style={panelNeutralStyle}>
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
            <h2 className="text-[22px] md:text-2xl font-semibold" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
              Phân tích phong thủy của bạn
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Mệnh */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(217,183,120,0.25)" }}
            >
              <p className="text-xs mb-1.5" style={{ color: "rgba(237,237,237,0.65)" }}>Mệnh</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: "#D9B778" }}>{profile.menh}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(237,237,237,0.6)" }}>
                {profile.thienCan} {profile.diaChi} · {profile.napAm}
              </p>
            </div>

            {/* Cung phi */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs mb-1.5" style={{ color: "rgba(237,237,237,0.65)" }}>Cung phi</p>
              <p className="text-lg md:text-xl font-bold text-white">{profile.cungPhi.cung}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(237,237,237,0.6)" }}>
                {profile.cungPhi.nguHanh} · {profile.cungPhi.amDuong}
              </p>
            </div>

            {/* Âm dương */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs mb-1.5" style={{ color: "rgba(237,237,237,0.65)" }}>Âm – Dương</p>
              <p className="text-lg md:text-xl font-bold text-white">
                {profile.cungPhi.amDuong === "Dương" ? <Sun className="inline w-5 h-5 mr-1" style={{ color: CHAMPAGNE }} /> : <Moon className="inline w-5 h-5 mr-1" style={{ color: CHAMPAGNE }} />}
                {profile.cungPhi.amDuong === "Dương" ? "Dương mạng" : "Âm mạng"}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(237,237,237,0.6)" }}>
                Giờ {profile.gioLabel.split(" ")[0]} ({profile.gioAmDuong})
              </p>
            </div>

            {/* Số may mắn */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-xs mb-1.5" style={{ color: "rgba(237,237,237,0.65)" }}>Số may mắn</p>
              <p className="text-lg md:text-xl font-bold tracking-wider" style={{ color: "#D9B778" }}>
                {luckyDigits.join(" · ")}
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(237,237,237,0.6)" }}>
                Hợp mệnh {profile.menh}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PHÂN TÍCH CCCD & HÓA GIẢI ─────────────────────────────────── */}
      {result && cccdInfo && (
        <div className={`${panelBase} spt-rise mt-10 md:mt-14`} style={panelNeutralStyle}>
          <div className="flex items-center gap-3 mb-2">
            <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
            <h2 className="text-[22px] md:text-2xl font-semibold flex items-center gap-2" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
              <ShieldCheck className="w-5 h-5" style={{ color: CHAMPAGNE }} />
              Hóa giải CCCD
            </h2>
          </div>
          <p className="mb-5 text-sm" style={{ color: "rgba(237,237,237,0.6)" }}>
            CCCD <span className="font-mono" style={{ color: "#D9B778" }}>{cccdInfo.cccd.replace(/(\d{4})(?=\d)/g, "$1 ")}</span>{" "}
            mang các năng lượng hung sau — SIM gợi ý bên dưới đã được lọc để bổ sung năng lượng cát hóa giải:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(237,237,237,0.65)" }}>
                Năng lượng hung trong CCCD
              </p>
              <div className="flex flex-wrap gap-2">
                {cccdInfo.nangLuongHung.length === 0 ? (
                  <p className="text-sm" style={{ color: "rgba(237,237,237,0.7)" }}>
                    Không phát hiện năng lượng hung — CCCD cân bằng.
                  </p>
                ) : (
                  cccdInfo.nangLuongHung.map((nl) => (
                    <Badge key={nl} className={`text-xs px-2.5 py-1 border font-medium ${NL_BADGE_CLASS[nl]}`}>
                      {NL_META[nl].label}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(217,183,120,0.25)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(237,237,237,0.65)" }}>
                Năng lượng cát cần bổ sung trong SIM
              </p>
              <div className="flex flex-wrap gap-2">
                {cccdInfo.hoaGiai.length === 0 ? (
                  <p className="text-sm" style={{ color: "rgba(237,237,237,0.7)" }}>
                    Không cần hóa giải.
                  </p>
                ) : (
                  cccdInfo.hoaGiai.map((nl) => (
                    <Badge key={nl} className={`text-xs px-2.5 py-1 border font-medium ${NL_BADGE_CLASS[nl]}`}>
                      {NL_META[nl].label}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>

          {cccdInfo.capCuc.length > 0 && (
            <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(237,237,237,0.65)" }}>Chi tiết hóa giải từng cặp số</p>
              <ul className="space-y-1.5">
                {cccdInfo.capCuc.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "rgba(237,237,237,0.8)" }}>
                    <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: CHAMPAGNE }} />
                    <span>
                      <span className="font-mono" style={{ color: "#E8CD9A" }}>{c.cau}</span>
                      <span className="text-[rgba(237,237,237,0.55)]"> → {c.giaiThich}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── GỢI Ý SIM HỢP NHẤT ──────────────────────────────────────────── */}
      {result && (
        <div className={`${panelBase} spt-rise mt-10 md:mt-14`} style={panelNeutralStyle}>
          <div className="flex items-center gap-3 mb-2">
            <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
            <h2 className="text-[22px] md:text-2xl font-semibold" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
              SIM hợp nhất theo phong thủy
            </h2>
          </div>
          <p className="mb-6 text-sm" style={{ color: "rgba(237,237,237,0.6)" }}>
            Chấm điểm trên {result.total} SIM đang có trong kho — theo ngũ hành, âm dương, tổng nút, quẻ dịch, cấu trúc số và Bát Cực Linh Số.
          </p>

          {result.sims.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: "rgba(237,237,237,0.7)" }}>Không tìm thấy SIM phù hợp trong kho. Vui lòng thử lại sau.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.sims.map((sim) => (
                <div
                  key={sim.id}
                  className="spt-card rounded-lg p-5 flex flex-col gap-2.5"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-lg md:text-xl font-semibold truncate" style={{ color: "#D9B778" }}>
                        {formatSimQuyAware(sim.digits)}
                      </p>
                      <p className="text-base md:text-lg font-medium text-white mt-0.5">{formatPrice(sim.price)}</p>
                    </div>
                    <div
                      className="flex flex-col items-center justify-center flex-shrink-0 rounded-xl px-3 py-1.5"
                      style={{
                        background: sim.score >= 8 ? "rgba(217,183,120,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${sim.score >= 8 ? "rgba(217,183,120,0.4)" : "rgba(255,255,255,0.1)"}`,
                      }}
                    >
                      <span className="text-xl font-bold leading-none" style={{ color: scoreColor(sim.score) }}>
                        {sim.score.toFixed(1)}
                      </span>
                      <span className="text-[10px] mt-0.5" style={{ color: "rgba(237,237,237,0.55)" }}>/10 điểm</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={`text-xs px-2.5 py-1 border font-medium ${LEVEL_CLASS[sim.hexagramLevel] ?? LEVEL_CLASS["Bình thường"]}`}>
                      Quẻ {sim.que}
                    </Badge>
                    <Badge className="text-xs px-2.5 py-1 border font-medium bg-white/[0.06] text-[rgba(237,237,237,0.75)] border-white/10">
                      {sim.nut} nút
                    </Badge>
                    {sim.nlChuDao && (
                      <Badge className={`text-xs px-2.5 py-1 border font-medium ${NL_BADGE_CLASS[sim.nlChuDao]}`}>
                        NL {NL_META[sim.nlChuDao].label}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs truncate" style={{ color: "rgba(237,237,237,0.55)" }}>
                    {sim.hexagram}
                  </p>

                  {/* Năng lượng Bát Cực nổi bật */}
                  <div className="flex flex-wrap gap-1">
                    {NL_ORDER.filter((nl) => (sim.nlCounts?.[nl] ?? 0) > 0)
                      .sort((a, b) => (sim.nlCounts?.[b] ?? 0) - (sim.nlCounts?.[a] ?? 0))
                      .slice(0, 3)
                      .map((nl) => (
                        <span
                          key={nl}
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${NL_BADGE_CLASS[nl]}`}
                        >
                          {NL_META[nl].label} ×{sim.nlCounts?.[nl]}
                        </span>
                      ))}
                  </div>

                  <Button
                    size="lg"
                    className="spt-cta mt-1 text-white border-0 text-base font-semibold py-2.5"
                    style={ctaStyle}
                    onClick={() => handleBuyNow(sim)}
                  >
                    ĐẶT NGAY
                  </Button>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs mt-4 text-center" style={{ color: "rgba(237,237,237,0.5)" }}>
            Click "ĐẶT NGAY" để đặt mua SIM. Giá hiển thị là giá thực từ kho CHONSOMOBIFONE.
          </p>
        </div>
      )}
    </>
  );
};

export default SimHopTuoiTool;
