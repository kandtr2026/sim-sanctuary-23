import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { BASE_URL } from "@/lib/seo";

/**
 * /sim-hop-menh (không có mệnh) → hub gộp /sim-phong-thuy-hop-menh.
 *
 * Vì sao cần: 5 trang con /sim-hop-menh/<mệnh> là cụm mới, còn hub thì đã tồn
 * tại ở URL khác (/sim-phong-thuy-hop-menh, KHÔNG được sửa trong đợt này). Nếu
 * để trống thì khách và bot cắt bớt URL sẽ ăn 404 giữa cụm. 308 sang hub đúng
 * hơn là dựng thêm một trang hub thứ hai cạnh tranh cùng từ khoá.
 *
 * 25/11/2026: canonical khai về /sim-theo-menh (trang mệnh chính) theo đợt gom
 * mệnh. Trang vẫn 308 như cũ nên trên thực tế bot đi theo redirect, không đọc
 * được thẻ canonical này — giữ để metadata khớp với 5 trang con.
 */
export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/sim-theo-menh` },
};

export default function SimHopMenhIndexPage(): never {
  permanentRedirect("/sim-phong-thuy-hop-menh");
}
