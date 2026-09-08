"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * Ô nhập số cho trang tra cứu. Client island nhỏ: chỉ giữ state ô input rồi
 * điều hướng sang `/tra-cuu-sim?so=<digits>` — phần phân tích + hiển thị do
 * trang server lo (SEO + chia sẻ link được). Không tự fetch gì.
 */
export default function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = value.replace(/\D/g, "");
    if (!/^0\d{9,10}$/.test(digits)) {
      setError("Quý khách nhập đủ số điện thoại 10 số (bắt đầu bằng 0).");
      return;
    }
    setError("");
    router.push(`/tra-cuu-sim?so=${digits}`);
  };

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập số cần tra, ví dụ 0938686868"
          aria-label="Nhập số điện thoại cần tra cứu"
          className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <Search className="h-5 w-5" /> Tra cứu số
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
