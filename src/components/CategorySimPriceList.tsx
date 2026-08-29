import Link from "next/link";
import type { NormalizedSIM } from "@/lib/simUtils";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import { buildSimItemListJsonLd } from "@/components/SimSnapshot";

interface CategorySimPriceListProps {
  /** Tiêu đề khối — giữ NGẮN, hiện dạng h2 nhỏ. */
  title: string;
  /** Snapshot lấy từ getCategorySnapshot (đã lọc price > 0, sắp giá tăng dần). */
  sims: NormalizedSIM[];
  /** Canonical của trang — chảy vào Product/Offer `url`. Bỏ trống thì không phát `url`. */
  pageUrl?: string;
  /**
   * Câu mở đầu trên bảng. Mặc định nói về "khoảng giá" — trang đồng giá phải
   * truyền câu khác, vì ở đó không có khoảng giá nào để xem.
   */
  intro?: string;
  /** Câu chú thích ngắn dưới bảng (mô tả phạm vi dữ liệu của trang đó). */
  note?: string;
}

/** Trần số dòng — khối phải gọn, trang danh mục đã dài. */
const MAX_ROWS = 8;

/**
 * Bảng giá gọn cho trang danh mục: số thật + giá thật, server-render nên nằm
 * sẵn trong HTML thô, kèm ItemList/Product/Offer JSON-LD.
 *
 * Vì sao có file này: commit 471a0c9 xoá khối lớn `SimSnapshot` ("Sim X Nổi Bật
 * Trong Kho") khỏi 10 trang danh mục nhưng để lại lời gọi `getCategorySnapshot`,
 * nên các trang vừa mất giá + mất Product/Offer trong HTML, vừa tốn một truy vấn
 * mỗi lần ISR để rồi bỏ kết quả. Khối này trả lại phần dữ liệu (giá + schema) ở
 * dạng gọn hơn nhiều so với khối cũ — chủ dự án muốn trang ngắn.
 *
 * Ràng buộc quan trọng:
 *  - Schema chỉ phát khi khối THẬT SỰ hiển thị. Rỗng → return null, không có
 *    `<script>` nào. Đánh dấu sản phẩm cho khối không hiển thị bị Google coi là
 *    sai lệch dữ liệu có cấu trúc.
 *  - Giá in ra dùng `formatPrice`; giá trong schema là `sim.price` thô (do
 *    `buildSimItemListJsonLd` lo) — cùng một con số, không nơi nào tự nối chuỗi
 *    tiền nên hai bên không thể lệch.
 *  - Lọc lại `price > 0` cho chắc: `formatPrice` trả "Liên hệ" khi giá <= 0, mà
 *    "Liên hệ" thì không được phép rơi vào Offer.
 *  - Cách chấm dấu đi qua `formatSimQuyAware` (src/lib/simDisplay.ts) — nguồn duy
 *    nhất của luật hiển thị số. Không tự `split('.')` ở đây.
 *  - Link "Đặt mua" trỏ /mua-ngay/{id}: route noindex + bị disallow trong
 *    robots.txt, nên gắn rel="nofollow" và KHÔNG bao giờ đưa URL đó vào schema.
 */
export default function CategorySimPriceList({
  title,
  sims,
  pageUrl,
  intro = "Số thật đang còn trong kho, giá đã niêm yết — Quý khách xem nhanh khoảng giá trước khi lọc tiếp bên dưới.",
  note,
}: CategorySimPriceListProps) {
  const rows = (sims ?? []).filter((sim) => sim.price > 0).slice(0, MAX_ROWS);
  if (rows.length === 0) return null;

  const itemListJsonLd = buildSimItemListJsonLd(title, rows, pageUrl);

  return (
    <>
      {/* aria-label thay cho aria-labelledby: khối này dùng ở 10 trang, gắn id cố
          định sẽ có nguy cơ trùng id nếu một trang nào đó render hai khối. */}
      <section
        aria-label={title}
        className="rounded-xl border border-border bg-card p-4 shadow-card md:p-5"
      >
        <h2 className="mb-1 text-base font-bold text-primary md:text-lg">{title}</h2>
        <p className="mb-3 text-xs text-muted-foreground">{intro}</p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th
                  scope="col"
                  className="border-b border-border px-2 py-2.5 text-left font-semibold text-foreground sm:px-3"
                >
                  Số SIM
                </th>
                <th
                  scope="col"
                  className="border-b border-border px-2 py-2.5 text-right font-semibold text-foreground sm:px-3"
                >
                  Giá bán
                </th>
                <th scope="col" className="border-b border-border px-2 py-2.5 text-right sm:px-3">
                  <span className="sr-only">Đặt mua</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sim, index) => (
                <tr key={sim.id} className={index % 2 === 1 ? "bg-secondary/20" : undefined}>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 font-semibold tracking-wide text-foreground sm:px-3">
                    {formatSimQuyAware(sim.rawDigits || sim.formattedNumber)}
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 text-right font-semibold text-primary sm:px-3">
                    {formatPrice(sim.price)}
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 text-right sm:px-3">
                    <Link
                      href={`/mua-ngay/${encodeURIComponent(sim.id)}`}
                      rel="nofollow"
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      {/* Nhãn ngắn ở màn hẹp: ba cột số + giá + "Đặt mua" làm bảng
                          tràn ngang ở 375px, khách phải kéo mới thấy nút. */}
                      <span className="sm:hidden">Đặt</span>
                      <span className="hidden sm:inline">Đặt mua</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {note ? <p className="mt-2.5 text-xs text-muted-foreground">{note}</p> : null}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
