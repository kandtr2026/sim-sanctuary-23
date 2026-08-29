/**
 * Nguồn sự thật duy nhất cho trang "Việc SEO cần làm" (/admin/seo).
 *
 * Vì sao có file này: sau đợt 29/08/2026 (96 trang programmatic + gỡ lỗi giá +
 * chuẩn hoá văn phong), phần code đã xong nhưng còn một loạt việc CHỈ CHỦ SHOP
 * làm được — đặt biến môi trường, đổi quyền chia sẻ Google Sheet, xác nhận nghiệp
 * vụ. Trước đây các việc đó nằm rải trong chat và trong memory của trợ lý, tức
 * chủ shop không có chỗ nào để xem mình còn nợ gì.
 *
 * Quy ước: mỗi khi làm xong một việc, sửa `status` TRONG CÙNG commit với thay đổi
 * thật — giống `roadmap.ts`. Riêng các việc có `liveCheck` thì trang tự đọc trạng
 * thái từ server, KHÔNG cần sửa file (xem /api/admin/seo-status).
 */

export type SeoStatus = "done" | "doing" | "todo";

/** Ai làm được việc này. Chủ shop không đọc code, dev không có quyền dashboard. */
export type SeoOwner = "chu-shop" | "dev" | "ca-hai";

/**
 * Khoá của các việc mà server tự kiểm được. Trang sẽ ghi đè `status` bằng kết quả
 * thật, nên một việc đã làm ngoài code (đặt biến trên Vercel) tự chuyển xanh mà
 * không ai phải sửa file này.
 */
export type SeoLiveCheck = "cronSecret" | "gscConnected" | "syncState";

export interface SeoTask {
  id: string;
  title: string;
  status: SeoStatus;
  owner: SeoOwner;
  priority: "P0" | "P1" | "P2";
  /** Vì sao việc này đáng làm — viết cho người không đọc code. */
  why: string;
  /** Làm thế nào. Lệnh hoặc đường bấm cụ thể, không nói chung chung. */
  how?: string;
  /** Hậu quả nếu không làm. Chỉ ghi khi hậu quả không hiển nhiên. */
  risk?: string;
  liveCheck?: SeoLiveCheck;
  updated?: string;
}

export interface SeoGroup {
  id: string;
  title: string;
  goal: string;
  tasks: SeoTask[];
}

export const SEO_NORTH_STAR =
  "Site đã có 287 URL và dữ liệu thật trong từng trang. Việc còn lại phần lớn không phải viết code, mà là bật đo lường (Search Console), để job đồng bộ chạy được, và chốt vài điều chỉ chủ shop biết.";

/** Số liệu đã đo ngày 29/08/2026 — để trang hiển thị mốc so sánh. */
export const SEO_BASELINE = [
  { label: "URL trong sitemap", value: "287", note: "trước đợt này: 119" },
  { label: "Trang tĩnh khi build", value: "289", note: "trước đợt này: 117" },
  { label: "Kho SIM đang bán", value: "49.093", note: "đã loại 302 số ẩn + số đã bán" },
  { label: "Từ khoá đang theo dõi", value: "118", note: "scripts/seo/keywords.json" },
];

export const SEO_GROUPS: SeoGroup[] = [
  {
    id: "do-luong",
    title: "1. Bật đo lường",
    goal:
      "Chưa nối Search Console thì mọi việc SEO sau đó đều là đoán: không biết từ khoá nào đang ở hạng mấy, trang nào có người vào.",
    tasks: [
      {
        id: "gsc-service-account",
        title: "Nối Search Console vào công cụ đo thứ hạng",
        status: "todo",
        owner: "chu-shop",
        priority: "P0",
        liveCheck: "gscConnected",
        why:
          "Property chonsomobifone.com ĐÃ được xác minh (2 thẻ google-site-verification đang sống trên site), nên Google đã tích luỹ số liệu sẵn. Chỉ cần cấp quyền đọc là rút ra được lịch sử, không phải chờ từ đầu.",
        how:
          "Google Cloud → tạo service account + key JSON. Search Console → Cài đặt → Người dùng và quyền → thêm email service account (quyền Bị hạn chế là đủ). Rồi đặt 3 biến trên Vercel: GSC_SIM_SITE_URL = sc-domain:chonsomobifone.com, GSC_SIM_CLIENT_EMAIL, GSC_SIM_PRIVATE_KEY. Xong chạy: npm run seo:rank -- --ngay 90",
        risk:
          "Không có bước này thì bảng 118 từ khoá vẫn chỉ là danh sách mong muốn, không ai biết đang đứng thứ mấy.",
      },
      {
        id: "gsc-sitemap",
        title: "Khai sitemap mới trong Search Console",
        status: "todo",
        owner: "chu-shop",
        priority: "P1",
        why:
          "Sitemap vừa tăng từ 119 lên 287 URL. Khai lại để Google lấy danh sách mới thay vì chờ tự phát hiện.",
        how: "Search Console → Sitemaps → nhập sitemap.xml → Submit. Sau 3–7 ngày xem mục Trang (Pages) để biết bao nhiêu URL đã được index.",
      },
    ],
  },
  {
    id: "job-dong-bo",
    title: "2. Để job đồng bộ kho chạy được",
    goal:
      "Job sync-sims là thứ đưa giá và trạng thái từ Google Sheet vào web. Nó vừa được sửa nhưng chưa có gì gọi nó.",
    tasks: [
      {
        id: "cron-secret",
        title: "Đặt biến CRON_SECRET trên Vercel",
        status: "todo",
        owner: "chu-shop",
        priority: "P0",
        liveCheck: "cronSecret",
        why:
          "Cron đã được khai trong vercel.json (2 lần/ngày). Route cố ý TỪ CHỐI khi chưa có secret — một endpoint ghi 51.000 dòng mà mở toang thì tệ hơn là cron không chạy.",
        how:
          'Sinh secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))". Rồi: npx vercel env add CRON_SECRET production, dán chuỗi vào. Cuối cùng redeploy: npx vercel --prod. Kiểm: gọi https://www.chonsomobifone.com/api/cron/sync-sims phải trả 401.',
        risk:
          "Chưa đặt thì mọi bản sửa trong job (siết parse giá, ghi tags/điểm đẹp, chặn SIM ẩn) nằm im — sửa giá trong Sheet sẽ không lên web.",
      },
      {
        id: "migration-sync-state",
        title: "Chạy migration bảng sims_sync_state",
        status: "todo",
        owner: "chu-shop",
        priority: "P1",
        liveCheck: "syncState",
        why:
          "Bảng này lưu vân tay nội dung để job bỏ qua lần sync khi Sheet không đổi. Thiếu bảng thì job vẫn chạy đúng, chỉ là ghi lại cả 51.000 dòng mỗi lượt.",
        how:
          "Mở Supabase → SQL Editor → dán nội dung file supabase/migrations/20260829090000_sims_sync_state.sql → Run. (Không dùng supabase db push được: lịch sử migration remote/local đang lệch, và migration repair thì sửa vào sổ migration nên dễ đánh dấu sai bản đã chạy.)",
      },
      {
        id: "kiem-lan-sync-dau",
        title: "Xem lại lưới SIM sau lần sync đầu tiên",
        status: "todo",
        owner: "ca-hai",
        priority: "P1",
        why:
          "Lần chạy đầu sẽ điền beauty_score cho 29.969 số và is_vip cho 2.425 số — ba cột này trước giờ trống. Sắp xếp mặc định là giá tăng dần rồi tới điểm đẹp, nên nhóm cùng giá SẼ đổi thứ tự thật.",
        how: "Sau khi cron chạy: mở trang chủ xem thứ tự số cùng giá, và kiểm bộ lọc VIP (trước đây 0 số, sau sẽ ~2.425).",
      },
    ],
  },
  {
    id: "bao-mat-du-lieu",
    title: "3. Bịt phần rò dữ liệu còn lại",
    goal:
      "Phía code đã chặn 3 đường làm lộ cột giá vốn. Nhưng bản thân Google Sheet vẫn đang chia sẻ công khai.",
    tasks: [
      {
        id: "sheet-quyen-chia-se",
        title: "Đổi quyền chia sẻ Google Sheet kho SIM",
        status: "todo",
        owner: "chu-shop",
        priority: "P0",
        why:
          "Web đã thôi tải cột GIÁ THU VỀ và Giá Thu Điều Chỉnh xuống trình duyệt (ticker trang chủ 14,1 MB → 2,8 KB; trang định giá 5,6 MB → 2,1 MB). Nhưng ai có link Sheet vẫn đọc được toàn bộ bảng biên lợi nhuận — chỗ này chỉ đổi được trên Google Drive.",
        how:
          "Google Drive → file kho SIM → Chia sẻ → đổi từ Bất kỳ ai có đường liên kết sang Bị hạn chế, rồi thêm riêng các tài khoản cần đọc. Lưu ý kiểm lại web sau khi đổi: các edge function đọc Sheet qua gviz cần quyền phù hợp.",
        risk: "Đối thủ hoặc khách biết giá vốn thì mọi cuộc mặc cả bắt đầu từ con số đó.",
      },
    ],
  },
  {
    id: "xac-nhan-nghiep-vu",
    title: "4. Việc chỉ chủ shop trả lời được",
    goal: "Mấy chỗ này code không tự quyết được vì nó thuộc chính sách bán hàng.",
    tasks: [
      {
        id: "goi-cuoc-tk179",
        title: "Xác nhận lại cách ghi cột Phân loại trong Sheet",
        status: "done",
        owner: "chu-shop",
        priority: "P1",
        updated: "29/08/2026",
        why:
          "Đã chốt: cột Phân loại là gói cước THẬT của từng SIM, ô trống nghĩa là SIM không có gói. Nhãn trên thẻ giờ chạy theo dữ liệu; trang thôi hứa TK179 cho cả kho (thực tế chỉ 649/13.088 dòng là TK179).",
        how: "Giữ cột Phân loại đúng quy ước này khi nhập kho mới — nhãn trên web đọc trực tiếp từ đó.",
      },
      {
        id: "thu-mua-sim",
        title: "Có nhận thu mua / cầm cố SIM không?",
        status: "todo",
        owner: "chu-shop",
        priority: "P2",
        why:
          "Đối thủ simsodep có trang thu-mua-cam-co-sim. Mình có công cụ định giá sẵn nên nối vào rất rẻ — nhưng phải biết shop có thật sự nhận mua lại hay không, không thể mở trang rồi để khách gọi vào hỏi một dịch vụ không tồn tại.",
      },
      {
        id: "sim-doanh-nghiep",
        title: "Có bán lô cho doanh nghiệp không?",
        status: "todo",
        owner: "chu-shop",
        priority: "P2",
        why:
          "Cụm 'sim số đẹp cho công ty' có nhu cầu và kho 49.000 số đáp ứng được, nhưng cần chính sách giá lô + hoá đơn trước khi làm trang.",
      },
      {
        id: "que-55",
        title: "Đối chiếu quẻ 55 trong bảng 80 quẻ Kinh Dịch",
        status: "todo",
        owner: "chu-shop",
        priority: "P2",
        why:
          "Bảng đang ghi 'Ngược lại ý mình, có có thành công' — chữ 'có có' có vẻ là lỗi gõ nhưng không đoán được ý gốc. Bảng này sinh ra cả bài viết lẫn kết quả công cụ nên sai một chỗ là sai hai nơi.",
        how: "Đối chiếu bản tra cứu 80 quẻ đang dùng rồi cho biết câu đúng; 2 lỗi chính tả khác (Nổ lực → Nỗ lực, dâu khổ → đau khổ) đã sửa.",
      },
    ],
  },
  {
    id: "noi-dung-con-no",
    title: "5. Nội dung còn nợ",
    goal: "Phần chữ đã chuẩn hoá trong repo, nhưng bài trong database thì chưa.",
    tasks: [
      {
        id: "blog-supabase-van-phong",
        title: "Chuẩn hoá văn phong 158 bài blog trong database",
        status: "todo",
        owner: "ca-hai",
        priority: "P1",
        why:
          "55 file trong repo đã chuyển sang giọng 'Quý khách', nhưng bài ở /tin-tuc/[slug] lấy chữ từ bảng blog_posts nên vẫn giọng cũ (gọi khách là 'bạn'). Bot viết bài mới đã bị chặn không cho đăng bài sai xưng hô, nên vấn đề chỉ còn ở các bài cũ.",
        how: "Sửa qua /admin/posts, hoặc chạy SQL cập nhật hàng loạt rồi rà lại bằng mắt vài bài.",
      },
      {
        id: "trang-dia-phuong",
        title: "Dựng trang địa phương cho TP.HCM",
        status: "todo",
        owner: "dev",
        priority: "P1",
        why:
          "Shop có cửa hàng thật ở 43A Đường số 9, P. Tân Hưng và đã có Store schema kèm toạ độ trong layout — đây là tài sản chưa dùng. Đối thủ mạnh nhất đều ở Hà Nội, nên cụm 'mua sim số đẹp tphcm' là sân nhà.",
        how: "7 từ khoá địa phương đã nằm trong scripts/seo/keywords.json, nhóm 'địa phương'.",
      },
      {
        id: "bai-giay-to",
        title: "Viết bài: mua SIM cần giấy tờ gì",
        status: "todo",
        owner: "dev",
        priority: "P2",
        why:
          "Hai cụm 'mua sim số đẹp có cần cmnd không' và 'sim trả trước có sang tên được không' đang không có trang nào trả lời, mà đây đúng là câu khách hỏi trước khi xuống tiền.",
      },
    ],
  },
  {
    id: "ky-thuat-con-no",
    title: "6. Kỹ thuật còn nợ (dev)",
    goal: "Không gấp bằng nhóm trên, nhưng để lâu thì thành nợ khó trả.",
    tasks: [
      {
        id: "or-syntax-prefix-suffix",
        title: "Sửa cú pháp or() cho lọc nhiều đầu số / đuôi số",
        status: "todo",
        owner: "dev",
        priority: "P1",
        why:
          "Phần khoảng giá đã sửa, nhưng prefixes và suffixes vẫn dùng cú pháp sai với PostgREST nên query trả 400 rồi âm thầm rơi về quét cả 49.000 hàng. Kết quả đúng nhưng chậm và tốn.",
      },
      {
        id: "cache-cheap-sims",
        title: "Thêm TTL cho cache kho 229k",
        status: "todo",
        owner: "dev",
        priority: "P2",
        why:
          "serverCheapSims giữ cache không hết hạn — cùng lỗi vừa sửa ở serverSimData, nên độ tươi bằng tuổi tiến trình chứ không phải 5 phút.",
      },
      {
        id: "facet-cold-start",
        title: "Tính facet bằng SQL thay vì quét kho",
        status: "todo",
        owner: "dev",
        priority: "P2",
        why:
          "/api/sims?includeFacets=1 lần gọi lạnh từng mất ~46 giây vì phải đếm qua 49.000 hàng. Khi cache nguội, sidebar có thể không có số đếm.",
      },
      {
        id: "khoi-khuyen-mai",
        title: "Quyết: bật lại hay xoá khối khuyến mãi",
        status: "todo",
        owner: "ca-hai",
        priority: "P2",
        why:
          "Giá gạch ngang và badge giảm giá là code chết — lưới đọc /api/sims còn store khuyến mãi chỉ được nạp bởi hook khác. Sheet hiện cũng 0 dòng giảm giá. Để nguyên thì có ngày ai đó tưởng nó đang chạy.",
      },
    ],
  },
];
