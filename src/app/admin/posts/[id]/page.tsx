"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip Vietnamese diacritics
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

interface FormState {
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  category: string;
  cover_image_url: string;
  content_html: string;
  published: boolean;
}

const EMPTY_FORM: FormState = {
  slug: "",
  title: "",
  meta_title: "",
  meta_description: "",
  category: "",
  cover_image_url: "",
  content_html: "",
  published: false,
};

function AdminPostEditorContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isEditing = id !== "new";
  const router = useRouter();
  const { user } = useAdminAuth();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `${isEditing ? "Sửa bài viết" : "Đăng bài mới"} – Quản trị`;
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Không tìm thấy bài viết.");
        router.replace("/admin/dashboard");
        return;
      }
      setForm({
        slug: data.slug,
        title: data.title,
        meta_title: data.meta_title ?? "",
        meta_description: data.meta_description ?? "",
        category: data.category ?? "",
        cover_image_url: data.cover_image_url ?? "",
        content_html: data.content_html ?? "",
        published: data.published,
      });
      setSlugTouched(true);
      setLoading(false);
    })();
  }, [id, isEditing, router]);

  const updateTitle = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      // Auto-derive the slug from the title until the user edits it by hand.
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.title.trim()) {
      toast.error("Cần có tiêu đề và đường dẫn (slug).");
      return;
    }

    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      category: form.category.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      content_html: form.content_html,
      published: form.published,
    };

    const result = isEditing
      ? await supabase.from("blog_posts").update(payload).eq("id", id)
      : await supabase.from("blog_posts").insert({ ...payload, author_id: user?.id });

    setSaving(false);

    if (result.error) {
      // Unique constraint on slug is the most likely failure — surface it plainly.
      const message = result.error.message.includes("duplicate")
        ? "Đường dẫn (slug) này đã được dùng cho bài viết khác."
        : result.error.message;
      toast.error("Lưu thất bại: " + message);
      return;
    }

    toast.success(isEditing ? "Đã cập nhật bài viết." : "Đã tạo bài viết.");
    router.replace("/admin/dashboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Quay lại quản trị
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-lg font-semibold text-foreground">
          {isEditing ? "Sửa bài viết" : "Đăng bài mới"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="post-title">Tiêu đề</Label>
            <Input id="post-title" required value={form.title} onChange={(e) => updateTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-slug">
              Đường dẫn (slug) — trang sẽ hiện tại /tin-tuc/{form.slug || "..."}
            </Label>
            <Input
              id="post-slug"
              required
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
              }}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="post-category">Danh mục</Label>
              <Input
                id="post-category"
                placeholder="Phong thuỷ, Đầu số, Tin tức..."
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-cover">Ảnh bìa (URL)</Label>
              <Input
                id="post-cover"
                value={form.cover_image_url}
                onChange={(e) => setForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-meta-title">Meta title (SEO — để trống sẽ dùng Tiêu đề)</Label>
            <Input
              id="post-meta-title"
              value={form.meta_title}
              onChange={(e) => setForm((prev) => ({ ...prev, meta_title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-meta-desc">Meta description (SEO)</Label>
            <Textarea
              id="post-meta-desc"
              rows={2}
              value={form.meta_description}
              onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content">
              Nội dung (HTML — dùng &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;&lt;li&gt; như các bài viết hiện có)
            </Label>
            <Textarea
              id="post-content"
              rows={16}
              className="font-mono text-sm"
              value={form.content_html}
              onChange={(e) => setForm((prev) => ({ ...prev, content_html: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="post-published"
              checked={form.published}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="post-published">
              {form.published ? "Đã đăng — hiển thị công khai" : "Nháp — chưa hiển thị công khai"}
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/dashboard")}>
              Huỷ
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function AdminPostEditorPage() {
  return (
    <RequireAdmin>
      <AdminPostEditorContent />
    </RequireAdmin>
  );
}
