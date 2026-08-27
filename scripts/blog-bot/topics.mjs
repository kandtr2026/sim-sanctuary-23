/**
 * Topic bank for the daily blog-draft bot (see OpenCode.md).
 *
 * Order matters: the job picks the FIRST topic whose slug does not already
 * exist in `blog_posts`. The "kho số đẹp" series (sim types like tứ quý,
 * lục quý) sits at the front because those are the highest-value SEO
 * keywords, mirroring the category structure of simthanglong.com. Once the
 * bank is exhausted the job extends the birth-year series (see
 * `nextYearTopic` in this file) rather than repeating a slug.
 *
 * Titles are deliberately VARIED (not all "Sim X là gì?") to avoid a wall of
 * repetitive headings. `internalLink` must be one of the allowed internal
 * links listed in OpenCode.md section 6. `keywords` are the SEO keywords the
 * article should target (main ones first).
 */

/**
 * Slug đã có trang viết cứng trong repo (`src/app/tin-tuc/<slug>/page.tsx`).
 *
 * Bot KHÔNG được dùng lại các slug này. Không phải vì sợ trùng khoá — Next luôn
 * ưu tiên route tĩnh nên bài bot ghi vào DB sẽ không bao giờ hiện ra — mà vì đó
 * là một lượt chạy bot ném đi, cộng thêm một hàng rác trong `blog_posts`.
 *
 * Danh sách này phải khớp với `TIN_TUC_ARTICLES` trong
 * `src/content/tinTucArticles.ts`. Thêm bài viết cứng mới thì thêm slug vào đây.
 */
export const RESERVED_SLUGS = [
  // 6 bài cũ
  'y-nghia-sim-so-dep',
  'so-tong-dai-cac-nha-mang',
  'y-nghia-cac-con-so-1-9',
  'cach-xem-sim-phong-thuy-hop-tuoi',
  'cach-tranh-mat-tien-oan-khi-mua-sim-so-dep',
  'cac-dau-so-mang-mobifone-moi-nhat',
  // Loạt bài trụ cột 27/08/2026
  'bat-cuc-linh-so-la-gi',
  '80-que-kinh-dich-trong-sim',
  'sim-hop-menh-ngu-hanh',
  'cach-tinh-diem-sim-phong-thuy',
  'y-nghia-2-so-cuoi-dien-thoai',
  'gia-sim-so-dep-mobifone',
  'mua-sim-so-dep-o-dau-uy-tin',
  'kiem-tra-so-dien-thoai-mobifone',
  'kiem-tra-sim-chinh-chu-mobifone',
  'sim-bi-khoa-mobifone',
  'chuyen-mang-giu-so-sang-mobifone',
];

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

export function canChi(year) {
  return `${CAN[(year - 4) % 10]} ${CHI[(year - 4) % 12]}`;
}

function yearTopic(year) {
  return {
    slug: `sim-hop-tuoi-${year}`,
    title: `Sim Hợp Tuổi ${year} ${canChi(year)} – Chọn Số Theo Phong Thủy Hợp Mệnh`,
    category: 'Phong thuỷ',
    internalLink: '/sim-phong-thuy',
    keywords: [
      `sim hợp tuổi ${year}`,
      `sim phong thủy tuổi ${year}`,
      `người sinh năm ${year} mệnh gì`,
      'sim hợp mệnh',
      'chọn sim phong thủy',
    ],
  };
}

function headNumberTopic(prefix) {
  return {
    slug: `dau-so-${prefix}-la-mang-gi`,
    title: `Đầu số ${prefix} là mạng gì? Ý nghĩa và cách chọn sim đầu ${prefix}`,
    category: 'Đầu số',
    internalLink: '/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat',
    keywords: [`đầu số ${prefix}`, `sim đầu ${prefix}`, `đầu số ${prefix} là mạng gì`, 'sim Mobifone', 'sim số đẹp'],
  };
}

/**
 * "Kho số đẹp" series — the sim-type categories that carry the strongest
 * SEO traffic (tứ quý, lục quý, ngũ quý, tam hoa, …), mirroring
 * simthanglong.com's "sim theo loại" structure.
 */
const KHO_SO_DEP = [
  {
    slug: 'sim-tu-quy-la-gi-y-nghia',
    title: 'Sim Tứ Quý Đẹp – Ý Nghĩa Phong Thủy Và Cách Chọn Số Hợp Mệnh',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: [
      'sim tứ quý',
      'sim tứ quý là gì',
      'sim tứ quý đẹp',
      'tứ quý 8888',
      'ý nghĩa phong thủy sim tứ quý',
      'giá sim tứ quý',
    ],
  },
  {
    slug: 'sim-luc-quy-la-gi-y-nghia',
    title: 'Sim Lục Quý 6 Số Giống Nhau – Dòng Sim Đỉnh Cao Của Người Sành Chơi',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: [
      'sim lục quý',
      'sim lục quý là gì',
      'sim lục quý 6 số giống nhau',
      'lục quý 888888',
      'giá sim lục quý',
      'sim số đẹp đẳng cấp',
    ],
  },
  {
    slug: 'sim-tu-quy-giua-la-gi',
    title: 'Tứ Quý Giữa – Cách Sở Hữu Sim Số Đẹp Dễ Nhớ Với Chi Phí Hợp Lý',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tứ quý giữa', 'tứ quý giữa là gì', 'sim tứ quý', 'cách nhận biết tứ quý giữa'],
  },
  {
    slug: 'sim-ngu-quy-giua-la-gi',
    title: 'Ngũ Quý Giữa Khác Gì Ngũ Quý Cuối? Ý Nghĩa Và Giá Trị Cần Biết',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim ngũ quý giữa', 'ngũ quý giữa là gì', 'sim ngũ quý', 'sim số đẹp'],
  },
  {
    slug: 'sim-tam-hoa-la-gi-y-nghia',
    title: 'Sim Tam Hoa – Ý Nghĩa Từng Bộ Số Và Mẹo Chọn Hợp Mệnh Cho Người Mới',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tam hoa', 'sim tam hoa là gì', 'tam hoa 333', 'giá sim tam hoa', 'sim số đẹp'],
  },
  {
    slug: 'sim-tam-hoa-kep-la-gi',
    title: 'Sim Tam Hoa Kép – Sự Kết Hợp Hoàn Hảo Của Hai Bộ Số May Mắn',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tam hoa kép', 'tam hoa kép là gì', 'sim tam hoa', 'sim lặp kép'],
  },
  {
    slug: 'sim-tien-don-la-gi',
    title: 'Sim Số Tiến – Vì Sao Dãy Số Tăng Dần Được Giới Kinh Doanh Ưa Chuộng?',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tiến đơn', 'sim số tiến', 'sim tiến lên', 'sim số đẹp dễ nhớ'],
  },
  {
    slug: 'sim-tien-doi-la-gi',
    title: 'Sim Tiến Đôi – Cặp Số May Mắn Tăng Dần Đều Đặn Và Cách Chọn',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tiến đôi', 'số tiến đôi', 'sim số đẹp', 'sim dễ nhớ'],
  },
  {
    slug: 'sim-lap-la-gi-y-nghia',
    title: 'Sim Lặp – Sức Hút Của Những Con Số Lặp Lại Trong Giới Chơi Sim',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim lặp', 'sim lặp là gì', 'sim lặp kép', 'sim số đẹp'],
  },
  {
    slug: 'sim-kep-la-gi',
    title: 'Sim Kép – Điểm Khác Biệt Với Sim Lặp Và Cách Nhận Biết Dễ Dàng',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim kép', 'sim kép là gì', 'sim số đẹp', 'sim lặp kép'],
  },
  {
    slug: 'sim-ganh-la-gi',
    title: 'Sim Gánh – Ý Nghĩa Số Đối Xứng Và Cách Chọn Số Gánh Đảo',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim gánh', 'sim gánh là gì', 'sim gánh đảo', 'sim số đẹp'],
  },
  {
    slug: 'sim-dao-la-gi',
    title: 'Sim Đảo – Dãy Số Soi Gương May Mắn Và Cách Chọn Hợp Mệnh',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đảo', 'sim đảo là gì', 'sim số đảo', 'sim số đẹp'],
  },
  {
    slug: 'sim-phu-quy-la-gi-y-nghia',
    title: 'Sim Phú Quý – Ý Nghĩa Đuôi 68, 86 Và Cách Chọn Số Tài Lộc',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim phú quý', 'sim phú quý là gì', 'đuôi 68', 'đuôi 86', 'sim lộc phát'],
  },
  {
    slug: 'sim-ong-dia-la-gi-y-nghia',
    title: 'Sim Ông Địa – Ý Nghĩa Đuôi 38, 78 Và Cách Chọn Chuẩn Phong Thủy',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim ông địa', 'sim ông địa là gì', 'ông địa 38', 'ông địa 78', 'sim số đẹp'],
  },
  {
    slug: 'sim-de-nho-la-gi',
    title: 'Sim Dễ Nhớ – Tổng Hợp Các Dòng Sim Số Đẹp Dễ Thuộc Nhất',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim dễ nhớ', 'sim số dễ nhớ', 'sim số đẹp', 'sim tạo thương hiệu'],
  },
  {
    slug: 'sim-dau-so-co-la-gi',
    title: 'Sim Đầu Số Cổ – Vì Sao Đầu Số 09x Luôn Giữ Giá Cao?',
    category: 'Ý nghĩa sim',
    internalLink: '/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat',
    keywords: ['sim đầu số cổ', 'đầu số cổ', 'sim đầu 090', 'sim đầu 091', 'sim số đẹp'],
  },
  {
    slug: 'sim-nam-sinh-la-gi',
    title: 'Sim Năm Sinh – Món Quà Ý Nghĩa Và Cách Chọn Số Hợp Tuổi',
    category: 'Ý nghĩa sim',
    internalLink: '/sim-phong-thuy',
    keywords: ['sim năm sinh', 'sim năm sinh là gì', 'sim năm sinh 1990', 'sim số đẹp', 'sim hợp tuổi'],
  },
  {
    slug: 'sim-vip-la-gi',
    title: 'Sim VIP – Phân Hạng Và Giá Trị Của Dòng Sim Số Đẹp Đẳng Cấp',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim vip', 'sim vip là gì', 'sim số đẹp', 'sim đẳng cấp'],
  },
  {
    slug: 'sim-khuyen-mai-la-gi',
    title: 'Sim Khuyến Mãi – Mẹo Chọn Sim Giá Rẻ Đủ Ưu Đãi',
    category: 'Kiến thức mua sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim khuyến mãi', 'sim giá rẻ', 'sim số đẹp giá rẻ', 'sim trả trước'],
  },
];

/**
 * "Đuôi số" series — các bộ đuôi số cụ thể mang ý nghĩa may mắn theo quan
 * niệm dân gian. Đây là nhóm từ khóa có ý định mua trực tiếp nhất (người gõ
 * đúng đuôi số thường đã sẵn sàng mua), cùng cấu trúc "sim đuôi {số}" mà
 * simthanglong.com đang dùng để làm xương sống title cho các trang sinh tài lộc.
 */
const DUOI_SO = [
  {
    slug: 'sim-duoi-68-la-gi-y-nghia',
    title: 'Sim Đuôi 68 – Ý Nghĩa Lộc Phát Và Cách Chọn Số Hợp Mệnh',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 68', 'đuôi 68 lộc phát', 'sim số 68', 'sim lộc phát', 'ý nghĩa số 68'],
  },
  {
    slug: 'sim-duoi-86-la-gi-y-nghia',
    title: 'Sim Đuôi 86 – Phát Lộc Từ Con Số Được Dân Kinh Doanh Ưa Chuộng',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 86', 'đuôi 86 phát lộc', 'sim số 86', 'sim lộc phát', 'ý nghĩa số 86'],
  },
  {
    slug: 'sim-duoi-39-la-gi-y-nghia',
    title: 'Sim Đuôi 39 Thần Tài – Ý Nghĩa Và Cách Chọn Hợp Phong Thủy',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 39', 'thần tài 39', 'sim thần tài', 'ý nghĩa số 39', 'sim số đẹp'],
  },
  {
    slug: 'sim-duoi-79-la-gi-y-nghia',
    title: 'Sim Đuôi 79 – Thần Tài Lớn Và Bí Quyết Chọn Số May Mắn',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 79', 'thần tài 79', 'sim thần tài', 'ý nghĩa số 79', 'sim số đẹp'],
  },
  {
    slug: 'sim-duoi-38-la-gi-y-nghia',
    title: 'Sim Đuôi 38 Ông Địa – Ý Nghĩa Và Mẹo Chọn Số Cầu Tài',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 38', 'ông địa 38', 'sim ông địa', 'ý nghĩa số 38', 'sim số đẹp'],
  },
  {
    slug: 'sim-duoi-78-la-gi-y-nghia',
    title: 'Sim Đuôi 78 – Ông Địa Lớn: Ý Nghĩa Và Cách Chọn Số Đẹp',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 78', 'ông địa 78', 'sim ông địa', 'ý nghĩa số 78', 'sim số đẹp'],
  },
  {
    slug: 'sim-duoi-1368-la-gi-y-nghia',
    title: 'Sim Đuôi 1368 – Sinh Tài Lộc Phát Có Gì Đặc Biệt?',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 1368', '1368 sinh tài lộc phát', 'sim số 1368', 'ý nghĩa số 1368', 'sim số đẹp'],
  },
  {
    slug: 'sim-duoi-6789-la-gi-y-nghia',
    title: 'Sim Đuôi 6789 – Dãy Số Tiến Được Giới Chơi Sim Săn Đón',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim đuôi 6789', 'số 6789', 'sim taxi 6789', 'ý nghĩa số 6789', 'sim số đẹp'],
  },
];

export const TOPIC_BANK = [
  // Kho số đẹp — các dòng sim có từ khóa SEO mạnh nhất (tứ quý, lục quý…).
  ...KHO_SO_DEP,

  // Đuôi số cụ thể — từ khóa mua hàng trực tiếp.
  ...DUOI_SO,

  // Chuỗi sim hợp tuổi theo phong thủy (1988 đã dùng – slug sim-hop-tuoi-1988 đã tồn tại).
  ...['1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000'].map((y) =>
    yearTopic(y),
  ),

  // Chuỗi giải thích đầu số Mobifone.
  ...['090', '093', '089', '070', '076', '077', '078', '079'].map(headNumberTopic),

  // Bài kiến thức chung.
  {
    slug: 'phan-biet-sim-tu-quy-that-tu-quy-giua',
    title: 'Sim tứ quý là gì? Cách phân biệt tứ quý thật, tứ quý giữa và tứ quý lệch',
    category: 'Kiến thức mua sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim tứ quý', 'tứ quý thật', 'tứ quý giữa', 'tứ quý lệch', 'cách phân biệt sim tứ quý'],
  },
  {
    slug: 'nen-mua-sim-tra-gop-hay-tra-thang',
    title: 'Nên mua sim trả góp hay trả thẳng? So sánh ưu nhược điểm',
    category: 'Kiến thức mua sim',
    internalLink: '/sim-tra-gop',
    keywords: ['sim trả góp', 'mua sim trả góp', 'sim số đẹp trả góp', 'mua sim trả thẳng'],
  },
  {
    slug: 'sim-taxi-la-gi-y-nghia',
    title: 'Sim taxi là gì? Vì sao được giới kinh doanh vận tải săn đón',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim taxi', 'sim taxi là gì', 'sim taxi 123456', 'sim số đẹp'],
  },
  {
    slug: 'sim-loc-phat-la-gi-y-nghia',
    title: 'Sim lộc phát là gì? Ý nghĩa và cách chọn số đuôi lộc phát hợp mệnh',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim lộc phát', 'sim lộc phát là gì', 'đuôi 68', 'đuôi 86', 'sim số đẹp'],
  },
  {
    slug: 'sim-than-tai-la-gi-y-nghia',
    title: 'Sim thần tài là gì? Ý nghĩa phong thủy và cách chọn số đuôi thần tài',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim thần tài', 'sim thần tài là gì', 'thần tài 39', 'thần tài 79', 'sim số đẹp'],
  },
  {
    slug: 'thu-tuc-sang-ten-sim-chinh-chu-mobifone',
    title: 'Thủ tục sang tên sim chính chủ Mobifone mới nhất',
    category: 'Kiến thức mua sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sang tên sim chính chủ', 'sang tên sim Mobifone', 'thủ tục sang tên sim'],
  },
  {
    slug: 'sim-ngu-quy-la-gi-y-nghia',
    title: 'Sim ngũ quý là gì? Vì sao sim ngũ quý luôn có giá trị cao',
    category: 'Ý nghĩa sim',
    internalLink: '/mua-sim-gia-re',
    keywords: ['sim ngũ quý', 'sim ngũ quý là gì', 'ngũ quý 88888', 'sim số đẹp'],
  },
];

/**
 * Fallback used once TOPIC_BANK is exhausted: continue the birth-year series
 * with the next year that isn't already in the bank (never repeats a slug).
 */
export function nextYearTopic(existingSlugs) {
  let year = 2001;
  while (existingSlugs.has(`sim-hop-tuoi-${year}`)) year += 1;
  return yearTopic(year);
}
