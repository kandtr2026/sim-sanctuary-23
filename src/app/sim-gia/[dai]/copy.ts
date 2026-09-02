/**
 * Chữ riêng cho từng dải giá của route /sim-gia/[dai].
 *
 * Cố ý viết TAY từng dải thay vì sinh từ một khuôn chuỗi: bốn trang này nằm cùng
 * một cụm nên nếu dùng khuôn, meta và mở bài sẽ gần trùng nhau — đúng lỗi mà các
 * route programmatic của site đang mắc. Mỗi dải vì thế có tiêu đề, mô tả, cách mở
 * bài và bộ FAQ riêng; con số (tồn kho, mức giá) thì trang tự đọc từ kho lúc
 * render, không viết cứng ở đây.
 *
 * Biên giá KHÔNG khai ở file này — xem `resolvePriceBand` trong
 * src/lib/simDangSo.ts, nơi slug được nối vào `PRICE_RANGES`.
 */

export interface BandFaqItem {
  q: string;
  a: string;
}

export interface BandCopy {
  /** ≤ 60 ký tự. */
  title: string;
  /** 140–165 ký tự. */
  description: string;
  ogDescription: string;
  /** Câu đầu trong hero, trước phần số liệu tồn kho. */
  heroLead: string;
  intro: { heading: string; paragraphs: string[] };
  guide: { heading: string; lead?: string; items: { title: string; body: string }[] };
  /** Câu dẫn cho khối bảng giá thứ hai (số đẹp nhất dải). */
  finestNote: string;
  faq: BandFaqItem[];
}

/** Tag dạng số → trang danh mục tương ứng, cho khối liên kết theo dữ liệu thật. */
export const TAG_HREF: Record<string, string> = {
  "Tam hoa": "/sim-tam-hoa",
  "Tam hoa kép": "/sim-tam-hoa-kep",
  "Gánh đảo": "/sim-ganh-dao",
  "Lặp kép": "/sim-lap-kep",
  "Dễ nhớ": "/sim-de-nho",
  Taxi: "/sim-taxi",
  "Tiến lên": "/sim-tien-len",
  "Thần tài": "/sim-than-tai",
  "Lộc phát": "/sim-loc-phat",
  "Ông địa": "/sim-ong-dia",
  "Năm sinh": "/sim-nam-sinh",
  "Tứ quý": "/mua-sim-tu-quy",
  "Ngũ quý": "/sim-ngu-quy",
  "Lục quý": "/sim-ngu-quy",
};

export const BAND_COPY: Record<string, BandCopy> = {
  "1-3-trieu": {
    title: "Sim Mobifone Giá 1–3 Triệu | Số Đẹp Vừa Tầm",
    description:
      "Kho sim Mobifone giá 1 đến 3 triệu: dải đông hàng nhất, đủ đuôi thần tài, lộc phát, gánh đảo. Quý khách so giá từng số rồi chốt, sang tên chính chủ.",
    ogDescription: "Sim Mobifone 1–3 triệu: dải đông hàng nhất kho, giá niêm yết công khai từng số.",
    heroLead: "Tầm giá có nhiều lựa chọn nhất, đủ đuôi tài lộc và số cân đối.",
    intro: {
      heading: "Nhiều hàng nhất kho — cách khoanh vùng cho nhanh",
      paragraphs: [
        "Đây là dải đông hàng nhất trên toàn kho, và cũng là dải khách hỏi nhiều nhất. Điểm cần lưu ý: nhiều lựa chọn quá thì việc chọn lại khó hơn, nên Quý khách nên khóa một tiêu chí trước.",
        "Cách gọn nhất là chọn đuôi số muốn, rồi mới lọc trong tầm giá. Ở dải này còn đủ đuôi thần tài 39/79, lộc phát 68/86, cùng nhiều dãy gánh đảo và lặp kép — nghĩa là Quý khách hiếm khi phải nhượng bộ về dạng số.",
        "Tiêu chí thứ hai đáng khóa là đầu số. Đầu 07x cho nhiều dãy đẹp hơn ở cùng mức tiền; đầu 090, 093 ở dải này thường có thân số đơn giản hơn, bù lại quen tai người Việt.",
      ],
    },
    guide: {
      heading: "Ba cách chọn số trong tầm 1–3 triệu",
      lead: "Ba hướng dưới đây tương ứng ba nhóm khách hay đặt số ở dải này.",
      items: [
        {
          title: "Cần số cho công việc mới",
          body: "Ưu tiên dãy dễ đọc trước, ý nghĩa sau. Đuôi lặp cặp hoặc gánh đảo giúp khách ghi đúng số ngay lần đầu, và ở tầm này nguồn hàng rất dồi dào.",
        },
        {
          title: "Cần đuôi tài lộc mà giữ ngân sách",
          body: "Chọn đuôi 39 hoặc 68 trên đầu số 07x. Lớp ý nghĩa giữ nguyên, giá thấp hơn hẳn so với cùng đuôi trên đầu 090.",
        },
        {
          title: "Mua thêm số thứ hai cho gia đình",
          body: "Đặt nhiều số một lượt trong dải này rất nhẹ ngân sách. Đội ngũ tư vấn giữ được nhiều số cùng lúc để Quý khách chọn dãy gần nhau cho cả nhà.",
        },
      ],
    },
    finestNote: "Tám dãy có điểm đẹp cao nhất trong tầm 1–3 triệu tại thời điểm cập nhật.",
    faq: [
      {
        q: "Sim 1–3 triệu có phải số đẹp thật không?",
        a: "Có. Toàn bộ số trong danh sách này đều là số đẹp có cấu trúc: đuôi tài lộc, đuôi lặp, gánh đảo hoặc dãy dễ nhớ. Khác biệt so với dải cao hơn nằm ở đầu số và độ khan của cấu trúc, không phải ở chỗ số có đẹp hay không.",
      },
      {
        q: "Dải này có sim tam hoa hay tứ quý không?",
        a: "Tam hoa thì có, tập trung ở các cụm 000, 111 trên đầu số 07x. Tứ quý gần như không xuất hiện dưới 3 triệu vì nguồn hàng quá khan; Quý khách muốn tứ quý nên xem dải 10–50 triệu.",
      },
      {
        q: "Mua sim ở dải này có được sang tên chính chủ?",
        a: "Được, chính sách áp dụng cho mọi mức giá. Quý khách nhận SIM, kiểm tra rồi mới thanh toán; thủ tục sang tên làm tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
      },
      {
        q: "Ngân sách của Quý khách dưới 1 triệu thì xem đâu?",
        a: "Xem kho SIM khuyến mãi đồng giá — mọi số cùng một mức giá, một phần kèm sẵn gói cước. Kho số đẹp dưới 1 triệu thường xuyên rất ít hàng nên chúng tôi không mở danh sách riêng cho tầm đó.",
      },
    ],
  },
  "3-5-trieu": {
    title: "Sim Mobifone Giá 3–5 Triệu | Số Đẹp Cho Hotline",
    description:
      "Sim Mobifone giá 3 đến 5 triệu: bậc trung có nhiều tam hoa và lặp kép để làm hotline. Giá niêm yết ngay cạnh từng số, nhận SIM kiểm tra rồi thanh toán.",
    ogDescription: "Sim Mobifone 3–5 triệu: bậc trung, nhiều tam hoa và lặp kép. Giá công khai từng số.",
    heroLead: "Bậc trung của kho, nơi số làm hotline kinh doanh tập trung nhiều nhất.",
    intro: {
      heading: "Thêm 2 triệu so với dải dưới thì được thêm gì",
      paragraphs: [
        "Câu hỏi này khách đặt gần như mỗi ngày, và câu trả lời khá cụ thể: được cụm tam hoa ở đuôi, được thân số gọn hơn, và được nhiều dãy trên đầu 090, 093 hơn.",
        "Cùng một đuôi 68, số ở dải 1–3 triệu thường có thân số dài và rời; lên tầm này thân số bắt đầu có cấu trúc — lặp cặp, đối xứng, hoặc trùng phần đầu. Khi Quý khách đọc số cho khách hàng nghe, chỗ khác nhau nằm ở đó.",
        "Đây cũng là ngưỡng mà nhiều chủ shop chọn để lấy số làm hotline chính thức: đủ đẹp để in lên bảng hiệu, chưa tới mức phải cân nhắc như một khoản đầu tư.",
      ],
    },
    guide: {
      heading: "Chọn số hotline trong tầm 3–5 triệu",
      lead: "Nếu số này sẽ nằm trên bảng hiệu và bao bì, ba điểm dưới đây nên xét theo đúng thứ tự.",
      items: [
        {
          title: "1. Nhịp đọc trước tiên",
          body: "Đọc thử số cho một người chưa từng nghe. Nếu người đó ghi lại đúng ngay lần đầu, dãy đó đáng chọn — kể cả khi đuôi không phải 68 hay 39.",
        },
        {
          title: "2. Đuôi số, chọn theo nghề",
          body: "Buôn bán chọn 68, 86, 39, 79. Dịch vụ kỹ thuật, vận chuyển thì đuôi tam hoa hoặc lặp cặp lợi hơn vì khách chỉ cần nhớ số, không cần lớp ý nghĩa.",
        },
        {
          title: "3. Đầu số, xét cuối",
          body: "Đầu 090, 093 tạo cảm giác lâu năm; 07x cho dãy đẹp hơn ở cùng mức tiền. Cân giữa hai bên theo việc số này dùng để gọi ra hay để khách gọi vào.",
        },
      ],
    },
    finestNote: "Tám dãy có điểm đẹp cao nhất trong tầm 3–5 triệu tại thời điểm cập nhật.",
    faq: [
      {
        q: "Tầm 3–5 triệu có tam hoa đầu 090 không?",
        a: "Có, nhưng số lượng thay đổi liên tục vì nhóm này bán nhanh. Tam hoa cụm 000 và 111 xuất hiện thường xuyên hơn cụm 888, 999 — hai cụm sau ở đầu 090 thường vượt mức 5 triệu.",
      },
      {
        q: "Số ở dải này có giữ giá không?",
        a: "Số có cấu trúc rõ và đầu số cổ thì giữ giá tốt hơn số thân rối. Điều cần nói thẳng: mua sim ở tầm này nên nhắm vào việc dùng lâu dài, còn mục tiêu giữ giá thì dải 10–50 triệu phù hợp hơn.",
      },
      {
        q: "Quý khách trả góp được ở dải này không?",
        a: "Được. Trang mua sim trả góp mô tả rõ cách chia kỳ và giấy tờ cần. Ở tầm 3–5 triệu, phần lớn khách chọn trả một lần vì chênh lệch không nhiều.",
      },
      {
        q: "Đặt số hôm nay thì bao lâu nhận được?",
        a: "30 phút giao toàn quốc kể từ lúc chốt số. Quý khách thanh toán COD lúc nhận hoặc chuyển khoản trước.",
      },
    ],
  },
  "5-10-trieu": {
    title: "Sim Mobifone Giá 5–10 Triệu | Số Đẹp Đầu 090, 093",
    description:
      "Sim Mobifone giá 5 đến 10 triệu: nhiều dãy đầu 090, 093 và đuôi tam hoa. Mức giá Anh Chị mua số dùng lâu dài. Giá công khai, sang tên chính chủ.",
    ogDescription: "Sim Mobifone 5–10 triệu: nhiều dãy đầu 090, 093, đuôi tam hoa. Giá công khai.",
    heroLead: "Kho hẹp lại, và đây là lúc đầu số cùng cấu trúc dãy quyết định giá.",
    intro: {
      heading: "Vượt mốc 5 triệu, kho hẹp lại rất nhanh",
      paragraphs: [
        "So với dải 3–5 triệu, số lượng hàng ở đây giảm nhiều lần. Nguyên nhân nằm ở nguồn: số hội đủ cả ba yếu tố — đầu số cổ, thân số có cấu trúc, đuôi đẹp — vốn ít.",
        "Điều đó đổi cách chọn. Ở dải dưới, Quý khách lọc theo đuôi rồi vẫn còn hàng trăm lựa chọn. Ở đây, nên xem cả danh sách trong tầm giá rồi mới quyết, vì dãy vừa ý có thể không quay lại.",
        "Nhóm khách chính ở tầm này: người lấy số để dùng mười năm tới, chủ doanh nghiệp nhỏ cần một dãy đứng vững trước đối tác, và người mua tặng.",
      ],
    },
    guide: {
      heading: "Bốn nhóm số thường gặp trong tầm 5–10 triệu",
      items: [
        {
          title: "Tam hoa đuôi trên đầu số cổ",
          body: "Đầu 090 hoặc 093 kèm cụm ba số cuối. Nhóm được hỏi nhiều nhất ở dải này, và cũng đi nhanh nhất.",
        },
        {
          title: "Taxi cụm ba số",
          body: "Dãy lặp khối kiểu 417.417 — đọc từ xa vẫn đúng, rất hợp đơn vị vận chuyển và cửa hàng có xe giao hàng.",
        },
        {
          title: "Đuôi tài lộc kèm thân số lặp",
          body: "Đuôi 68, 79, 39 đi cùng thân số có cấu trúc. Một dãy làm hai việc: mang lớp ý nghĩa và dễ nhớ.",
        },
        {
          title: "Số năm sinh trọn ngày tháng",
          body: "Sáu chữ số cuối mã hóa đủ ngày sinh. Nhóm này được mua để tặng nhiều hơn để dùng cho kinh doanh.",
        },
      ],
    },
    finestNote: "Tám dãy có điểm đẹp cao nhất trong tầm 5–10 triệu tại thời điểm cập nhật.",
    faq: [
      {
        q: "Vì sao dải 5–10 triệu ít hàng hơn hẳn dải dưới?",
        a: "Vì số ở đây phải hội đủ ba yếu tố cùng lúc: đầu số cổ, thân số có cấu trúc và đuôi đẹp. Kho càng lên cao thì điều kiện càng chặt, nên lượng hàng giảm theo từng bậc giá.",
      },
      {
        q: "Nên chọn đầu 090 đuôi thường, hay đầu 07x đuôi đẹp?",
        a: "Tùy việc dùng số. Số để khách gọi vào thì đuôi dễ nhớ quan trọng hơn, chọn 07x đuôi đẹp. Số dùng trong giao dịch, gặp đối tác thì đầu 090 tạo cảm giác lâu năm — nhiều khách chọn hướng này ở tầm giá trên 5 triệu.",
      },
      {
        q: "Mua ở tầm này có cần hợp đồng không?",
        a: "Quý khách nhận SIM, kiểm tra thông tin và thử số trước khi thanh toán; đội ngũ xuất phiếu bán kèm hỗ trợ sang tên chính chủ. Với số trên 10 triệu, chúng tôi làm thêm biên nhận chi tiết cho Quý khách.",
      },
      {
        q: "Số đã bán có còn hiện trên trang không?",
        a: "Danh sách cập nhật theo kho mỗi 5 phút và chỉ lấy số đang ở trạng thái còn bán, nên số đã có chủ sẽ rời khỏi trang sau lần cập nhật gần nhất. Với số ở tầm giá này, đội ngũ tư vấn vẫn xác nhận lại tình trạng qua điện thoại trước khi Quý khách chuyển tiền.",
      },
    ],
  },
  "10-50-trieu": {
    title: "Sim Mobifone Giá 10–50 Triệu | Số Đẹp Cao Cấp",
    description:
      "Sim Mobifone giá 10 đến 50 triệu: tứ quý, tam hoa kép, taxi và đuôi thần tài hiếm. Hàng có sẵn, sang tên chính chủ, giao trực tiếp tại TP.HCM.",
    ogDescription: "Sim Mobifone 10–50 triệu: tứ quý, tam hoa kép, taxi. Sang tên chính chủ, giao tại TP.HCM.",
    heroLead: "Tầm giá của tứ quý, tam hoa kép và những cụm số khan hàng.",
    intro: {
      heading: "Ở tầm này, khách mua số theo cách khác",
      paragraphs: [
        "Khách đặt số trên 10 triệu thường không hỏi “còn số nào đẹp không” mà hỏi đúng một cấu trúc: tứ quý 8, tam hoa kép cụm 9, taxi 68. Số ở đây được chọn như chọn một vật giữ lâu, nên tiêu chí rất rõ ràng ngay từ đầu.",
        "Kho ở dải này mỏng theo đúng nghĩa: mỗi cấu trúc thường chỉ có vài dãy, có cấu trúc chỉ còn một. Đội ngũ tư vấn vì thế làm việc theo yêu cầu cụ thể — Quý khách nói cấu trúc muốn, chúng tôi báo đúng những dãy đang còn.",
        "Ba việc nên làm trước khi chuyển tiền cho một số ở tầm này: xem thông tin thuê bao trên ứng dụng My Mobifone, xác nhận sim chưa bị khóa hai chiều, và làm sang tên chính chủ ngay trong ngày nhận.",
      ],
    },
    guide: {
      heading: "Những gì Quý khách nên kiểm trước khi chốt",
      lead: "Số càng giá trị thì phần thủ tục càng đáng làm kỹ. Bốn bước dưới đây mất chưa tới 15 phút.",
      items: [
        {
          title: "Kiểm tra thuê bao trên My Mobifone",
          body: "Xem tình trạng thuê bao, gói cước đang gắn và hạn sử dụng ngay trên ứng dụng chính thức của nhà mạng, trước lúc thanh toán.",
        },
        {
          title: "Thử gọi và nhận tin nhắn hai chiều",
          body: "Gọi ra một số khác và nhận lại một tin nhắn. Bước này loại được trường hợp sim đang bị hạn chế dịch vụ.",
        },
        {
          title: "Sang tên chính chủ trong ngày",
          body: "Đăng ký thông tin của Quý khách ngay khi nhận SIM. Đây là cơ sở để giữ số nếu sau này mất SIM hoặc cần khôi phục.",
        },
        {
          title: "Giữ phiếu bán và biên nhận",
          body: "Với số trên 10 triệu, chúng tôi lập biên nhận chi tiết ghi rõ dãy số, mức giá và người nhận. Quý khách giữ bản này cùng hợp đồng thuê bao.",
        },
      ],
    },
    finestNote: "Tám dãy có điểm đẹp cao nhất trong tầm 10–50 triệu tại thời điểm cập nhật.",
    faq: [
      {
        q: "Tầm 10–50 triệu mua được tứ quý nào?",
        a: "Tứ quý các con số 0, 1, 2, 3, 4, 5 nằm trong tầm này khá thường xuyên. Tứ quý 6, 8, 9 trên đầu số cổ thường vượt mức 50 triệu; đội ngũ tư vấn sẽ báo riêng khi Quý khách cần nhóm đó.",
      },
      {
        q: "Số ở dải này có giữ được giá không?",
        a: "Nhóm có cấu trúc khan — tứ quý, tam hoa kép, taxi cụm tài lộc — giữ giá tốt hơn phần còn lại vì nguồn hàng không sinh thêm. Đây là quan sát từ thị trường, không phải một cam kết về giá bán lại.",
      },
      {
        q: "Thanh toán một số 30 triệu thế nào cho an toàn?",
        a: "Cách nhiều khách chọn: đặt cọc một phần qua chuyển khoản để giữ số, phần còn lại trả khi nhận SIM tại cửa hàng ở TP.HCM hoặc lúc nhân viên giao tới. Quý khách kiểm tra sim rồi mới trả nốt.",
      },
      {
        q: "Có hỗ trợ trả góp cho số ở tầm này không?",
        a: "Có. Trang mua sim trả góp ghi rõ cách chia kỳ và giấy tờ cần chuẩn bị. Với số trên 10 triệu, đây là hình thức được hỏi nhiều nhất sau chuyển khoản một lần.",
      },
      {
        q: "Quý khách ở tỉnh thì nhận số thế nào?",
        a: "Chuyển phát nhanh 1–3 ngày làm việc, thu tiền khi nhận. Với số giá trị cao, đội ngũ gọi xác nhận trước khi gửi và gửi kèm biên nhận trong bưu kiện.",
      },
    ],
  },
};
