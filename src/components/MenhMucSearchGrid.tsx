"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import SearchBarAdvanced from "@/components/SearchBarAdvanced";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";
import { nguHanhCuaSo, diemTongHop, diemMucTieu, type NguHanh, type MucTieu } from "@/lib/phongThuy";

/**
 * Lưới số cho trang /sim-theo-menh/[hành] và /sim-hop/[mục tiêu], KÈM ô tìm kiếm
 * để khách lọc số TRONG chính mệnh / mục tiêu đó (góp ý #27: "trang mệnh Kim phải
 * có ô tìm để tìm số mệnh Kim mà mẫu số khác").
 *
 * - Chưa gõ (hoặc < 2 chữ số): hiện `initial` — top số server đã chấm sẵn theo
 *   phong thủy cho mệnh/mục tiêu này.
 * - Gõ mẫu số (vd *686, 090*): gọi /api/sims?search= để server dò mẫu trên TOÀN
 *   kho, rồi LỌC client theo đúng ngũ hành (Hà Đồ) / mục tiêu của trang, xếp theo
 *   điểm phong thủy cao nhất. Ngũ hành/điểm tính đúng bằng chip trên thẻ nên nhất quán.
 */
type Props = {
  initial: NormalizedSIM[];
  /** Trang theo mệnh: ngũ hành của số phải bằng hành này. */
  hanh?: NguHanh;
  /** Trang theo mục tiêu: số phải hỗ trợ mục tiêu này (điểm ≥ 1). */
  mucId?: MucTieu;
  /** Nhãn mục tiêu (vd "Tài lộc") để dựng câu chữ; chỉ dùng khi có mucId. */
  label?: string;
  zaloHref?: string;
};

const ZALO = "https://zalo.me/0933686666";
const SEARCH_LIMIT = 300;

export default function MenhMucSearchGrid({ initial, hanh, mucId, label, zaloHref = ZALO }: Props) {
  const [query, setQuery] = useState("");
  // Cần ≥ 2 chữ số thật (bỏ dấu *) mới đi tìm — giống ô tìm trang chủ.
  const active = query.replace(/[^0-9]/g, "").length >= 2;

  const { data, isFetching } = useQuery<{ items: NormalizedSIM[] }>({
    queryKey: ["menh-muc-search", hanh ?? mucId ?? "", query],
    enabled: active,
    queryFn: async () => {
      const res = await fetch(`/api/sims?search=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const results = useMemo(() => {
    if (!active) return initial;
    const items = data?.items ?? [];
    return items
      .filter((s) =>
        hanh ? nguHanhCuaSo(s.rawDigits).chinh === hanh : mucId ? diemMucTieu(s.rawDigits, mucId) >= 1 : true,
      )
      .map((s) => ({ s, pt: diemTongHop(s.rawDigits).diem }))
      .sort((a, b) => b.pt - a.pt || a.s.price - b.s.price)
      .slice(0, 60)
      .map((x) => x.s);
  }, [active, data, initial, hanh, mucId]);

  const nhan = hanh ? `mệnh ${hanh}` : label ? `hợp ${label}` : "phù hợp";

  return (
    <div>
      <div className="mb-4 max-w-xl">
        <SearchBarAdvanced compact value={query} onChange={setQuery} />
        <p className="mt-1.5 px-1 text-xs text-muted-foreground">
          Gõ mẫu số để tìm số {nhan} theo ý Quý khách — vd <code className="rounded bg-muted px-1">*686</code> đuôi 686,{" "}
          <code className="rounded bg-muted px-1">090*</code> đầu 090. Dấu <code className="rounded bg-muted px-1">*</code> = phần bất kỳ.
        </p>
      </div>

      {results.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {active ? (
            <>
              Không tìm thấy số {nhan} khớp “{query}”. Quý khách thử mẫu khác, hoặc{" "}
            </>
          ) : (
            <>Kho tạm chưa có số {nhan}. Quý khách </>
          )}
          <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-500 hover:underline">
            <MessageCircle className="mb-0.5 mr-0.5 inline h-3.5 w-3.5" />nhắn Zalo
          </a>{" "}
          để em tìm giúp.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {results.map((s) => (
              <SIMCardNew key={s.id} sim={s} searchQuery={active ? query : ""} />
            ))}
          </div>
          {active && (
            <p className="mt-3 text-xs text-muted-foreground">
              {isFetching ? "Đang tìm…" : `Hiện ${results.length} số ${nhan} khớp “${query}”, xếp theo điểm phong thủy cao nhất.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
