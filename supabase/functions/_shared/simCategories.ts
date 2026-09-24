// ═══════════════════════════════════════════════════════════════════════════
// DANH MỤC SỐ ĐẸP — NGUỒN CHÂN LÝ DUY NHẤT (web Next + edge function sync-sims)
//
// File thuần TS, KHÔNG import gì: Deno (sync-sims) import thẳng bằng
// `../_shared/simCategories.ts`, Next import qua `src/lib/simCategories.ts`.
// Trước đây luật bị chép tay hai nơi (simUtils.ts + sync-sims) và đã lệch nhau.
//
// Luật bóc từ simthanglong.vn (09/2026), đo trên ~20k số có nhãn của họ + 100 số
// hỏi đủ 20 danh mục: nhãn chính khớp 99,94%, thành viên từng danh mục 99,5–100%.
// Nguyên tắc của họ, giữ nguyên ở đây:
//   1. MỘT SỐ THUỘC NHIỀU DANH MỤC (0876.010.010 = Taxi + Gánh đảo + Dễ nhớ).
//      Mỗi luật là một "dạng thuần", không loại trừ nhau. Trang danh mục X liệt
//      kê MỌI số thuộc X.
//   2. "Nhãn chính" = danh mục đứng cao nhất theo CATEGORY_PRIORITY mà số thuộc.
//   3. Mọi dạng neo ở ĐUÔI số, trừ "quý giữa" (cụm giữa dãy) và Đầu số cổ.
//
// Khác simthanglong có chủ ý:
//   - KHÔNG có "Ông địa" (A Khoa bỏ loại này 14/09/2026).
//   - Năm sinh dạng ddmmyy phải là NGÀY CÓ THẬT (loại 31.11, 30.02) — họ không
//     kiểm, nhưng gắn nhãn năm sinh cho ngày không tồn tại là sai với khách.
// ═══════════════════════════════════════════════════════════════════════════

/** Số chữ số giống nhau liền nhau tính từ cuối (…0000 → 4). */
const tailRun = (d: string): number => {
  let k = 1;
  while (k < d.length && d[d.length - 1 - k] === d[d.length - 1]) k++;
  return k;
};

/**
 * Độ dài các cụm chữ số giống nhau KHÔNG chạm đuôi, bắt đầu từ vị trí `from`
 * trở đi (bỏ số 0 đầu). Dùng cho "quý giữa".
 */
const midRuns = (d: string, from = 1): number[] => {
  const out: number[] = [];
  let i = 1;
  while (i < d.length) {
    let j = i;
    while (j + 1 < d.length && d[j + 1] === d[i]) j++;
    if (j < d.length - 1 && i >= from) out.push(j - i + 1);
    i = j + 1;
  }
  return out;
};

/** Độ dài đoạn đuôi lặp theo chu kỳ p (p=3: …417417 → 6). */
const periodRun = (d: string, p: number): number => {
  let i = d.length - p - 1;
  while (i >= 0 && d[i] === d[i + p]) i--;
  return d.length - 1 - i;
};

/** Số vị trí khác nhau giữa hai chuỗi cùng độ dài. */
const hamming = (a: string, b: string): number => {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

const isPalindrome = (t: string): boolean => {
  for (let i = 0, j = t.length - 1; i < j; i++, j--) if (t[i] !== t[j]) return false;
  return !/^(\d)\1+$/.test(t); // 000000 là lục quý, không phải gánh đảo
};

const NGAY_TRONG_THANG = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Năm sinh hợp lệ theo quy ước kho số: 1950–2029 (yy 00–29 → 20yy, 50–99 → 19yy). */
const okYY = (yy: number): boolean => yy <= 29 || yy >= 50;

/**
 * Đuôi 4 số "số độc" simthanglong liệt kê (danh sách tay, không phải công thức).
 * Bóc từ trang /sim-so-doc của họ 09/2026.
 */
const SO_DOC_TAILS = new Set([
  "0102", "0378", "0389", "0404", "0569", "0578", "1102", "1204", "1368", "1389", "1486", "1569",
  "1618", "1689", "1919", "2204", "2283", "2368", "2389", "2569", "2626", "2628", "2828", "3389",
  "3569", "3689", "4078", "4389", "4404", "4569", "4953", "5389", "5569", "6389", "6569", "6688",
  "6689", "6979", "7389", "7569", "8386", "8389", "8569", "9389", "9569",
]);

type Rule = (d: string) => boolean;

/** Luật thành viên của từng danh mục. Tên khoá = chuỗi tag lưu trong DB/URL. */
export const CATEGORY_RULES: Record<string, Rule> = {
  "Lục quý": (d) => tailRun(d) >= 6,
  "Ngũ quý": (d) => tailRun(d) === 5,
  "Tứ quý": (d) => tailRun(d) === 4,
  // Tam hoa kép: 6 số cuối AAA.BBB (A ≠ B), bộ ba đầu không dính thêm số A.
  "Tam hoa kép": (d) => {
    const t = d.slice(-6);
    return tailRun(d) === 3 && t[0] === t[1] && t[1] === t[2] && t[0] !== t[3] && d[d.length - 7] !== t[0];
  },
  // Tam hoa: ĐÚNG 3 số cuối giống nhau (…0000 là tứ quý, không phải tam hoa).
  "Tam hoa": (d) => tailRun(d) === 3,
  "Lục quý giữa": (d) => midRuns(d).some((k) => k >= 6),
  "Ngũ quý giữa": (d) => midRuns(d).some((k) => k === 5),
  // Cụm 4 dính đầu số (0333.3…, 0911.11…) không tính: phải bắt đầu sau 3 số đầu.
  "Tứ quý giữa": (d) => midRuns(d, 3).some((k) => k === 4),
  // Taxi: đuôi lặp nguyên khối — AB.AB.AB, ABC.ABC, ABCD.ABCD, ABCDE.ABCDE.
  Taxi: (d) =>
    tailRun(d) < 3 &&
    (periodRun(d, 2) >= 6 || periodRun(d, 3) >= 6 || periodRun(d, 4) >= 8 || periodRun(d, 5) >= 10),
  // Lặp kép: 4 số cuối AABB hoặc ABAB (A ≠ B).
  "Lặp kép": (d) => {
    const t = d.slice(-4);
    return (t[0] === t[1] && t[2] === t[3] && t[0] !== t[2]) || (t[0] === t[2] && t[1] === t[3] && t[0] !== t[1]);
  },
  // Gánh đảo: 4 số cuối ABBA, hoặc 6/8 số cuối đối xứng (860.068, 0624.4260).
  "Gánh đảo": (d) => {
    const t = d.slice(-4);
    const abba = t[0] === t[3] && t[1] === t[2] && t[0] !== t[1];
    return abba || isPalindrome(d.slice(-6)) || isPalindrome(d.slice(-8));
  },
  // Tiến lên: 3 số cuối tăng đều (789, 0123); 4 số bước 2 (1357, 2468);
  // 3 cặp tiến đều (05.06.07, 07.17.27); đuôi 8910 và 9899.
  "Tiến lên": (d) => {
    const a = [...d].map(Number);
    const n = a.length;
    if (a[n - 3] + 1 === a[n - 2] && a[n - 2] + 1 === a[n - 1]) return true;
    if (a[n - 4] + 2 === a[n - 3] && a[n - 3] + 2 === a[n - 2] && a[n - 2] + 2 === a[n - 1]) return true;
    const [p, q, r, s, t, u] = a.slice(n - 6);
    if (p === r && r === t && q + 1 === s && s + 1 === u) return true;
    if (q === s && s === u && p + 1 === r && r + 1 === t) return true;
    return d.endsWith("8910") || d.endsWith("9899");
  },
  "Thần tài": (d) => /(39|79)$/.test(d),
  "Lộc phát": (d) => /(68|86|688|866)$/.test(d),
  // Dễ nhớ: nhóm dạng "đọc một lần là nhớ" — rộng nhất, chồng lên nhiều nhóm khác.
  "Dễ nhớ": (d) => {
    const n = d.length;
    const c = (i: number) => d[n + i];
    const t = d.slice(-6);
    if (tailRun(d) === 3) return true; // …777
    if (c(-3) === c(-1) && c(-2) !== c(-1)) return true; // …ABA (5.838)
    if (c(-4) === c(-2) && c(-3) !== c(-2)) return true; // …ABAx (1910)
    if (hamming(t.slice(0, 3), t.slice(3)) === 1) return true; // ABC.ABD (122.722)
    if (c(-4) === c(-3) && c(-3) === c(-2) && c(-1) !== c(-2)) return true; // AAAx (7778)
    if (c(-5) === c(-4) && c(-4) === c(-1) && c(-3) === c(-2) && c(-3) !== c(-1)) return true; // AABBA (99669)
    if (t[0] === t[1] && t[1] === t[2] && t[5] === t[0] && t[3] !== t[0]) return true; // AAA.xyA (888.478)
    if (t[1] === t[2] && t[2] === t[5] && t[0] !== t[1] && t[3] !== t[1] && t[4] !== t[1]) return true; // xAA.yzA (933.503)
    const l8 = d.slice(-8);
    return hamming(l8.slice(0, 4), l8.slice(4)) === 1; // ABCD.xBCD (1970.1980)
  },
  // Số độc: đuôi nằm trong danh sách tay (1102 "độc nhất vô nhị", 4953, x389…).
  "Số độc": (d) => SO_DOC_TAILS.has(d.slice(-4)),
  // Đầu số cổ: 090/091/094/097/098 với số thứ tư 2–9 (0901, 0911… là đầu mở sau).
  "Đầu số cổ": (d) => /^09[01478][2-9]/.test(d),
  // Năm sinh: 4 số cuối là năm 1950–2029, hoặc 6 số cuối là ngày dd.mm.yy có thật.
  "Năm sinh": (d) => {
    const y4 = Number(d.slice(-4));
    if (y4 >= 1950 && y4 <= 2029) return true;
    const dd = Number(d.slice(-6, -4));
    const mm = Number(d.slice(-4, -2));
    const yy = Number(d.slice(-2));
    if (mm < 1 || mm > 12 || dd < 1 || !okYY(yy)) return false;
    const y = yy <= 29 ? 2000 + yy : 1900 + yy;
    const maxDay = mm === 2 && !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 28 : NGAY_TRONG_THANG[mm - 1];
    return dd <= maxDay;
  },
};

/**
 * Thứ tự "nhãn chính" (suy từ nhãn simthanglong in trên ~20k số: nhãn là danh
 * mục đứng cao nhất trong list này mà số thuộc về). Kết quả detectSimCategories
 * cũng xếp theo thứ tự này, nên phần tử [0] luôn là nhãn chính.
 */
export const CATEGORY_PRIORITY = [
  "Lục quý",
  "Ngũ quý",
  "Tứ quý",
  "Lục quý giữa",
  "Tam hoa kép",
  "Tam hoa",
  "Lặp kép",
  "Ngũ quý giữa",
  "Tứ quý giữa",
  "Taxi",
  "Thần tài",
  "Lộc phát",
  "Tiến lên",
  "Dễ nhớ",
  "Gánh đảo",
  "Số độc",
  "Đầu số cổ",
  "Năm sinh",
] as const;

export type SimCategory = (typeof CATEGORY_PRIORITY)[number];

/** Mọi danh mục số thuộc về, xếp theo CATEGORY_PRIORITY ([0] = nhãn chính). */
export const detectSimCategories = (rawDigits: string): SimCategory[] => {
  let d = String(rawDigits ?? "").replace(/\D/g, "");
  // Cột số của sheet là kiểu số nên mất số 0 đầu ("909123456") — trả lại cho đúng
  // đầu số, không thì Đầu số cổ (và mọi phép "bỏ 3 số đầu") lệch một nhịp.
  if (d.length === 9) d = `0${d}`;
  if (d.length < 8) return [];
  return CATEGORY_PRIORITY.filter((c) => CATEGORY_RULES[c](d));
};

/** Nhãn chính của số, hoặc null nếu số không thuộc danh mục nào ("Tự chọn"). */
export const primarySimCategory = (rawDigits: string): SimCategory | null =>
  detectSimCategories(rawDigits)[0] ?? null;

// ── Điểm đẹp & VIP (dùng chung web + sync-sims, cùng lý do như trên) ─────────

/**
 * SIM VIP = có một DẠNG CAO CẤP dưới đây, HOẶC giá ≥ ngưỡng VIP. Thứ tự là thứ
 * tự dashboard dùng để xếp mỗi số VIP vào đúng MỘT nhóm (`VIP_TAGS.find`).
 * "Quý giữa" 5–6 số vào đây vì trước 09/2026 chúng được tính chung là Ngũ/Lục
 * quý — tách danh mục không được làm số rớt khỏi VIP.
 */
export const VIP_TAGS = ["Lục quý", "Ngũ quý", "Tứ quý", "Lục quý giữa", "Ngũ quý giữa", "Tam hoa kép"] as const;
export const VIP_PRICE_THRESHOLD = 50_000_000;

const TAG_SCORE: Record<string, number> = {
  "Lục quý": 100,
  "Ngũ quý": 80,
  "Lục quý giữa": 70,
  "Tứ quý": 60,
  "Tam hoa kép": 55,
  "Ngũ quý giữa": 50,
  "Tam hoa": 40,
  "Tứ quý giữa": 25,
  "Thần tài": 25,
  "Lộc phát": 25,
  "Tiến lên": 20,
  "Gánh đảo": 20,
  "Lặp kép": 20,
  "Năm sinh": 15,
  "Dễ nhớ": 10,
  "Đầu số cổ": 10,
  "Taxi": 5,
  "Số độc": 5,
};

/** Điểm đẹp để sắp xếp: cộng điểm từng danh mục + thưởng VIP theo giá. */
export const calculateBeautyScore = (
  tags: readonly string[],
  price: number,
  vipThreshold: number = VIP_PRICE_THRESHOLD,
): number => {
  let score = 0;
  for (const t of new Set(tags)) score += TAG_SCORE[t] ?? 0;
  if (price >= vipThreshold) score += 10;
  return score;
};

export const isVIPSim = (
  tags: readonly string[],
  price: number,
  vipThreshold: number = VIP_PRICE_THRESHOLD,
): boolean => VIP_TAGS.some((t) => tags.includes(t)) || price >= vipThreshold;
