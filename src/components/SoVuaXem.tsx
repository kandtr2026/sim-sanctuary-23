"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { formatPrice } from "@/lib/simUtils";

// "Số vừa xem" — nhớ các số khách vừa mở (localStorage) để khách nhảy qua lại
// giữa các trang số mà không bị lạc. Ghi thêm số hiện tại (nếu có) rồi hiện phần
// còn lại. Chạy phía khách; ẩn hoàn toàn tới khi mount xong để tránh lệch hydrate.

type Item = { d: string; label: string; p: number };
type Stored = Item & { t: number };

const KEY = "csm_recent_sims";
const CAP = 12;

function readLS(): Stored[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is Stored => x && typeof x.d === "string" && typeof x.label === "string",
    );
  } catch {
    return [];
  }
}

export default function SoVuaXem({ current }: { current?: Item }) {
  const [items, setItems] = useState<Stored[]>([]);
  const [ready, setReady] = useState(false);

  const curD = current?.d;
  const curLabel = current?.label;
  const curP = current?.p;

  useEffect(() => {
    let list = readLS();
    if (curD) {
      list = list.filter((x) => x.d !== curD);
      list.unshift({ d: curD, label: curLabel ?? curD, p: curP ?? 0, t: Date.now() });
      list = list.slice(0, CAP);
      try {
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch {
        /* chế độ riêng tư chặn localStorage — bỏ qua, chỉ hiển thị trong phiên */
      }
    }
    setItems(list);
    setReady(true);
  }, [curD, curLabel, curP]);

  const shown = curD ? items.filter((x) => x.d !== curD) : items;
  if (!ready || shown.length === 0) return null;

  const clear = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* bỏ qua */
    }
    setItems(curD ? [{ d: curD, label: curLabel ?? curD, p: curP ?? 0, t: Date.now() }] : []);
  };

  return (
    <section
      aria-label="Số vừa xem"
      className="rounded-xl border border-border bg-card p-4 shadow-card md:p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <History aria-hidden className="h-4 w-4 text-primary" /> Số vừa xem
        </h2>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
        >
          Xoá
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {shown.map((s) => (
          <Link
            key={s.d}
            href={`/sim/${s.d}`}
            className="group shrink-0 rounded-lg border border-border bg-secondary/30 px-3 py-2 transition hover:border-primary/40 hover:bg-secondary/60"
          >
            <div className="font-mono text-sm font-bold tracking-wide text-foreground group-hover:text-primary">
              {s.label}
            </div>
            {s.p > 0 && (
              <div className="text-xs font-semibold text-primary">{formatPrice(s.p)}</div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
