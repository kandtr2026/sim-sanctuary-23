/**
 * Nguồn sự thật duy nhất cho trang "Dự án — Make Mobi Great Again" (/admin/du-an).
 *
 * Mỗi khi làm xong / đổi trạng thái bất kỳ Task nào trong docs/Sim_Opencode.md,
 * phải cập nhật file này (status / updated / next) TRONG CÙNG commit — trang
 * tiến độ nhờ đó luôn khớp thực tế. Read-only, không đọc DB.
 */

export type TaskStatus = "done" | "doing" | "todo";

export interface RoadmapTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: "P0" | "P1" | "P2";
  next?: string;
  updated?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  goal: string;
  tasks: RoadmapTask[];
}

export const NORTH_STAR = "Bán được hàng — biến web thành máy ra lead Zalo/gọi";

export const PILLARS = [
  { name: "Website", note: "chốt lead + SEO organic" },
  { name: "YouTube", note: "nội dung & traffic bền" },
  { name: "Ads", note: "tăng tốc có lead ngay" },
];

export const ROADMAP: RoadmapPhase[] = [
  {
    id: "GĐ0",
    title: "Vá xô + gắn đồng hồ",
    goal: "Web sẵn sàng chốt lead + đo được trước khi bật Ads",
    tasks: [
      { id: "T1", title: "Làm lại Dashboard quản trị", status: "done", updated: "2026-08-24" },
      {
        id: "T2",
        title: "Thống nhất event GA4 generate_lead",
        status: "done",
        priority: "P0",
        updated: "2026-08-24",
      },
      {
        id: "T3",
        title: "Bắt UTM + gclid vào lead",
        status: "done",
        priority: "P1",
        updated: "2026-08-24",
      },
      {
        id: "T4",
        title: "Vá CTA + lớp niềm tin trên landing",
        status: "done",
        priority: "P1",
        updated: "2026-08-24",
      },
      {
        id: "T5",
        title: "2–3 trang đích đón Ads + FB Pixel",
        status: "todo",
        priority: "P1",
        next: "Chờ bàn từ khoá + ngân sách",
      },
      { id: "T6", title: "Trang tiến độ Dự án trong admin", status: "done", updated: "2026-08-24" },
    ],
  },
  {
    id: "GĐ1",
    title: "Bật vòi traffic (Ads + Social)",
    goal: "Có lead Zalo/gọi ngay trong 90 ngày",
    tasks: [
      { id: "G1-ads", title: "Google Search Ads từ khoá mua-ngay", status: "todo", next: "Sau khi GA4→Ads nối xong" },
      { id: "G1-social", title: "Đăng số đẹp FB + video TikTok", status: "todo" },
    ],
  },
  {
    id: "GĐ2",
    title: "Khoan giếng: SEO + YouTube",
    goal: "Khách miễn phí từ Google & YouTube, gặt từ tháng 4+",
    tasks: [
      { id: "G2-seo", title: "Trang tự sinh: đầu số / ý nghĩa số / loại số / hợp tuổi", status: "todo" },
      { id: "G2-yt", title: "Video YouTube ý nghĩa sim + nhúng lên web", status: "todo" },
    ],
  },
  {
    id: "GĐ3",
    title: "Vòng lặp tối ưu",
    goal: "Nhân cái ra lead, cắt cái đốt tiền — chi phí/lead giảm dần",
    tasks: [
      { id: "G3-loop", title: "Đọc số liệu mỗi tuần, điều chỉnh", status: "todo" },
    ],
  },
];
