// ═══════════════════════════════════════════════════════════════════════════
// SỔ SIM ĐÃ BÁN (tab SIM_SOLD của Google Sheet kho chính)
//
// File thuần TS, KHÔNG import gì: Deno (sync-sims, fetch-sim-by-id) import bằng
// `../_shared/simSold.ts`, test Vitest import thẳng đường dẫn.
//
// Luật chủ shop (16/10/2026): một số chỉ bán MỘT lần, nên số đã từng nằm trong
// SIM_SOLD thì không bao giờ lên web nữa, kể cả khi bảng số tháng sau còn nó.
// So theo SỐ ĐIỆN THOẠI, không chỉ SimID: cột `SoThueBao` thực ra chứa SimID
// (vd SIM036227) còn số nằm ở cột `STB chuan` (vd 799515759, mất số 0 đầu).
// Bản cũ chỉ đọc SimID nên số bán dưới SimID khác SimID trên web (cùng số, khác
// kho) vẫn hiện — đối chiếu 16/10/2026 bắt được 11 số như vậy.
// ═══════════════════════════════════════════════════════════════════════════

export const SIM_SOLD_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/gviz/tq?tqx=out:csv&sheet=SIM_SOLD';

/** Chỉ giữ chữ số; 9 chữ số (mất số 0 đầu như cột STB chuan) thì thêm 0. */
export const normalizePhone = (raw: unknown): string => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length === 9 ? '0' + digits : digits;
};

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
    else current += char;
  }
  values.push(current.trim());
  return values;
};

export interface SoldLedger {
  /** SimID viết hoa (cột SoThueBao). */
  ids: Set<string>;
  /** Số 10 chữ số (cột STB chuan). */
  phones: Set<string>;
}

export const parseSoldCsv = (csvText: string): SoldLedger => {
  const ids = new Set<string>();
  const phones = new Set<string>();
  // Bỏ BOM đầu file (0xFEFF) nếu có — so mã ký tự để khỏi nhét ký tự vô hình vào regex.
  const text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { ids, phones };
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toUpperCase());
  const idCol = headers.findIndex((h) => h === 'SOTHUEBAO' || h === 'SO THUE BAO' || h === 'SỐTHUÊBAO');
  const phoneCol = headers.findIndex((h) => h === 'STB CHUAN' || h === 'STB CHUẨN');
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const values = splitCsvLine(line).map((v) => v.replace(/^"|"$/g, '').trim());
    const id = idCol >= 0 ? values[idCol] : '';
    if (id) ids.add(id.toUpperCase());
    const phone = phoneCol >= 0 ? normalizePhone(values[phoneCol]) : '';
    if (/^0\d{9}$/.test(phone)) phones.add(phone);
  }
  return { ids, phones };
};
