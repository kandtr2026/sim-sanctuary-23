/**
 * NỘI DUNG NGŨ HÀNH — bảng số nên ưu tiên / nên tránh theo mệnh, dùng chung cho
 * /sim-hop-menh/[hanh] và /sim-hop-tuoi/[nam].
 *
 * Phân loại chữ số KHÔNG gõ tay: suy ra từ `nguHanhCuaSo` + `quanHeNguHanh` +
 * `TUONG_SINH`/`TUONG_KHAC` của `src/lib/simHopTuoi.ts`, tức đúng thứ mà engine
 * dùng để chấm điểm. Sửa quy ước Hà Đồ bên engine thì bảng ở đây tự đổi theo.
 *
 * Giọng chữ: phong thủy trình bày như quan niệm dân gian ("được tin là", "theo
 * quan niệm"), không khẳng định như khoa học, không hứa đổi vận.
 */

import {
  nguHanhCuaSo,
  quanHeNguHanh,
  TUONG_KHAC,
  TUONG_SINH,
  type NguHanh,
} from "@/lib/simHopTuoi";

export type DigitRole = "sinh" | "dong" | "menhKhac" | "trung" | "khacMenh";

export interface HanhTable {
  /** Số tương sinh với bản mệnh — engine cộng điểm cao nhất. */
  sinh: number[];
  /** Số đồng hành. */
  dong: number[];
  /** Bản mệnh khắc số (bị trừ nhẹ). */
  menhKhac: number[];
  /** Không quan hệ trực tiếp (bị trừ nhẹ). */
  trung: number[];
  /** Số khắc bản mệnh — engine trừ nặng nhất. */
  khacMenh: number[];
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Hành sinh ra `hanh` (vd Thổ sinh Kim). */
export const hanhSinhRaNo = (hanh: NguHanh): NguHanh => {
  const found = (Object.keys(TUONG_SINH) as NguHanh[]).find((k) => TUONG_SINH[k] === hanh);
  return found ?? hanh;
};

/** Hành khắc `hanh` (vd Hỏa khắc Kim). */
export const hanhKhacNo = (hanh: NguHanh): NguHanh => {
  const found = (Object.keys(TUONG_KHAC) as NguHanh[]).find((k) => TUONG_KHAC[k] === hanh);
  return found ?? hanh;
};

/** Xếp 10 chữ số vào 5 nhóm quan hệ với bản mệnh. */
export const buildHanhTable = (menh: NguHanh): HanhTable => {
  const table: HanhTable = { sinh: [], dong: [], menhKhac: [], trung: [], khacMenh: [] };
  for (const d of DIGITS) {
    const hanhSo = nguHanhCuaSo(d);
    if (!hanhSo) continue;
    const rel = quanHeNguHanh(hanhSo, menh);
    if (rel === "sinh") table.sinh.push(d);
    else if (rel === "dung") table.dong.push(d);
    else if (rel === "khac") table.khacMenh.push(d);
    else if (TUONG_KHAC[menh] === hanhSo) table.menhKhac.push(d);
    else table.trung.push(d);
  }
  return table;
};

export const formatDigits = (digits: number[]): string =>
  digits.length > 0 ? digits.join(", ") : "—";

export interface HanhCopy {
  /** Tên hiển thị dạng "mệnh Kim". */
  label: string;
  /** Một câu mô tả tính chất hành theo quan niệm dân gian. */
  tinhChat: string;
  /** Gợi ý cách chọn số, viết cho khách chứ không cho người học phong thủy. */
  loiKhuyen: string;
  /** Nhóm khách hay chọn hành này (dùng cho đoạn mở bài trang hợp mệnh). */
  huongDung: string;
}

export const HANH_COPY: Record<NguHanh, HanhCopy> = {
  Kim: {
    label: "mệnh Kim",
    tinhChat:
      "Kim là hành của kim loại — sắc, bền, rành mạch. Người mệnh Kim theo quan niệm dân gian được xem là quyết đoán, giữ chữ tín, nói là làm.",
    loiKhuyen:
      "Ưu tiên dãy nhiều số 2, 5, 8 (Thổ sinh Kim) và 6, 7 (đồng hành Kim). Hạn chế số 9 vì Hỏa được cho là khắc Kim, nhất là khi 9 nằm ở hai số cuối.",
    huongDung:
      "Quý khách làm nghề cần sự tin cậy — tài chính, xây dựng, cơ khí, kinh doanh vật liệu — thường tìm nhóm số này.",
  },
  Mộc: {
    label: "mệnh Mộc",
    tinhChat:
      "Mộc là hành của cây cối — vươn lên, mở rộng, nuôi dưỡng. Người mệnh Mộc được tin là ôn hòa, biết nhìn dài hạn.",
    loiKhuyen:
      "Ưu tiên số 0, 1 (Thủy sinh Mộc) và 3, 4 (đồng hành Mộc). Hạn chế 6, 7 vì Kim được cho là khắc Mộc; số 2, 5, 8 chỉ nên xuất hiện thưa.",
    huongDung:
      "Quý khách làm giáo dục, nông nghiệp, nội thất gỗ, chăm sóc sức khỏe hay sáng tạo nội dung hay chọn nhóm số này.",
  },
  Thủy: {
    label: "mệnh Thủy",
    tinhChat:
      "Thủy là hành của nước — linh hoạt, len được vào mọi khe, thuận theo hoàn cảnh. Người mệnh Thủy được xem là nhạy, giỏi giao tiếp.",
    loiKhuyen:
      "Ưu tiên số 6, 7 (Kim sinh Thủy) và 0, 1 (đồng hành Thủy). Hạn chế 2, 5, 8 vì Thổ được cho là khắc Thủy; số 9 nên ít.",
    huongDung:
      "Quý khách làm thương mại, du lịch, vận tải, truyền thông — nghề cần đi lại và nói nhiều — thường tìm nhóm số này.",
  },
  Hỏa: {
    label: "mệnh Hỏa",
    tinhChat:
      "Hỏa là hành của lửa — sáng, nhanh, lan tỏa. Người mệnh Hỏa được tin là nhiệt tình, dám làm, dễ tạo ảnh hưởng.",
    loiKhuyen:
      "Ưu tiên số 3, 4 (Mộc sinh Hỏa) và số 9 (đồng hành Hỏa). Hạn chế 0, 1 vì Thủy được cho là khắc Hỏa; 6, 7 nên thưa.",
    huongDung:
      "Quý khách làm bán hàng, ẩm thực, giải trí, quảng cáo — nghề cần xuất hiện và thuyết phục — hay chọn nhóm số này.",
  },
  Thổ: {
    label: "mệnh Thổ",
    tinhChat:
      "Thổ là hành của đất — dày, ổn định, giữ được. Người mệnh Thổ theo quan niệm dân gian được xem là điềm đạm, bền bỉ, đáng tin.",
    loiKhuyen:
      "Ưu tiên số 9 (Hỏa sinh Thổ) và 2, 5, 8 (đồng hành Thổ). Hạn chế 3, 4 vì Mộc được cho là khắc Thổ; 0, 1 nên ít xuất hiện ở đuôi.",
    huongDung:
      "Quý khách làm bất động sản, xây dựng, nông sản, quản lý — nghề cần sự ổn định lâu dài — thường tìm nhóm số này.",
  },
};

/**
 * Chú giải ngắn cho 30 nạp âm của 60 hoa giáp. Đây là phần chữ RIÊNG rõ nhất
 * giữa 61 trang năm: hai năm cùng mệnh (vd 1963 và 2000 đều mệnh Kim) vẫn khác
 * nạp âm nên khác câu này. Giữ ở mức mô tả nghĩa chữ, không phán mệnh tốt/xấu.
 */
export const NAP_AM_GLOSS: Record<string, string> = {
  "Hải Trung Kim": "vàng trong biển — quý mà còn ẩn, cần thời gian mới hiện giá trị",
  "Lô Trung Hỏa": "lửa trong lò — cháy có kiểm soát, ấm và bền",
  "Đại Lâm Mộc": "cây rừng lớn — sức vươn rộng, chỗ dựa cho nhiều người",
  "Lộ Bàng Thổ": "đất ven đường — chịu bước chân người, quen với va chạm",
  "Kiếm Phong Kim": "vàng đầu mũi kiếm — sắc và dứt khoát",
  "Sơn Đầu Hỏa": "lửa đầu núi — sáng xa, dễ được nhìn thấy",
  "Giản Hạ Thủy": "nước dưới khe — trong, chảy đều, không ồn",
  "Thành Đầu Thổ": "đất đầu thành — nền của tường lũy, thiên về giữ",
  "Bạch Lạp Kim": "vàng trong nến trắng — mềm hơn, sáng dịu",
  "Dương Liễu Mộc": "cây dương liễu — mềm mà dai, biết uốn theo gió",
  "Tỉnh Tuyền Thủy": "nước giếng khơi — kín, dùng lâu vẫn còn",
  "Ốc Thượng Thổ": "đất trên mái — mỏng nhưng che được nắng mưa",
  "Tích Lịch Hỏa": "lửa sấm sét — mạnh và nhanh",
  "Tùng Bách Mộc": "cây tùng bách — đứng được qua mùa lạnh",
  "Trường Lưu Thủy": "dòng nước chảy dài — đi xa, không dừng",
  "Sa Trung Kim": "vàng trong cát — phải sàng mới thấy",
  "Sơn Hạ Hỏa": "lửa dưới chân núi — ấm, giữ được lâu",
  "Bình Địa Mộc": "cây đồng bằng — đất rộng, rễ tỏa đều",
  "Bích Thượng Thổ": "đất trên vách — bám chắc vào chỗ dựng",
  "Kim Bạch Kim": "vàng trắng — sáng, ít phai màu",
  "Phú Đăng Hỏa": "lửa đèn dầu — nhỏ mà thắp suốt đêm",
  "Thiên Hà Thủy": "nước sông trời, tức nước mưa — đến từ trên cao",
  "Đại Trạch Thổ": "đất đầm lớn — rộng và ẩm, nuôi được nhiều",
  "Thoa Xuyến Kim": "vàng làm trang sức — tinh xảo, để dành",
  "Tang Đố Mộc": "cây dâu tằm — nuôi được nghề, sinh lợi đều",
  "Đại Khê Thủy": "nước suối lớn — mạnh và trong",
  "Sa Trung Thổ": "đất pha cát — thoáng, dễ thấm",
  "Thiên Thượng Hỏa": "lửa trên trời, tức nắng — soi khắp, không giấu",
  "Thạch Lựu Mộc": "cây lựu đá — thân nhỏ mà chắc, ra quả đỏ",
  "Đại Hải Thủy": "nước biển lớn — sâu rộng, khó lường hết",
};
