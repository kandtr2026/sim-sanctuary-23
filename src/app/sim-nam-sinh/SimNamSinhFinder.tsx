"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
// Khoảng năm phải khớp isPlausibleBirthYear (serverSimData: 1955–2025). Nếu form
// đưa năm ngoài dải này thì /sim-nam-sinh/[year] sẽ notFound() → khách cụt hứng.
const YEAR_MIN = 1955;
const YEAR_MAX = 2025;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);
// Giá trị sentinel cho ô Ngày/Tháng khi khách muốn bỏ trống (tìm theo năm sinh).
// Radix Select không nhận value rỗng nên phải dùng một token riêng.
const NONE = "none";

const normalize = (n: number): string => String(n).padStart(2, "0");

// COUTURE STYLE TOKENS (giữ đồng bộ trang /sim-phong-thuy)
const CHAMPAGNE = "#D9B778";

const panelHeroStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #1B1517 0%, #151113 100%)",
  border: "1px solid rgba(217,183,120,0.30)",
  boxShadow:
    "0 24px 60px -34px rgba(217,183,120,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
};
const ctaStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #C0392B 0%, #9E2A20 100%)",
  boxShadow: "0 10px 24px -12px rgba(192,57,43,0.65)",
  borderRadius: "12px",
};

const selectClass =
  "h-12 md:h-14 rounded-xl text-base md:text-lg bg-black/40 border-white/10 text-white focus:border-[#D9B778] focus:ring-2 focus:ring-[#D9B778]/30";

export default function SimNamSinhFinder() {
  const router = useRouter();
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Ngày/tháng đi theo CẶP: có cả hai → tìm theo ngày sinh; bỏ trống cả hai →
  // tìm theo năm sinh. Chọn lẻ một trong hai là trạng thái chưa hợp lệ.
  const dayChosen = day !== "" && day !== NONE;
  const monthChosen = month !== "" && month !== NONE;
  const hasDayMonth = dayChosen && monthChosen;
  const partialDate = dayChosen !== monthChosen; // đúng một ô được chọn
  const canSearch = !!year && !partialDate;

  const handleSearch = () => {
    if (!canSearch) return;
    if (hasDayMonth) {
      router.push(`/sim-nam-sinh/${year}?d=${normalize(Number(day))}&m=${normalize(Number(month))}`);
    } else {
      // Chỉ theo năm sinh.
      router.push(`/sim-nam-sinh/${year}`);
    }
  };

  return (
    <div className="relative rounded-2xl p-6 md:p-9" style={panelHeroStyle}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
          <h2 className="text-[22px] md:text-2xl font-semibold flex items-center gap-2" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
            <Calendar className="w-5 h-5" style={{ color: CHAMPAGNE }} />
            Tìm SIM theo ngày sinh của Quý khách
          </h2>
        </div>
        <p className="mt-2 pl-4 text-sm" style={{ color: "rgba(237,237,237,0.65)" }}>
          Nhập <strong style={{ color: CHAMPAGNE }}>ngày/tháng/năm sinh</strong>, hoặc chỉ chọn{" "}
          <strong style={{ color: CHAMPAGNE }}>năm sinh</strong> — Ngày và Tháng có thể để trống.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="ns-day" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
            Ngày <span style={{ color: "rgba(237,237,237,0.45)" }}>(tùy chọn)</span>
          </Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="ns-day" className={selectClass}>
              <SelectValue placeholder="Ngày" />
            </SelectTrigger>
            <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
              <SelectItem value={NONE} className="text-white/70 text-base">
                — Bỏ trống —
              </SelectItem>
              {DAYS.map((d) => (
                <SelectItem key={d} value={String(d)} className="text-white text-base">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ns-month" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
            Tháng <span style={{ color: "rgba(237,237,237,0.45)" }}>(tùy chọn)</span>
          </Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger id="ns-month" className={selectClass}>
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
              <SelectItem value={NONE} className="text-white/70 text-base">
                — Bỏ trống —
              </SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)} className="text-white text-base">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ns-year" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
            Năm sinh <span style={{ color: CHAMPAGNE }}>*</span>
          </Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger id="ns-year" className={selectClass}>
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-white text-base">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {partialDate ? (
        <p className="mt-4 text-sm" style={{ color: "#E8A79F" }}>
          Quý khách chọn <strong className="font-semibold">đủ cả Ngày và Tháng</strong>, hoặc để trống
          cả hai để tìm theo năm sinh.
        </p>
      ) : hasDayMonth && year ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(237,237,237,0.7)" }}>
          Tìm số trùng đúng ngày sinh{" "}
          <strong className="font-semibold" style={{ color: CHAMPAGNE }}>
            {normalize(Number(day))}/{normalize(Number(month))}/{year}
          </strong>{" "}
          trong kho.
        </p>
      ) : year ? (
        <p className="mt-4 text-sm" style={{ color: "rgba(237,237,237,0.7)" }}>
          Tìm những số có năm sinh{" "}
          <strong className="font-semibold" style={{ color: CHAMPAGNE }}>
            {year}
          </strong>{" "}
          trong dãy.
        </p>
      ) : null}

      <Button
        onClick={handleSearch}
        disabled={!canSearch}
        size="lg"
        className="mt-5 w-full md:w-auto text-white border-0 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        style={ctaStyle}
      >
        <Search className="w-4 h-4 mr-2" />
        {hasDayMonth ? "Tìm sim theo ngày sinh" : "Tìm sim theo năm sinh"}
      </Button>

      <p className="mt-4 text-xs" style={{ color: "rgba(237,237,237,0.5)" }}>
        Quý khách chọn ngày sinh dương lịch của bản thân hoặc của người thân. Hệ thống lọc trong kho SIM Mobifone thật
        của CHONSOMOBIFONE những số có năm sinh tương ứng.
      </p>
    </div>
  );
}