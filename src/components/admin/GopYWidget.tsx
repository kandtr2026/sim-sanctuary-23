"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { BUILD_COMMIT, formatBuildTime } from "@/lib/buildInfo";

/**
 * Ô nổi "Góp ý cho Claude" — A Khoa gõ nhận xét ngay trên màn /admin đang xem,
 * Claude đọc bảng `public.sim_gop_y` rồi sửa mã. Bê từ KOI, đổi phần xác thực
 * cho hợp chonso: khu /admin ở đây dùng Supabase Auth (token trong context), nên
 * KHÔNG cần route /phien riêng như KOI — biết admin hay chưa từ useAdminAuth.
 *
 * CHỈ QUẢN TRỊ MỚI THẤY: chỉ hiện khi `isAdmin === true`. Widget mount trong
 * admin/layout.tsx (bọc AdminAuthProvider) nên không đụng gì tới phần site tĩnh.
 *
 * Kèm đường dẫn + tiêu đề + phiên bản (short git SHA) vào mỗi góp ý: đó là thứ
 * biến câu "chỗ này xấu" thành việc làm được ngay, khỏi hỏi lại đang ở màn nào,
 * bản nào.
 */
export function GopYWidget() {
  const duongDan = usePathname();
  const { session, isAdmin } = useAdminAuth();
  const token = session?.access_token;

  const [mo, setMo] = useState(false);
  const [text, setText] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [daGui, setDaGui] = useState(0);
  const [loi, setLoi] = useState("");
  const oNhap = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mo) oNhap.current?.focus();
  }, [mo]);

  async function gui() {
    const t = text.trim();
    if (!t || dangGui) return;
    if (!token) {
      setLoi("Phiên hết hạn — đăng nhập lại rồi gửi.");
      return;
    }
    setDangGui(true);
    setLoi("");
    try {
      const r = await fetch("/api/admin/gop-y", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noiDung: t,
          duongDan: duongDan + (typeof window !== "undefined" ? window.location.search : ""),
          tieuDe: typeof document !== "undefined" ? document.title : "",
          phienBan: BUILD_COMMIT,
        }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!r.ok || !j?.ok) {
        setLoi(
          r.status === 401
            ? "Phiên hết hạn. Đăng nhập lại ở /admin rồi gửi lại."
            : j?.error || "Không gửi được.",
        );
        return;
      }
      setText("");
      setDaGui((n) => n + 1);
    } catch {
      setLoi("Mất mạng — thử lại.");
    } finally {
      setDangGui(false);
    }
  }

  if (isAdmin !== true) return null;

  return (
    <>
      {mo ? (
        <div
          role="dialog"
          aria-label="Góp ý cho Claude"
          className="fixed inset-x-3 bottom-24 z-[80] flex flex-col rounded-2xl border border-white/15 bg-neutral-900/95 p-3 text-white shadow-2xl backdrop-blur md:inset-x-auto md:right-4 md:w-[380px]"
        >
          <div className="mb-2 flex items-center gap-2 text-xs opacity-70">
            <span className="font-semibold text-amber-300">💬 Góp ý cho Claude</span>
            <span className="ml-auto truncate" title={duongDan}>
              màn: {duongDan}
            </span>
          </div>
          <textarea
            ref={oNhap}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void gui();
              }
              if (e.key === "Escape") setMo(false);
            }}
            placeholder="Đang xem thấy gì cần sửa? Gõ ở đây… (Enter để gửi · Shift+Enter xuống dòng)"
            rows={3}
            className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/60"
          />
          {loi ? <p className="mt-1 text-xs text-red-300">{loi}</p> : null}
          <div className="mt-2 flex items-center gap-2">
            {daGui > 0 ? (
              <span className="text-xs text-emerald-300">đã gửi {daGui} ✓</span>
            ) : null}
            <span className="truncate text-[10px] text-white/30" title={`bản ${BUILD_COMMIT}`}>
              {BUILD_COMMIT} · {formatBuildTime()}
            </span>
            <button
              type="button"
              onClick={() => void gui()}
              disabled={dangGui || !text.trim()}
              className="ml-auto min-h-[40px] rounded-lg bg-amber-500 px-4 text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
            >
              {dangGui ? "Đang gửi…" : "Gửi"}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setMo((v) => !v)}
        aria-label={mo ? "Đóng ô góp ý" : "Góp ý cho Claude"}
        // bottom-24 để không đè các thanh dính đáy nếu có; md thì hạ xuống góc.
        className="fixed bottom-24 right-4 z-[81] grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-amber-500 text-2xl text-black shadow-2xl transition active:scale-95 md:bottom-6"
      >
        {mo ? "×" : "💬"}
      </button>
    </>
  );
}
