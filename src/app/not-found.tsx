import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>404 — Không tìm thấy trang</h1>
      <p>Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link href="/">Về trang chủ</Link>
    </main>
  );
}
