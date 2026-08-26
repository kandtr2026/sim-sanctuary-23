"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, ChevronDown } from "lucide-react";
import Link from "next/link";
import { formatPrice, formatSIMNumber } from "@/lib/simUtils";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);

const normalize = (n: number): string => String(n).padStart(2, "0");

export default function SimNamSinhFinder() {
  const router = useRouter();
  const [day, setDay] = useState<number | "">("");
  const [month, setMonth] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");

  const handleSearch = () => {
    if (!day || !month || !year) return;
    router.push(`/sim-nam-sinh/${year}`);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-gold/40 bg-gradient-to-b from-[hsl(0,0%,14%)] to-[hsl(0,0%,9%)] p-6 shadow-card md:p-8">
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gold">
        <Calendar className="h-4 w-4" />
        Nhập ngày sinh của bạn
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-left text-xs font-medium text-primary-foreground/70">Ngày</span>
          <div className="relative">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")}
              className="w-full appearance-none rounded-lg border border-gold/30 bg-black/40 px-3 py-3 text-center text-lg text-white outline-none focus:border-gold"
            >
              <option value="">Ngày</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-left text-xs font-medium text-primary-foreground/70">Tháng</span>
          <div className="relative">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}
              className="w-full appearance-none rounded-lg border border-gold/30 bg-black/40 px-3 py-3 text-center text-lg text-white outline-none focus:border-gold"
            >
              <option value="">Tháng</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-left text-xs font-medium text-primary-foreground/70">Năm sinh</span>
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
              className="w-full appearance-none rounded-lg border border-gold/30 bg-black/40 px-3 py-3 text-center text-lg text-white outline-none focus:border-gold"
            >
              <option value="">Năm</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/70" />
          </div>
        </label>
      </div>

      {day && month && year && (
        <p className="mt-4 text-sm text-primary-foreground/70">
          Bạn sinh ngày <strong className="text-gold">{normalize(Number(day))}/{normalize(Number(month))}/{year}</strong> —
          tìm sim có số <strong className="text-gold">{year}</strong>
        </p>
      )}

      <button
        onClick={handleSearch}
        disabled={!day || !month || !year}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3.5 text-base font-bold text-header-bg shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <Search className="h-5 w-5" />
        Tìm SIM năm sinh
      </button>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {YEARS.slice(0, 10).map((y) => (
          <Link
            key={y}
            href={`/sim-nam-sinh/${y}`}
            className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
          >
            {y}
          </Link>
        ))}
      </div>
    </div>
  );
}
