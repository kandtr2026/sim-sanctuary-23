// ============================================================================
// TƯ VẤN SIM THEO GIAI ĐOẠN ĐỜI (suy từ năm sinh)
// Dùng cho trang /sim-nam-sinh: khi kho KHÔNG có số trùng đúng ngày/năm sinh,
// thay vì để khách cụt hứng ("xem lại sau"), ta chuyển hướng mềm sang tư vấn
// sim phong thủy hợp tuổi — và nội dung tư vấn đổi theo độ tuổi:
//   • dưới 22  → học hành, thi cử
//   • 22–30    → công việc, khởi đầu làm ăn
//   • trên 30  → thăng tiến, uy tín, tài lộc
//
// Thuần hàm, không I/O — chạy được cả server (trang [year]) lẫn client.
// Cố ý KHÔNG hứa hẹn tuyệt đối (đỗ đạt/giàu/thăng chức); dùng ngữ điệu
// "nên ưu tiên / có thể hỗ trợ" theo quan niệm phong thủy.
// ============================================================================

export type LifeStage = "study" | "career" | "advancement";

export interface BirthYearLifeStage {
  /** Tuổi xấp xỉ theo năm hiện tại (currentYear - birthYear). */
  age: number;
  stage: LifeStage;
  /** Tiêu đề block tư vấn. */
  title: string;
  /** Đoạn tư vấn hợp giai đoạn đời. */
  body: string;
  /** Nhãn nút CTA dẫn sang công cụ sim hợp tuổi. */
  cta: string;
}

// Ranh giới độ tuổi: <22 học hành · 22–30 công việc · >30 thăng tiến.
const STUDY_MAX = 21; // ≤ 21 tuổi = còn trong độ tuổi học tập
const CAREER_MAX = 30; // 22–30 tuổi = đi làm / khởi đầu làm ăn

const COPY: Record<LifeStage, Omit<BirthYearLifeStage, "age" | "stage">> = {
  study: {
    title: "Gợi ý sim hợp tuổi cho việc học hành, thi cử",
    body:
      "Với khách hàng còn trong độ tuổi học tập, nên ưu tiên số dễ nhớ, cân bằng ngũ hành và tạo cảm giác thuận lợi cho học hành, thi cử. Nếu chưa có số đúng ngày sinh, Chọn Số Mobifone sẽ gợi ý các số hợp mệnh để hỗ trợ sự tập trung và may mắn trong học tập.",
    cta: "Xem sim hợp tuổi cho học hành",
  },
  career: {
    title: "Gợi ý sim hợp tuổi cho công việc, làm ăn",
    body:
      "Với khách hàng đang bước vào giai đoạn đi làm hoặc khởi đầu kinh doanh, nên chọn số dễ giao tiếp, có thế số sáng và hợp mệnh để hỗ trợ công việc, cơ hội làm ăn và các mối quan hệ.",
    cta: "Xem sim hợp tuổi cho công việc",
  },
  advancement: {
    title: "Gợi ý sim hợp tuổi cho thăng tiến, uy tín, tài lộc",
    body:
      "Với khách hàng trên 30 tuổi, số điện thoại nên ưu tiên sự ổn định, uy tín và thế số tốt cho công việc lâu dài. Nếu chưa có số đúng năm sinh, nên chọn sim hợp mệnh, hợp quẻ để hỗ trợ thăng tiến, tài lộc và vị thế cá nhân.",
    cta: "Xem sim hợp tuổi cho thăng tiến",
  },
};

const stageFromAge = (age: number): LifeStage => {
  if (age <= STUDY_MAX) return "study";
  if (age <= CAREER_MAX) return "career";
  return "advancement";
};

/**
 * Suy giai đoạn đời + nội dung tư vấn từ năm sinh.
 * @param year Năm sinh (số hoặc chuỗi "YYYY").
 * @param currentYear Năm hiện tại (mặc định lấy theo hệ thống) — cho phép test.
 * Tuổi âm (năm sinh ở tương lai) được kẹp về 0 để copy không kỳ quặc.
 */
export const getBirthYearLifeStage = (
  year: number | string,
  currentYear: number = new Date().getFullYear(),
): BirthYearLifeStage => {
  const y = Number(year);
  const rawAge = Number.isFinite(y) ? currentYear - y : 0;
  const age = rawAge < 0 ? 0 : rawAge;
  const stage = stageFromAge(age);
  return { age, stage, ...COPY[stage] };
};
