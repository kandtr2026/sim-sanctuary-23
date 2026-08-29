import { permanentRedirect } from "next/navigation";

/**
 * /sim-hop-menh (không có mệnh) → hub gộp /sim-phong-thuy-hop-menh.
 *
 * Vì sao cần: 5 trang con /sim-hop-menh/<mệnh> là cụm mới, còn hub thì đã tồn
 * tại ở URL khác (/sim-phong-thuy-hop-menh, KHÔNG được sửa trong đợt này). Nếu
 * để trống thì khách và bot cắt bớt URL sẽ ăn 404 giữa cụm. 308 sang hub đúng
 * hơn là dựng thêm một trang hub thứ hai cạnh tranh cùng từ khoá.
 */
export const dynamic = "force-static";

export default function SimHopMenhIndexPage(): never {
  permanentRedirect("/sim-phong-thuy-hop-menh");
}
