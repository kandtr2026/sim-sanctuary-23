/**
 * Google Ads conversion tracking (task A3).
 *
 * Inert cho tới khi chủ shop cấp AW-… và label chuyển đổi (Zalo/gọi), rồi set
 * 2 biến môi trường trong Vercel:
 *   - NEXT_PUBLIC_GADS_AW_ID   = "AW-123456789"  (conversion ID)
 *   - NEXT_PUBLIC_GADS_CONV_LABEL = "ZaloLead"    (conversion label)
 *
 * Khi đủ cả 2, useConversionTracker bắn thêm event `conversion` (send_to =
 * "AW-…/label") mỗi lần khách bấm Zalo / gọi / Messenger — Google Ads nhận lead
 * để đấu thầu theo chuyển đổi mà không cần đổi code.
 */

export const GADS_AW_ID = process.env.NEXT_PUBLIC_GADS_AW_ID;
export const GADS_CONV_LABEL = process.env.NEXT_PUBLIC_GADS_CONV_LABEL;

/** "AW-123456789/ZaloLead" — chuỗi send_to hợp lệ cho gtag conversion. */
export const GADS_CONV_SEND_TO =
  GADS_AW_ID && GADS_CONV_LABEL ? `${GADS_AW_ID}/${GADS_CONV_LABEL}` : null;

export const gadsReady = GADS_CONV_SEND_TO !== null;
