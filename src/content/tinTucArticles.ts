/**
 * Sổ đăng ký bài viết /tin-tuc viết cứng trong repo (file-based).
 *
 * ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT cho: danh sách trên /tin-tuc, sitemap, thẻ
 * metadata của từng trang bài, và khối "bài liên quan". Trước đây tiêu đề bài
 * bị chép tay ở 3 nơi (mảng `articles` trong tin-tuc/page.tsx, ROUTES trong
 * sitemap.ts, và constant TITLE trong từng page.tsx) nên rất dễ lệch nhau —
 * thêm bài mới chỉ cần khai ở đây một lần.
 *
 * Bài do bot/admin đăng qua Supabase (`blog_posts`) KHÔNG nằm trong file này;
 * chúng được nối thêm lúc chạy (xem `src/lib/blogPosts.ts`).
 */

export type ArticleCategory =
  | "Phong thuỷ"
  | "Ý nghĩa sim"
  | "Kiến thức mua sim"
  | "Đầu số"
  | "Hướng dẫn MobiFone";

export interface ArticleCover {
  /** Đường dẫn trong /public, đã tối ưu sẵn sang WebP. */
  src: string;
  alt: string;
  /** Kích thước thật của file — bắt buộc để không bị nhảy layout (CLS). */
  width: number;
  height: number;
}

export interface TinTucArticle {
  slug: string;
  /** Dùng cho <title>, thẻ card ở trang danh sách. */
  title: string;
  /** H1 hiển thị trong bài, nếu muốn khác `title`. */
  h1?: string;
  /** meta description — nhắm 140–160 ký tự. */
  description: string;
  /** Đoạn tóm tắt ở trang danh sách; mặc định lấy `description`. */
  excerpt?: string;
  category: ArticleCategory;
  cover?: ArticleCover;
  /** ISO date — vào Article schema. */
  datePublished: string;
  dateModified: string;
  /** Số phút đọc ước lượng (~200 từ/phút), hiện ở đầu bài. */
  readingMinutes?: number;
  /**
   * Bài cũ viết trước khi có sổ đăng ký này: page.tsx của chúng vẫn tự khai
   * `metadata` + JSON-LD bằng constant riêng, nên với các bài này sổ đăng ký chỉ
   * là nguồn cho danh sách /tin-tuc, sitemap và khối "bài liên quan". Bài mới thì
   * dùng `articleMetadata()` nên sổ đăng ký là nguồn duy nhất.
   */
  legacy?: boolean;
}

/** Ngày xuất bản chung cho loạt bài viết mới 27/08/2026. */
const PUB_2608 = "2026-08-27T09:00:00+07:00";

export const TIN_TUC_ARTICLES: TinTucArticle[] = [
  // ── Loạt bài trụ cột 27/08/2026 (mới nhất lên đầu danh sách) ──────────────
  {
    slug: "kiem-tra-so-dien-thoai-mobifone",
    title: "Cách Kiểm Tra Số Điện Thoại Của Mình MobiFone: 5 Cách Nhanh Nhất",
    h1: "Cách kiểm tra số điện thoại của mình trên MobiFone",
    description:
      "5 cách xem số điện thoại MobiFone của chính mình khi quên số: soạn TTTB gửi 1414, bấm *0#, gọi tổng đài 18001090, mở app My MobiFone hoặc gọi sang máy khác.",
    excerpt:
      "SIM vừa lắp, SIM phụ ít dùng, đổi máy xong không nhớ số nào ở khe nào. Năm cách xem lại số MobiFone trong vòng một phút, dùng được cả khi tài khoản đã hết tiền.",
    category: "Hướng dẫn MobiFone",
    cover: {
      src: "/blog/kiem-tra-so-dien-thoai-mobifone.webp",
      alt: "Bàn tay cầm điện thoại màn hình tối trên nền lụa đỏ",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 7,
  },
  {
    slug: "kiem-tra-sim-chinh-chu-mobifone",
    title: "Cách Kiểm Tra SIM Chính Chủ MobiFone & Chuẩn Hoá Thông Tin",
    h1: "Cách kiểm tra SIM MobiFone có chính chủ hay không",
    description:
      "Hướng dẫn kiểm tra SIM MobiFone đang đứng tên ai bằng cú pháp TTTB gửi 1414, app My MobiFone; cách chuẩn hoá và sang tên khi thông tin chưa đúng.",
    excerpt:
      "SIM không chính chủ có thể bị khoá bất cứ lúc nào và không thể dùng để xác thực ngân hàng. Đây là cách tự kiểm tra trong 30 giây và cách chuẩn hoá lại.",
    category: "Hướng dẫn MobiFone",
    cover: {
      src: "/blog/kiem-tra-sim-chinh-chu-mobifone.webp",
      alt: "Khay SIM đẩy ra khỏi điện thoại và một thẻ nano SIM chân vàng",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 8,
  },
  {
    slug: "chuyen-mang-giu-so-sang-mobifone",
    title: "Chuyển Mạng Giữ Số Sang MobiFone: Điều Kiện, Thủ Tục, Phí",
    h1: "Chuyển mạng giữ số sang MobiFone: điều kiện, thủ tục và phí",
    description:
      "Hướng dẫn chuyển mạng giữ số (MNP) sang MobiFone: điều kiện được duyệt, cú pháp đăng ký, phí chuyển mạng, thời gian xử lý và các lý do bị từ chối.",
    excerpt:
      "Giữ nguyên số cũ, đổi sang MobiFone. Bài này gom đủ điều kiện, thủ tục, phí và 6 lý do hồ sơ chuyển mạng thường bị từ chối.",
    category: "Hướng dẫn MobiFone",
    cover: {
      src: "/blog/chuyen-mang-giu-so-sang-mobifone.webp",
      alt: "Hai điện thoại đặt cạnh nhau, một chiếc sáng ánh vàng",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 9,
  },
  {
    slug: "sim-bi-khoa-mobifone",
    title: "SIM MobiFone Bị Khoá 1 Chiều, 2 Chiều: Nguyên Nhân & Cách Mở",
    h1: "SIM MobiFone bị khoá 1 chiều, 2 chiều: nguyên nhân và cách mở lại",
    description:
      "Phân biệt khoá 1 chiều và 2 chiều trên SIM MobiFone, nguyên nhân thường gặp, mốc thời gian trước khi bị thu hồi số và cách mở lại từng trường hợp.",
    excerpt:
      "Gọi ra không được nhưng vẫn nhận được cuộc gọi là khoá một chiều. Bài viết ghi rõ từng mốc thời gian trước khi số bị thu hồi, để Quý khách kịp xử lý.",
    category: "Hướng dẫn MobiFone",
    cover: {
      src: "/blog/sim-bi-khoa-mobifone.webp",
      alt: "Ổ khoá đồng nhỏ đặt trên mặt sau điện thoại",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 8,
  },
  {
    slug: "bat-cuc-linh-so-la-gi",
    title: "Bát Cực Linh Số: 8 Năng Lượng & 64 Cặp Số Trong Dãy SIM",
    h1: "Bát Cực Linh Số: 8 năng lượng và 64 cặp số trong một dãy SIM",
    description:
      "Bát Cực Linh Số chia 64 cặp số thành 8 năng lượng: 4 cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và 4 hung. Bảng tra đầy đủ và cách tự soi dãy SIM.",
    excerpt:
      "Bảng tra đủ 64 cặp số, kèm bốn bước tự soi một dãy SIM bằng giấy bút. Đọc xong, Quý khách tự thẩm định được dãy số trước khi nghe bất kỳ lời tư vấn nào.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/bat-cuc-linh-so-la-gi.webp",
      alt: "Tám quả cầu vàng phát sáng xếp vòng tròn trên bàn gỗ sơn mài",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 11,
  },
  {
    slug: "80-que-kinh-dich-trong-sim",
    title: "80 Quẻ Kinh Dịch Trong SIM: Cách Tính Và Bảng Tra Ý Nghĩa",
    h1: "80 quẻ Kinh Dịch trong SIM: cách tính và bảng tra ý nghĩa",
    description:
      "Cách tính quẻ Kinh Dịch của SIM: lấy 4 hoặc 6 số cuối chia 80, phần dư là số quẻ. Kèm bảng tra các quẻ đại cát, đại hung và cách dùng cho đúng.",
    excerpt:
      "Phép chia 80 là cách xem sim phổ biến nhất trên các diễn đàn phong thuỷ số. Bài này giải thích cách tính, chỗ hay bị làm sai, và tra quẻ ra sao.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/80-que-kinh-dich-trong-sim.webp",
      alt: "Thẻ tre chiêm bốc và la bàn phong thuỷ bằng đồng trên nền lụa đen",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 10,
  },
  {
    slug: "sim-hop-menh-ngu-hanh",
    title: "Chọn SIM Hợp Mệnh Theo Ngũ Hành: Bảng Tra Kim Mộc Thuỷ Hoả Thổ",
    h1: "Chọn SIM hợp mệnh theo ngũ hành: bảng tra Kim – Mộc – Thuỷ – Hoả – Thổ",
    description:
      "Bảng ngũ hành của từng con số 0–9 theo Hà Đồ, cách tra mệnh từ năm sinh và nguyên tắc chọn số tương sinh, tránh tương khắc cho từng mệnh.",
    excerpt:
      "Mỗi con số thuộc một hành. Tra mệnh theo năm sinh xong, việc chọn số gọn lại còn hai việc: ghép đúng nhóm tương sinh và tránh nhóm tương khắc.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/sim-hop-menh-ngu-hanh.webp",
      alt: "Năm vật tượng trưng ngũ hành xếp trên nền đá đen",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 10,
  },
  {
    slug: "cach-tinh-diem-sim-phong-thuy",
    title: "Cách Tính Điểm SIM Phong Thuỷ: 5 Trụ Cột Và Cách Đọc Điểm",
    h1: "Cách tính điểm SIM phong thuỷ: 5 trụ cột và cách đọc kết quả",
    description:
      "Điểm phong thuỷ của một SIM được cộng từ 5 trụ cột: ngũ hành bản mệnh, âm dương cung phi, tổng nút, quẻ Kinh Dịch và Bát Cực Linh Số. Cách tự tính tay.",
    excerpt:
      "Ngũ hành 40%, âm dương 20%, quẻ Kinh Dịch 20%, tổng nút 15%, cấu trúc 5%. Toàn bộ công thức được mở ra để Quý khách tự kiểm lại điểm của một số bằng giấy bút.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/cach-tinh-diem-sim-phong-thuy.webp",
      alt: "Bàn tính gỗ khung sẫm với hạt màu vàng đồng",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 11,
  },
  {
    slug: "y-nghia-2-so-cuoi-dien-thoai",
    title: "Ý Nghĩa 2 Số Cuối Điện Thoại: Bảng Tra Đủ 100 Cặp 00–99",
    h1: "Ý nghĩa 2 số cuối điện thoại: bảng tra đủ 100 cặp từ 00 đến 99",
    description:
      "Bảng tra ý nghĩa 2 số cuối điện thoại đủ 100 cặp 00–99 theo ba hệ: đồng âm dân gian, năng lượng Bát Cực Linh Số và ngũ hành từng chữ số.",
    excerpt:
      "68 là lộc phát, 39 là thần tài. Bảng tra dưới đây đủ 100 cặp số cuối từ 00 đến 99, đặt cạnh nhau ba cách đọc phổ biến nhất để Quý khách đối chiếu.",
    category: "Ý nghĩa sim",
    cover: {
      src: "/blog/y-nghia-2-so-cuoi-dien-thoai.webp",
      alt: "Hai đồng xu vàng cổ đặt cạnh nhau trên nền lụa đỏ sẫm",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 12,
  },
  {
    slug: "gia-sim-so-dep-mobifone",
    title: "Giá SIM Số Đẹp MobiFone: Bảng Giá Tham Khảo Theo Từng Dòng",
    h1: "Giá SIM số đẹp MobiFone: khoảng giá tham khảo theo từng dòng số",
    description:
      "Giá SIM số đẹp MobiFone theo dòng: tứ quý, ngũ quý, tam hoa, lộc phát, thần tài, đầu số cổ. Những yếu tố khiến hai số cùng dạng lệch giá nhau nhiều lần.",
    excerpt:
      "Hai số cùng dạng tứ quý có thể lệch giá nhau vài chục lần. Bài viết mổ xẻ các yếu tố định giá và khoảng giá tham khảo từng dòng, giúp Quý khách chốt ngân sách.",
    category: "Kiến thức mua sim",
    cover: {
      src: "/blog/gia-sim-so-dep-mobifone.webp",
      alt: "Những chồng tiền xu vàng bên cạnh điện thoại úp mặt trên đá cẩm thạch tối",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 10,
  },
  {
    slug: "mua-sim-so-dep-o-dau-uy-tin",
    title: "Mua SIM Số Đẹp Ở Đâu Uy Tín? 8 Điều Cần Kiểm Tra Trước Khi Trả Tiền",
    h1: "Mua SIM số đẹp ở đâu uy tín? 8 điều cần kiểm tra trước khi trả tiền",
    description:
      "Checklist 8 bước kiểm tra một nơi bán SIM số đẹp: giá niêm yết, thông tin thuê bao, cam kết sang tên, cách nhận SIM, chính sách đổi trả và dấu hiệu lừa đảo.",
    excerpt:
      "Không có giấy phép nào riêng cho nghề bán SIM số đẹp, nên người mua phải tự kiểm. Tám câu hỏi dưới đây lọc được phần lớn rủi ro.",
    category: "Kiến thức mua sim",
    cover: {
      src: "/blog/mua-sim-so-dep-o-dau-uy-tin.webp",
      alt: "Điện thoại đặt trên khay nhung đỏ tại quầy cửa hàng",
      width: 1200,
      height: 675,
    },
    datePublished: PUB_2608,
    dateModified: PUB_2608,
    readingMinutes: 9,
  },

  // ── Bài cũ (JSX tự quản phần đầu bài; ở đây chỉ khai để vào danh sách + sitemap) ──
  {
    slug: "y-nghia-sim-so-dep",
    title: "Ý Nghĩa Số Điện Thoại – Sim Số Như Thế Nào Là Đẹp?",
    description:
      "Ý nghĩa số điện thoại và cách nhận biết một SIM số đẹp: quy tắc âm dương, ngũ hành, các dạng đầu số và đuôi số quý.",
    category: "Ý nghĩa sim",
    cover: {
      src: "/blog/cat-y-nghia-sim.webp",
      alt: "Thẻ SIM mạ vàng trên nền lụa đỏ",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
  {
    slug: "y-nghia-cac-con-so-1-9",
    title: "Ý Nghĩa Các Con Số Từ 1 Đến 9 Trong Phong Thủy",
    description:
      "Ý nghĩa từng con số từ 1 đến 9 theo phong thủy, ngũ hành và ứng dụng khi chọn SIM số đẹp hợp mệnh.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/cat-phong-thuy.webp",
      alt: "La bàn phong thuỷ bằng đồng trên nền lụa đỏ",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
  {
    slug: "cach-xem-sim-phong-thuy-hop-tuoi",
    title: "Cách Xem Sim Phong Thủy Hợp Tuổi Chính Xác Nhất",
    description:
      "3 cách xem SIM phong thủy hợp tuổi: theo ngũ hành bản mệnh, âm dương tương phối, và cách tính sim đại cát chia 80.",
    category: "Phong thuỷ",
    cover: {
      src: "/blog/cat-phong-thuy.webp",
      alt: "La bàn phong thuỷ bằng đồng trên nền lụa đỏ",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
  {
    slug: "cac-dau-so-mang-mobifone-moi-nhat",
    title: "Các Đầu Số Mobifone Mới Nhất – Danh Sách Đầy Đủ & Ý Nghĩa",
    description:
      "Danh sách đầy đủ các đầu số Mobifone mới nhất: 089, 090, 093, 070, 076, 077, 078, 079. Lịch sử chuyển đổi đầu số và ý nghĩa từng đầu số.",
    category: "Đầu số",
    cover: {
      src: "/blog/cat-dau-so.webp",
      alt: "Năm thẻ nano SIM xếp xoè trên nền tối",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
  {
    slug: "cach-tranh-mat-tien-oan-khi-mua-sim-so-dep",
    title: "Cách Tránh Mất Tiền Oan Khi Mua Sim Số Đẹp",
    description:
      "Quy tắc vàng khi mua SIM số đẹp: không thanh toán 100% trước, kiểm tra hoạt động, cảnh giác sim giá rẻ bất ngờ, kiểm tra TTTB 1414.",
    category: "Kiến thức mua sim",
    cover: {
      src: "/blog/cat-kien-thuc-mua-sim.webp",
      alt: "Sổ tay da, bút và điện thoại trên bàn làm việc tối",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
  {
    slug: "so-tong-dai-cac-nha-mang",
    title: "Số Tổng Đài Mobifone, Vinaphone, Viettel, Gmobile Mới Nhất",
    description:
      "Danh sách số tổng đài chăm sóc khách hàng của các nhà mạng Mobifone, Vinaphone, Viettel, Gmobile cập nhật mới nhất.",
    category: "Hướng dẫn MobiFone",
    cover: {
      src: "/blog/cat-kien-thuc-mua-sim.webp",
      alt: "Sổ tay da, bút và điện thoại trên bàn làm việc tối",
      width: 1200,
      height: 675,
    },
    datePublished: "2026-08-01T09:00:00+07:00",
    dateModified: "2026-08-23T09:00:00+07:00",
    legacy: true,
  },
];

/** Tra một bài theo slug. Ném lỗi lúc build nếu slug sai (bắt lỗi sớm). */export function getArticle(slug: string): TinTucArticle {
  const found = TIN_TUC_ARTICLES.find((a) => a.slug === slug);
  if (!found) {
    throw new Error(
      `[tinTucArticles] Không có bài nào với slug "${slug}". Khai bài trong src/content/tinTucArticles.ts trước.`,
    );
  }
  return found;
}

/** Có bài file-based nào với slug này? Dùng để /tin-tuc/[slug] không đá nhau với bài DB. */
export function hasArticle(slug: string): boolean {
  return TIN_TUC_ARTICLES.some((a) => a.slug === slug);
}

/**
 * Bài liên quan để chèn cuối mỗi bài — ưu tiên chỉ định tay, thiếu thì bù bằng
 * bài cùng chuyên mục, cuối cùng bù bằng bài mới nhất. Luôn trả về đủ `limit`
 * bài (nếu kho có đủ) để không bao giờ hiện khối trống.
 */
export function getRelatedArticles(
  slug: string,
  explicit: string[] = [],
  limit = 3,
): TinTucArticle[] {
  const self = TIN_TUC_ARTICLES.find((a) => a.slug === slug);
  const picked: TinTucArticle[] = [];
  const seen = new Set<string>([slug]);

  const push = (article: TinTucArticle | undefined) => {
    if (!article || seen.has(article.slug) || picked.length >= limit) return;
    seen.add(article.slug);
    picked.push(article);
  };

  explicit.forEach((s) => push(TIN_TUC_ARTICLES.find((a) => a.slug === s)));
  if (self) {
    TIN_TUC_ARTICLES.filter((a) => a.category === self.category).forEach(push);
  }
  TIN_TUC_ARTICLES.forEach(push);

  return picked;
}

/**
 * Ảnh bìa mặc định theo chuyên mục, dùng cho bài lấy từ Supabase `blog_posts`
 * (bot/admin đăng) vì cột `cover_image_url` của chúng gần như luôn rỗng. Nhờ vậy
 * trang danh sách không bị lỗ hổng ảnh giữa các thẻ, mà cũng không phải sửa dữ
 * liệu trong DB.
 */
const CATEGORY_COVERS: Record<string, ArticleCover> = {
  "Phong thuỷ": {
    src: "/blog/cat-phong-thuy.webp",
    alt: "La bàn phong thuỷ bằng đồng trên nền lụa đỏ",
    width: 1200,
    height: 675,
  },
  "Ý nghĩa sim": {
    src: "/blog/cat-y-nghia-sim.webp",
    alt: "Thẻ SIM mạ vàng trên nền lụa đỏ",
    width: 1200,
    height: 675,
  },
  "Kiến thức mua sim": {
    src: "/blog/cat-kien-thuc-mua-sim.webp",
    alt: "Sổ tay da, bút và điện thoại trên bàn làm việc tối",
    width: 1200,
    height: 675,
  },
  "Đầu số": {
    src: "/blog/cat-dau-so.webp",
    alt: "Năm thẻ nano SIM xếp xoè trên nền tối",
    width: 1200,
    height: 675,
  },
  "Hướng dẫn MobiFone": {
    src: "/blog/cat-kien-thuc-mua-sim.webp",
    alt: "Sổ tay da, bút và điện thoại trên bàn làm việc tối",
    width: 1200,
    height: 675,
  },
};

/** Chuyên mục lạ (bot tự nghĩ ra mục mới) vẫn có ảnh — rơi về "Ý nghĩa sim". */
export function coverForCategory(category: string | null | undefined): ArticleCover {
  return (category && CATEGORY_COVERS[category]) || CATEGORY_COVERS["Ý nghĩa sim"];
}
