import type { Metadata } from "next";
import SoSanhSimClient from "./SoSanhSimClient";

export const metadata: Metadata = {
  title: { absolute: "So sánh phong thủy 2 số SIM | CHONSOMOBIFONE.COM" },
  description:
    "So sánh điểm phong thủy, năng lượng Bát Cực, ngũ hành và quẻ của hai số SIM để chọn số hợp hơn — miễn phí, không cần nhập thông tin cá nhân.",
  alternates: { canonical: "/so-sanh-sim" },
  robots: { index: true, follow: true },
};

export default function SoSanhSimPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="text-2xl font-extrabold md:text-3xl">So sánh phong thủy 2 số</h1>
          <p className="mt-1 text-sm text-primary-foreground/85">
            Nhập hai số (hoặc chọn từ “Số vừa xem”) để xem số nào hợp phong thủy hơn.
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-8">
        <SoSanhSimClient />
      </div>
    </main>
  );
}
