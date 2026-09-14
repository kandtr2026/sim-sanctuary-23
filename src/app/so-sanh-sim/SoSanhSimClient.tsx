"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { phanTichBatCuc, NL_META, NL_CAT, NL_HUNG } from "@/lib/batCuc";
import { getHexagramFromSuffix } from "@/lib/hexagrams";
import { diemTongHop, nguHanhCuaSo, mucTieuCuaSo, HANH_MAU } from "@/lib/phongThuy";

// So sánh phong thủy 2 số (A Khoa 14/09). Thuần client, dùng lib phong thủy sẵn
// có. Gợi ý nhanh từ "Số vừa xem" (localStorage csm_recent_sims).

const ZALO = "https://zalo.me/0933686666";

function fmtSo(d: string): string {
  if (d.length === 10) return `${d.slice(0, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
  if (d.length === 11) return `${d.slice(0, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
  return d;
}

function phanTichSo(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length < 9) return null;
  const { diem, batCuc, queLevel } = diemTongHop(d);
  const r = phanTichBatCuc(d);
  const cat = NL_CAT.reduce((s, k) => s + r.counts[k], 0);
  const hung = NL_HUNG.reduce((s, k) => s + r.counts[k], 0);
  const chuDao = r.chuDao ? NL_META[r.chuDao].label : "—";
  const nh = nguHanhCuaSo(d);
  const hex = getHexagramFromSuffix(d.slice(-4));
  const mt = mucTieuCuaSo(d).slice(0, 3);
  return { d, fmt: fmtSo(d), diem, batCuc, queLevel, cat, hung, chuDao, hanh: nh.chinh, hex, mt };
}

type Phan = NonNullable<ReturnType<typeof phanTichSo>>;

function CotKetQua({ p, thang }: { p: Phan; thang: boolean }) {
  return (
    <div className={`rounded-xl border p-4 md:p-5 ${thang ? "border-gold/50 bg-gold/[0.05]" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <Link href={`/sim/${p.d}`} className="font-mono text-lg font-extrabold tracking-wide text-foreground hover:text-primary">
          {p.fmt}
        </Link>
        {thang && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-dark">Hợp hơn</span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-4xl font-extrabold leading-none text-primary">{p.diem.toFixed(1)}</span>
        <span className="mb-1 text-sm font-semibold text-muted-foreground">/10</span>
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Bát Cực</dt>
          <dd className="font-medium text-foreground">{p.batCuc.toFixed(1)} · {p.cat} cát / {p.hung} hung</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Chủ đạo</dt>
          <dd className="font-medium text-foreground">{p.chuDao}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Ngũ hành</dt>
          <dd className="font-bold" style={{ color: HANH_MAU[p.hanh] }}>{p.hanh}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Quẻ</dt>
          <dd className="text-right font-medium text-foreground">{p.hex ? `Q${p.hex.index} · ${p.hex.level}` : "—"}</dd>
        </div>
      </dl>
      {p.mt.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.mt.map((m) => (
            <span key={m.id} className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-medium text-foreground">
              {m.icon} {m.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SoSanhSimClient() {
  const [soA, setSoA] = useState("");
  const [soB, setSoB] = useState("");
  const [recent, setRecent] = useState<{ d: string; label: string }[]>([]);

  useEffect(() => {
    // Điền sẵn từ ?a=&b=, nếu không có thì lấy 2 số vừa xem gần nhất.
    let a = "";
    let b = "";
    try {
      const sp = new URLSearchParams(window.location.search);
      a = (sp.get("a") || "").replace(/\D/g, "");
      b = (sp.get("b") || "").replace(/\D/g, "");
    } catch {
      /* bỏ qua */
    }
    let rec: { d: string; label: string }[] = [];
    try {
      const arr = JSON.parse(localStorage.getItem("csm_recent_sims") || "[]");
      if (Array.isArray(arr)) rec = arr.filter((x) => x && typeof x.d === "string").map((x) => ({ d: x.d, label: x.label || x.d }));
    } catch {
      /* bỏ qua */
    }
    setRecent(rec);
    if (!a && rec[0]) a = rec[0].d;
    if (!b && rec[1]) b = rec[1].d;
    setSoA(a);
    setSoB(b);
  }, []);

  const pA = useMemo(() => phanTichSo(soA), [soA]);
  const pB = useMemo(() => phanTichSo(soB), [soB]);

  const winner = pA && pB ? (pA.diem === pB.diem ? "hoa" : pA.diem > pB.diem ? "a" : "b") : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { val: soA, set: setSoA, label: "Số thứ nhất" },
          { val: soB, set: setSoB, label: "Số thứ hai" },
        ].map((f, i) => (
          <div key={i}>
            <label className="mb-1 block text-sm font-medium text-foreground">{f.label}</label>
            <input
              value={f.val}
              onChange={(e) => f.set(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
              inputMode="numeric"
              list="recent-sims"
              placeholder="Nhập số SIM…"
              className="min-h-[46px] w-full rounded-lg border border-border bg-background px-3 font-mono text-base tabular-nums outline-none focus:border-primary"
            />
          </div>
        ))}
        <datalist id="recent-sims">
          {recent.map((r) => (
            <option key={r.d} value={r.d}>
              {r.label}
            </option>
          ))}
        </datalist>
      </div>

      {recent.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Số vừa xem — bấm để điền:</p>
          <div className="flex flex-wrap gap-2">
            {recent.slice(0, 8).map((r) => (
              <button
                key={r.d}
                type="button"
                onClick={() => (soA ? setSoB(r.d) : setSoA(r.d))}
                className="rounded-lg border border-border bg-secondary/30 px-2.5 py-1 font-mono text-xs font-semibold text-foreground transition hover:border-primary/40"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {winner && (
        <div className="rounded-xl border border-gold/30 bg-gold/[0.06] p-4 text-center">
          <p className="text-base font-bold text-foreground">
            {winner === "hoa"
              ? "Hai số tương đương về phong thủy."
              : `Số ${winner === "a" ? (pA as Phan).fmt : (pB as Phan).fmt} hợp phong thủy hơn (${(winner === "a" ? pA : pB)!.diem.toFixed(1)} so với ${(winner === "a" ? pB : pA)!.diem.toFixed(1)}).`}
          </p>
          <a
            href={ZALO}
            target="_blank"
            rel="noopener noreferrer"
            data-sim-number={winner === "b" ? (pB as Phan).d : (pA as Phan).d}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-500 hover:underline"
          >
            <MessageCircle className="h-4 w-4" /> Nhắn Zalo chốt số này
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {pA ? <CotKetQua p={pA} thang={winner === "a"} /> : <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nhập số thứ nhất</div>}
        {pB ? <CotKetQua p={pB} thang={winner === "b"} /> : <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nhập số thứ hai</div>}
      </div>

      <p className="text-xs text-muted-foreground">
        Điểm mang tính tham khảo theo Bát Cực Linh Số + quẻ Kinh Dịch. Cần tư vấn kỹ theo tuổi/mệnh,
        Quý khách nhắn Zalo giúp em.
      </p>
    </div>
  );
}
