/**
 * Cờ "máy NỘI BỘ" — thiết bị của A Khoa / người nhà / nhân viên, không được đếm
 * vào thống kê khách (page_visits, conversion_clicks).
 *
 * Lưu VĨNH VIỄN trong localStorage (khoá `csm_noi_bo`), tức là kể cả khi đã đăng
 * xuất máy đó vẫn không bị đếm nữa. Bật bằng một trong các cách:
 *   - máy từng vào /admin hoặc từng có phiên đăng nhập (hook tracker tự bật);
 *   - mở bất kỳ URL nào của site kèm `?noibo=1` (A Khoa mở 1 lần trên máy nhân viên).
 * Tắt bằng `?noibo=0`.
 *
 * An toàn SSR (không có window) và chế độ riêng tư (localStorage ném lỗi): khi
 * không ghi được thì nhớ tạm trong bộ nhớ cho hết lượt mở trang này.
 */

export const NOI_BO_KEY = "csm_noi_bo";
export const NOI_BO_PARAM = "noibo";

// Dự phòng khi localStorage bị chặn — chỉ sống trong lượt mở trang hiện tại.
let memoryFlag: boolean | null = null;

const hasWindow = () => typeof window !== "undefined";

/** Máy này có đang được đánh dấu nội bộ không. */
export function isNoiBoDevice(): boolean {
  if (!hasWindow()) return false;
  try {
    return window.localStorage.getItem(NOI_BO_KEY) === "1";
  } catch {
    return memoryFlag === true;
  }
}

/** Đánh dấu máy này là nội bộ (vĩnh viễn, tới khi có `?noibo=0`). */
export function markNoiBoDevice(): void {
  if (!hasWindow()) return;
  memoryFlag = true;
  try {
    window.localStorage.setItem(NOI_BO_KEY, "1");
  } catch {
    /* riêng tư / bị chặn — giữ cờ trong bộ nhớ */
  }
}

/** Bỏ đánh dấu nội bộ cho máy này. */
export function clearNoiBoDevice(): void {
  if (!hasWindow()) return;
  memoryFlag = false;
  try {
    window.localStorage.removeItem(NOI_BO_KEY);
  } catch {
    /* riêng tư / bị chặn — cờ bộ nhớ đã tắt */
  }
}

/**
 * Đọc giá trị `?noibo=` trong chuỗi query: "on" (1/true/rỗng), "off" (0/false/off),
 * null nếu không có tham số hoặc giá trị lạ.
 */
export function parseNoiBoParam(search: string): "on" | "off" | null {
  let value: string | null;
  try {
    value = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(NOI_BO_PARAM);
  } catch {
    return null;
  }
  if (value === null) return null;
  const v = value.trim().toLowerCase();
  if (v === "" || v === "1" || v === "true" || v === "on") return "on";
  if (v === "0" || v === "false" || v === "off") return "off";
  return null;
}

/**
 * Áp cờ theo `?noibo=` của URL (mặc định URL hiện tại). Trả về hành động đã áp
 * ("on" / "off") hoặc null nếu URL không có tham số hợp lệ.
 */
export function applyNoiBoFromUrl(search?: string): "on" | "off" | null {
  if (!hasWindow()) return null;
  const action = parseNoiBoParam(search ?? window.location.search);
  if (action === "on") markNoiBoDevice();
  else if (action === "off") clearNoiBoDevice();
  return action;
}

/**
 * Gỡ `noibo` khỏi thanh địa chỉ (replaceState, không tải lại trang) — để nhân viên
 * lỡ copy link đang mở gửi cho khách thì khách KHÔNG bị đánh dấu nội bộ theo.
 */
export function stripNoiBoParam(): void {
  if (!hasWindow()) return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(NOI_BO_PARAM)) return;
    url.searchParams.delete(NOI_BO_PARAM);
    // data = null (theo docs Next): router tự chép state nội bộ và đồng bộ
    // useSearchParams. Truyền history.state (có __NA) sẽ làm router BỎ QUA URL mới.
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch {
    /* không gỡ được thì thôi — cờ đã áp xong */
  }
}
