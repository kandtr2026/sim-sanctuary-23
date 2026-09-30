"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Cake,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  SearchX,
  ShieldCheck,
  Tag,
  Truck,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, type NormalizedSIM } from "@/lib/simUtils";
import {
  birthdayDisplaySegments,
  buildSimsQuery,
  networkLabel,
  onlyDigits,
  parseBirthForm,
  parseQuickInput,
  normalizeQuickTyping,
  PREFIX_FILTERS,
  PRICE_FILTERS,
  readUrlPrefill,
  segmentsToText,
  splitBirthdayMatches,
  type BirthdayTarget,
  type BirthFormErrors,
  type DisplaySegment,
  type PrefixFilterKey,
  type PriceFilterKey,
} from "@/lib/simNgaySinh";
import type { MauSoNgaySinh } from "./_lib/mauSoNgaySinh";

const ZALO_URL = "https://zalo.me/0933686666";
const REQUEST_TIMEOUT_MS = 15_000;

type Status = "idle" | "loading" | "done" | "error";

interface ResultState {
  exact: NormalizedSIM[];
  contains: NormalizedSIM[];
  exactTotal: number;
  containsTotal: number;
}

const EMPTY_RESULT: ResultState = { exact: [], contains: [], exactTotal: 0, containsTotal: 0 };

const QUICK_ONLY_DIGITS = "Ô này chỉ nhận chữ số — nhập 6 số ngày sinh dạng DDMMYY, ví dụ 050790.";

async function fetchSims(
  query: string,
  signal: AbortSignal,
): Promise<{ items: NormalizedSIM[]; total: number }> {
  const res = await fetch(`/api/sims?${query}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: unknown = await res.json();
  const body = (json ?? {}) as { items?: unknown; total?: unknown };
  const items = Array.isArray(body.items)
    ? (body.items as NormalizedSIM[]).filter((s) => typeof s?.rawDigits === "string")
    : [];
  const total = typeof body.total === "number" && Number.isFinite(body.total) ? body.total : items.length;
  return { items, total };
}

/** GA4 event chuẩn `search` — bọc an toàn: gtag bị chặn/chưa nạp thì bỏ qua. */
function trackSearch(ddmmyy: string) {
  try {
    window.gtag?.("event", "search", { search_term: ddmmyy });
  } catch {
    /* tracking không bao giờ được làm hỏng trang */
  }
}

/** Ghi lại tham số tìm lên URL (giữ nguyên utm/gclid…) để khách chia sẻ/tải lại được. */
function syncUrl(entries: Record<string, string>) {
  try {
    const url = new URL(window.location.href);
    for (const k of ["q", "ngay", "thang", "nam"]) url.searchParams.delete(k);
    for (const [k, v] of Object.entries(entries)) url.searchParams.set(k, v);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* không quan trọng */
  }
}

// ─── UI con ─────────────────────────────────────────────────────────────────

function NumberText({ segments, exact }: { segments: DisplaySegment[]; exact: boolean }) {
  return (
    <>
      {segments.map((s, i) =>
        s.hl ? (
          <span key={i} className="text-gold">
            {s.text}
          </span>
        ) : (
          <span key={i} className={exact ? "text-white" : "text-white/60"}>
            {s.text}
          </span>
        ),
      )}
    </>
  );
}

function SimNgaySinhCard({ sim, ddmmyy, exact }: { sim: NormalizedSIM; ddmmyy: string; exact: boolean }) {
  const digits = onlyDigits(sim.rawDigits);
  const segments = birthdayDisplaySegments(digits, ddmmyy);
  const display = segmentsToText(segments);

  return (
    <article
      data-sim-number={display}
      className={cn(
        "flex flex-col rounded-xl border p-3",
        exact ? "border-gold/50 bg-gold/[0.07]" : "border-border bg-card",
      )}
    >
      {exact ? (
        <span className="mb-2 self-start rounded-md bg-gold px-2 py-0.5 text-[11px] font-bold leading-tight text-black">
          Trùng 6 số cuối ngày sinh
        </span>
      ) : (
        <span className="mb-2 self-start rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium leading-tight text-white/80">
          Có chứa ngày sinh
        </span>
      )}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
        <span>
          Mạng: <span className="font-semibold text-foreground/90">{networkLabel(sim.network)}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 font-medium text-emerald-400">
          <Cake className="h-3 w-3" aria-hidden />
          Ngày sinh
        </span>
      </div>

      {/* prefetch={false}: một lượt tìm có thể ra ~160 thẻ; prefetch hết /sim/[digits]
          là ép server dựng từng trang (mỗi trang đọc Supabase đang sát quota). */}
      <Link
        href={`/sim/${digits}`}
        prefetch={false}
        aria-label={`Xem chi tiết số ${display}`}
        className="mt-1.5 block whitespace-nowrap font-extrabold tabular-nums tracking-wide"
        style={{ fontSize: "clamp(15px, 4.2vw, 21px)", lineHeight: 1.2 }}
      >
        <NumberText segments={segments} exact={exact} />
      </Link>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-base font-bold text-white">{formatPrice(sim.price)}</span>
        <span className="text-[11px] font-medium text-emerald-400">Chính chủ</span>
      </div>

      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Giữ số này qua Zalo ${display} giá ${formatPrice(sim.price)}`}
        className="mt-2 flex min-h-11 items-center justify-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 px-1.5 text-[13px] font-semibold whitespace-nowrap sm:gap-1.5 sm:px-2 sm:text-sm text-sky-400 transition hover:bg-sky-500/25"
      >
        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
        Giữ số này qua Zalo
      </a>
      <Link
        href={`/sim/${digits}`}
        prefetch={false}
        className="mt-1.5 py-1 text-center text-xs text-muted-foreground underline-offset-2 transition hover:text-gold hover:underline"
      >
        Xem chi tiết phong thủy
      </Link>
    </article>
  );
}

function ChipRow<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`Lọc theo ${label.toLowerCase()}`}
      className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm",
              active
                ? "border-gold bg-gold/15 text-gold"
                : "border-border bg-card text-foreground/80 hover:border-gold/50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ContactButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-bold text-white transition hover:bg-sky-600"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Gửi ngày sinh qua Zalo 0933.686.666
      </a>
      <a
        href="tel:0933686666"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-gold/60"
      >
        <Phone className="h-4 w-4" aria-hidden />
        Gọi 0933.686.666
      </a>
    </div>
  );
}

function ConciergeCard({ label }: { label?: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/[0.05] p-4 text-center sm:p-6">
      <h3 className="text-base font-bold text-foreground sm:text-lg">
        {label ? `Chưa thấy số ưng ý cho ngày sinh ${label}?` : "Chưa thấy số đúng ngày sinh của anh/chị?"}
      </h3>
      <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground sm:text-sm">
        Gửi ngày/tháng/năm sinh qua Zalo, CHONSOMOBIFONE sẽ kiểm tra kho tổng và báo lại các số gần nhất.
        Không cần đặt cọc trước, nhận SIM kiểm tra rồi mới thanh toán.
      </p>
      <div className="mt-3.5 flex flex-wrap justify-center gap-2">
        <a
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-white transition hover:bg-sky-600 shadow-sm"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Gửi ngày sinh để tìm số
        </a>
        <a
          href="tel:0933686666"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-gold/60"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Gọi kiểm tra số còn hàng
        </a>
      </div>
    </div>
  );
}

// ─── Component chính ────────────────────────────────────────────────────────

export default function SimNgaySinhFinder({ samples }: { samples: MauSoNgaySinh[] }) {
  // Form
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");
  const [formErrors, setFormErrors] = useState<BirthFormErrors>({});
  // Ô tìm nhanh
  const [quick, setQuick] = useState("");
  const [quickError, setQuickError] = useState("");
  // Bộ lọc
  const [price, setPrice] = useState<PriceFilterKey>("all");
  const [prefix, setPrefix] = useState<PrefixFilterKey>("all");
  // Kết quả
  const [active, setActive] = useState<BirthdayTarget | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ResultState>(EMPTY_RESULT);

  const ngayRef = useRef<HTMLInputElement>(null);
  const thangRef = useRef<HTMLInputElement>(null);
  const namRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  // Chỉ request MỚI NHẤT được ghi kết quả (đổi lọc liên tục không bị response cũ đè).
  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Tìm theo DDMMYY với đúng giá trị lọc TRUYỀN VÀO — không đọc state lọc trong
   * closure (lỗi cũ ở /sim-phong-thuy: setX() rồi tìm ngay → gửi giá trị lượt trước).
   */
  const runSearch = useCallback(
    async (target: BirthdayTarget, priceKey: PriceFilterKey, prefixKey: PrefixFilterKey) => {
      const id = ++reqIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      setActive(target);
      setStatus("loading");

      try {
        const [ex, ct] = await Promise.allSettled([
          fetchSims(buildSimsQuery(target.ddmmyy, "exact", priceKey, prefixKey), controller.signal),
          fetchSims(buildSimsQuery(target.ddmmyy, "contains", priceKey, prefixKey), controller.signal),
        ]);
        if (id !== reqIdRef.current) return;

        // Cả hai hỏng mới báo lỗi: nhóm "chứa" đã gồm cả số trùng đuôi, nhóm
        // "trùng" đứng riêng chỉ để không bị giới hạn số dòng cắt mất.
        if (ex.status === "rejected" && ct.status === "rejected") {
          setResult(EMPTY_RESULT);
          setStatus("error");
          return;
        }
        const exItems = ex.status === "fulfilled" ? ex.value.items : [];
        const ctItems = ct.status === "fulfilled" ? ct.value.items : [];
        const groups = splitBirthdayMatches([...exItems, ...ctItems], target.ddmmyy);
        const exactTotal =
          ex.status === "fulfilled" ? Math.max(ex.value.total, groups.exact.length) : groups.exact.length;
        const containsTotal =
          ct.status === "fulfilled"
            ? Math.max(ct.value.total - exactTotal, groups.contains.length)
            : groups.contains.length;

        setResult({ exact: groups.exact, contains: groups.contains, exactTotal, containsTotal });
        setStatus("done");
      } finally {
        window.clearTimeout(timer);
      }
    },
    [],
  );

  const scrollToResults = () => {
    window.requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      // Chỉ cuộn khi vùng kết quả còn nằm thấp (mobile, bàn phím vừa đóng).
      if (el.getBoundingClientRect().top > window.innerHeight * 0.55) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const blurActive = () => {
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
  };

  // Prefill từ URL (link Google Ads): ?ngay=01&thang=08&nam=2005 hoặc ?q=010805.
  useEffect(() => {
    let prefill: ReturnType<typeof readUrlPrefill> = null;
    try {
      prefill = readUrlPrefill(new URLSearchParams(window.location.search));
    } catch {
      return;
    }
    if (!prefill) return;

    if (prefill.kind === "quick") {
      setQuick(prefill.q);
      const r = parseQuickInput(prefill.q);
      if (!r.ok) {
        setQuickError(r.error);
        return;
      }
      trackSearch(r.target.ddmmyy);
      void runSearch(r.target, "all", "all");
      return;
    }

    setNgay(prefill.ngay);
    setThang(prefill.thang);
    setNam(prefill.nam);
    const r = parseBirthForm(prefill);
    if (!r.ok) {
      setFormErrors(r.errors);
      return;
    }
    trackSearch(r.target.ddmmyy);
    void runSearch(r.target, "all", "all");
  }, [runSearch]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * Bỏ kết quả đang hiện + mọi request còn bay. Gọi khi khách nhập SAI: không được
   * để danh sách của ngày sinh trước nằm dưới thông báo lỗi (QA 29/09: nhập nhanh
   * lỗi mà vẫn thấy kết quả 010805 cũ → tưởng ô nhanh không chạy).
   */
  const clearResults = () => {
    reqIdRef.current += 1;
    abortRef.current?.abort();
    setActive(null);
    setResult(EMPTY_RESULT);
    setStatus("idle");
  };

  const startSearch = (target: BirthdayTarget, urlEntries: Record<string, string>) => {
    blurActive();
    trackSearch(target.ddmmyy);
    syncUrl(urlEntries);
    void runSearch(target, price, prefix);
    scrollToResults();
  };

  // Đọc giá trị ngay trên ô input lúc submit (không dựa vào state có thể chưa kịp
  // cập nhật — vd trình duyệt tự điền không bắn onChange), fallback về state.
  const fieldValue = (form: HTMLFormElement, name: string, fallback: string) => {
    const el = form.elements.namedItem(name);
    return el instanceof HTMLInputElement ? el.value : fallback;
  };

  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = {
      ngay: fieldValue(e.currentTarget, "ngay", ngay),
      thang: fieldValue(e.currentTarget, "thang", thang),
      nam: fieldValue(e.currentTarget, "nam", nam),
    };
    const r = parseBirthForm(input);
    if (!r.ok) {
      setFormErrors(r.errors);
      clearResults();
      const first = r.errors.ngay ? ngayRef : r.errors.thang ? thangRef : namRef;
      first.current?.focus();
      return;
    }
    setFormErrors({});
    // Ô nhanh xoá trắng: hai nơi nhập không được giữ hai ngày sinh khác nhau.
    setQuick("");
    setQuickError("");
    const { day, month, year } = r.target;
    startSearch(r.target, {
      ngay: String(day).padStart(2, "0"),
      thang: String(month).padStart(2, "0"),
      nam: String(year),
    });
  };

  const onSubmitQuick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Giá trị lấy thẳng từ ô, chuẩn hoá tại chỗ rồi tìm NGAY bằng biến cục bộ —
    // không đọc state bất đồng bộ.
    const raw = normalizeQuickTyping(fieldValue(e.currentTarget, "q", quick));
    setQuick(raw);
    const r = parseQuickInput(raw);
    if (!r.ok) {
      setQuickError(r.error);
      clearResults();
      // Ô vẫn đang focus nên onFocus không chạy lại — chọn sẵn để gõ lại là THAY.
      const el = e.currentTarget.elements.namedItem("q");
      if (el instanceof HTMLInputElement) el.select();
      return;
    }
    setQuickError("");
    setFormErrors({});
    // Ô ngày/tháng/năm xoá trắng: không giữ 01/08/2005 cũ khiến bấm nút form lại
    // quay về kết quả trước.
    setNgay("");
    setThang("");
    setNam("");
    setQuick(r.target.ddmmyy);
    startSearch(r.target, { q: r.target.ddmmyy });
  };

  const onPickSample = (s: MauSoNgaySinh) => {
    const r = parseQuickInput(s.ddmmyy);
    if (!r.ok) return;
    setQuick(s.ddmmyy);
    setQuickError("");
    setFormErrors({});
    setNgay("");
    setThang("");
    setNam("");
    startSearch(r.target, { q: s.ddmmyy });
  };

  // Đổi lọc khi đã có ngày sinh → tìm lại NGAY với giá trị vừa chọn.
  const onPriceChange = (key: PriceFilterKey) => {
    if (key === price) return;
    setPrice(key);
    if (active) void runSearch(active, key, prefix);
  };
  const onPrefixChange = (key: PrefixFilterKey) => {
    if (key === prefix) return;
    setPrefix(key);
    if (active) void runSearch(active, price, key);
  };
  const resetFilters = () => {
    setPrice("all");
    setPrefix("all");
    if (active) void runSearch(active, "all", "all");
  };

  const makeFieldHandler =
    (
      setter: (v: string) => void,
      field: keyof BirthFormErrors,
      maxLen: number,
      next?: React.RefObject<HTMLInputElement | null>,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = onlyDigits(e.target.value).slice(0, maxLen);
      setter(v);
      if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      // Gõ đủ 2 số ngày/tháng → tự nhảy sang ô kế.
      if (next && v.length === maxLen && (e.nativeEvent as InputEvent).inputType?.startsWith("insert")) {
        next.current?.focus();
      }
    };

  const filtersActive = price !== "all" || prefix !== "all";
  const hasAny = result.exact.length > 0 || result.contains.length > 0;

  const inputClass = (invalid: boolean) =>
    cn(
      "h-12 w-full rounded-xl border bg-black/40 px-3 text-center text-lg font-semibold tabular-nums tracking-wider text-white outline-none transition placeholder:font-normal placeholder:text-white/30 focus:ring-2",
      invalid ? "border-red-500/70 focus:ring-red-500/30" : "border-white/15 focus:border-gold focus:ring-gold/30",
    );

  return (
    <div>
      {/* ── Form chính ── */}
      <div className="rounded-2xl border border-gold/25 bg-card p-4 shadow-card sm:p-6">
        <form onSubmit={onSubmitForm} noValidate aria-label="Tìm sim theo ngày tháng năm sinh">
          <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-2 sm:gap-3">
            <div>
              <label htmlFor="ns-ngay" className="mb-1 block text-xs font-medium text-muted-foreground">
                Ngày (DD)
              </label>
              <input
                ref={ngayRef}
                id="ns-ngay"
                name="ngay"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="bday-day"
                placeholder="DD"
                maxLength={2}
                value={ngay}
                onFocus={(e) => e.currentTarget.select()}
                onChange={makeFieldHandler(setNgay, "ngay", 2, thangRef)}
                aria-invalid={!!formErrors.ngay}
                aria-describedby={formErrors.ngay ? "ns-ngay-err" : undefined}
                className={inputClass(!!formErrors.ngay)}
              />
            </div>
            <div>
              <label htmlFor="ns-thang" className="mb-1 block text-xs font-medium text-muted-foreground">
                Tháng (MM)
              </label>
              <input
                ref={thangRef}
                id="ns-thang"
                name="thang"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="bday-month"
                placeholder="MM"
                maxLength={2}
                value={thang}
                onFocus={(e) => e.currentTarget.select()}
                onChange={makeFieldHandler(setThang, "thang", 2, namRef)}
                aria-invalid={!!formErrors.thang}
                aria-describedby={formErrors.thang ? "ns-thang-err" : undefined}
                className={inputClass(!!formErrors.thang)}
              />
            </div>
            <div>
              <label htmlFor="ns-nam" className="mb-1 block text-xs font-medium text-muted-foreground">
                Năm (YYYY)
              </label>
              <input
                ref={namRef}
                id="ns-nam"
                name="nam"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="bday-year"
                placeholder="YYYY"
                maxLength={4}
                value={nam}
                onFocus={(e) => e.currentTarget.select()}
                onChange={makeFieldHandler(setNam, "nam", 4)}
                aria-invalid={!!formErrors.nam}
                aria-describedby={formErrors.nam ? "ns-nam-err" : undefined}
                className={inputClass(!!formErrors.nam)}
              />
            </div>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            💡 Ví dụ: <span className="font-semibold text-foreground/90">05/07/1990</span> → hệ thống tìm đuôi{" "}
            <span className="font-semibold text-gold">050790</span>. Nếu chưa có số trùng tuyệt đối, nhân viên sẽ kiểm tra
            kho tổng và gợi ý số gần nhất.
          </p>

          {(formErrors.ngay || formErrors.thang || formErrors.nam) && (
            <div className="mt-2 space-y-1" role="alert">
              {formErrors.ngay && (
                <p id="ns-ngay-err" className="text-sm text-red-400">
                  {formErrors.ngay}
                </p>
              )}
              {formErrors.thang && (
                <p id="ns-thang-err" className="text-sm text-red-400">
                  {formErrors.thang}
                </p>
              )}
              {formErrors.nam && (
                <p id="ns-nam-err" className="text-sm text-red-400">
                  {formErrors.nam}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cta text-base font-bold text-cta-foreground shadow-glow-primary transition hover:bg-cta-hover"
          >
            <Search className="h-5 w-5" aria-hidden />
            Tìm sim theo ngày sinh
          </button>
        </form>

        {/* ── Ô tìm nhanh ── */}
        <form onSubmit={onSubmitQuick} noValidate className="mt-4 border-t border-border pt-4" aria-label="Tìm nhanh theo DDMMYY">
          <label htmlFor="ns-quick" className="mb-1 block text-xs font-medium text-muted-foreground">
            Hoặc nhập nhanh 6 số ngày sinh
          </label>
          <div className="flex gap-2">
            <input
              id="ns-quick"
              name="q"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Nhập DDMMYY, ví dụ 050790"
              maxLength={14}
              value={quick}
              // Chạm vào ô là chọn hết: gõ số mới THAY số cũ chứ không nối đuôi.
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const typed = e.target.value;
                setQuick(normalizeQuickTyping(typed));
                // Gõ chữ cái: lọc bỏ nhưng BÁO ngay, đừng để khách tưởng ô không nhận.
                if (/[^\d/\-. ]/.test(typed)) setQuickError(QUICK_ONLY_DIGITS);
                else if (quickError) setQuickError("");
              }}
              aria-invalid={!!quickError}
              aria-describedby={quickError ? "ns-quick-err" : undefined}
              // Chữ gõ giữ 16px (iOS phóng to khi ô < 16px); chỉ thu placeholder để
              // câu "Nhập DDMMYY, ví dụ 050790" hiện đủ trên màn 360–390px.
              className={cn(
                inputClass(!!quickError),
                "min-w-0 flex-1 text-left text-base placeholder:text-xs sm:placeholder:text-base",
              )}
            />
            <button
              type="submit"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gold/60 bg-gold/10 px-4 text-sm font-bold text-gold transition hover:bg-gold/20"
            >
              <Search className="h-4 w-4" aria-hidden />
              Tìm
            </button>
          </div>
          {quickError && (
            <p id="ns-quick-err" role="alert" className="mt-1.5 text-sm text-red-400">
              {quickError}
            </p>
          )}
        </form>
      </div>

      {/* ── 4 Cam kết rút gọn tăng uy tín cho khách Ads ── */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2.5">
          <Tag className="h-4 w-4 shrink-0 text-gold" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">Giá công khai</p>
            <p className="truncate text-[11px] text-muted-foreground">Giá hiện trên từng số</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2.5">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">Chính chủ 100%</p>
            <p className="truncate text-[11px] text-muted-foreground">Đăng ký đúng thông tin</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">Kiểm tra rồi trả</p>
            <p className="truncate text-[11px] text-muted-foreground">Nhận SIM kiểm tra trước</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 p-2.5">
          <Truck className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground">Giao nhanh</p>
            <p className="truncate text-[11px] text-muted-foreground">Hỗ trợ giao tận nơi</p>
          </div>
        </div>
      </div>

      {/* ── Bộ lọc ── */}
      <div className="mt-3 space-y-1.5">
        <ChipRow label="Giá" options={PRICE_FILTERS} value={price} onChange={onPriceChange} />
        <ChipRow label="Đầu số" options={PREFIX_FILTERS} value={prefix} onChange={onPrefixChange} />
      </div>

      {/* ── Kết quả ── */}
      <div ref={resultsRef} className="mt-4 scroll-mt-24" aria-busy={status === "loading"}>
        <p className="sr-only" aria-live="polite">
          {status === "loading" && active ? `Đang tìm số có ngày sinh ${active.label}` : ""}
          {status === "done" && active
            ? `Có ${result.exact.length} số trùng 6 số cuối và ${result.contains.length} số chứa ngày sinh ${active.label}.`
            : ""}
          {status === "error" ? "Không tải được danh sách số." : ""}
        </p>

        {status === "idle" && samples.length > 0 && (
          <section aria-labelledby="ns-mau-title">
            <h2 id="ns-mau-title" className="text-base font-bold text-foreground">
              Một số SIM ngày sinh đang có sẵn
            </h2>
            <p className="mb-2 text-xs text-muted-foreground">
              Chạm vào một số để xem thêm các số cùng ngày sinh.
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {samples.map((s) => (
                <li key={s.digits}>
                  <button
                    type="button"
                    onClick={() => onPickSample(s)}
                    className="flex w-full flex-col items-start rounded-lg border border-border bg-card px-3 py-2 text-left transition hover:border-gold/60"
                  >
                    <span className="whitespace-nowrap font-bold tabular-nums" style={{ fontSize: "clamp(14px, 3.9vw, 17px)" }}>
                      <NumberText segments={birthdayDisplaySegments(s.digits, s.ddmmyy)} exact />
                    </span>
                    <span className="text-xs text-muted-foreground">{formatPrice(s.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <ConciergeCard />
          </section>
        )}

        {status === "loading" && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Đang tìm số có ngày sinh {active?.label}…
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
              ))}
            </div>
          </div>
        )}

        {status === "error" && active && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
            <p className="flex items-center gap-2 font-semibold text-red-300">
              <WifiOff className="h-4 w-4" aria-hidden />
              Không tải được danh sách số.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Kết nối mạng có thể đang chập chờn. Vui lòng thử lại, hoặc gửi ngày sinh {active.label} qua Zalo để
              CHONSOMOBIFONE tìm giúp.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void runSearch(active, price, prefix)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-cta px-4 text-sm font-bold text-white transition hover:bg-cta-hover"
              >
                Thử lại
              </button>
              <ContactButtons />
            </div>
          </div>
        )}

        {status === "done" && active && (
          <div>
            <h2 className="text-lg font-bold text-foreground sm:text-xl">
              Kết quả cho ngày sinh <span className="text-gold">{active.label}</span>{" "}
              <span className="text-sm font-normal text-muted-foreground">(đuôi {active.ddmmyy})</span>
            </h2>

            {hasAny ? (
              <>
                {/* Nhóm 1 — trùng tuyệt đối 6 số cuối: LUÔN nằm trên */}
                {result.exact.length > 0 ? (
                  <section className="mt-3" aria-labelledby="ns-exact-title">
                    <h3 id="ns-exact-title" className="mb-2 text-sm font-semibold text-gold">
                      Trùng 6 số cuối ({result.exactTotal} số)
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {result.exact.map((sim) => (
                        <SimNgaySinhCard key={sim.rawDigits} sim={sim} ddmmyy={active.ddmmyy} exact />
                      ))}
                    </div>
                  </section>
                ) : (
                  <p className="mt-3 rounded-xl border border-gold/30 bg-gold/[0.06] p-3 text-sm text-foreground/90">
                    Chưa có số trùng tuyệt đối 6 số cuối. CHONSOMOBIFONE gợi ý các số chứa ngày sinh gần nhất bên dưới.
                  </p>
                )}

                {/* Nhóm 2 — chứa DDMMYY ở giữa dãy */}
                {result.contains.length > 0 && (
                  <section className="mt-5" aria-labelledby="ns-contains-title">
                    <h3 id="ns-contains-title" className="mb-2 text-sm font-semibold text-foreground/90">
                      Số chứa ngày sinh trong dãy ({result.containsTotal} số)
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {result.contains.map((sim) => (
                        <SimNgaySinhCard key={sim.rawDigits} sim={sim} ddmmyy={active.ddmmyy} exact={false} />
                      ))}
                    </div>
                  </section>
                )}

                {(result.exactTotal > result.exact.length || result.containsTotal > result.contains.length) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Đang hiển thị các số giá tốt nhất. Cần xem thêm, khách hàng nhắn Zalo 0933.686.666 để được gửi đủ
                    danh sách.
                  </p>
                )}
                <ConciergeCard label={active.label} />
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <SearchX className="h-4 w-4 text-gold" aria-hidden />
                  Chưa có số trùng ngày sinh {active.ddmmyy} trong kho đang hiển thị. Anh/chị gửi ngày sinh qua Zalo để CHONSOMOBIFONE kiểm tra thêm.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filtersActive ? "Đang áp bộ lọc giá/đầu số — bỏ lọc để xem toàn bộ kho ngày sinh." : "Nhân viên kiểm tra kho tổng và báo lại số phù hợp."}
                </p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-3 text-sm font-semibold text-gold underline underline-offset-2"
                  >
                    Bỏ bộ lọc giá và đầu số
                  </button>
                )}
                <ContactButtons className="mt-3" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
