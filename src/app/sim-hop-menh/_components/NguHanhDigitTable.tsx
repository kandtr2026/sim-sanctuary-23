import type { NguHanh } from "@/lib/simHopTuoi";
import {
  buildHanhTable,
  formatDigits,
  hanhKhacNo,
  hanhSinhRaNo,
} from "../_lib/menhContent";
import { TUONG_KHAC, TUONG_SINH } from "@/lib/simHopTuoi";

/**
 * Bảng chữ số nên ưu tiên / nên tránh theo bản mệnh.
 *
 * Dữ liệu đến từ `buildHanhTable` (suy ra từ `nguHanhCuaSo` + `quanHeNguHanh`
 * của engine), nên bảng này luôn nói đúng thứ engine dùng để chấm điểm. Cột
 * "engine cộng/trừ" nói thẳng chiều tác động thay vì để khách tự đoán vì sao
 * một số điểm cao hơn số khác.
 */
export default function NguHanhDigitTable({ menh }: { menh: NguHanh }) {
  const table = buildHanhTable(menh);
  const sinhBoi = hanhSinhRaNo(menh);
  const biKhacBoi = hanhKhacNo(menh);

  const rows: { digits: number[]; quanHe: string; danhGia: string; tone: string }[] = [
    {
      digits: table.sinh,
      quanHe: `${sinhBoi} sinh ${menh}`,
      danhGia: "Nên ưu tiên — engine cộng điểm cao nhất",
      tone: "text-primary",
    },
    {
      digits: table.dong,
      quanHe: `Đồng hành ${menh}`,
      danhGia: "Dùng tốt — cộng điểm",
      tone: "text-primary",
    },
    {
      digits: table.trung,
      quanHe: "Không quan hệ trực tiếp",
      danhGia: "Trung tính — trừ nhẹ",
      tone: "text-muted-foreground",
    },
    {
      digits: table.menhKhac,
      quanHe: `${menh} khắc ${TUONG_KHAC[menh]}`,
      danhGia: "Hạn chế — trừ nhẹ",
      tone: "text-muted-foreground",
    },
    {
      digits: table.khacMenh,
      quanHe: `${biKhacBoi} khắc ${menh}`,
      danhGia: "Nên tránh — engine trừ nặng nhất",
      tone: "text-destructive",
    },
  ];

  return (
    <section
      aria-label={`Chữ số nên ưu tiên và nên tránh với mệnh ${menh}`}
      className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8"
    >
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
        <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
        Chữ số nên ưu tiên và nên tránh với mệnh {menh}
      </h2>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Quan hệ ngũ hành giữa từng chữ số và mệnh {menh}, theo quy ước Hà Đồ
          </caption>
          <thead>
            <tr className="bg-secondary/50">
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                Chữ số
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                Quan hệ ngũ hành
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                Với mệnh {menh}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.quanHe} className="hover:bg-secondary/30">
                <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 font-bold tracking-wide text-foreground">
                  {formatDigits(row.digits)}
                </td>
                <td className="border-b border-border/60 px-3 py-2.5 text-muted-foreground">{row.quanHe}</td>
                <td className={`border-b border-border/60 px-3 py-2.5 font-medium ${row.tone}`}>
                  {row.danhGia}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Quy ước ngũ hành của chữ số theo Hà Đồ: 0, 1 thuộc Thủy · 2, 5, 8 thuộc Thổ · 3, 4 thuộc Mộc ·
        6, 7 thuộc Kim · 9 thuộc Hỏa. Mệnh {menh} sinh {TUONG_SINH[menh]} và khắc {TUONG_KHAC[menh]}.
        Đây là quan niệm dân gian, dùng để so sánh giữa các số — không phải cơ sở khoa học, cũng không
        phải lời hứa đổi vận.
      </p>
    </section>
  );
}
