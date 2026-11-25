// Nguồn nội dung: Terra viết, đã soát — 24/11/2026 (TASK_MENH_COPY_20261124.json).
// Dùng NGUYÊN VĂN, không sửa chữ. Key khớp `item.hanh` trong NGU_HANH_LIST.
// Lý do (GSC 28 ngày): query dạng câu hỏi "mệnh kim hợp số mấy / số điện thoại
// nào", "mệnh mộc hợp số mấy", "các số hợp mệnh thổ" đứng vị trí 59–79 vì trang
// chưa có câu trả lời thẳng ở đầu trang.
import type { FaqItem } from "@/components/FaqAccordion";
import type { NguHanh } from "@/lib/phongThuy";

export const MENH_ANSWERS: Record<NguHanh, { answer: string; faqs: FaqItem[] }> = {
  "Kim": {
    answer: "Mệnh Kim hợp số 6, 7 thuộc hành Kim và số 2, 5, 8 thuộc hành Thổ tương sinh. Theo quan niệm ngũ hành, Quý khách nên hạn chế số 9 và có thể chú ý đến 4 số đuôi hoặc số cuối khi chọn SIM.",
    faqs: [
      {
        q: "Mệnh Kim hợp số mấy?",
        a: "Theo quan niệm ngũ hành, 6 và 7 là số đồng hành với mệnh Kim; 2, 5, 8 thuộc hành Thổ, tương sinh với Kim. Quý khách có thể dùng các nhóm số này làm cơ sở tham khảo khi xem SIM.",
      },
      {
        q: "Mệnh Kim hợp số điện thoại nào?",
        a: "Quý khách có thể xem cả dãy 10 số, đồng thời ưu tiên các số hợp mệnh Kim ở phần đuôi vì đây là phần dễ ghi nhớ. Theo quan niệm ngũ hành, nhóm số hợp gồm 6, 7, 2, 5, 8; nên hạn chế 9.",
      },
      {
        q: "Số đuôi nào kỵ với mệnh Kim?",
        a: "Theo quan niệm ngũ hành, số 9 thuộc hành Hỏa, mà Hỏa khắc Kim, nên thường được khuyên hạn chế ở đuôi SIM. Quý khách có thể tham khảo các đuôi có số 6, 7, 2, 5 hoặc 8.",
      },
    ],
  },
  "Mộc": {
    answer: "Mệnh Mộc hợp số 3, 4 đồng hành và 0, 1 tương sinh. Theo quan niệm ngũ hành, Quý khách nên hạn chế 6, 7 và chú ý 4 số đuôi hoặc số cuối khi xem SIM.",
    faqs: [
      {
        q: "Mệnh Mộc hợp số mấy?",
        a: "Theo quan niệm ngũ hành, 3 và 4 thuộc hành Mộc, còn 0 và 1 thuộc hành Thủy, tương sinh với Mộc. Quý khách có thể tham khảo hai nhóm số này tùy sở thích.",
      },
      {
        q: "Mệnh Mộc hợp số điện thoại nào?",
        a: "Một cách chọn theo quan niệm ngũ hành là xem cả dãy 10 số rồi ưu tiên 3, 4, 0, 1 ở phần đuôi. Quý khách cũng nên hạn chế sự xuất hiện của 6 và 7 khi cân nhắc.",
      },
      {
        q: "Số đuôi nào kỵ với mệnh Mộc?",
        a: "Số 6 và 7 thuộc hành Kim, được xem là nên hạn chế vì Kim khắc Mộc theo quan niệm ngũ hành. Khi xem đuôi SIM, Quý khách có thể tham khảo 3, 4, 0 hoặc 1 thay thế.",
      },
    ],
  },
  "Thủy": {
    answer: "Mệnh Thủy hợp số 0, 1 đồng hành và 6, 7 tương sinh. Theo quan niệm ngũ hành, Quý khách nên hạn chế 2, 5, 8 và cân nhắc các số hợp ở 4 số đuôi hoặc số cuối.",
    faqs: [
      {
        q: "Mệnh Thủy hợp số mấy?",
        a: "Theo quan niệm ngũ hành, 0 và 1 thuộc hành Thủy nên đồng hành với bản mệnh; 6 và 7 thuộc hành Kim, tương sinh với Thủy. Quý khách có thể ghi nhớ các nhóm này khi tham khảo kho SIM.",
      },
      {
        q: "Mệnh Thủy hợp số điện thoại nào?",
        a: "Quý khách nên xem tổng thể dãy 10 số và có thể ưu tiên 0, 1, 6, 7 ở phần đuôi dễ nhớ. Theo quan niệm ngũ hành, các số 2, 5, 8 thuộc nhóm nên hạn chế.",
      },
      {
        q: "Số đuôi nào kỵ với mệnh Thủy?",
        a: "Theo quan niệm ngũ hành, 2, 5, 8 thuộc hành Thổ, mà Thổ khắc Thủy, nên thường được hạn chế ở đuôi số. Quý khách có thể cân nhắc đuôi có 0, 1, 6 hoặc 7.",
      },
    ],
  },
  "Hỏa": {
    answer: "Mệnh Hỏa hợp số 9 đồng hành cùng 3, 4 tương sinh. Theo quan niệm ngũ hành, Quý khách nên hạn chế 0, 1; khi chọn SIM, có thể chú ý 4 số đuôi hoặc số cuối.",
    faqs: [
      {
        q: "Mệnh Hỏa hợp số mấy?",
        a: "Theo quan niệm ngũ hành, số 9 đồng hành với mệnh Hỏa, còn 3 và 4 thuộc hành Mộc, tương sinh với Hỏa. Quý khách có thể dựa vào đó để tham khảo các số mình yêu thích.",
      },
      {
        q: "Mệnh Hỏa hợp số điện thoại nào?",
        a: "Quý khách có thể xem dãy 10 số có dễ nhớ, phù hợp nhu cầu hay không, rồi ưu tiên 9, 3, 4 ở phần đuôi. Theo quan niệm ngũ hành, 0 và 1 là các số nên hạn chế với mệnh Hỏa.",
      },
      {
        q: "Số đuôi nào kỵ với mệnh Hỏa?",
        a: "Theo quan niệm ngũ hành, 0 và 1 thuộc hành Thủy, khắc Hỏa nên thường được khuyên hạn chế ở đuôi SIM. Quý khách có thể tham khảo các đuôi có 9, 3 hoặc 4.",
      },
    ],
  },
  "Thổ": {
    answer: "Mệnh Thổ hợp số 2, 5, 8 đồng hành và 9 tương sinh. Theo quan niệm ngũ hành, Quý khách nên hạn chế 3, 4 và để ý các số hợp ở 4 số đuôi hoặc số cuối.",
    faqs: [
      {
        q: "Mệnh Thổ hợp số mấy?",
        a: "Các số 2, 5, 8 thuộc hành Thổ nên đồng hành với mệnh Thổ. Theo quan niệm ngũ hành, số 9 thuộc hành Hỏa cũng được xem là tương sinh vì Hỏa sinh Thổ.",
      },
      {
        q: "Mệnh Thổ hợp số điện thoại nào?",
        a: "Khi xem cả dãy 10 số, Quý khách có thể ưu tiên 2, 5, 8, 9 ở phần đuôi để dễ ghi nhớ. Theo quan niệm ngũ hành, 3 và 4 là những số mệnh Thổ nên hạn chế.",
      },
      {
        q: "Số đuôi nào kỵ với mệnh Thổ?",
        a: "Theo quan niệm ngũ hành, 3 và 4 thuộc hành Mộc, mà Mộc khắc Thổ, nên thường được hạn chế ở đuôi điện thoại. Quý khách có thể xem các lựa chọn chứa 2, 5, 8 hoặc 9.",
      },
    ],
  },
};
