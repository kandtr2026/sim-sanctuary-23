import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";

/**
 * Các khối dựng bài /tin-tuc mà CSS `.article-prose` không lo được:
 * bảng dữ liệu, ảnh có chú thích, hộp lưu ý, hộp "ý chính". Thân bài viết
 * bằng HTML/JSX thường (p, h2, ul, strong, a) và để `.article-prose` trong
 * globals.css lo phần chữ.
 */

interface DataTableProps {
  caption?: string;
  head: string[];
  rows: ReactNode[][];
  /** Cột đầu in đậm (thường là cột "số"/"đầu số"). */
  boldFirstColumn?: boolean;
}

/**
 * Bảng dữ liệu — thứ mà mọi trang sim top Google đều có (bảng ngũ hành, bảng
 * đầu số, bảng đuôi số) và cũng là dạng nội dung Google hay lấy làm featured
 * snippet. Bọc trong div cuộn ngang để không tràn khung trên điện thoại.
 */
export function DataTable({ caption, head, rows, boldFirstColumn = true }: DataTableProps) {
  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card-elevated">
              {head.map((cell) => (
                <th
                  key={cell}
                  scope="col"
                  className="border-b border-border px-3 py-2.5 text-left font-semibold text-gold"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 1 ? "bg-card/60" : undefined}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`border-b border-border/60 px-3 py-2.5 align-top text-body ${
                      cellIndex === 0 && boldFirstColumn
                        ? "whitespace-nowrap font-semibold text-foreground"
                        : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

interface ArticleFigureProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

/**
 * Ảnh trong thân bài. Ảnh đã nén WebP sẵn trong /public nên dùng <img> thường
 * (không qua bộ tối ưu ảnh của Vercel, không tốn quota) — nhưng BẮT BUỘC có
 * width/height để trình duyệt giữ chỗ, tránh nhảy layout khi ảnh tải xong.
 */
export function ArticleFigure({ src, alt, width, height, caption }: ArticleFigureProps) {
  return (
    <figure className="my-7">
      {/* Cố ý dùng <img> chứ không phải next/image — xem ghi chú ở JSDoc trên. */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl border border-border object-cover"
      />
      {caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground md:text-sm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

type NoteTone = "info" | "tip" | "warn";

const NOTE_STYLES: Record<NoteTone, { icon: typeof Info; ring: string; label: string }> = {
  info: { icon: Info, ring: "border-primary/45 bg-primary/10", label: "Ghi chú" },
  tip: { icon: Lightbulb, ring: "border-gold/45 bg-gold/10", label: "Mẹo" },
  warn: { icon: TriangleAlert, ring: "border-destructive/50 bg-destructive/10", label: "Lưu ý" },
};

/** Hộp lưu ý / mẹo / cảnh báo giữa bài. */
export function Note({
  tone = "info",
  title,
  children,
}: {
  tone?: NoteTone;
  title?: string;
  children: ReactNode;
}) {
  const style = NOTE_STYLES[tone];
  const Icon = style.icon;
  return (
    <aside className={`my-6 rounded-xl border px-4 py-3.5 ${style.ring}`}>
      <p className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon aria-hidden className="h-4 w-4 shrink-0" />
        {title ?? style.label}
      </p>
      <div className="text-sm leading-relaxed text-body [&_a]:font-medium [&_a]:text-gold [&_a:hover]:underline">
        {children}
      </div>
    </aside>
  );
}

/**
 * Hộp "ý chính" đặt ngay dưới đoạn mở đầu. Vừa giúp người đọc lướt nhanh, vừa
 * là dạng khối Google thường trích làm featured snippet cho truy vấn dạng
 * "… là gì", "cách …".
 */
export function KeyPoints({ items }: { items: ReactNode[] }) {
  return (
    <aside className="my-6 rounded-xl border border-gold/30 bg-card p-4 md:p-5">
      <p className="mb-2.5 text-sm font-semibold uppercase tracking-wide text-gold">
        Tóm gọn
      </p>
      <ul className="space-y-2 text-sm leading-relaxed text-body md:text-base">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <span className="[&_a]:font-medium [&_a]:text-gold [&_a:hover]:underline">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
