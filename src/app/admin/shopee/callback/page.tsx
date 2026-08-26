"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Trang nhận `code` uỷ quyền Shopee trả về sau khi chủ shop bấm Đồng ý.
 * Redirect URL khai trên Shopee Open Platform: /admin/shopee/callback
 *
 * Code dùng MỘT LẦN và hết hạn ~10 phút — tự đổi ngay khi tới đây, rồi về
 * /admin/shopee. Nếu đổi lỗi, giữ nguyên code trên URL để admin tự xử lý.
 */
function ShopeeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAdminAuth();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Đang trao đổi code uỷ quyền với Shopee…");
  const ran = useRef(false);

  useEffect(() => {
    document.title = "Đang uỷ quyền Shopee – CHONSOMOBIFONE.COM";
  }, []);

  useEffect(() => {
    if (ran.current) return;
    const code = searchParams.get("code");
    const shopId = searchParams.get("shop_id");

    if (!code) {
      setStatus("error");
      setMessage("Không thấy code uỷ quyền trên URL. Hãy bấm lại \"Uỷ quyền shop\" từ đầu.");
      return;
    }
    if (!session?.access_token) {
      // RequireAdmin đang đợi session — bấm tiếp khi có token.
      return;
    }

    ran.current = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/shopee/exchange", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code, shopId: shopId || undefined }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("error");
          setMessage(
            (body as { error?: string })?.error ||
              `Lỗi khi đổi code (HTTP ${res.status}). Code đã dùng một lần — nếu lỗi thì bấm Uỷ quyền lại từ đầu.`,
          );
          return;
        }
        setStatus("done");
        setMessage("Đã uỷ quyền thành công. Đang chuyển về trang quản lý…");
        setTimeout(() => router.replace("/admin/shopee"), 800);
      } catch {
        setStatus("error");
        setMessage("Không gọi được server để đổi code. Kiểm tra mạng rồi thử lại.");
      }
    })();
  }, [session, searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        {status === "working" ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        ) : status === "done" ? (
          <p className="text-3xl">✅</p>
        ) : (
          <p className="text-3xl">⚠️</p>
        )}
        <h1 className="mt-3 text-lg font-semibold text-foreground">Uỷ quyền Shopee</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function ShopeeCallbackPage() {
  return (
    <RequireAdmin>
      <ShopeeCallbackContent />
    </RequireAdmin>
  );
}
