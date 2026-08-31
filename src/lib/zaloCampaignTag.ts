/**
 * A6 — gắn mã campaign vào link Zalo (round-trip enabler).
 *
 * Vòng đo lead → đơn: web biết campaign/gclid mỗi cú bấm Zalo (conversion_clicks)
 * nhưng KHÔNG biết SĐT; AppSheet biết SĐT+đơn nhưng không biết campaign. Cách nối:
 * cho mã campaign đi nhờ tin nhắn Zalo, rồi đơn về qua webhook /api/orders.
 *
 * Ở đây: mỗi lần khách bấm link zalo.me, ta chèn (hoặc nối thêm) `?text=…[Mã: X]`
 * NGAY TRƯỚC KHI điều hướng (capture phase — còn kịp sửa href). Chuyên viên nhìn
 * thấy mã trong hội thoại Zalo và dán vào cột "Mã campaign" của AppSheet.
 *
 * Quy tắc mã X (ưu tiên theo thứ tự):
 *   1. utm_campaign nếu có;
 *   2. nếu không có utm_campaign nhưng có gclid → "ads";
 *   3. nếu không → source (seo/facebook/direct…).
 * Link đã có `?text=` (vd /mua-ngay, QuickContactPopup) thì GIỮ text cũ, chỉ nối
 * thêm "[Mã: X]". Link đã chứa "[Mã:" thì bỏ qua — không tag hai lần.
 *
 * Module thuần (không đụng DOM ngoài tham số truyền vào) để dễ test; hook gọi
 * đúng hai hàm này trong capture-phase listener.
 */
import { getAttribution } from "@/lib/attribution";
import { classifySource } from "@/lib/trackingUtils";

/** Bảng mã campaign từ attribution / nguồn. null = không có gì đáng gắn. */
export function computeCampaignCode(): string | null {
  const attr = getAttribution();
  if (attr.utm_campaign?.trim()) return attr.utm_campaign.trim();
  if (attr.gclid) return "ads";
  const { source } = classifySource(document.referrer);
  // "internal" là khách điều hướng trong chính site — không phải một chiến dịch.
  if (source && source !== "internal") return source;
  return null;
}

/** Tìm SIM cụ thể đang xem, nếu có (data-sim-number hoặc đường dẫn /mua-ngay). */
export function detectSimNumber(el: Element, pathname?: string): string | null {
  const holder = el.closest("[data-sim-number]") as HTMLElement | null;
  const attr = holder?.getAttribute("data-sim-number");
  if (attr?.trim()) return attr.trim();
  const p = pathname ?? window.location.pathname;
  const m = p.match(/^\/mua-ngay\/([^/]+)/);
  return m?.[1] ?? null;
}

/**
 * Sửa href của link zalo.me ngay trước khi navigate. Trả về href mới, hoặc
 * undefined nếu không có gì để tag. Không ném — hỏng thì trả undefined để hook
 * giữ link nguyên vẹn.
 */
export function tagZaloHref(el: HTMLAnchorElement): string | undefined {
  try {
    const code = computeCampaignCode();
    if (!code) return undefined;
    const url = new URL(el.href);
    const existing = url.searchParams.get("text") ?? "";
    if (/\[Mã:\s*[^\]]+\]/.test(existing)) return undefined; // đã tag rồi
    const sim = detectSimNumber(el);
    const base =
      existing.trim() ||
      (sim ? `Em quan tâm SIM ${sim}.` : "Em quan tâm sim số đẹp.");
    url.searchParams.set("text", `${base} [Mã: ${code}]`.trim());
    return url.toString();
  } catch {
    return undefined;
  }
}
