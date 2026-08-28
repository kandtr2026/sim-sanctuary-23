import Link from "next/link";
import { getCategorySnapshot, type SnapshotFilter } from "@/lib/serverSimData";
import { planSimDisplay } from "@/lib/simDisplay";

interface ArticleSimTableProps {
  /** Tiêu đề khối, hiện dạng h3 trong bài. */
  title: string;
  filter: SnapshotFilter;
  limit?: number;
  /** Trang danh mục để xem thêm — bắt buộc, đây là link nội bộ chính của khối. */
  moreHref: string;
  moreLabel: string;
  /** Câu chú thích dưới bảng (nguồn dữ liệu, thời điểm). */
  note?: string;
}

const priceFormatter = new Intl.NumberFormat("vi-VN");

/**
 * Bảng SIM THẬT chèn giữa bài viết — số thật, giá thật, lấy từ kho ngay lúc
 * render (Server Component) nên có mặt trong HTML thô, không cần JavaScript.
 *
 * Vì sao làm khối này: khảo sát các site sim đang top cho thấy họ chỉ chèn số
 * MẪU đã che chữ (dạng `09x.86.68.86`) hoặc link suông về trang lọc — không nơi
 * nào đưa số thật kèm giá vào giữa bài. Đây là điểm khác biệt rẻ nhất mà cũng
 * hữu ích nhất cho người đọc: đọc xong lý thuyết là thấy ngay số đang còn hàng.
 *
 * Ghi chú kỹ thuật:
 *  - Link "Đặt mua" trỏ /mua-ngay/{id} — route này bị chặn trong robots.txt,
 *    nên gắn rel="nofollow" để không đẩy bot vào URL đã disallow.
 *  - CỐ Ý không phát Product/Offer JSON-LD ở trang bài: đánh dấu sản phẩm nên
 *    nằm ở trang bán, không nằm trong bài kiến thức. Trang danh mục đã có schema
 *    riêng của nó.
 *  - Kho rỗng hoặc lỗi đọc kho → getCategorySnapshot trả [] → khối tự ẩn, bài
 *    vẫn đọc bình thường.
 */
export default async function ArticleSimTable({
  title,
  filter,
  limit = 8,
  moreHref,
  moreLabel,
  note,
}: ArticleSimTableProps) {
  // `getCategorySnapshot` sắp giá tăng dần, nên lấy đúng `limit` số đầu sẽ ra một
  // bảng mà cả 8 dòng cùng một mức giá thấp nhất — đọc xong không biết dòng số này
  // trải giá tới đâu. Lấy rộng hơn rồi rút mẫu cách đều để bảng có cả số rẻ nhất
  // lẫn số tầm trên, vẫn giữ thứ tự tăng dần.
  const pool = await getCategorySnapshot(filter, limit * 8);
  if (pool.length === 0) return null;

  const sims =
    pool.length <= limit
      ? pool
      : Array.from({ length: limit }, (_, i) =>
          pool[Math.min(pool.length - 1, Math.round((i * (pool.length - 1)) / (limit - 1)))],
        ).filter((sim, index, list) => list.findIndex((s) => s.id === sim.id) === index);

  return (
    <section className="my-7 rounded-xl border border-gold/30 bg-card p-4 md:p-5">
      <h3 className="!mt-0 mb-1 text-base font-semibold text-gold md:text-lg">{title}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Số thật đang còn trong kho, giá đã niêm yết — bảng lấy rải từ mức thấp nhất lên dần để Quý
        khách thấy khoảng giá của dòng số này.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-card-elevated">
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-gold">
                Số SIM
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-gold">
                Giá bán
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-right font-semibold text-gold">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {sims.map((sim, index) => (
              <tr key={sim.id} className={index % 2 === 1 ? "bg-card/60" : undefined}>
                <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 font-semibold tracking-wide text-foreground">
                  {/* Cách chấm dấu đi qua planSimDisplay — nguồn duy nhất của
                      luật hiển thị số (xem src/lib/simDisplay.ts). Không tự
                      split('.') ở đây. */}
                  {planSimDisplay(sim.rawDigits, "", sim.displayNumber).display}
                </td>
                <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-body">
                  {priceFormatter.format(sim.price)} đ
                </td>
                <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right">
                  <Link
                    href={`/mua-ngay/${sim.id}`}
                    rel="nofollow"
                    className="text-xs font-semibold text-gold hover:underline"
                  >
                    Đặt mua
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm">
        <Link href={moreHref} className="font-medium text-gold hover:underline">
          {moreLabel} →
        </Link>
      </p>
      {note ? <p className="mt-1.5 text-xs text-muted-foreground">{note}</p> : null}
    </section>
  );
}
