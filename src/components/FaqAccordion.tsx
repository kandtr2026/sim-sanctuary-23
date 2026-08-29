import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  /** Tiêu đề khối. Đặt null nếu trang tự render h2 riêng. */
  title?: string | null;
  className?: string;
}

/**
 * Khối "Câu hỏi thường gặp" render bằng `<details>` — KHÔNG dùng Radix Accordion.
 *
 * Vì sao: Radix `AccordionContent` chỉ đưa câu trả lời vào DOM khi mục được mở.
 * 24 trang của site vừa phát `FAQPage` JSON-LD chứa đầy đủ câu trả lời trong khi
 * HTML thô chỉ có câu hỏi — đo trên production: 8/8 trang kiểm ngẫu nhiên đều
 * thiếu 100% câu trả lời trong DOM. Chính sách FAQPage của Google đòi mỗi cặp
 * hỏi–đáp trong markup phải hiển thị được trên trang; markup có câu trả lời không
 * tồn tại trong DOM là căn cứ để nhận manual action về dữ liệu có cấu trúc.
 * `src/data/faqData.ts` đã ghi cảnh báo này từ trước, nhưng chỉ cho FAQ trang chủ.
 *
 * `<details>` giữ nguyên trải nghiệm gập/mở (native, không cần JS) mà câu trả lời
 * luôn nằm trong HTML — cùng cách `ArticleShell` đã làm cho 17 bài /tin-tuc.
 *
 * Component này là Server Component: không "use client", nên không thêm JS vào
 * bundle của 24 trang.
 */
export default function FaqAccordion({
  items,
  title = "Câu hỏi thường gặp",
  className,
}: FaqAccordionProps) {
  if (items.length === 0) return null;

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-6 shadow-card md:p-8", className)}
    >
      {title ? (
        <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {title}
        </h2>
      ) : null}

      <div className="space-y-2.5">
        {items.map((item) => (
          <details
            key={item.q}
            className="group rounded-lg border border-border px-4 py-3 open:bg-secondary/30"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none group-open:text-primary">
              {item.q}
            </summary>
            {/* `whitespace-pre-line`: một số câu trả lời (vd mốc giao hàng theo
                vùng trong faqData.ts) ngắt dòng bằng \n — mất nó thì cả khối dồn
                thành một đoạn liền. Câu không có \n thì thuộc tính này vô hại. */}
            <p className="mt-2.5 whitespace-pre-line leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
