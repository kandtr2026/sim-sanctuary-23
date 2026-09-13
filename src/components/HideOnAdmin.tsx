"use client";

import { usePathname } from "next/navigation";

/**
 * Ẩn chrome dành cho KHÁCH (Header/Footer/nav/nút liên hệ nổi…) khi đang ở khu
 * `/admin` — trang quản trị không cần mấy thứ đó (góp ý #21). usePathname trả
 * đúng path cả khi SSR nên không nháy: trên /admin không render ra HTML luôn.
 *
 * Đặt ở layout gốc bọc quanh nhóm chrome; các component con vẫn là Server
 * Component bình thường (mẫu "client component bọc server children").
 */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
