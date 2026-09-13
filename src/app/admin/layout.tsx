import type { Metadata } from "next";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { GopYWidget } from "@/components/admin/GopYWidget";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      {children}
      {/* Ô nổi "Góp ý cho Claude" — chỉ quản trị mới thấy (tự ẩn nếu !isAdmin). */}
      <GopYWidget />
    </AdminAuthProvider>
  );
}
