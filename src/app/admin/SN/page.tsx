"use client";

/**
 * Trang riêng cho dự án "Sim sinh nhật" tại /admin/SN (góp ý #56): A Khoa muốn
 * tách hẳn ra 1 menu lớn, không nằm chung tab dashboard cho đỡ chật. Toàn bộ giao
 * diện là SimBirthdaySection (3 menu: Chưa lọc / Có Zalo / Ko Zalo + Kanban…).
 */

import Link from "next/link";
import { ArrowLeft, CalendarHeart, LogOut } from "lucide-react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { SimBirthdaySection } from "@/components/admin/SimBirthdaySection";
import { useAdminAuth } from "@/hooks/useAdminAuth";

function SimBirthdayPageContent() {
  const { user, session, signOut } = useAdminAuth();
  const token = session?.access_token;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex flex-wrap items-center gap-3 px-4 py-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarHeart className="h-4 w-4 text-gold" />
            Sim sinh nhật
          </h1>
          <div className="ml-auto flex items-center gap-3">
            {user?.email && <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>}
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <SimBirthdaySection token={token} />
      </main>
    </div>
  );
}

export default function SimBirthdayPage() {
  return (
    <RequireAdmin>
      <SimBirthdayPageContent />
    </RequireAdmin>
  );
}
