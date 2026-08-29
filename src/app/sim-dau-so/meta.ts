/**
 * Chữ nghĩa cho cụm /sim-dau-so: title, meta description, đoạn "đầu số này là
 * mạng gì". Hàm thuần — không import gì, không đọc dữ liệu, nên chạy được cả ở
 * generateMetadata và trong thân trang mà không kéo thêm phụ thuộc.
 *
 * Vì sao tách file: 34 trang đầu số + 90 trang combo dùng chung một khuôn chữ.
 * Bản cũ chỉ thay 1–2 biến trong một câu duy nhất nên 8 trang đầu số (và 24
 * trang combo) có meta description gần trùng nhau — Google gộp lại và tự viết
 * đoạn khác. Ở đây mỗi trang nhận:
 *   1. MỘT trong 4 khuôn câu, chọn theo VỊ TRÍ đầu số (deterministic — tuyệt đối
 *      không random, nếu không SSR và client sẽ ra hai chuỗi khác nhau).
 *   2. DỮ KIỆN RIÊNG của chính trang đó: tồn kho thật + dải giá thật.
 * Hai trang cạnh nhau vì thế khác cả khuôn câu lẫn số liệu.
 */

/** Số biến thể câu — dùng cho cả description và mở bài. */
export const VARIANT_COUNT = 4;

/**
 * Chỉ số biến thể, deterministic từ (vị trí đầu số, chữ số thứ 4, vị trí loại).
 *
 * `prefixIndex` là vị trí dải 3 số trong DAU_SO_PREFIXES; `tailDigit` là chữ số
 * thứ 4 (-1 với đầu số 3 chữ số). Nhờ `tailDigit`, 0901/0902/0903 nhận ba khuôn
 * câu khác nhau thay vì cùng một khuôn của dải 090.
 */
export const variantIndex = (
  prefixIndex: number,
  tailDigit: number,
  loaiIndex = 0,
): number => {
  const base = Math.max(0, prefixIndex) + Math.max(0, tailDigit + 1) + Math.max(0, loaiIndex);
  return base % VARIANT_COUNT;
};

// ── Số liệu → chữ ───────────────────────────────────────────────────────────

/**
 * Ngăn nghìn bằng dấu chấm, tự viết thay vì `toLocaleString('vi-VN')`: chuỗi này
 * đi vào HTML prerender, phải giống nhau ở mọi máy build (Node thiếu full-icu sẽ
 * trả "7,664").
 */
export const groupThousands = (n: number): string => {
  const digits = String(Math.max(0, Math.floor(n)));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ".";
    out += digits[i];
  }
  return out;
};

/**
 * Giá gọn: 990000 → "990 nghìn", 1300000 → "1,3 triệu", 1000000000 → "1 tỷ".
 *
 * `round`: "down" làm tròn xuống, "up" làm tròn lên (1 chữ số thập phân). Giá
 * THẤP NHẤT luôn làm tròn LÊN và giá cao nhất làm tròn XUỐNG, để câu "giá từ X
 * đến Y" không bao giờ hứa rẻ hơn hoặc sang hơn kho thật.
 */
export const moneyShort = (value: number, round: "up" | "down" = "down"): string => {
  if (!Number.isFinite(value) || value <= 0) return "0đ";
  const units: { limit: number; label: string }[] = [
    { limit: 1_000_000_000, label: "tỷ" },
    { limit: 1_000_000, label: "triệu" },
    { limit: 1_000, label: "nghìn" },
  ];
  for (const { limit, label } of units) {
    if (value < limit) continue;
    const scaled = value / limit;
    const rounded =
      round === "up" ? Math.ceil(scaled * 10) / 10 : Math.floor(scaled * 10) / 10;
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(1).replace(".", ","); // dấu phẩy thập phân kiểu Việt
    return `${text} ${label}`;
  }
  return `${groupThousands(value)}đ`;
};

/** "990 nghìn – 788 triệu"; nhóm chỉ có một mức giá → "990 nghìn". */
export const priceRangeText = (minPrice: number, maxPrice: number): string => {
  const low = moneyShort(minPrice, "up");
  const high = moneyShort(maxPrice, "down");
  return low === high ? low : `${low} – ${high}`;
};

// ── Title ───────────────────────────────────────────────────────────────────
// Giữ nguyên khuôn title của 8 trang đầu số + 24 trang combo đang được index
// (đổi title của URL đang xếp hạng là rủi ro không cần thiết). Đầu số 4 chữ số
// chỉ dài thêm 1 ký tự nên vẫn dưới 60.

export const buildDauSoTitle = (prefix: string): string =>
  // Đo cho cả 34 đầu số: bản cũ "Sim X Mobifone | Kho Sim Đầu Số X Đẹp, Giá Tốt"
  // là 63 ký tự với prefix 4 chữ số → bị cắt trên SERP, và lặp "Sim" hai lần.
  `Sim ${prefix} Mobifone | Kho Sim Đầu Số ${prefix} Giá Tốt`;

export const buildComboTitle = (prefix: string, loaiLabel: string): string =>
  // "Sim tứ quý đầu số 090 Mobifone | Giá tốt, chính chủ" = 65 ký tự. Bỏ phần
  // "Mobifone" (đã có trong H1 + toàn site là Mobifone) để lọt khung 60.
  `Sim ${loaiLabel} đầu số ${prefix} | Giá rõ, chính chủ`;

// ── Meta description ────────────────────────────────────────────────────────
// Cấu tạo: MỘT câu đầu chứa dữ kiện riêng của trang (tồn kho + dải giá) + các
// câu cam kết ghép thêm cho đủ dài. Số liệu làm cho mỗi trang khác nhau về nội
// dung; khuôn câu + thứ tự câu cam kết làm cho chúng khác nhau cả về hình thức.

/** Khoảng độ dài description Google thường in đủ (ký tự). */
const DESC_MIN = 140;
const DESC_MAX = 165;

/**
 * Các câu cam kết ghép sau câu dữ kiện. Độ dài lệch nhau (15 → 37 ký tự) là có
 * chủ ý: `fitDescription` nhặt câu vừa chỗ còn lại, nhờ vậy description luôn rơi
 * vào khoảng 140–165 dù tồn kho có 4 số hay 7.664 số, giá "1 triệu" hay
 * "990 nghìn – 788 triệu".
 */
const CLOSERS: string[] = [
  "Quý khách xem giá công khai từng số.",
  "Nhận SIM kiểm tra rồi mới trả tiền.",
  "Giao nội thành HCM 30 phút – 2 giờ.",
  "Anh Chị lọc theo đuôi hoặc ngân sách.",
  "Sang tên chính chủ.",
  "Tư vấn qua 0938.868.868.",
  "Giao toàn quốc.",
];

/**
 * Ghép câu cam kết vào `head` cho tới khi đạt `DESC_MIN`, không bao giờ vượt
 * `DESC_MAX`. Thứ tự bắt đầu từ `variant` nên hai trang cạnh nhau đóng câu khác
 * nhau. Thuần tính toán → SSR và ISR luôn ra cùng một chuỗi.
 */
const fitDescription = (head: string, variant: number): string => {
  const pool = [...CLOSERS.slice(variant % CLOSERS.length), ...CLOSERS.slice(0, variant % CLOSERS.length)];
  let out = head;
  for (const clause of pool) {
    if (out.length >= DESC_MIN) break;
    if (out.length + 1 + clause.length <= DESC_MAX) out += ` ${clause}`;
  }
  return out;
};

export interface DescriptionInput {
  prefix: string;
  count: number;
  minPrice: number;
  maxPrice: number;
  variant: number;
}

/** Trang đầu số. 4 khuôn câu, đều nêu tồn kho + dải giá thật của chính đầu số đó. */
export const buildDauSoDescription = ({
  prefix,
  count,
  minPrice,
  maxPrice,
  variant,
}: DescriptionInput): string => {
  const v = variant % VARIANT_COUNT;

  // Kho lỗi / rỗng: không bịa số liệu, dùng câu không có con số.
  if (count <= 0) {
    return fitDescription(
      `Kho sim đầu số ${prefix} MobiFone, giá niêm yết công khai theo từng số.`,
      v,
    );
  }

  const n = `${groupThousands(count)} số`;
  const pr = priceRangeText(minPrice, maxPrice);
  const heads = [
    `Kho đầu số ${prefix} MobiFone đang có ${n}, giá ${pr}.`,
    `${n} sim đầu ${prefix} MobiFone còn hàng, giá ${pr}.`,
    `Đầu số ${prefix} là mạng MobiFone; kho còn ${n}, giá ${pr}.`,
    `Danh sách ${n} đầu ${prefix} MobiFone kèm giá công khai, dải ${pr}.`,
  ];
  return fitDescription(heads[v], v);
};

export interface ComboDescriptionInput extends DescriptionInput {
  loaiLabel: string;
}

/** Trang combo đầu số × loại đuôi. Cùng luật: 4 khuôn câu + số liệu riêng. */
export const buildComboDescription = ({
  prefix,
  loaiLabel,
  count,
  minPrice,
  maxPrice,
  variant,
}: ComboDescriptionInput): string => {
  const v = variant % VARIANT_COUNT;

  if (count <= 0) {
    return fitDescription(
      `Sim ${loaiLabel} đầu số ${prefix} MobiFone, kho cập nhật liên tục theo ngày.`,
      v,
    );
  }

  const n = `${groupThousands(count)} số`;
  const pr = priceRangeText(minPrice, maxPrice);
  const heads = [
    `Sim ${loaiLabel} đầu số ${prefix} MobiFone: ${n} đang có hàng, giá ${pr}.`,
    `${n} sim ${loaiLabel} thuộc đầu ${prefix} MobiFone, giá ${pr}.`,
    `Đã lọc sẵn ${n} đuôi ${loaiLabel} trong kho đầu ${prefix} MobiFone, giá ${pr}.`,
    `Kho sim ${loaiLabel} đầu ${prefix} MobiFone còn ${n}, dải giá ${pr}.`,
  ];
  return fitDescription(heads[v], v);
};

// ── "0909 là mạng gì" ───────────────────────────────────────────────────────
// Cụm truy vấn mà đối thủ (simthanglong.vn) không trả lời trên trang đầu số.
// Nội dung phải ĐÚNG: 090/093 là dải 09x MobiFone có từ đầu; 07x là dải MobiFone
// nhận khi chuyển thuê bao 11 số về 10 số (2018); 089 được cấp thêm sau này.

const FAMILY_NOTE: Record<string, string> = {
  "090": "dải 09x MobiFone dùng từ những ngày đầu mạng di động Việt Nam",
  "093": "dải 09x lâu đời của MobiFone, quen tai với người Việt",
  "070": "dải 07x MobiFone nhận khi thuê bao 11 số đổi về 10 số năm 2018",
  "076": "dải 07x MobiFone nhận khi thuê bao 11 số đổi về 10 số năm 2018",
  "077": "dải 07x MobiFone nhận khi thuê bao 11 số đổi về 10 số năm 2018",
  "078": "dải 07x MobiFone nhận khi thuê bao 11 số đổi về 10 số năm 2018",
  "079": "dải 07x MobiFone nhận khi thuê bao 11 số đổi về 10 số năm 2018",
  "089": "đầu số 10 số được cấp thêm cho MobiFone, ra sau nên còn nhiều số đẹp",
};

/** Câu trả lời ngắn cho "{prefix} là mạng gì?" — dùng cho cả FAQ và thân trang. */
export const networkAnswer = (prefix: string): string => {
  const family = prefix.length === 4 ? prefix.slice(0, 3) : prefix;
  const note = FAMILY_NOTE[family] ?? "dải số của MobiFone";
  const scope =
    prefix.length === 4
      ? `Đầu số ${prefix} là mạng MobiFone — ${prefix} nằm trong dải ${family}, ${note}.`
      : `Đầu số ${prefix} là mạng MobiFone — ${note}.`;
  return `${scope} Từ khi có chuyển mạng giữ số, một thuê bao ${prefix} đang dùng vẫn có thể đã sang mạng khác; còn SIM bán tại CHONSOMOBIFONE.COM đều là SIM MobiFone, sang tên chính chủ.`;
};

/** Tiêu đề mục "là mạng gì" trên thân trang. */
export const networkHeading = (prefix: string): string => `${prefix} là mạng gì?`;
