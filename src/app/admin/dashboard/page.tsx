"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Crown, FileText, Smartphone, TrendingUp, Wallet } from "lucide-react";
import { BarList } from "@/components/admin/BarList";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { PostsTable, type PostRow } from "@/components/admin/PostsTable";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { SalesChart } from "@/components/admin/SalesChart";
import { StatCard } from "@/components/admin/StatCard";
import { PageVisitsSection } from "@/components/admin/PageVisitsSection";
import { ConversionsSection } from "@/components/admin/ConversionsSection";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getLastUpdateInfo, getPromotionalData, useSimData } from "@/hooks/useSimData";
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
  const { allSims, isLoading: simsLoading, isFetching, forceReload, tagCounts, prefixes } = useSimData();

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
    const total = allSims.length;
    const inventoryValue = allSims.reduce((sum, sim) => sum + (sim.price || 0), 0);
    const discountedCount = allSims.filter((sim) => {
      const promo = getPromotionalData(sim.id);
      return promo?.finalPrice && promo.originalPrice > 0 && promo.finalPrice < promo.originalPrice;
    }).length;
    return {
      total,
      inventoryValue,
      avgPrice: total > 0 ? inventoryValue / total : 0,
      maxPrice: Math.max(0, ...allSims.map((sim) => sim.price || 0)),
      vipCount: allSims.filter((sim) => sim.isVIP).length,
      discountedCount,
    };
  }, [allSims]);

  const networkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sim of allSims) {
      counts[sim.network] = (counts[sim.network] ?? 0) + 1;
    }
    return counts;
  }, [allSims]);

  const priceBucketCounts = useMemo(() => {
    return PRICE_RANGES.map((range) => ({
      label: range.label,
      count: allSims.filter((s) => s.price >= range.min && s.price <= range.max).length,
    }));
  }, [allSims]);

  const topTags = useMemo(
    () =>
      Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8),
    [tagCounts],
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

  const lastUpdate = getLastUpdateInfo();
  const lastUpdateLabel = lastUpdate.timestamp
    ? new Date(lastUpdate.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const publishedCount = posts.filter((post) => post.published).length;
  const draftCount = posts.length - publishedCount;
  const discountPct = stats.total > 0 ? Math.round((stats.discountedCount / stats.total) * 100) : 0;

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
        isFetching={isFetching}
        onRefresh={() => forceReload()}
        onSignOut={() => void signOut()}
      />

      <main className="container space-y-10 px-4 py-8">
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
                <StatCard
                  label="SIM đang giảm giá"
                  value={stats.discountedCount.toLocaleString("vi-VN")}
                  sub={`${discountPct}% tổng kho`}
                  icon={BadgePercent}
                  iconClass="bg-primary/15 text-primary"
                  valueClass="text-primary"
                />
                <StatCard
                  label="SIM VIP"
                  value={stats.vipCount.toLocaleString("vi-VN")}
                  icon={Crown}
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

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <BarList title="Phân bố theo mạng" items={networkItems} />
                <BarList title="Theo khoảng giá" items={priceItems} />
                <BarList
                  title="Loại số phổ biến nhất"
                  items={tagItems}
                  footer={
                    <div className="border-t border-border pt-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Đầu số phổ biến</p>
                      <div className="flex flex-wrap gap-1.5">
                        {prefixes.prefix3.slice(0, 10).map((prefix) => (
                          <span
                            key={prefix}
                            className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground"
                          >
                            {prefix}
                          </span>
                        ))}
                      </div>
                    </div>
                  }
                />
              </div>
            </>
          )}
        </section>

        <SalesChart />

        <PageVisitsSection />

        <ConversionsSection />

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
