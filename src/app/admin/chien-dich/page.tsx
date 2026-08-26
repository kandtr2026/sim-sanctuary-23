"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Megaphone, Pencil, Plus, Power, Trash2 } from "lucide-react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { CampaignType, SiteCampaign } from "@/lib/campaigns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// `site_campaigns` is intentionally NOT in the generated Supabase types (its
// migration may not be applied yet), so we reach it through a loosely-typed
// client. Every call is wrapped in try/catch + toast so a missing table never
// crashes the screen — see isMissingTable() below.
const db = () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- site_campaigns isn't in generated Supabase types (migration may be unapplied); loose cast per data-layer contract
  (supabase as unknown as { from: (t: string) => any }).from("site_campaigns");

const MIGRATION_MSG =
  "Bảng site_campaigns chưa được tạo trên Supabase — chạy migration trước.";

const TYPE_OPTIONS: { value: CampaignType; label: string }[] = [
  { value: "flash_sale", label: "Flash sale (đếm ngược tới giờ kết thúc)" },
  { value: "promo_banner", label: "Banner khuyến mãi" },
  { value: "featured_deal", label: "Ưu đãi nổi bật" },
];

const TYPE_LABEL: Record<string, string> = {
  flash_sale: "Flash sale",
  promo_banner: "Banner KM",
  featured_deal: "Ưu đãi nổi bật",
};

const TYPE_BADGE: Record<string, string> = {
  flash_sale: "bg-red-500/15 text-red-400",
  promo_banner: "bg-sky-500/15 text-sky-400",
  featured_deal: "bg-gold/15 text-gold",
};

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

const pad = (n: number) => String(n).padStart(2, "0");

// timestamptz ISO -> value for <input type="datetime-local"> (local wall clock)
const toLocalInput = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// datetime-local value (local) -> ISO string for storage, or null when empty
const fromLocalInput = (v: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const parseTags = (csv: string): string[] | null => {
  const arr = csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
};

// A not-yet-applied migration surfaces as one of these; treat as "run migration".
const isMissingTable = (err: { code?: string; message?: string } | null): boolean => {
  if (!err) return false;
  const msg = err.message ?? "";
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    /could not find the table|schema cache|does not exist/i.test(msg)
  );
};

interface FormState {
  name: string;
  slug: string;
  type: CampaignType;
  active: boolean;
  headline: string;
  subline: string;
  cta_label: string;
  cta_url: string;
  discount_note: string;
  target_tags: string; // CSV in the input, split to text[] on save
  starts_at: string; // datetime-local
  ends_at: string; // datetime-local
  sort: string; // number in a text field
}

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  type: "promo_banner",
  active: false,
  headline: "",
  subline: "",
  cta_label: "",
  cta_url: "",
  discount_note: "",
  target_tags: "",
  starts_at: "",
  ends_at: "",
  sort: "0",
};

function AdminChienDichContent() {
  const [list, setList] = useState<SiteCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Chiến dịch bán hàng – CHONSOMOBIFONE.COM";
  }, []);

  const load = async () => {
    setLoading(true);
    setListError(null);
    try {
      const { data, error } = await db()
        .select("*")
        .order("sort", { ascending: true })
        .order("id", { ascending: true });
      if (error) {
        setListError(isMissingTable(error) ? MIGRATION_MSG : error.message);
        setList([]);
      } else {
        setList((data ?? []) as SiteCampaign[]);
      }
    } catch {
      setListError("Không thể tải danh sách chiến dịch.");
      setList([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugTouched(false);
  };

  const startEdit = (row: SiteCampaign) => {
    setForm({
      name: row.name,
      slug: row.slug,
      type: (row.type as CampaignType) || "promo_banner",
      active: row.active,
      headline: row.headline ?? "",
      subline: row.subline ?? "",
      cta_label: row.cta_label ?? "",
      cta_url: row.cta_url ?? "",
      discount_note: row.discount_note ?? "",
      target_tags: (row.target_tags ?? []).join(", "),
      starts_at: toLocalInput(row.starts_at),
      ends_at: toLocalInput(row.ends_at),
      sort: String(row.sort ?? 0),
    });
    setEditingId(row.id);
    setSlugTouched(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateName = (name: string) => {
    setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Cần có Tên và Slug.");
      return;
    }
    const startIso = fromLocalInput(form.starts_at);
    const endIso = fromLocalInput(form.ends_at);
    if (startIso && endIso && endIso <= startIso) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      type: form.type,
      active: form.active,
      headline: form.headline.trim() || null,
      subline: form.subline.trim() || null,
      cta_label: form.cta_label.trim() || null,
      cta_url: form.cta_url.trim() || null,
      discount_note: form.discount_note.trim() || null,
      target_tags: parseTags(form.target_tags),
      starts_at: startIso,
      ends_at: endIso,
      sort: Number.parseInt(form.sort, 10) || 0,
    };

    setSaving(true);
    try {
      const result =
        editingId != null
          ? await db().update(payload).eq("id", editingId)
          : await db().insert(payload);
      if (result.error) {
        const err = result.error as { code?: string; message?: string };
        if (isMissingTable(err)) toast.error(MIGRATION_MSG);
        else if (/duplicate|unique/i.test(err.message ?? ""))
          toast.error("Slug này đã được dùng cho chiến dịch khác.");
        else toast.error("Lưu thất bại: " + (err.message ?? "lỗi không rõ"));
        return;
      }
      toast.success(editingId != null ? "Đã cập nhật chiến dịch." : "Đã tạo chiến dịch.");
      resetForm();
      void load();
    } catch {
      toast.error("Lưu thất bại — kiểm tra kết nối / quyền admin.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: SiteCampaign) => {
    try {
      const { error } = await db().update({ active: !row.active }).eq("id", row.id);
      if (error) {
        toast.error(isMissingTable(error) ? MIGRATION_MSG : "Đổi trạng thái thất bại: " + error.message);
        return;
      }
      setList((prev) => prev.map((c) => (c.id === row.id ? { ...c, active: !c.active } : c)));
      toast.success(row.active ? "Đã tắt chiến dịch." : "Đã bật chiến dịch.");
    } catch {
      toast.error("Đổi trạng thái thất bại.");
    }
  };

  const remove = async (row: SiteCampaign) => {
    if (!window.confirm(`Xoá chiến dịch "${row.name}"? Không thể hoàn tác.`)) return;
    try {
      const { error } = await db().delete().eq("id", row.id);
      if (error) {
        toast.error(isMissingTable(error) ? MIGRATION_MSG : "Xoá thất bại: " + error.message);
        return;
      }
      setList((prev) => prev.filter((c) => c.id !== row.id));
      if (editingId === row.id) resetForm();
      toast.success("Đã xoá chiến dịch.");
    } catch {
      toast.error("Xoá thất bại.");
    }
  };

  const activeCount = useMemo(() => list.filter((c) => c.active).length, [list]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex items-center gap-3 px-4 py-3">
          <a
            href="/admin/dashboard"
            aria-label="Quay lại Bảng điều khiển"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div className="flex min-w-0 items-center gap-2">
            <Megaphone className="h-5 w-5 shrink-0 text-gold" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Chiến dịch bán hàng</h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {list.length} chiến dịch · {activeCount} đang bật
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl space-y-8 px-4 py-8">
        {/* Form tạo / sửa */}
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId != null ? `Sửa chiến dịch #${editingId}` : "Tạo chiến dịch mới"}
            </h2>
            {editingId != null ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Tạo mới
              </Button>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Tên chiến dịch</Label>
              <Input
                id="c-name"
                required
                placeholder="VD: Flash sale sim tứ quý cuối tuần"
                value={form.name}
                onChange={(e) => updateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-slug">Slug (cũng là utm_campaign)</Label>
              <Input
                id="c-slug"
                required
                placeholder="flash-sale-tu-quy"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Gắn <span className="font-mono">?utm_campaign={form.slug || "..."}</span> vào link Ads để đo hiệu quả.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-type">Loại</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((prev) => ({ ...prev, type: v as CampaignType }))}
              >
                <SelectTrigger id="c-type" aria-label="Loại chiến dịch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-sort">Thứ tự (số nhỏ hiện trước)</Label>
              <Input
                id="c-sort"
                type="number"
                inputMode="numeric"
                value={form.sort}
                onChange={(e) => setForm((prev) => ({ ...prev, sort: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Switch
              id="c-active"
              checked={form.active}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="c-active" className="cursor-pointer">
              {form.active ? "Đang bật — hiển thị trên web (nếu trong khung giờ)" : "Đang tắt — không hiển thị"}
            </Label>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="c-headline">Tiêu đề hiển thị (headline)</Label>
            <Input
              id="c-headline"
              placeholder="VD: Giảm đến 30% sim tứ quý — chỉ hôm nay"
              value={form.headline}
              onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
            />
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="c-subline">Mô tả phụ (subline)</Label>
            <Textarea
              id="c-subline"
              rows={2}
              value={form.subline}
              onChange={(e) => setForm((prev) => ({ ...prev, subline: e.target.value }))}
            />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-cta-label">Nhãn nút CTA</Label>
              <Input
                id="c-cta-label"
                placeholder="VD: Xem ngay / Chat Zalo"
                value={form.cta_label}
                onChange={(e) => setForm((prev) => ({ ...prev, cta_label: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-cta-url">Link nút CTA</Label>
              <Input
                id="c-cta-url"
                type="url"
                inputMode="url"
                placeholder="/sim-tu-quy hoặc https://zalo.me/..."
                value={form.cta_url}
                onChange={(e) => setForm((prev) => ({ ...prev, cta_url: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-discount">Ghi chú giảm giá</Label>
              <Input
                id="c-discount"
                placeholder="VD: -30% / Tặng sim phong thủy"
                value={form.discount_note}
                onChange={(e) => setForm((prev) => ({ ...prev, discount_note: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-tags">Tag mục tiêu (phân tách bằng dấu phẩy)</Label>
              <Input
                id="c-tags"
                placeholder="tu-quy, than-tai, nam-sinh"
                value={form.target_tags}
                onChange={(e) => setForm((prev) => ({ ...prev, target_tags: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-starts">Bắt đầu (để trống = ngay lập tức)</Label>
              <Input
                id="c-starts"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((prev) => ({ ...prev, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-ends">Kết thúc (để trống = không giới hạn)</Label>
              <Input
                id="c-ends"
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((prev) => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId != null ? "Lưu thay đổi" : "Tạo chiến dịch"}
            </Button>
            {editingId != null ? (
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Huỷ
              </Button>
            ) : null}
          </div>
        </form>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Danh sách chiến dịch</h2>

          {loading ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="ml-auto h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : listError ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-10 text-center shadow-card">
              <p className="text-sm font-medium text-amber-400">{listError}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Nếu bảng chưa có, chạy migration <span className="font-mono">supabase/migrations/20260826030000_site_campaigns.sql</span> rồi thử lại.
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Megaphone className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Chưa có chiến dịch nào</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tạo chiến dịch đầu tiên bằng biểu mẫu phía trên.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Chiến dịch</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Loại</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Trạng thái</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Thời gian</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.map((row) => {
                    const fmt = (iso: string | null) =>
                      iso ? new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
                    return (
                      <tr key={row.id} className="align-top transition-colors hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{row.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">utm_campaign={row.slug}</p>
                          <span className="mt-1 inline-flex sm:hidden">
                            <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", TYPE_BADGE[row.type] ?? "bg-muted text-muted-foreground")}>
                              {TYPE_LABEL[row.type] ?? row.type}
                            </span>
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", TYPE_BADGE[row.type] ?? "bg-muted text-muted-foreground")}>
                            {TYPE_LABEL[row.type] ?? row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              row.active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", row.active ? "bg-emerald-400" : "bg-muted-foreground")} />
                            {row.active ? "Bật" : "Tắt"}
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground md:table-cell">
                          <div>Bắt đầu: {fmt(row.starts_at)}</div>
                          <div>Kết thúc: {fmt(row.ends_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void toggleActive(row)}
                              aria-label={row.active ? `Tắt chiến dịch "${row.name}"` : `Bật chiến dịch "${row.name}"`}
                              title={row.active ? "Tắt" : "Bật"}
                            >
                              <Power className={cn("h-4 w-4", row.active ? "text-emerald-400" : "text-muted-foreground")} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(row)}
                              aria-label={`Sửa chiến dịch "${row.name}"`}
                              title="Sửa"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void remove(row)}
                              aria-label={`Xoá chiến dịch "${row.name}"`}
                              title="Xoá"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminChienDichPage() {
  return (
    <RequireAdmin>
      <AdminChienDichContent />
    </RequireAdmin>
  );
}
