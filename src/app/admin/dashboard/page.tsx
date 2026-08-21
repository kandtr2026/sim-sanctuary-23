"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSimData } from "@/hooks/useSimData";
import { PRICE_RANGES } from "@/lib/simUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostRow {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border bg-card p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
  </div>
);

function AdminDashboardContent() {
  const { user, signOut } = useAdminAuth();
  // Reuses the exact same live-inventory feed (Google Sheet -> fetch-sim-data
  // edge function -> normalized SIMs) that the public storefront already
  // uses, so "how many numbers of what kind are in stock" always matches
  // what a visitor actually sees on the site — no separate data pipeline to
  // keep in sync.
  const { allSims, isLoading: simsLoading, tagCounts, prefixes } = useSimData();

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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Trang quản trị</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="container mx-auto space-y-10 px-4 py-8">
        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">Thống kê kho số (đang bán)</h2>
          {simsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu kho...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <StatCard label="Tổng số còn hàng" value={allSims.length.toLocaleString("vi-VN")} />
                {Object.entries(networkCounts).map(([network, count]) => (
                  <StatCard key={network} label={network} value={count.toLocaleString("vi-VN")} />
                ))}
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Theo khoảng giá</h3>
                  <ul className="space-y-1.5 text-sm">
                    {priceBucketCounts
                      .filter((b) => b.count > 0)
                      .map((b) => (
                        <li key={b.label} className="flex items-center justify-between text-muted-foreground">
                          <span>{b.label}</span>
                          <span className="font-medium text-foreground">{b.count.toLocaleString("vi-VN")}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="mb-3 text-sm font-medium text-foreground">Loại số phổ biến nhất</h3>
                  <ul className="space-y-1.5 text-sm">
                    {topTags.map(([tag, count]) => (
                      <li key={tag} className="flex items-center justify-between text-muted-foreground">
                        <span>{tag}</span>
                        <span className="font-medium text-foreground">{count.toLocaleString("vi-VN")}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Đầu 3 số phổ biến nhất: {prefixes.prefix3.slice(0, 10).join(", ") || "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Bài viết</h2>
            <Button asChild size="sm">
              <Link href="/admin/posts/new">
                <Plus className="mr-2 h-4 w-4" />
                Đăng bài mới
              </Link>
            </Button>
          </div>

          {postsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài viết...
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bài viết nào được tạo qua trang quản trị.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tiêu đề</th>
                    <th className="px-4 py-2 font-medium">Danh mục</th>
                    <th className="px-4 py-2 font-medium">Trạng thái</th>
                    <th className="px-4 py-2 font-medium">Cập nhật</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td className="px-4 py-2 text-foreground">
                        {post.title}
                        <div className="text-xs text-muted-foreground">/tin-tuc/{post.slug}</div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{post.category || "—"}</td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            post.published
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                              : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          }
                        >
                          {post.published ? "Đã đăng" : "Nháp"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(post.updated_at).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/posts/${post.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void handleDeletePost(post)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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
