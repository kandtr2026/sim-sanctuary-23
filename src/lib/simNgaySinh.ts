/**
 * Logic thuần của landing /sim-ngay-thang-nam-sinh (Google Ads).
 *
 * Khách nhập ngày sinh → quy về 6 chữ số DDMMYY → tìm SIM MobiFone có 6 số cuối
 * trùng đúng DDMMYY (nhóm "trùng tuyệt đối"), kèm các số chứa DDMMYY ở giữa dãy
 * (nhóm "chứa"). Mọi thứ ở đây không đụng DOM/fetch để test được bằng vitest:
 * parse form 3 ô, parse ô tìm nhanh, kiểm tra ngày có thật, tách/xếp 2 nhóm kết
 * quả, dựng query `/api/sims` theo bộ lọc, chia đoạn hiển thị số.
 *
 * Bộ lọc giá dùng index của `PRICE_RANGES` (src/lib/simUtils.ts) — cùng bảng mà
 * `/api/sims` đọc, nên không có bản copy biên giá thứ hai.
 */

export const YEAR_MIN = 1900;

/** Chỉ giữ chữ số. */
export const onlyDigits = (value: string | null | undefined): string =>
  String(value ?? "").replace(/\D/g, "");

const pad2 = (n: number): string => String(n).padStart(2, "0");

export const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Số ngày tối đa của tháng. `year` null = chưa biết năm (vd khách chỉ gõ DDMMYY
 * hoặc ô năm đang lỗi) → tháng 2 cho tới 29 để không báo oan 29/02.
 */
export const daysInMonth = (month: number, year: number | null): number => {
  if (month === 2) {
    if (year === null) return 29;
    return isLeapYear(year) ? 29 : 28;
  }
  return DAYS_IN_MONTH[month - 1] ?? 31;
};

/** Câu báo lỗi khi ngày vượt số ngày của tháng (đã biết ngày 1–31, tháng 1–12). */
const dayOverflowMessage = (day: number, month: number, year: number | null): string => {
  if (month === 2 && day === 29 && year !== null && !isLeapYear(year)) {
    return `Năm ${year} không nhuận, tháng 2 chỉ có 28 ngày.`;
  }
  if (month === 2) {
    return year === null
      ? `Tháng 2 không có ngày ${day}. Tháng 2 chỉ có 28 hoặc 29 ngày.`
      : `Tháng 2 không có ngày ${day}. Tháng 2 năm ${year} chỉ có ${daysInMonth(2, year)} ngày.`;
  }
  return `Tháng ${month} không có ngày ${day}. Tháng ${month} chỉ có ${daysInMonth(month, year)} ngày.`;
};

export interface BirthdayTarget {
  /** 6 chữ số DDMMYY gửi lên API. */
  ddmmyy: string;
  day: number;
  month: number;
  /** Năm đủ 4 số; null khi khách chỉ gõ DDMMYY (không biết thế kỷ). */
  year: number | null;
  /** Nhãn hiển thị: "05/07/1990", hoặc "05/07/90" khi không có năm đủ. */
  label: string;
}

const makeTarget = (day: number, month: number, year: number | null, yy: string): BirthdayTarget => {
  const ddmmyy = `${pad2(day)}${pad2(month)}${yy}`;
  return {
    ddmmyy,
    day,
    month,
    year,
    label: `${pad2(day)}/${pad2(month)}/${year !== null ? year : yy}`,
  };
};

// ─── Form 3 ô: Ngày (DD) · Tháng (MM) · Năm (YYYY) ──────────────────────────

export interface BirthFormInput {
  ngay: string;
  thang: string;
  nam: string;
}

export interface BirthFormErrors {
  ngay?: string;
  thang?: string;
  nam?: string;
}

export type BirthFormResult =
  | { ok: true; target: BirthdayTarget }
  | { ok: false; errors: BirthFormErrors };

/**
 * Đọc form ngày sinh. Mỗi ô báo lỗi riêng (hiện ngay dưới ô đó); lỗi "tháng X
 * không có ngày Y" gắn vào ô Ngày.
 *
 * 05/07/1990 → "050790": ngày/tháng pad 2 số, năm lấy 2 số cuối.
 */
export function parseBirthForm(input: BirthFormInput, now: Date = new Date()): BirthFormResult {
  const errors: BirthFormErrors = {};
  const currentYear = now.getFullYear();

  const dRaw = onlyDigits(input.ngay);
  const mRaw = onlyDigits(input.thang);
  const yRaw = onlyDigits(input.nam);

  let day: number | null = null;
  if (!dRaw) {
    errors.ngay = "Vui lòng nhập ngày sinh (1–31).";
  } else {
    const d = Number(dRaw);
    if (dRaw.length > 2 || d < 1 || d > 31) {
      errors.ngay = `Ngày ${dRaw} không hợp lệ. Ngày chỉ từ 1 đến 31.`;
    } else {
      day = d;
    }
  }

  let month: number | null = null;
  if (!mRaw) {
    errors.thang = "Vui lòng nhập tháng sinh (1–12).";
  } else {
    const m = Number(mRaw);
    if (mRaw.length > 2 || m < 1 || m > 12) {
      errors.thang = `Tháng ${mRaw} không hợp lệ. Tháng chỉ từ 1 đến 12.`;
    } else {
      month = m;
    }
  }

  let year: number | null = null;
  if (!yRaw) {
    errors.nam = "Vui lòng nhập năm sinh đủ 4 số, ví dụ 1990.";
  } else if (yRaw.length !== 4) {
    errors.nam = "Năm sinh cần đủ 4 số, ví dụ 1990.";
  } else {
    const y = Number(yRaw);
    if (y < YEAR_MIN || y > currentYear) {
      errors.nam = `Năm sinh cần trong khoảng ${YEAR_MIN}–${currentYear}.`;
    } else {
      year = y;
    }
  }

  // Ngày có thật trong tháng? Năm lỗi/thiếu thì vẫn bắt được 30/02, 31/04…
  if (day !== null && month !== null && day > daysInMonth(month, year)) {
    errors.ngay = dayOverflowMessage(day, month, year);
    day = null;
  }

  if (day === null || month === null || year === null) {
    return { ok: false, errors };
  }
  return { ok: true, target: makeTarget(day, month, year, String(year).slice(-2)) };
}

// ─── Ô tìm nhanh: "050790", "05071990", "05/07/1990", "5-7-90" ──────────────

export type QuickInputResult =
  | { ok: true; target: BirthdayTarget }
  | { ok: false; error: string };

const QUICK_FORMAT_HINT =
  "Nhập 6 số dạng DDMMYY (ví dụ 050790) hoặc ngày/tháng/năm (ví dụ 05/07/1990).";

/** Kiểm tra ngày/tháng/năm đã tách từ ô nhanh; trả câu lỗi hoặc null. */
const validateQuickParts = (
  day: number,
  month: number,
  year: number | null,
  currentYear: number,
): string | null => {
  if (day < 1 || day > 31) return `Ngày ${pad2(day)} không hợp lệ. Ngày chỉ từ 1 đến 31.`;
  if (month < 1 || month > 12) return `Tháng ${pad2(month)} không hợp lệ. Tháng chỉ từ 1 đến 12.`;
  if (year !== null && (year < YEAR_MIN || year > currentYear)) {
    return `Năm sinh cần trong khoảng ${YEAR_MIN}–${currentYear}.`;
  }
  if (day > daysInMonth(month, year)) return dayOverflowMessage(day, month, year);
  return null;
};

/**
 * Đọc ô tìm nhanh. Nhận 6 số DDMMYY, 8 số DDMMYYYY, hoặc có dấu / - . (khoảng
 * trắng cũng được coi là dấu ngăn) → luôn quy về DDMMYY.
 */
/**
 * Chuẩn hoá chữ khách GÕ vào ô nhanh (chạy ở mỗi onChange và lúc bấm Tìm):
 * chỉ giữ chữ số và dấu / - . khoảng trắng. Nếu ô chỉ có chữ số mà dài hơn 8
 * (khách gõ chồng lên số cũ, vd ô đang "010805" gõ tiếp "050790" thành
 * "010805050790"), giữ 6 số VỪA gõ — ý khách là tìm ngày sinh mới, không phải
 * nối chuỗi. Có dấu phân cách thì để nguyên cho parseQuickInput xử lý.
 */
export function normalizeQuickTyping(raw: string): string {
  const cleaned = String(raw ?? "").replace(/[^\d/\-. ]/g, "");
  if (/[/\-. ]/.test(cleaned)) return cleaned.slice(0, 14);
  return cleaned.length > 8 ? cleaned.slice(-6) : cleaned;
}

export function parseQuickInput(raw: string, now: Date = new Date()): QuickInputResult {
  const text = String(raw ?? "").trim().replace(/\*/g, "");
  if (!text) return { ok: false, error: "Vui lòng nhập ngày sinh, ví dụ 050790." };
  const currentYear = now.getFullYear();

  let day: number;
  let month: number;
  let year: number | null;
  let yy: string;

  const parts = text.split(/[\s/\-.]+/).filter(Boolean);
  if (parts.length > 1) {
    if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
      return { ok: false, error: QUICK_FORMAT_HINT };
    }
    const [dStr, mStr, yStr] = parts;
    if (dStr.length > 2 || mStr.length > 2 || (yStr.length !== 2 && yStr.length !== 4)) {
      return { ok: false, error: QUICK_FORMAT_HINT };
    }
    day = Number(dStr);
    month = Number(mStr);
    year = yStr.length === 4 ? Number(yStr) : null;
    yy = yStr.slice(-2);
  } else {
    const digits = onlyDigits(text);
    if (digits.length !== 6 && digits.length !== 8) {
      return {
        ok: false,
        error: digits.length
          ? `Cần 6 số dạng DDMMYY (ví dụ 050790) — ô đang có ${digits.length} số.`
          : QUICK_FORMAT_HINT,
      };
    }
    day = Number(digits.slice(0, 2));
    month = Number(digits.slice(2, 4));
    year = digits.length === 8 ? Number(digits.slice(4, 8)) : null;
    yy = digits.slice(-2);
  }

  const error = validateQuickParts(day, month, year, currentYear);
  if (error) return { ok: false, error };
  return { ok: true, target: makeTarget(day, month, year, yy) };
}

// ─── Kết quả: tách "trùng 6 số cuối" và "chứa ở giữa" ────────────────────────

export interface HasRawDigits {
  rawDigits: string;
}

export interface BirthdayMatchGroups<T extends HasRawDigits> {
  /** 6 số cuối trùng DDMMYY — luôn hiển thị trước. */
  exact: T[];
  /** Chứa DDMMYY nhưng không nằm ở đuôi. */
  contains: T[];
}

/**
 * Tách danh sách (có thể gộp từ 2 lượt gọi API, trùng số) thành 2 nhóm, giữ thứ
 * tự gốc trong từng nhóm, bỏ số lặp và số không chứa DDMMYY.
 */
export function splitBirthdayMatches<T extends HasRawDigits>(
  items: readonly T[],
  ddmmyy: string,
): BirthdayMatchGroups<T> {
  const key = onlyDigits(ddmmyy);
  const exact: T[] = [];
  const contains: T[] = [];
  if (key.length !== 6) return { exact, contains };

  const seen = new Set<string>();
  for (const item of items) {
    const digits = onlyDigits(item?.rawDigits);
    if (!digits || seen.has(digits)) continue;
    if (digits.endsWith(key)) {
      seen.add(digits);
      exact.push(item);
    } else if (digits.includes(key)) {
      seen.add(digits);
      contains.push(item);
    }
  }
  return { exact, contains };
}

export type BirthdayMatchKind = "exact" | "contains";

/** Một danh sách phẳng: mọi số trùng tuyệt đối đứng TRƯỚC mọi số chứa. */
export function orderBirthdayMatches<T extends HasRawDigits>(
  items: readonly T[],
  ddmmyy: string,
): { sim: T; kind: BirthdayMatchKind }[] {
  const { exact, contains } = splitBirthdayMatches(items, ddmmyy);
  return [
    ...exact.map((sim) => ({ sim, kind: "exact" as const })),
    ...contains.map((sim) => ({ sim, kind: "contains" as const })),
  ];
}

// ─── Bộ lọc → tham số /api/sims ─────────────────────────────────────────────

export const PRICE_FILTERS = [
  { key: "all", label: "Tất cả", ranges: [] },
  { key: "duoi-1tr", label: "Dưới 1 triệu", ranges: [0] },
  { key: "1-3tr", label: "1 - 3 triệu", ranges: [1] },
  { key: "3-5tr", label: "3 - 5 triệu", ranges: [2] },
  { key: "5-10tr", label: "5 - 10 triệu", ranges: [3] },
  { key: "tren-10tr", label: "Trên 10 triệu", ranges: [4, 5, 6, 7, 8] },
] as const satisfies readonly { key: string; label: string; ranges: readonly number[] }[];

export type PriceFilterKey = (typeof PRICE_FILTERS)[number]["key"];

export const PREFIX_FILTERS = [
  { key: "all", label: "Tất cả", prefixes: [] },
  { key: "090", label: "090", prefixes: ["090"] },
  { key: "093", label: "093", prefixes: ["093"] },
  { key: "089", label: "089", prefixes: ["089"] },
  { key: "07x", label: "07x", prefixes: ["070", "076", "077", "078", "079"] },
] as const satisfies readonly { key: string; label: string; prefixes: readonly string[] }[];

export type PrefixFilterKey = (typeof PREFIX_FILTERS)[number]["key"];

/** Nhóm "trùng 6 số cuối" hiếm khi quá vài chục số; nhóm "chứa" gồm cả số trùng nên lấy rộng hơn. */
export const EXACT_LIMIT = 60;
export const CONTAINS_LIMIT = 100;

/**
 * Query string cho `/api/sims`:
 *  - exact    → `suffixes=DDMMYY` (raw_digits kết thúc bằng)
 *  - contains → `search=DDMMYY`   (raw_digits chứa; kết quả gồm cả số trùng đuôi)
 * Luôn `networks=Mobifone`, cộng bộ lọc giá/đầu số đang chọn.
 */
export function buildSimsQuery(
  ddmmyy: string,
  mode: BirthdayMatchKind,
  price: PriceFilterKey,
  prefix: PrefixFilterKey,
): string {
  const params = new URLSearchParams();
  params.set(mode === "exact" ? "suffixes" : "search", onlyDigits(ddmmyy));
  params.set("networks", "Mobifone");
  const ranges = PRICE_FILTERS.find((f) => f.key === price)?.ranges ?? [];
  if (ranges.length) params.set("priceRanges", ranges.join(","));
  const prefixes = PREFIX_FILTERS.find((f) => f.key === prefix)?.prefixes ?? [];
  if (prefixes.length) params.set("prefixes", prefixes.join(","));
  params.set("limit", String(mode === "exact" ? EXACT_LIMIT : CONTAINS_LIMIT));
  return params.toString();
}

// ─── Hiển thị số ────────────────────────────────────────────────────────────

export interface DisplaySegment {
  text: string;
  /** true = đoạn DDMMYY cần tô nổi. */
  hl: boolean;
}

/**
 * Chia số để hiển thị, đoạn DDMMYY chấm thành dd.mm.yy:
 *  - trùng đuôi: 0901010805 → "0901." + [01.08.05]
 *  - chứa giữa : 0901080504 → "09." + [01.08.05] + ".04"
 * Không chứa DDMMYY → trả nguyên dãy, không tô.
 */
export function birthdayDisplaySegments(rawDigits: string, ddmmyy: string): DisplaySegment[] {
  const digits = onlyDigits(rawDigits);
  const key = onlyDigits(ddmmyy);
  if (key.length !== 6 || !digits) return [{ text: digits, hl: false }];

  const idx = digits.endsWith(key) ? digits.length - 6 : digits.indexOf(key);
  if (idx < 0) return [{ text: digits, hl: false }];

  const before = digits.slice(0, idx);
  const after = digits.slice(idx + 6);
  const segments: DisplaySegment[] = [];
  if (before) segments.push({ text: `${before}.`, hl: false });
  segments.push({ text: `${key.slice(0, 2)}.${key.slice(2, 4)}.${key.slice(4, 6)}`, hl: true });
  if (after) segments.push({ text: `.${after}`, hl: false });
  return segments;
}

/** Nối các đoạn thành chuỗi (dùng cho aria-label, data-sim-number). */
export const segmentsToText = (segments: readonly DisplaySegment[]): string =>
  segments.map((s) => s.text).join("");

/** Tên mạng viết đúng thương hiệu: "Mobifone" (giá trị DB) → "MobiFone". */
export function networkLabel(network: string | null | undefined): string {
  switch (network) {
    case "Mobifone":
      return "MobiFone";
    case "Vinaphone":
      return "VinaPhone";
    case "Gmobile":
      return "Gmobile";
    default:
      return network ? String(network) : "MobiFone";
  }
}

// ─── Prefill từ URL (Google Ads) ────────────────────────────────────────────

export type UrlPrefill =
  | { kind: "form"; ngay: string; thang: string; nam: string }
  | { kind: "quick"; q: string }
  | null;

/**
 * `?ngay=01&thang=08&nam=2005` → điền form; `?q=010805` → điền ô nhanh.
 * Giá trị chỉ được giữ chữ số (và cắt độ dài) — không tin chuỗi từ URL.
 * `q` ưu tiên khi có cả hai.
 */
export function readUrlPrefill(params: URLSearchParams): UrlPrefill {
  const q = params.get("q");
  if (q && q.trim()) {
    return { kind: "quick", q: q.replace(/[^\d/\-. ]/g, "").slice(0, 10) };
  }
  const ngay = onlyDigits(params.get("ngay")).slice(0, 2);
  const thang = onlyDigits(params.get("thang")).slice(0, 2);
  const nam = onlyDigits(params.get("nam")).slice(0, 4);
  if (ngay || thang || nam) return { kind: "form", ngay, thang, nam };
  return null;
}
