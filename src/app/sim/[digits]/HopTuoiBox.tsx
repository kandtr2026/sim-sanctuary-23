"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { hopTuoiSo, HANH_MAU, type HopTuoiKetQua } from "@/lib/phongThuy";

// Hợp tuổi NHẸ (A Khoa 14/09): chỉ hỏi NĂM SINH — không đòi CCCD/ngày giờ như
// simkinhdich. Luận theo nạp âm ngũ hành của năm vs ngũ hành số. Chạy client.

export default function HopTuoiBox({ digits, formatted, zaloHref }: { digits: string; formatted: string; zaloHref: string }) {
  const [nam, setNam] = useState("");
  const [kq, setKq] = useState<HopTuoiKetQua | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const xem = () => {
    const r = hopTuoiSo(digits, Number(nam));
    if (!r) {
      setKq(null);
      setLoi("Nhập năm sinh dương lịch (VD: 1990).");
      return;
    }
    setLoi(null);
    setKq(r);
  };

  const toneCls =
    kq?.tone === "tot"
      ? "border-emerald-500/30 bg-emerald-500/[0.07]"
      : kq?.tone === "xau"
        ? "border-amber-500/30 bg-amber-500/[0.07]"
        : "border-border bg-secondary/30";

  return (
    <div className="mt-2 rounded-xl border border-border bg-secondary/20 p-4">
      <h3 className="text-base font-bold text-foreground">Hợp tuổi của bạn?</h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Chỉ cần nhập <strong className="text-foreground">năm sinh</strong> (dương lịch) — không cần
        CCCD — xem nhanh số này có hợp mệnh của bạn không.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={nam}
          onChange={(e) => setNam(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => e.key === "Enter" && xem()}
          inputMode="numeric"
          placeholder="VD: 1990"
          aria-label="Năm sinh"
          className="min-h-[42px] w-32 rounded-lg border border-border bg-background px-3 text-center text-base tabular-nums outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={xem}
          className="min-h-[42px] rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Xem hợp tuổi
        </button>
      </div>
      {loi && <p className="mt-2 text-sm text-amber-600">{loi}</p>}
      {kq && (
        <div className={`mt-3 rounded-lg border p-3 ${toneCls}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>
              Mệnh của bạn:{" "}
              <strong style={{ color: HANH_MAU[kq.menh] }}>{kq.menh}</strong>
            </span>
            <span className="opacity-40">·</span>
            <span>
              Số này hành:{" "}
              <strong style={{ color: HANH_MAU[kq.hanhSo] }}>{kq.hanhSo}</strong>
            </span>
          </div>
          <div className="mt-1 text-base font-bold text-foreground">{kq.muc}</div>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{kq.giaiThich}</p>
          <a
            href={zaloHref}
            target="_blank"
            rel="noopener noreferrer"
            data-sim-number={digits}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-500 hover:underline"
          >
            <MessageCircle className="h-4 w-4" /> Nhắn Zalo hỏi kỹ hơn về số {formatted}
          </a>
        </div>
      )}
    </div>
  );
}
