import { BadgeCheck, RefreshCw, ShieldCheck, Tag, Truck } from "lucide-react";

/**
 * Khối "Cam kết khi mua" — dập lớp niềm tin cho khách từ Ads. Server Component:
 * render tĩnh, không có state/client logic. Mọi <a> href tel:/zalo.me bắn
 * generate_lead qua listener toàn cục — không cần onClick tracking riêng.
 */
const COMMITMENTS = [
  {
    icon: ShieldCheck,
    title: "Nhận SIM, kiểm tra rồi mới trả tiền",
    text: "Ship COD nội thành: cầm SIM, kích hoạt thử rồi mới thanh toán.",
  },
  {
    icon: BadgeCheck,
    title: "Sang tên chính chủ 100%",
    text: "Hỗ trợ sang tên qua cửa hàng MobiFone / app My MobiFone.",
  },
  {
    icon: Tag,
    title: "Giá niêm yết công khai",
    text: "Giá hiện ngay trên số — không phí ẩn, không hét giá.",
  },
  {
    icon: Truck,
    title: "Giao nhanh toàn quốc",
    text: "Nội thành HCM 30 phút–2 giờ; tỉnh khác 1–3 ngày.",
  },
  {
    icon: RefreshCw,
    title: "Đổi/hoàn nếu SIM lỗi",
    text: "SIM không kích hoạt được → đổi số khác hoặc hoàn tiền.",
  },
];

interface TrustCommitmentsProps {
  title?: string;
}

export default function TrustCommitments({
  title = "Cam kết khi mua tại CHONSOMOBIFONE.COM",
}: TrustCommitmentsProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
      <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
        <span className="h-8 w-1 rounded-full bg-primary" />
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMMITMENTS.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-lg bg-secondary/40 p-4"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
