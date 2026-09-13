"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Crown, FileText, ShoppingCart, Smartphone, TrendingUp, Wallet } from "lucide-react";
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
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getLastUpdateInfo, useSimData } from "@/hooks/useSimData";
import { formatPrice, PRICE_RANGES } from "@/lib/simUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatCompactVnd = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(1)} tỷ`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(0)} tr`
      : n.toLocaleString("vi-VN");

function AdminDashboardContent() {
  const { user, signOut } = useAdminAuth();
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

  // Phân rã SIM VIP theo từng nhóm (từ server, toàn kho) — hiện count>0, nhiều nhất trước.
  const vipBreakdownItems = useMemo(() => {
    const b = serverStats?.vipBreakdown;
    if (!b) return [] as [string, number][];
    return Object.entries(b)
      .filter(([, n]) => n > 0)
      .sort((x, y) => y[1] - x[1]);
  }, [serverStats]);

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        email={user?.email ?? ""}
        lastUpdate={lastUpdateLabel}
        simCount={stats.total}
        isCache={lastUpdate.isCache}
        onSignOut={() => void signOut()}
      />

      <main className="container space-y-10 px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/admin/shopee"
            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/40 hover:bg-card/70"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Shopee bán hàng
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Đồng bộ lô SIM lên Shopee · quản lý sản phẩm đã đăng
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">Thống kê kho số (đang bán)</h2>

          {simsLoading ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Tổng SIM còn hàng" value={stats.total.toLocaleString("vi-VN")} icon={Smartphone} />
                <StatCard
                  label="Tổng giá trị kho"
                  value={formatCompactVnd(stats.inventoryValue)}
                  icon={Wallet}
                  iconClass="bg-gold/15 text-gold"
                  valueClass="text-gold"
                />
                <StatCard label="Giá trung bình" value={formatPrice(stats.avgPrice)} icon={TrendingUp} />
                <StatCard
                  label="Bài viết"
                  value={posts.length.toLocaleString("vi-VN")}
                  sub={postsLoading ? "Đang tải…" : `${publishedCount} đăng · ${draftCount} nháp`}
                  icon={FileText}
                />
              </div>

              {/* SIM VIP là gì — định nghĩa + phân rã thành phần (góp ý #8) */}
              <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <Crown className="h-4 w-4 text-gold" />
                  <h3 className="text-sm font-semibold text-foreground">SIM VIP là gì?</h3>
                  <span className="ml-auto text-sm font-bold text-gold">
                    {stats.vipCount.toLocaleString("vi-VN")} SIM VIP
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  SIM VIP = có 1 trong 4 dạng cao cấp (Lục quý · Ngũ quý · Tứ quý · Tam hoa kép)
                  {" "}<span className="font-semibold text-foreground">hoặc</span> giá từ 50 triệu trở lên.
                </p>
                {vipBreakdownItems.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vipBreakdownItems.map(([label, count]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="font-bold text-gold">{count.toLocaleString("vi-VN")}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Đang tải phân loại VIP…</p>
                )}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <BarList title="Phân bố theo mạng" items={networkItems} />
                <BarList title="Theo khoảng giá" items={priceItems} />
                <BarList title="Loại số phổ biến nhất" items={tagItems} />
              </div>
            </>
          )}
        </section>

        <SalesChart />

        <PageVisitsSection />

        <ConversionsSection />

        <CampaignPerformanceSection />

        <TikTokShopSection />

        <PostsTable posts={posts} loading={postsLoading} onDelete={(post) => void handleDeletePost(post)} />
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
