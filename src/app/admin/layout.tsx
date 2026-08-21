import type { Metadata } from "next";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
