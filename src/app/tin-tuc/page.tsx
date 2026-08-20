import type { Metadata } from "next";
import Link from "next/link";
import { buildBreadcrumb } from "@/lib/seo";

const articles = [
  { title: "Ý NGHĨA SỐ ĐIỆN THOẠI - Sim số như thế nào là sim đẹp?", href: "/tin-tuc/y-nghia-sim-so-dep" },
  { title: "SỐ TỔNG ĐÀI CÁC NHÀ MẠNG MỚI NHẤT - Mobifone / Gmobile / Vina / Viettel", href: "/tin-tuc/so-tong-dai-cac-nha-mang" },
  { title: "Ý NGHĨA CÁC CON SỐ TỪ 1 - 9 CÓ THỂ BẠN CHƯA BIẾT", href: "/tin-tuc/y-nghia-cac-con-so-1-9" },
  { title: "CÁCH XEM SIM PHONG THUỶ HỢP TUỔI", href: "/tin-tuc/cach-xem-sim-phong-thuy-hop-tuoi" },
  { title: "CÁCH TRÁNH MẤT TIỀN OAN KHI MUA SIM SỐ ĐẸP", href: "/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep" },
  { title: "CÁC ĐẦU SỐ MẠNG MOBIFONE MỚI NHẤT - Danh sách đầy đủ & ý nghĩa", href: "/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat" },
];

export const metadata: Metadata = {
  title: {
    absolute: "Tin Tức SIM Số Đẹp – Kiến Thức Phong Thủy & Mua Bán SIM",
  },
  description:
    "Tin tức và kiến thức về SIM số đẹp: ý nghĩa các con số, xem SIM phong thủy hợp tuổi, cách tránh mất tiền oan khi mua SIM.",
  alternates: {
    canonical: "https://www.chonsomobifone.com/tin-tuc",
  },
  openGraph: {
    type: "website",
    title: "Tin Tức SIM Số Đẹp – CHONSOMOBIFONE.COM",
    description: "Kiến thức SIM số đẹp và phong thủy.",
    url: "https://www.chonsomobifone.com/tin-tuc",
  },
};

export default function TinTucPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Tin Tức
        </h1>

        <div className="space-y-4">
          {articles.map((article, index) => (
            article.href ? (
              <Link
                key={index}
                href={article.href}
                className="block p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <h2 className="text-base md:text-lg font-medium text-foreground">
                  {index + 1}. {article.title}
                </h2>
              </Link>
            ) : (
              <div
                key={index}
                className="p-4 bg-card rounded-lg border border-border"
              >
                <h2 className="text-base md:text-lg font-medium text-foreground">
                  {index + 1}. {article.title}
                </h2>
              </div>
            )
          ))}
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Tin tức", path: "/tin-tuc" },
            ]),
          ),
        }}
      />
    </>
  );
}
