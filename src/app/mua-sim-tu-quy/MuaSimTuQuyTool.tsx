"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Phone, Search, ChevronRight } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import { formatPrice } from "@/lib/simUtils";
import { planSimDisplay } from "@/lib/simDisplay";
import type { NormalizedSIM } from "@/lib/simUtils";

const ZALO_URL = "https://zalo.me/0933356666";
const QUY_TU = encodeURIComponent("Tứ quý");

const MuaSimTuQuyTool = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Lọc tứ quý SANG SERVER (/api/sims — full 49k, hết cảnh kẹt cache 14k).
  // Lấy nguyên bộ tứ quý (total ~154 < limit 200) một lần rồi derive 2 danh sách.
  const tuQuyQuery = useQuery<{ items: NormalizedSIM[]; total: number }>({
    queryKey: ["tu-quy-list"],
    queryFn: async () => {
      const res = await fetch(`/api/sims?quyType=${QUY_TU}&limit=200&sort=price_asc`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
  });

  // Ô tìm kiếm chạy trên TOÀN kho (không riêng tứ quý) — gọi lại server.
  const searchQueryData = useQuery<{ items: NormalizedSIM[]; total: number }>({
    queryKey: ["tu-quy-search", activeSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearch.trim()) params.set("search", activeSearch);
      params.set("limit", "60");
      const res = await fetch(`/api/sims?${params.toString()}`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!activeSearch.trim(),
  });

  const allTuQuySims = useMemo(() => tuQuyQuery.data?.items ?? [], [tuQuyQuery.data]);

  // Cheap sims sorted by price asc (for "Kho Sim Tứ Quý Cập Nhật")
  const tuQuySims = useMemo(() => {
    return [...allTuQuySims].sort((a, b) => a.price - b.price).slice(0, 12);
  }, [allTuQuySims]);

  // Expensive sims sorted by price desc (for "Sim Tứ Quý Nổi Bật")
  const featuredTuQuySims = useMemo(() => {
    return [...allTuQuySims].sort((a, b) => b.price - a.price).slice(0, 10);
  }, [allTuQuySims]);

  const searchResults = useMemo(() => {
    if (!activeSearch.trim()) return null;
    const items = searchQueryData.data?.items ?? [];
    return items.length ? items : null;
  }, [searchQueryData.data, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setTimeout(() => {
      document.getElementById("kho-sim-tu-quy")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  const displaySims = searchResults ?? tuQuySims;
  const hasActiveSearch = !!activeSearch.trim();
  const isLoading = tuQuyQuery.isLoading;
  const isSearching = hasActiveSearch && searchQueryData.isFetching;

  return (
    <>
      <section className="bg-card rounded-xl shadow-card border border-border p-4 md:p-6">
        <form onSubmit={handleSearch} className="max-w-lg mx-auto">
          <div className="flex bg-card rounded-xl overflow-hidden shadow-elevated ring-1 ring-gold/20">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                inputMode="tel"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ""))}
                placeholder="Nhập số cần tìm hoặc *7777 để tìm đuôi..."
                className="w-full pl-12 pr-3 py-3 md:py-3.5 bg-card text-foreground text-base focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="btn-cta px-5 md:px-7 flex items-center gap-2 rounded-none text-sm md:text-base font-bold whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Tìm SIM</span>
            </button>
          </div>
        </form>
      </section>

      {/* ===== SIM TỨ QUÝ NỔI BẬT ===== */}
      <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-primary rounded-full" />
          Sim Tứ Quý Nổi Bật
        </h2>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded hidden sm:block" />
                <div className="h-5 w-24 bg-muted rounded ml-auto" />
                <div className="h-7 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : featuredTuQuySims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Số SIM</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground hidden sm:table-cell">Nhà mạng</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Giá</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {featuredTuQuySims.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground tracking-wide">
                      {(() => {
                        // Tứ quý phải hiện 4 số cuối liền nhau (VD 093.368.6666).
                        // Dùng rule chấm dùng chung thay vì tự cắt 3-3-4 ở đây —
                        // xem `src/lib/simDisplay.ts`.
                        const raw = s.rawDigits || (s.displayNumber || "").replace(/\D/g, "");
                        const preferred = s.formattedNumber || s.displayNumber;
                        if (raw.length < 5) return preferred;
                        return planSimDisplay(raw, `*${raw.slice(-4)}`, preferred).display;
                      })()}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">
                      {(() => {
                        const digits = (s.displayNumber || "").replace(/\D/g, "");
                        const p = digits.slice(0, 3);
                        if (["090", "093", "089", "070", "076", "077", "078", "079"].includes(p)) return "Mobifone";
                        if (["091", "094", "088", "081", "082", "083", "084", "085"].includes(p)) return "Vinaphone";
                        if (["099", "059"].includes(p)) return "Gmobile";
                        return "Khác";
                      })()}
                    </td>
                    {/* Giá phải in đủ số, không quy ra "triệu". Dạng cũ chia giá
                        cho một triệu rồi làm tròn 1 chữ số thập phân, tức độ
                        chia 100.000đ, nên nhãn nói CAO hơn giá thật: 3.860.000
                        hiện "3,9 triệu" (+40.000đ), 1.950.000 hiện "2 triệu"
                        (+50.000đ) — bảng nói một giá, trang đặt hàng nói giá
                        khác. `formatPrice` là nguồn định dạng tiền duy nhất của
                        site (xem `src/lib/simUtils.ts`); cột này có
                        `whitespace-nowrap` trong bảng `overflow-x-auto` nên đủ
                        chỗ cho "39.000.000đ". */}
                    <td className="py-3 px-4 text-right font-semibold text-primary whitespace-nowrap">
                      {formatPrice(s.price)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <a
                        href={ZALO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-sim-number={s.displayNumber}
                        className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 transition"
                      >
                        <Phone className="w-3 h-3" /> Liên hệ
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Kho sim tứ quý nổi bật đang được cập nhật. Vui lòng quay lại sau ít phút.</div>
        )}
      </section>

      {/* ===== KHO SIM TỨ QUÝ THỰC TẾ ===== */}
      <section id="kho-sim-tu-quy" className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
          <span className="w-1 h-8 bg-primary rounded-full" />
          {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : "Kho Sim Tứ Quý Cập Nhật"}
        </h2>
        {hasActiveSearch && (
          <button onClick={clearSearch} className="mb-4 text-sm text-primary hover:underline">
            ← Quay lại kho sim tứ quý
          </button>
        )}
        {isLoading || isSearching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-6 w-full bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : displaySims.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
            {displaySims.map((sim) => (
              <SIMCardNew
                key={sim.id}
                sim={sim}
                // Danh sách mặc định của trang này là kho tứ quý → tôn cụm 4 số
                // đuôi lên (077.867.0000). Khi khách tìm thì kết quả là toàn kho,
                // không còn chắc là tứ quý nên bỏ cờ đi.
                quyFilter={hasActiveSearch ? null : "Tứ quý"}
                searchQuery={hasActiveSearch ? activeSearch : ""}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {hasActiveSearch
              ? activeSearch.startsWith("*")
                ? "Kho hiện chưa có sim nào mang đuôi số Quý khách vừa tìm. Vui lòng thử một đuôi khác."
                : "Kho hiện chưa có sim nào chứa chuỗi số Quý khách vừa tìm. Vui lòng thử một chuỗi khác."
              : "Kho tứ quý đang được cập nhật. Vui lòng quay lại sau ít phút."}
          </div>
        )}
        <div className="mt-6 text-center">
          <button onClick={() => router.push("/")} className="btn-cta inline-flex items-center gap-2 px-6 py-3">
            Xem toàn bộ kho sim <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </>
  );
};

export default MuaSimTuQuyTool;
