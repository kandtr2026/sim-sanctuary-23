/** Chế độ xem biểu đồ theo ngày (14 ngày gần nhất) hoặc tháng (6 tháng gần nhất). */
export type DailyPeriod = "day" | "month";

/** Một điểm dữ liệu ngày YYYY-MM-DD + số lượng, do server gom sẵn. */
export interface DailyPoint {
  day: string;
  count: number;
}

export interface DailyBar {
  key: string;
  count: number;
  label: string;
  height: number;
}

/** "Hôm nay" theo giờ VN (UTC+7), biểu diễn bằng Date có các trường UTC = giờ VN. */
const nowVn = () => new Date(Date.now() + 7 * 3600 * 1000);

/**
 * Dựng cột biểu đồ từ dữ liệu ngày đã gom sẵn (YYYY-MM-DD). `day` = 14 ngày gần
 * nhất; `month` = 6 tháng gần nhất (cộng dồn các ngày trong tháng). Dùng chung
 * cho biểu đồ lượt truy cập & lượt đọc bài viết để hai chỗ không lệch cách tính.
 */
export function buildDailyBars(daily: DailyPoint[], period: DailyPeriod): DailyBar[] {
  const byDay = new Map(daily.map((d) => [d.day, d.count]));
  const base = nowVn();

  if (period === "day") {
    const anchors: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      anchors.push(d.toISOString().slice(0, 10));
    }
    const counts = anchors.map((a) => byDay.get(a) ?? 0);
    const max = Math.max(1, ...counts);
    return anchors.map((a, i) => ({
      key: a,
      count: counts[i],
      label: `${a.slice(8, 10)}/${a.slice(5, 7)}`,
      height: counts[i] === 0 ? 2 : Math.max(8, Math.round((counts[i] / max) * 85)),
    }));
  }

  const anchors: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    anchors.push(d.toISOString().slice(0, 7));
  }
  const counts = anchors.map((m) => daily.filter((d) => d.day.startsWith(m)).reduce((s, d) => s + d.count, 0));
  const max = Math.max(1, ...counts);
  return anchors.map((m, i) => ({
    key: m,
    count: counts[i],
    label: `${m.slice(5, 7)}/${m.slice(2, 4)}`,
    height: counts[i] === 0 ? 2 : Math.max(8, Math.round((counts[i] / max) * 85)),
  }));
}
