import Link from "next/link";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface PostsTableProps {
  posts: PostRow[];
  loading: boolean;
  onDelete: (post: PostRow) => void;
}

const PostSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between gap-4">
        <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
        <div className="hidden h-4 w-1/5 animate-pulse rounded bg-muted sm:block" />
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

export function PostsTable({ posts, loading, onDelete }: PostsTableProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">Bài viết</h2>
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" />
            Đăng bài mới
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Chưa có bài viết nào</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Chưa có bài viết nào được tạo qua trang quản trị.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" />
              Tạo bài viết đầu tiên
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Tiêu đề</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Danh mục</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Cập nhật</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => (
                <tr key={post.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-foreground">
                    {post.title}
                    <div className="text-xs text-muted-foreground">/tin-tuc/{post.slug}</div>
                  </td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                    {post.category || "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {post.published ? (
                      <Badge className="border-none bg-emerald-500/15 text-emerald-400">Đã đăng</Badge>
                    ) : (
                      <Badge variant="secondary" className="border-none">
                        Nháp
                      </Badge>
                    )}
                  </td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">
                    {new Date(post.updated_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/posts/${post.id}`} aria-label={`Sửa bài viết "${post.title}"`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(post)}
                        aria-label={`Xoá bài viết "${post.title}"`}
                      >
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
  );
}
