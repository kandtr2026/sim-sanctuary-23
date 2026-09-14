import { permanentRedirect } from "next/navigation";

// A Khoa 14/09: bỏ loại sim "Ông địa". Giữ URL cũ (đang được index) nhưng 301 về
// trang Thần tài — không 404, không mất link equity đã tích luỹ.
export const dynamic = "force-static";

export default function SimOngDiaRedirect(): never {
  permanentRedirect("/sim-than-tai");
}
