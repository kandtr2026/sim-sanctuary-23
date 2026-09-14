import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  MessageCircle,
  BookOpen,
  Gem,
} from "lucide-react";
import {
  chamBatCuc,
  phanTichBatCuc,
  NL_META,
  NL_ORDER,
  NL_CAT,
  NL_HUNG,
  type NangLuong,
} from "@/lib/batCuc";
import { getHexagramFromSuffix, type HexagramLevel } from "@/lib/hexagrams";

// Trang "câu chuyện" của một con số: áp thẳng engine Bát Cực Linh Số + quẻ Kinh
// Dịch đã có sẵn trong hệ thống (lib/batCuc, lib/hexagrams) rồi kể lại cho khách.
// Server component thuần — SEO đọc được, không cần JS phía khách.

type Props = {
  digits: string;
  formatted: string;
  zaloHref: string;
};

const verdictOf = (score: number) => {
  if (score >= 8)
    return {
      label: "Xuất sắc",
      text: "text-emerald-600",
      bar: "bg-emerald-500",
      blurb:
        "Số rất đẹp về phong thủy — năng lượng cát vượng, hầu như không nhiễu. Hợp người muốn một số “để đời”, đi cùng công việc và may mắn lâu dài.",
    };
  if (score >= 6.5)
    return {
      label: "Tốt",
      text: "text-emerald-600",
      bar: "bg-emerald-500",
      blurb:
        "Năng lượng cát chiếm ưu thế, nâng đỡ công việc và tài lộc. Một lựa chọn an tâm cho cả người dùng cá nhân lẫn kinh doanh.",
    };
  if (score >= 5)
    return {
      label: "Khá",
      text: "text-gold-dark",
      bar: "bg-gold",
      blurb:
        "Cân bằng giữa cát và hung — dùng tốt cho nhu cầu phổ thông và hợp túi tiền. Nếu chọn theo mệnh/tuổi, hãy nhắn Zalo để được soi kỹ hơn.",
    };
  return {
    label: "Cần cân nhắc",
    text: "text-amber-600",
    bar: "bg-amber-500",
    blurb:
      "Có yếu tố hung đáng lưu ý. Nên soi theo mệnh/tuổi trước khi chọn — nhắn Zalo để được tư vấn miễn phí, hoặc xem các số cùng nhóm bên dưới.",
  };
};

const hexTone: Record<HexagramLevel, string> = {
  "Đại cát": "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Cát: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  "Bình thường": "bg-secondary text-muted-foreground border-border",
  Hung: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  "Đại hung": "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function PhongThuyStory({ digits, formatted, zaloHref }: Props) {
  const clean = digits.replace(/\D/g, "");
  const { score } = chamBatCuc(clean);
  const r = phanTichBatCuc(clean);
  const present = NL_ORDER.filter((k) => r.counts[k] > 0);
  const catCount = NL_CAT.reduce((s, k) => s + r.counts[k], 0);
  const hungCount = NL_HUNG.reduce((s, k) => s + r.counts[k], 0);
  const chuDao = r.chuDao ? NL_META[r.chuDao] : null;
  const hex = getHexagramFromSuffix(clean.slice(-4));
  const v = verdictOf(score);
  const pct = Math.max(4, Math.round((score / 10) * 100));

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
      <h2 className="mb-1 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
        <span className="h-8 w-1 rounded-full bg-primary" />
        <Sparkles aria-hidden className="h-5 w-5 text-gold" />
        Chấm điểm phong thủy số {formatted}
      </h2>
      <p className="mb-6 pl-4 text-sm text-muted-foreground">
        Phân tích theo <strong className="text-foreground">Bát Cực Linh Số</strong> (8 năng
        lượng cát/hung) và <strong className="text-foreground">quẻ Kinh Dịch</strong> — mang
        tính tham khảo, giúp Quý khách hiểu “câu chuyện” của con số.
      </p>

      {/* ── Điểm tổng ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-secondary/30 p-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-end gap-1">
          <span className={`text-5xl font-extrabold leading-none ${v.text}`}>
            {score.toFixed(1)}
          </span>
          <span className="mb-1 text-lg font-semibold text-muted-foreground">/10</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`text-base font-bold ${v.text}`}>{v.label}</span>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-600">
              <ShieldCheck aria-hidden className="h-3 w-3" /> {catCount} cát
            </span>
            {hungCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                <AlertTriangle aria-hidden className="h-3 w-3" /> {hungCount} hung
              </span>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div className={`h-full rounded-full ${v.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.blurb}</p>
        </div>
      </div>

      {/* ── Năng lượng chủ đạo ────────────────────────────────────────────── */}
      {chuDao && (
        <div className="mb-6">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-foreground">
            <Gem aria-hidden className="h-4 w-4 text-primary" />
            Năng lượng chủ đạo: {chuDao.label}
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                chuDao.loai === "cát"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {chuDao.loai === "cát" ? "Cát" : "Hung"}
            </span>
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{chuDao.moTa}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chuDao.yNghia.map((y) => (
              <span
                key={y}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {y}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Các năng lượng có trong số ────────────────────────────────────── */}
      {present.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-base font-bold text-foreground">
            Các năng lượng có trong số
          </h3>
          <ul className="space-y-2.5">
            {present.map((k) => {
              const m = NL_META[k];
              const cat = m.loai === "cát";
              return (
                <li
                  key={k}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    cat
                      ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                      : "border-amber-500/25 bg-amber-500/[0.04]"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      cat
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-amber-500/15 text-amber-600"
                    }`}
                  >
                    {r.counts[k]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-foreground">{m.label}</strong>
                      <span
                        className={`text-xs font-medium ${
                          cat ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        {cat ? "cát" : "hung"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{m.moTa}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── Chi tiết từng cặp số (câu chuyện) ─────────────────────────────── */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-bold text-foreground">Đọc theo từng cặp số</h3>
        <div className="flex flex-wrap gap-1.5">
          {r.pairs.map((p, i) => {
            const m = p.nl ? NL_META[p.nl] : null;
            const cat = m?.loai === "cát";
            return (
              <span
                key={`${p.cap}-${i}`}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                  !m
                    ? "border-border bg-secondary/40 text-muted-foreground"
                    : cat
                      ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-600"
                      : "border-amber-500/30 bg-amber-500/[0.06] text-amber-600"
                }`}
                title={m ? m.moTa : "Cặp trung tính (không thuộc 8 năng lượng)"}
              >
                <span className="font-mono font-bold tracking-wider text-foreground">
                  {p.cap}
                </span>
                <span className="font-medium">{m ? m.label : "trung tính"}</span>
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Số được đọc thành các cặp liền nhau; mỗi cặp mang một năng lượng. Chữ số 0 và 5 là
          cặp trung tính, không tính cát/hung.
        </p>
      </div>

      {/* ── Quẻ Kinh Dịch ─────────────────────────────────────────────────── */}
      {hex && (
        <div className="mb-6">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-foreground">
            <BookOpen aria-hidden className="h-4 w-4 text-primary" />
            Quẻ Kinh Dịch (4 số cuối)
          </h3>
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/20 p-3">
            <span
              className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${hexTone[hex.level]}`}
            >
              {hex.level}
            </span>
            <p className="text-sm leading-relaxed text-foreground">
              Quẻ {hex.index}: <em className="not-italic font-medium">“{hex.title}”</em>
            </p>
          </div>
        </div>
      )}

      {/* ── CTA giữa trang (Zalo-first) ───────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] p-4 text-center">
        <p className="text-sm font-medium text-foreground">
          Muốn hợp mệnh/tuổi của mình hay còn phân vân? Nhắn Zalo, bên em soi giúp miễn phí.
        </p>
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          data-sim-number={clean}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 font-bold text-header-bg shadow transition hover:-translate-y-0.5 hover:bg-gold-light"
        >
          <MessageCircle className="h-4 w-4" /> Nhắn Zalo tư vấn số {formatted}
        </a>
      </div>
    </section>
  );
}
