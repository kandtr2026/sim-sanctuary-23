import Link from "next/link";
import { Sparkles } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";
import { getBirthYearLifeStage } from "@/lib/birthYearLifeStage";

/**
 * Format số theo ngày sinh khớp: 0903714793 (khớp d1m1yy "4793" = 4.7.93)
 * → "090371.4.7.93". Trả về null khi không khớp pattern nào.
 */
const buildBirthDateDisplay = (
  digits: string,
  year: string,
  day: string,
  month: string,
): string | null => {
  const yy = year.slice(-2);
  // day/month có thể là "8"/"08" → d1/m1 là số KHÔNG pad (bỏ 0 đầu), d2/m2 pad 2.
  const d1 = String(Number(day));
  const d2 = day.padStart(2, "0");
  const m1 = String(Number(month));
  const m2 = month.padStart(2, "0");

  // Zone 1: d-m-y đầy đủ, ưu tiên 2-2 → 2-1 → 1-1
  const candidates: { suffix: string; display: string }[] = [
    { suffix: d2 + m2 + yy, display: `${d2}.${m2}.${yy}` },
    { suffix: d2 + m1 + yy, display: `${d2}.${m1}.${yy}` },
    { suffix: d1 + m1 + yy, display: `${d1}.${m1}.${yy}` },
    { suffix: d2 + m2 + year, display: `${d2}.${m2}.${year}` },
    { suffix: d2 + m1 + year, display: `${d2}.${m1}.${year}` },
    { suffix: d1 + m1 + year, display: `${d1}.${m1}.${year}` },
  ];
  for (const c of candidates) {
    if (digits.endsWith(c.suffix)) {
      return `${digits.slice(0, digits.length - c.suffix.length)}.${c.display}`;
    }
  }

  // Zone 2: m-y
  for (const mm of [m1, m2]) {
    if (digits.endsWith(mm + year)) {
      return `${digits.slice(0, digits.length - (mm + year).length)}.${mm}.${year}`;
    }
  }

  return null;
};

/**
 * Server-rendered grid of SIMs for a birth year. Uses the server snapshot
 * (real SIMs matching the year in the last 6 digits) so the page shows actual
 * stock without shipping the full catalogue to the client.
 */
const BirthYearSimGrid = ({
  year,
  sims,
  totalCount,
  day,
  month,
  fallbackSims,
  hopTuoiSims,
  hopTuoiMenh,
}: {
  year: string;
  sims: NormalizedSIM[];
  totalCount?: number;
  day?: string;
  month?: string;
  fallbackSims?: NormalizedSIM[];
  hopTuoiSims?: NormalizedSIM[];
  hopTuoiMenh?: string;
}) => {
  const dd = day ? day.padStart(2, "0") : "";
  const mm = month ? month.padStart(2, "0") : "";
  const hasDate = Boolean(day && month);
  // Nhãn ngữ cảnh dùng chung: theo ngày sinh đầy đủ hay chỉ theo năm.
  const nhanNgay = hasDate ? `${dd}/${mm}/${year}` : `năm ${year}`;
  // Heading cho nhánh CÓ số — nói đúng thứ khách sắp thấy (task 2A).
  const headingCoSo = hasDate
    ? `Có số trùng ngày sinh ${dd}/${mm}/${year} trong kho`
    : `Có số chứa năm sinh ${year} trong kho`;
  // Link sang công cụ sim hợp tuổi, prefill sẵn ngày sinh nếu có (khỏi nhập lại).
  const phongThuyHref = `/sim-phong-thuy?nam=${year}${hasDate ? `&ngay=${day}&thang=${month}` : ""}`;

  if (sims.length === 0) {
    // Không có số trùng đúng ngày/năm sinh → KHÔNG để khách cụt hứng. Chuyển hướng
    // chủ động sang tư vấn sim phong thủy hợp tuổi, nội dung đổi theo giai đoạn đời
    // (dưới 22 học hành · 22–30 công việc · trên 30 thăng tiến). Task 2B.
    const lifeStage = getBirthYearLifeStage(year);
    // Ưu tiên số hợp mệnh (chấm điểm theo năm sinh); nếu chưa có thì mới dùng
    // fallbackSims chung. Cùng một lưới thẻ để không lặp hai khối gợi ý.
    const embeddedIsHopTuoi = Boolean(hopTuoiSims && hopTuoiSims.length > 0);
    const embedded = embeddedIsHopTuoi ? hopTuoiSims! : fallbackSims ?? [];
    return (
      <div id="kho-sim" className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {hasDate ? `Sim theo ngày sinh ${dd}/${mm}/${year}` : `Sim theo năm sinh ${year}`}
        </h2>
        <p className="mb-5 leading-relaxed text-muted-foreground">
          Hiện kho chưa có số chứa đúng {nhanNgay} của Quý khách. Chọn Số Mobifone sẽ gợi ý sim
          phong thủy hợp tuổi, hợp mệnh và mục tiêu sử dụng để Quý khách vẫn chọn được số phù hợp.
        </p>

        {/* Tư vấn theo giai đoạn đời — ngõ ra chủ động thay cho "xem lại sau".
            Nội dung suy từ năm sinh qua getBirthYearLifeStage(). */}
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-5 md:p-6">
          <p className="mb-1.5 flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-gold" />
            {lifeStage.title}
          </p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{lifeStage.body}</p>
          <Link
            href={phongThuyHref}
            className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light"
          >
            {lifeStage.cta}
          </Link>
        </div>

        {embedded.length > 0 && (
          <div className="mt-6">
            {embeddedIsHopTuoi ? (
              <>
                <p className="mb-1 font-semibold text-foreground">
                  Gợi ý sim hợp mệnh{hopTuoiMenh ? ` ${hopTuoiMenh}` : ""} — chọn theo năm sinh {year}
                </p>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  Các số dưới đây được chấm điểm hợp mệnh theo năm sinh {year} (chưa trùng đúng{" "}
                  {nhanNgay}). Nhập thêm giờ sinh &amp; giới tính ở công cụ Sim hợp tuổi để chấm chính
                  xác hơn.
                </p>
              </>
            ) : (
              <>
                <p className="mb-1 font-semibold text-foreground">Vài số đẹp đang có sẵn trong kho</p>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  Các số dưới đây <strong className="text-foreground">chưa trùng đúng {nhanNgay}</strong>,
                  chỉ là gợi ý để Quý khách tham khảo thêm.
                </p>
              </>
            )}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 md:gap-3">
              {embedded.map((sim) => (
                <div key={sim.id} className="min-w-0">
                  <SIMCardNew sim={sim} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section id="kho-sim" className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {headingCoSo}
          {totalCount !== undefined && totalCount > 0 && (
            <span className="text-sm font-semibold text-muted-foreground">({totalCount.toLocaleString("vi-VN")} số)</span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 md:gap-3">
{sims.map((sim) => {
  const birthDisp = day && month ? buildBirthDateDisplay(sim.rawDigits, year, day, month) : undefined;
  return (
    <div key={sim.id} className="min-w-0">
      <SIMCardNew sim={sim} birthDateDisplay={birthDisp} />
    </div>
  );
})}
      </div>

      {/* Ngõ đi tiếp cho khách không thấy đúng ngày sinh của mình trong lưới. Trang
          này chỉ tìm số CHỨA đúng ngày sinh, nên số lượng phụ thuộc kho; công cụ
          phong thủy chấm điểm cả kho theo mệnh nên luôn có số phù hợp. */}
      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        Chưa thấy số đúng ngày sinh của Quý khách?{" "}
        <Link
          href={phongThuyHref}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Chọn theo phong thủy — chấm điểm toàn bộ kho theo mệnh của Quý khách
        </Link>
      </p>
    </section>
  );
};

export default BirthYearSimGrid;
