import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SIMCardNew from "@/components/SIMCardNew";
import { getServerSims } from "@/lib/serverSimData";
import { MUC_TIEU, mucTieuTheoSlug, diemMucTieu, diemTongHop } from "@/lib/phongThuy";

// Trang "lọc theo MỤC TIÊU" (A Khoa 14/09): số hợp Tài lộc / Công danh / Tình
// duyên / Quý nhân — chấm bằng Bát Cực, xếp theo độ hợp mục tiêu rồi điểm tổng.
// Server-render (SEO) + link nội bộ sang /sim/[digits].

export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ muc: string }> };

export function generateStaticParams() {
  return MUC_TIEU.map((m) => ({ muc: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { muc } = await params;
  const m = mucTieuTheoSlug(muc);
  if (!m) {
    return { title: { absolute: "Không tìm thấy | CHONSOMOBIFONE.COM" }, robots: { index: false, follow: true } };
  }
  const title = `Sim hợp ${m.label} theo phong thủy`;
  return {
    title: { absolute: `${title} | CHONSOMOBIFONE.COM` },
    description: `Danh sách SIM MobiFone hợp mục tiêu ${m.label} — chấm theo Bát Cực Linh Số, xếp theo điểm phong thủy. Giá niêm yết công khai, nhắn Zalo chốt số.`,
    alternates: { canonical: `/sim-hop/${m.slug}` },
    robots: { index: true, follow: true },
  };
}

const ZALO = "https://zalo.me/0933686666";

export default async function SimHopMucTieuPage({ params }: Props) {
  const { muc } = await params;
  const m = mucTieuTheoSlug(muc);
  if (!m) notFound();

  const sims = (await getServerSims()).filter((s) => s.price > 0);
  const scored = sims
    .map((s) => ({ s, g: diemMucTieu(s.rawDigits, m.id), pt: diemTongHop(s.rawDigits).diem }))
    .filter((x) => x.g >= 1)
    .sort((a, b) => b.g - a.g || b.pt - a.pt || a.s.price - b.s.price)
    .slice(0, 60);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold md:text-3xl">
            <span aria-hidden>{m.icon}</span> Sim hợp {m.label}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-primary-foreground/85">
            Các số trong kho hợp mục tiêu <strong>{m.label}</strong> theo Bát Cực Linh Số, xếp từ
            hợp nhất xuống. Giá niêm yết công khai — bấm số để xem “câu chuyện” phong thủy, hoặc
            nhắn Zalo chốt ngay.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {MUC_TIEU.map((x) => (
              <Link
                key={x.id}
                href={`/sim-hop/${x.slug}`}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  x.id === m.id
                    ? "border-gold bg-gold text-header-bg"
                    : "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                }`}
              >
                {x.icon} {x.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {scored.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Kho tạm chưa có số hợp {m.label}. Quý khách{" "}
            <a href={ZALO} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-500 hover:underline">
              nhắn Zalo
            </a>{" "}
            để em tìm số phù hợp.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {scored.map((x) => (
              <SIMCardNew key={x.s.id} sim={x.s} />
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Điểm phong thủy theo Bát Cực Linh Số + quẻ Kinh Dịch, mang tính tham khảo. Bấm vào số để
          xem phân tích đầy đủ.
        </p>
      </div>
    </main>
  );
}
