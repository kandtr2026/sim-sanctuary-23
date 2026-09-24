import { permanentRedirect } from "next/navigation";

// A Khoa 24/09: gộp tam hoa kép vào tam hoa. Theo luật danh mục mới (simthanglong)
// tam hoa kép = 6 số cuối AAA.BBB, kho lúc gộp chỉ còn 1 số — không đủ đứng
// thành trang riêng. Mọi số tam hoa kép vốn đã là tam hoa (3 số cuối giống nhau)
// nên đã nằm sẵn trong danh sách /sim-tam-hoa. Giữ URL cũ (đang được index) nhưng
// 301 về trang Tam hoa — không 404, không mất link equity đã tích luỹ.
export const dynamic = "force-static";

export default function SimTamHoaKepRedirect(): never {
  permanentRedirect("/sim-tam-hoa");
}
