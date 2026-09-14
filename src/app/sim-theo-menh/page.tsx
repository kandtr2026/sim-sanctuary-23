import type { Metadata } from "next";
import Link from "next/link";
import { getServerSims } from "@/lib/serverSimData";
import {
  nguHanhCuaSo,
  NGU_HANH_LIST,
  HANH_MAU,
  nguHanhSinhRa,
  type NguHanh,
} from "@/lib/phongThuy";

// View "SIM theo mệnh" (A Khoa 14/09): thống kê kho theo ngũ hành của SỐ (Hà Đồ —
// KHỚP với badge hành trên chip) để khách chọn số theo mệnh. Server-render, SEO.

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "SIM theo mệnh — chọn số hợp Kim/Mộc/Thủy/Hỏa/Thổ | CHONSOMOBIFONE.COM" },
  description:
    "Chọn SIM theo mệnh: thống kê số theo ngũ hành Kim, Mộc, Thủy, Hỏa, Thổ. Xem nhóm số hợp mệnh của bạn, chấm điểm phong thủy, giá niêm yết, nhắn Zalo chốt số.",
  alternates: { canonical: "/sim-theo-menh" },
  robots: { index: true, follow: true },
};

export default async function SimTheoMenhPage() {
  const sims = (await getServerSims()).filter((s) => s.price > 0);
  const dem: Record<NguHanh, number> = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  for (const s of sims) dem[nguHanhCuaSo(s.rawDigits).chinh]++;

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="text-2xl font-extrabold md:text-3xl">SIM theo mệnh</h1>
          <p className="mt-1 max-w-2xl text-sm text-primary-foreground/85">
            Mỗi số mang một <strong>ngũ hành</strong> (Kim · Mộc · Thủy · Hỏa · Thổ). Chọn nhóm hợp
            mệnh của Quý khách để xem những số đẹp phong thủy nhất trong tầm giá. Chưa rõ mệnh? Vào
            một trang số bất kỳ, nhập năm sinh ở ô “Hợp tuổi” là biết ngay.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NGU_HANH_LIST.map(({ hanh, slug, moTa }) => {
            const n = dem[hanh];
            const mau = HANH_MAU[hanh];
            const nuoi = nguHanhSinhRa(hanh);
            return (
              <Link
                key={slug}
                href={`/sim-theo-menh/${slug}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40"
                style={{ borderTopColor: mau, borderTopWidth: 3 }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg font-bold" style={{ color: mau }}>
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: mau }} />
                    Mệnh {hanh}
                  </span>
                  <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-sm font-bold tabular-nums text-foreground">
                    {n.toLocaleString("vi-VN")} số
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{moTa}.</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Số hành {hanh} hợp người <strong className="text-foreground">mệnh {hanh}</strong> (tương
                  hòa) và <strong className="text-foreground">mệnh {nuoi}</strong> (được số sinh vượng).
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-primary group-hover:underline">
                  Xem {n.toLocaleString("vi-VN")} số mệnh {hanh} →
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Ngũ hành tính theo Hà Đồ (1,6 Thủy · 2,7 Hỏa · 3,8 Mộc · 4,9 Kim · 5,0 Thổ) — đúng bằng
          badge hành hiển thị trên từng số. Mang tính tham khảo.
        </p>
      </div>
    </main>
  );
}
