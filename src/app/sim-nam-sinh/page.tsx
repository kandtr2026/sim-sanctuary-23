import type { Metadata } from "next";
import { Suspense } from "react";
import SimNamSinhFinder from "./SimNamSinhFinder";
import ZaloChatCard from "@/components/ZaloChatCard";
import TrustCommitments from "@/components/TrustCommitments";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Sim Năm Sinh – Tìm SIM Theo Ngày Sinh, Hợp Tuổi";
const DESCRIPTION =
  "Tìm sim năm sinh theo ngày sinh của bạn: nhập ngày/tháng/năm sinh để xem kho sim có số năm sinh, hợp tuổi. Giá công khai, sang tên chính chủ, giao toàn quốc.";
const CANONICAL = "https://www.chonsomobifone.com/sim-nam-sinh";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    images: [{ url: "https://www.chonsomobifone.com/og-sim-nam-sinh.png?v=1", width: 1200, height: 630 }],
  },
};

const faqData = [
  {
    q: "Làm sao tìm sim năm sinh của mình?",
    a: "Nhập ngày, tháng, năm sinh của bạn vào ô trên. Hệ thống tự tìm những sim có số năm sinh (4 số của năm trong dãy số) và hiển thị để bạn chọn.",
  },
  {
    q: "Sim năm sinh có đắt không?",
    a: "Sim năm sinh có giá từ vài trăm nghìn đến vài chục triệu tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số. Giá niêm yết công khai, không phát sinh phí ẩn.",
  },
  {
    q: "Chọn sim hợp tuổi như thế nào?",
    a: "Theo quan niệm dân gian, nhiều người chọn sim gắn với năm sinh của mình hoặc người thân vì dễ nhớ và mang ý nghĩa cá nhân. Đây là niềm tin tham khảo, không phải khẳng định tuyệt đối.",
  },
  {
    q: "Mua sim năm sinh có sang tên chính chủ không?",
    a: "Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function SimNamSinhPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(320px, 40vw, 420px)" }}
          className="relative flex items-center bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground"
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />
          <div className="container relative mx-auto px-4 py-8 text-center">
            <h1 className="mx-auto mb-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              SIM Năm Sinh — <span className="text-gold">nhập ngày sinh, chọn số hợp tuổi</span>
            </h1>
            <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Nhập ngày/tháng/năm sinh của bạn để tìm sim có số năm sinh. Giá niêm yết công khai, sang tên chính chủ,
              giao tận nơi toàn quốc.
            </p>
            <Suspense fallback={null}>
              <SimNamSinhFinder />
            </Suspense>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim năm sinh là gì?
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim năm sinh là dòng sim có <strong className="text-foreground">số năm sinh ở các số cuối</strong> —
                gắn với năm sinh của bạn hoặc người thân. Nhiều người chọn vì dễ nhớ và mang ý nghĩa cá nhân.
              </p>
              <p>
                Nhập ngày sinh phía trên, hệ thống sẽ tự tìm những sim có số năm sinh phù hợp trong kho để bạn chọn.
              </p>
            </div>
          </section>

          <div className="my-8 max-w-sm mx-auto">
            <ZaloChatCard />
          </div>

          <TrustCommitments />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-lg border border-border px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="py-4 text-left font-medium text-foreground hover:text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Sim năm sinh", path: "/sim-nam-sinh" },
            ]),
          ),
        }}
      />
    </>
  );
}
