import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSheetCsv, normalizeHeader, parseCSVLine, stripQuotes } from '@/lib/cheapSimSheet';

// ============================================================
// Đếm số SIM đã bán (đã bị trừ khỏi kho) - realtime theo Google Sheet
// Nguồn: tab SIM_SOLD của spreadsheet kho chính (cột SoThueBao)
// Mỗi dòng SoThueBao = 1 SIM đã bán = 1 "đơn đã giao"
// ============================================================

// Spreadsheet A - kho chính (trùng với fetch-sim-data edge function)
const SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';

/**
 * `select B` — chỉ cột `SoThueBao`, và đi qua `sheet-proxy`.
 *
 * Bản cũ fetch thẳng `sheet=SIM_SOLD` không projection: 383 KB, 24 cột, **gồm cả
 * cột `GiaThu` (giá thu về)**. Hook này chạy trong `TrustBar` — component nằm ở
 * layout dùng chung — nên mọi khách vào BẤT KỲ trang nào cũng tải về bảng giá vốn
 * của toàn bộ đơn đã bán. Đếm số dòng thì chỉ cần đúng một cột.
 */
const SIM_SOLD_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=SIM_SOLD` +
  `&tq=${encodeURIComponent('select B')}`;

/** Header kỳ vọng của `select B`; lệch là hỏng to tiếng thay vì đếm cột sai. */
const EXPECTED_HEADER = 'sothuebao';

// Số nền cộng thêm vào số đếm thật (để 0 nếu muốn hiển thị đúng số thật)
const BASE_COUNT = 0;
// Số hiển thị dự phòng khi chưa tải được (giữ nguyên số cũ để không nhảy về 0)
const FALLBACK_COUNT = 1247;

const CACHE_KEY = 'delivered_count_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 phút
const REFRESH_INTERVAL = 2 * 60 * 1000; // tự làm mới mỗi 2 phút

// Đếm số dòng SIM đã bán từ CSV `select B` của tab SIM_SOLD
const countSoldRows = (csv: string): number => {
  // U+FEFF is the UTF-8 BOM Google Sheets prepends. Written as an escape rather
  // than a literal so it stays visible in source and survives editor re-saves.
  const text = csv.replace(/^\uFEFF/, '').trim();
  // Chặn HTML/trang login trả về thay vì CSV
  if (!text || text.toLowerCase().startsWith('<')) {
    throw new Error('SIM_SOLD trả về nội dung không hợp lệ');
  }

  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return 0; // chỉ có header hoặc rỗng

  const headers = parseCSVLine(lines[0]).map((h) => normalizeHeader(h));
  // Projection chỉ có một cột nên vị trí là cố định — nhưng vẫn phải kiểm tên: nếu
  // ai chèn cột vào sheet thì `B` trỏ sang cột khác và số đếm thành vô nghĩa. Sai
  // tên thì ném lỗi để hook giữ số cũ, không hiện số bừa.
  if (headers[0] !== EXPECTED_HEADER) {
    throw new Error('SIM_SOLD đổi thứ tự cột — cột B không còn là SoThueBao');
  }

  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    if (stripQuotes(parseCSVLine(lines[i])[0] || '')) count++;
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
  const csv = await fetchSheetCsv(SIM_SOLD_URL);
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
  // Đọc localStorage TRONG EFFECT, không đọc lúc render: nếu đọc ở render thì
  // SSR (cached=null → TrustBar hiện "…") khác client khi có cache → hydration
  // mismatch React #418 trên MỌI trang (TrustBar nằm ở layout dùng chung).
  const [cached, setCached] = useState<number | null>(null);

  useEffect(() => {
    setCached(loadCache());
  }, []);

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
