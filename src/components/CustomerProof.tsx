import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/data/testimonials";

/**
 * Khối "bằng chứng thật" — phản hồi của khách từng mua. Server Component.
 * TESTIMONIALS rỗng (chưa có feedback thật) → trả về null, trang không hiện
 * khối trống. Ảnh (nếu có) load lazy, không chặn render nội dung.
 */
export default function CustomerProof() {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
      <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
        <span className="h-8 w-1 rounded-full bg-primary" />
        Khách hàng nói gì
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <figure
            key={i}
            className="flex flex-col gap-3 rounded-lg bg-secondary/40 p-4"
          >
            <Quote className="h-5 w-5 shrink-0 text-gold" />
            <blockquote className="text-sm leading-relaxed text-muted-foreground">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3 border-t border-border pt-3">
              {t.image ? (
                <img
                  src={t.image}
                  alt={`Ảnh khách hàng ${t.author}`}
                  loading="lazy"
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.author}</p>
                {t.role ? (
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                ) : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
