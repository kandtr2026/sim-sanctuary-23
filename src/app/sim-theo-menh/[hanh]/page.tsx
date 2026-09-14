import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getServerSims } from "@/lib/serverSimData";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import {
  nguHanhCuaSo,
  diemTongHop,
  NGU_HANH_LIST,
  hanhTheoSlug,
  HANH_MAU,
  nguHanhSinhRa,
} from "@/lib/phongThuy";

export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ hanh: string }> };

export function generateStaticParams() {
  return NGU_HANH_LIST.map((x) => ({ hanh: x.slug }));
}

const ZALO = "https://zalo.me/0933686666";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hanh } = await params;
  const item = hanhTheoSlug(hanh);
  if (!item) {
    return { title: { absolute: "Không tìm thấy | CHONSOMOBIFONE.COM" }, robots: { index: false, follow: true } };
  }
  return {
    title: { absolute: `SIM mệnh ${item.hanh} — số hành ${item.hanh} hợp phong thủy | CHONSOMOBIFONE.COM` },
    description: `Kho SIM MobiFone hành ${item.hanh} (${item.moTa}). Chấm điểm phong thủy, giá niêm yết công khai, sang tên chính chủ. Nhắn Zalo chốt số hợp mệnh.`,
    alternates: { canonical: `/sim-theo-menh/${item.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function SimTheoMenhHanhPage({ params }: Props) {
  const { hanh } = await params;
  const item = hanhTheoSlug(hanh);
  if (!item) notFound();

  const mau = HANH_MAU[item.hanh];
  const nuoi = nguHanhSinhRa(item.hanh);
  const sims = (await getServerSims()).filter((s) => s.price > 0);
  const scored = sims
    .filter((s) => nguHanhCuaSo(s.rawDigits).chinh === item.hanh)
    .map((s) => ({ s, pt: diemTongHop(s.rawDigits).diem }))
    .sort((a, b) => b.pt - a.pt || a.s.price - b.s.price)
    .slice(0, 60);

  return (
    <main className="min-h-screen bg-background">
      <section className="text-primary-foreground" style={{ background: `linear-gradient(180deg, ${mau}, ${mau}cc)` }}>
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white md:text-3xl">
            <span aria-hidden className="h-4 w-4 rounded-full bg-white/90" /> SIM mệnh {item.hanh}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/90">
            Số hành <strong>{item.hanh}</strong> ({item.moTa}). Hợp người{" "}
            <strong>mệnh {item.hanh}</strong> (tương hòa) và <strong>mệnh {nuoi}</strong> (được số sinh
            vượng). Xếp theo điểm phong thủy cao nhất.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {NGU_HANH_LIST.map((x) => (
              <Link
                key={x.slug}
                href={`/sim-theo-menh/${x.slug}`}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  x.slug === item.slug ? "border-white bg-white text-header-bg" : "border-white/40 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {x.hanh}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {scored.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Kho tạm chưa có số hành {item.hanh}. Quý khách{" "}
            <a href={ZALO} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-500 hover:underline">
              nhắn Zalo
            </a>{" "}
            để em tìm số hợp mệnh.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">Số SIM</th>
                  <th scope="col" className="border-b border-border px-3 py-2.5 text-center font-semibold text-foreground">Điểm PT</th>
                  <th scope="col" className="border-b border-border px-3 py-2.5 text-right font-semibold text-foreground">Giá bán</th>
                  <th scope="col" className="border-b border-border px-3 py-2.5 text-right"><span className="sr-only">Thao tác</span></th>
                </tr>
              </thead>
              <tbody>
                {scored.map((x, i) => (
                  <tr key={x.s.id} className={i % 2 === 1 ? "bg-secondary/20" : undefined}>
                    <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 font-semibold tracking-wide text-foreground">
                      <Link href={`/sim/${x.s.rawDigits}`} className="underline-offset-2 hover:text-primary hover:underline">
                        {formatSimQuyAware(x.s.rawDigits)}
                      </Link>
                    </td>
                    <td className="border-b border-border/60 px-3 py-2.5 text-center">
                      <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-600">
                        {x.pt.toFixed(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right font-semibold text-primary">
                      {formatPrice(x.s.price)}
                    </td>
                    <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right">
                      <a
                        href={ZALO}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-sim-number={x.s.displayNumber || x.s.rawDigits}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sky-500 hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" /> Zalo
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Ngũ hành của số tính theo Hà Đồ, điểm phong thủy theo Bát Cực + quẻ — mang tính tham khảo.
          Bấm vào số để xem phân tích đầy đủ, hoặc nhập năm sinh ở ô “Hợp tuổi” để soi theo mệnh bạn.
        </p>
      </div>
    </main>
  );
}
