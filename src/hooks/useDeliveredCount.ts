import { useQuery } from '@tanstack/react-query';

// ============================================================
// Đếm số SIM đã bán (đã bị trừ khỏi kho) - realtime theo Google Sheet
// Nguồn: tab SIM_SOLD của spreadsheet kho chính (cột SoThueBao)
// Mỗi dòng SoThueBao = 1 SIM đã bán = 1 "đơn đã giao"
// ============================================================

// Spreadsheet A - kho chính (trùng với fetch-sim-data edge function)
const SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';
// gviz API có sẵn CORS nên fetch thẳng từ trình duyệt được (không cần proxy)
const SIM_SOLD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=SIM_SOLD`;

// Số nền cộng thêm vào số đếm thật (để 0 nếu muốn hiển thị đúng số thật)
const BASE_COUNT = 0;
// Số hiển thị dự phòng khi chưa tải được (giữ nguyên số cũ để không nhảy về 0)
const FALLBACK_COUNT = 1247;

const CACHE_KEY = 'delivered_count_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 phút
const REFRESH_INTERVAL = 2 * 60 * 1000; // tự làm mới mỗi 2 phút

// Parse 1 dòng CSV (xử lý dấu phẩy trong ô quoted)
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
    else { current += char; }
  }
  values.push(current.trim());
  return values;
};

// Đếm số dòng SIM đã bán từ CSV của tab SIM_SOLD
const countSoldRows = (csv: string): number => {
  const text = csv.replace(/^﻿/, '').trim();
  // Chặn HTML/trang login trả về thay vì CSV
  if (!text || text.toLowerCase().startsWith('<')) {
    throw new Error('SIM_SOLD trả về nội dung không hợp lệ');
  }

  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return 0; // chỉ có header hoặc rỗng

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, '').trim().toUpperCase()
  );
  // Tìm cột SoThueBao (chứa SimID đã bán)
  const colIdx = headers.findIndex(
    (h) => h === 'SOTHUEBAO' || h === 'SO THUE BAO' || h === 'SỐTHUÊBAO'
  );

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    // Nếu tìm được cột thì đếm ô không rỗng; nếu không, đếm dòng có dữ liệu
    const val =
      colIdx !== -1
        ? (vals[colIdx] || '').replace(/^"|"$/g, '').trim()
        : (vals[0] || '').trim();
    if (val) count++;
  }
  return count;
};

const loadCache = (): number | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { count, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL && typeof count === 'number') return count;
  } catch { /* bỏ qua */ }
  return null;
};

const saveCache = (count: number) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ count, ts: Date.now() }));
  } catch { /* bỏ qua */ }
};

const fetchDeliveredCount = async (): Promise<number> => {
  const bust = `&t=${Date.now()}`;
  const res = await fetch(`${SIM_SOLD_URL}${bust}`, {
    headers: { Accept: 'text/csv,*/*' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const count = countSoldRows(csv);
  saveCache(count);
  return count;
};

/**
 * Trả về số SIM đã bán (đã trừ khỏi kho), tự làm mới định kỳ.
 * - deliveredCount: số hiển thị = BASE_COUNT + số đếm thật (hoặc FALLBACK khi chưa có)
 * - isLoading: đang tải lần đầu và chưa có cache
 */
export const useDeliveredCount = () => {
  const cached = loadCache();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deliveredCount'],
    queryFn: fetchDeliveredCount,
    staleTime: CACHE_TTL,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: cached ?? undefined,
  });

  const hasReal = typeof data === 'number';
  const deliveredCount = hasReal ? BASE_COUNT + (data as number) : FALLBACK_COUNT;

  return {
    deliveredCount,
    isLoading: isLoading && cached === null,
    isError,
  };
};
