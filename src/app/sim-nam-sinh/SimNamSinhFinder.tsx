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
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

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

  const handleSearch = () => {
    if (!day || !month || !year) return;
    router.push(`/sim-nam-sinh/${year}?d=${normalize(Number(day))}&m=${normalize(Number(month))}`);
  };

  return (
    <div className="relative rounded-2xl p-6 md:p-9" style={panelHeroStyle}>
      <div className="flex items-center gap-3 mb-6">
        <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: CHAMPAGNE }} />
        <h2 className="text-[22px] md:text-2xl font-semibold flex items-center gap-2" style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}>
          <Calendar className="w-5 h-5" style={{ color: CHAMPAGNE }} />
          Tìm SIM theo ngày sinh của Quý khách
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="ns-day" style={{ color: "rgba(237,237,237,0.8)" }} className="text-sm">
            Ngày
          </Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="ns-day" className={selectClass}>
              <SelectValue placeholder="Ngày" />
            </SelectTrigger>
            <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
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
            Tháng
          </Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger id="ns-month" className={selectClass}>
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent className="bg-[#1B1618] border-white/10 text-white max-h-72">
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
            Năm sinh
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

      {day && month && year && (
        <p className="mt-4 text-sm" style={{ color: "rgba(237,237,237,0.7)" }}>
          Ngày sinh{" "}
          <strong className="font-semibold" style={{ color: CHAMPAGNE }}>
            {normalize(Number(day))}/{normalize(Number(month))}/{year}
          </strong>{" "}
          — chúng tôi sẽ lọc những số có{" "}
          <strong className="font-semibold" style={{ color: CHAMPAGNE }}>
            {year}
          </strong>{" "}
          trong dãy
        </p>
      )}

      <Button
        onClick={handleSearch}
        disabled={!day || !month || !year}
        size="lg"
        className="mt-5 w-full md:w-auto text-white border-0 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        style={ctaStyle}
      >
        <Search className="w-4 h-4 mr-2" />
        Xem SIM năm sinh
      </Button>

      <p className="mt-4 text-xs" style={{ color: "rgba(237,237,237,0.5)" }}>
        Quý khách chọn ngày sinh dương lịch của bản thân hoặc của người thân. Hệ thống lọc trong kho SIM Mobifone thật
        của CHONSOMOBIFONE những số có năm sinh tương ứng.
      </p>
    </div>
  );
}