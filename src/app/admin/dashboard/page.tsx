"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarHeart, Download, ExternalLink, FileText, Globe, LayoutDashboard, Loader2, ShoppingCart, Smartphone, TrendingUp, Wallet } from "lucide-react";
import { BarList } from "@/components/admin/BarList";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { PostsTable, type PostRow } from "@/components/admin/PostsTable";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { SalesChart } from "@/components/admin/SalesChart";
import { StatCard } from "@/components/admin/StatCard";
import { PageVisitsSection } from "@/components/admin/PageVisitsSection";
import { ConversionsSection } from "@/components/admin/ConversionsSection";
import { CampaignPerformanceSection } from "@/components/admin/CampaignPerformanceSection";
import { TikTokShopSection } from "@/components/admin/TikTokShopSection";
import { ShopeeSummaryCard } from "@/components/admin/ShopeeSummaryCard";
import { SimBirthdaySection } from "@/components/admin/SimBirthdaySection";
import { ShopeeSalesSection } from "@/components/admin/ShopeeSalesSection";
import { PostReadsSection } from "@/components/admin/PostReadsSection";
import { VisitTrendSection } from "@/components/admin/VisitTrendSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getLastUpdateInfo, useSimData } from "@/hooks/useSimData";
import { formatPrice, PRICE_RANGES } from "@/lib/simUtils";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Một dòng SIM rút gọn trả từ /api/admin/vip-sims để liệt kê trong dialog. */
interface VipSimLite {
  id: string;
  digits: string;
  number: string;
  price: number;
  network: string;
}

/**
 * Chia dashboard thành các TAB cho gọn (góp ý #16): mọi thống kê SEO / lượt truy
 * cập gom vào tab Traffic; kho số ở Tổng quan; SIM đã bán + kênh sàn ở Doanh thu;
 * Shopee đứng riêng. Đổi tab chỉ mount đúng phần đang xem — các section tự fetch
 * data khi mở nên trang không nặng ngay từ đầu.
 */
type TabId = "tong-quan" | "traffic" | "bai-viet" | "doanh-thu" | "sim-sinh-nhat";
const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "tong-quan", label: "Tổng quan", icon: LayoutDashboard },
  { id: "traffic", label: "Traffic", icon: Globe },
  { id: "bai-viet", label: "Bài viết", icon: FileText },
  { id: "doanh-thu", label: "Doanh thu", icon: Wallet },
  // Dự án riêng, chạy song song với kho số đang bán — xem SimBirthdaySection.
  { id: "sim-sinh-nhat", label: "Sim sinh nhật", icon: CalendarHeart },
];

const formatCompactVnd = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(0)} tr`
      : n.toLocaleString("vi-VN");

function AdminDashboardContent() {
  const { user, session, signOut } = useAdminAuth();
  const token = session?.access_token;
  const [tab, setTab] = useState<TabId>("tong-quan");

  // Tab có link riêng (?tab=…) để refresh vẫn ở đúng tab (góp ý #44). Đọc URL khi
  // vào/refresh; đổi tab thì cập nhật URL bằng replaceState (không điều hướng lại).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId);
  }, []);
  const doiTab = (id: TabId) => {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(null, "", url.toString());
  };
  const [exportingSims, setExportingSims] = useState(false);
  // Danh sách SIM VIP theo nhóm — tải LƯỜI (chỉ khi A Khoa bấm vào 1 chip
  // breakdown lần đầu), rồi giữ lại cho các lần bấm sau (góp ý #13).
  const [vipGroups, setVipGroups] = useState<Record<string, VipSimLite[]> | null>(null);
  const [vipLoading, setVipLoading] = useState(false);
  const [vipError, setVipError] = useState<string | null>(null);
  const [selectedVipCat, setSelectedVipCat] = useState<string | null>(null);
  // Reuses the exact same live-inventory feed (Google Sheet -> fetch-sim-data
  // edge function -> normalized SIMs) that the public storefront already
  // uses, so "how many numbers of what kind are in stock" always matches
  // what a visitor actually sees on the site — no separate data pipeline to
  // keep in sync.
  const { allSims, isLoading: simsLoading, tagCounts } = useSimData();

  // Server-side stats: total SIM + inventory value (authoritative ~49k, không
  // bị fallback cache 14k của useSimData). Fetch 1 lần, cache 5 phút.
  // Số liệu TOÀN KHO (~49k) từ server — các mục phân bổ phải dùng cái này, KHÔNG
  // đếm từ allSims (chỉ ~14k client tải) kẻo cộng thiếu (góp ý #7).
  const [serverStats, setServerStats] = useState<{
    total: number;
    totalValue: number;
    vipCount: number;
    vipBreakdown: Record<string, number>;
    networkCounts: Record<string, number>;
    priceCounts: number[];
    tagCounts: Record<string, number>;
    phongThuyCounts: { label: string; count: number }[];
  } | null>(null);
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => { if (r.ok) return r.json(); return null; })
      .then((d) => { if (d) setServerStats(d); })
      .catch(() => {});
  }, []);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    document.title = "Quản trị – CHONSOMOBIFONE.COM";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, category, published, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        toast.error("Không tải được danh sách bài viết: " + error.message);
      } else {
        setPosts((data ?? []) as PostRow[]);
      }
      setPostsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    // Ưu tiên số liệu server (đủ ~49k) — nếu chưa tải xong dùng allSims tạm.
    const total = serverStats?.total ?? allSims.length;
    const inventoryValue = serverStats?.totalValue ?? allSims.reduce((sum, sim) => sum + (sim.price || 0), 0);
    return {
      total,
      inventoryValue,
      avgPrice: total > 0 ? inventoryValue / total : 0,
      maxPrice: Math.max(0, ...allSims.map((sim) => sim.price || 0)),
      vipCount: serverStats?.vipCount ?? allSims.filter((sim) => sim.isVIP).length,
    };
  }, [allSims, serverStats]);

  // Ưu tiên số toàn kho từ server; chỉ rơi về allSims khi server chưa tải xong.
  const networkCounts = useMemo(() => {
    if (serverStats?.networkCounts) return serverStats.networkCounts;
    const counts: Record<string, number> = {};
    for (const sim of allSims) {
      counts[sim.network] = (counts[sim.network] ?? 0) + 1;
    }
    return counts;
  }, [allSims, serverStats]);

  const priceBucketCounts = useMemo(() => {
    if (serverStats?.priceCounts) {
      return PRICE_RANGES.map((range, i) => ({
        label: range.label,
        count: serverStats.priceCounts[i] ?? 0,
      }));
    }
    return PRICE_RANGES.map((range) => ({
      label: range.label,
      count: allSims.filter((s) => s.price >= range.min && s.price <= range.max).length,
    }));
  }, [allSims, serverStats]);

  const topTags = useMemo(
    () =>
      Object.entries(serverStats?.tagCounts ?? tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    [tagCounts, serverStats],
  );

  const networkItems = useMemo(
    () =>
      Object.entries(networkCounts)
        .sort((a, b) => {
          const isMobifoneA = a[0] === "Mobifone" ? 0 : 1;
          const isMobifoneB = b[0] === "Mobifone" ? 0 : 1;
          if (isMobifoneA !== isMobifoneB) return isMobifoneA - isMobifoneB;
          return b[1] - a[1];
        })
        .map(([network, count]) => ({
          label: network,
          count,
          fillClass: network === "Mobifone" ? "bg-primary" : "bg-muted-foreground/40",
        })),
    [networkCounts],
  );

  const priceItems = useMemo(
    () =>
      priceBucketCounts
        .filter((bucket) => bucket.count > 0)
        .map((bucket) => ({
          label: bucket.label,
          count: bucket.count,
          fillClass: "bg-[hsl(var(--gold-soft))]",
        })),
    [priceBucketCounts],
  );

  const tagItems = useMemo(
    () =>
      topTags.map(([tag, count]) => ({
        label: tag,
        count,
        fillClass: "bg-[hsl(var(--gold-soft))]",
      })),
    [topTags],
  );

  // Phân bố kho theo dải điểm phong thủy (góp ý #22) — server đã xếp cao→thấp.
  const phongThuyItems = useMemo(
    () =>
      (serverStats?.phongThuyCounts ?? [])
        .filter((b) => b.count > 0)
        .map((b) => ({ label: b.label, count: b.count, fillClass: "bg-emerald-500/60" })),
    [serverStats],
  );

  const lastUpdate = getLastUpdateInfo();
  const lastUpdateLabel = lastUpdate.timestamp
    ? new Date(lastUpdate.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;

  const handleDeletePost = async (post: PostRow) => {
    if (!window.confirm(`Xoá bài viết "${post.title}"? Không thể hoàn tác.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
    if (error) {
      toast.error("Xoá thất bại: " + error.message);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    toast.success("Đã xoá bài viết.");
  };

  // Bấm 1 chip breakdown → mở dialog liệt kê SIM của nhóm đó. Lần đầu mới tải
  // /api/admin/vip-sims (gom theo nhóm), sau đó dùng lại (góp ý #13).
  const openVipCat = (cat: string) => {
    setSelectedVipCat(cat);
    if (vipGroups || vipLoading) return;
    setVipLoading(true);
    setVipError(null);
    fetch("/api/admin/vip-sims")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { groups: Record<string, VipSimLite[]> }) => setVipGroups(d.groups ?? {}))
      .catch((e) => setVipError(e instanceof Error ? e.message : "Không tải được danh sách"))
      .finally(() => setVipLoading(false));
  };

  const selectedVipSims = selectedVipCat ? (vipGroups?.[selectedVipCat] ?? []) : [];

  // Xuất Excel toàn bộ SIM đang bán, đủ trường (bảng sims + join Sheet1). Chỉ
  // admin — route requireAdmin, tải về bằng token phiên (góp ý #12).
  const handleExportSims = async () => {
    if (!token) {
      toast.error("Chưa đăng nhập.");
      return;
    }
    setExportingSims(true);
    const t = toast.loading("Đang gom dữ liệu SIM (bảng số + Sheet)…");
    try {
      const res = await fetch("/api/admin/export-sims", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const count = res.headers.get("X-Sim-Count") ?? "";
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = /filename="?([^"]+)"?/.exec(cd);
      const filename = m?.[1] || `sim-data_day-du_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(count ? `Đã xuất ${Number(count).toLocaleString("vi-VN")} SIM ra Excel` : "Đã xuất Excel", { id: t });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xuất thất bại", { id: t });
    } finally {
      setExportingSims(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        email={user?.email ?? ""}
        lastUpdate={lastUpdateLabel}
        simCount={stats.total}
        isCache={lastUpdate.isCache}
        onSignOut={() => void signOut()}
      />

      <main className="container space-y-8 px-4 py-8">
        {/* Thanh tab điều hướng (góp ý #16) */}
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/30 p-1" aria-label="Khu vực dashboard">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => doiTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
          {/* Shopee: bấm vào đi thẳng trang quản lý, khỏi phải click thêm (góp ý #17) */}
          <a
            href="/admin/shopee"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ShoppingCart className="h-4 w-4" />
            Shopee
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </nav>

        {/* ─── Tab TỔNG QUAN: kho số + tóm tắt Shopee (góp ý #30) ─── */}
        {tab === "tong-quan" && (
          <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Smartphone className="h-4 w-4 text-primary" />
                Thống kê kho số (đang bán)
              </h2>
              <button
                type="button"
                onClick={() => void handleExportSims()}
                disabled={exportingSims}
                title="Tải Excel toàn bộ SIM đang bán, đủ trường (kèm giá thu về từ Sheet)"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
              >
                {exportingSims ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {exportingSims ? "Đang xuất…" : "Xuất data SIM"}
              </button>
            </div>

            {simsLoading ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard label="Tổng SIM còn hàng" value={stats.total.toLocaleString("vi-VN")} icon={Smartphone} />
                  <StatCard
                    label="Tổng giá trị kho"
                    value={formatCompactVnd(stats.inventoryValue)}
                    icon={Wallet}
                    iconClass="bg-gold/15 text-gold"
                    valueClass="text-gold"
                  />
                  <StatCard label="Giá trung bình" value={formatPrice(stats.avgPrice)} icon={TrendingUp} />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <BarList title="Phân bố theo mạng" items={networkItems} />
                  <BarList title="Theo khoảng giá" items={priceItems} />
                  <BarList title="Phân bố theo điểm phong thủy" items={phongThuyItems} />
                  <BarList title="Loại số phổ biến nhất" items={tagItems} />
                </div>
              </>
            )}
          </section>

            <ShopeeSummaryCard />
            <ShopeeSalesSection />
            <TikTokShopSection />
          </div>
        )}

        {/* ─── Tab TRAFFIC: SEO + lượt truy cập (góp ý #16) ─── */}
        {tab === "traffic" && (
          <div className="space-y-10">
            <VisitTrendSection token={token} />
            <PageVisitsSection />
            <ConversionsSection />
            <CampaignPerformanceSection />
          </div>
        )}

        {/* ─── Tab BÀI VIẾT: thống kê + hiệu quả đọc, tab riêng (góp ý #18, #19) ─── */}
        {tab === "bai-viet" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Thống kê bài viết
              </h2>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <StatCard label="Tổng bài viết" value={posts.length.toLocaleString("vi-VN")} icon={FileText} />
                <StatCard
                  label="Đã đăng"
                  value={publishedCount.toLocaleString("vi-VN")}
                  icon={FileText}
                  iconClass="bg-primary/15 text-primary"
                  valueClass="text-primary"
                />
                <StatCard
                  label="Nháp"
                  value={draftCount.toLocaleString("vi-VN")}
                  icon={FileText}
                  iconClass="bg-gold/15 text-gold"
                  valueClass="text-gold"
                />
              </div>
              <PostReadsSection posts={posts} token={token} />
            </section>

            <PostsTable posts={posts} loading={postsLoading} onDelete={(post) => void handleDeletePost(post)} />
          </div>
        )}

        {/* ─── Tab DOANH THU: SIM đã bán + kênh sàn ─── */}
        {tab === "doanh-thu" && (
          <div className="space-y-10">
            <SalesChart />
            <TikTokShopSection />
          </div>
        )}

        {/* ─── Tab SIM SINH NHẬT: dự án ghép khách có ngày sinh ↔ sim mang đúng
            ngày đó. Kho và danh sách khách nằm ở bảng riêng, KHÔNG trộn vào kho
            số đang bán. ─── */}
        {tab === "sim-sinh-nhat" && <SimBirthdaySection token={token} />}

        {/* Danh sách SIM của nhóm VIP đang chọn (góp ý #13) — mount ở gốc để mọi
            tab đều mở được, dù chip nằm trong tab Tổng quan */}
        <Dialog open={!!selectedVipCat} onOpenChange={(open) => (open ? null : setSelectedVipCat(null))}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>SIM {selectedVipCat ?? ""}</DialogTitle>
            </DialogHeader>
            {vipLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách…
              </div>
            ) : vipError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-destructive">{vipError}</p>
                <button
                  type="button"
                  onClick={() => selectedVipCat && openVipCat(selectedVipCat)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {selectedVipSims.length.toLocaleString("vi-VN")} SIM · bấm số để mở trang SIM
                </p>
                {selectedVipSims.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Không có SIM trong nhóm này.</p>
                ) : (
                  <div className="max-h-[60vh] divide-y divide-border overflow-y-auto">
                    {selectedVipSims.map((sim) => (
                      <a
                        key={sim.id}
                        href={`/sim/${sim.digits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 py-2 text-sm transition-colors hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-1.5 font-medium tabular-nums text-foreground">
                          {sim.number}
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{sim.network}</span>
                        <span className="shrink-0 font-semibold text-gold">{formatPrice(sim.price)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <AdminDashboardContent />
    </RequireAdmin>
  );
}
