"use client";

/**
 * Quản trị Shopee — LÀM LẠI TỪ ĐẦU (A Khoa 15/09).
 *
 * Bản cũ (2184 dòng) gộp quá nhiều thứ vào một màn nên rối. A Khoa muốn xoá sạch
 * giao diện và dựng lại từng tính năng một. Tính năng ĐẦU TIÊN: danh sách các link
 * listing đang có trên Shopee (bấm mở / sao chép nhanh).
 *
 * Backend giữ nguyên — các route /api/admin/shopee/* vẫn còn đủ, tính năng sau
 * (đăng số, sửa giá, tắt biến thể…) sẽ được gắn lại dần khi A Khoa yêu cầu.
 *
 * Nguồn dữ liệu:
 *  - /api/admin/shopee/status          → cred (biết shop_id để dựng link)
 *  - /api/admin/shopee/items/snapshot  → danh sách listing đã cache (vào là thấy ngay)
 *  - /api/admin/shopee/items/from-shopee→ kéo mới nhất từ Shopee rồi lưu snapshot
 *  - /api/admin/shopee/config + auth-url→ khai báo & uỷ quyền shop (chỉ dùng khi setup)
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface CredStatus {
  configured: boolean;
  authorized: boolean;
  partnerId: string | null;
  shopId: string | null;
  env: string;
  tokenExpired: boolean;
  source: "db" | "env" | "none";
}

interface ShopeeVariant {
  model_id: number;
  label: string;
  sku: string | null;
  price: number;
  stock: number;
  inKho: boolean;
}

interface ShopeeListing {
  item_id: number;
  item_name: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
  sim_id: string | null;
  priceNote?: string;
  variants?: ShopeeVariant[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
const TRANG_THAI: Record<string, { label: string; cls: string }> = {
  NORMAL: { label: "Đang bán", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  UNLIST: { label: "Ngừng bán", cls: "bg-muted text-muted-foreground border-border" },
  UNLISTED: { label: "Ngừng bán", cls: "bg-muted text-muted-foreground border-border" },
  REVIEWING: { label: "Đang duyệt", cls: "bg-gold/15 text-gold border-gold/30" },
  BANNED: { label: "Bị khoá", cls: "bg-primary/15 text-primary border-primary/30" },
  DELETED: { label: "Đã xoá", cls: "bg-primary/15 text-primary border-primary/30" },
};

const trangThai = (s: string) =>
  TRANG_THAI[String(s || "").toUpperCase()] ?? { label: s || "—", cls: "bg-muted text-muted-foreground border-border" };

const formatVnd = (n: number) => (n > 0 ? n.toLocaleString("vi-VN") + "₫" : "—");

const giaListing = (it: ShopeeListing): string => {
  const prices = (it.variants ?? []).map((v) => v.price).filter((p) => p > 0);
  if (prices.length === 0) return it.priceNote || formatVnd(it.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatVnd(min) : `${formatVnd(min)} – ${formatVnd(max)}`;
};

const api = async <T,>(path: string, init?: RequestInit, token?: string): Promise<T> => {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string })?.error || `HTTP ${res.status}`);
  return body as T;
};

// ── Trang ──────────────────────────────────────────────────────────────────
function ShopeeAdminContent() {
  const { user, session } = useAdminAuth();
  const token = session?.access_token;

  const [cred, setCred] = useState<CredStatus | null>(null);
  const [listings, setListings] = useState<ShopeeListing[]>([]);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [q, setQ] = useState("");
  const [onlyLive, setOnlyLive] = useState(false);
  const [copiedId, setCopiedId] = useState<number | "all" | null>(null);

  // Panel kết nối — chỉ mở khi cần setup.
  const [showConnect, setShowConnect] = useState(false);
  const [cfg, setCfg] = useState({ partnerId: "", partnerKey: "", shopId: "", env: "live" });
  const [savingCfg, setSavingCfg] = useState(false);

  useEffect(() => {
    document.title = "Quản trị Shopee – CHONSOMOBIFONE.COM";
  }, []);

  // Nạp trạng thái kết nối (để biết shop_id dựng link) + snapshot listing.
  const loadAll = useCallback(async (tk: string) => {
    setLoading(true);
    try {
      const [st, snap] = await Promise.all([
        api<{ cred: CredStatus }>("/api/admin/shopee/status", {}, tk),
        api<{
          items: ShopeeListing[];
          fetchedAt: string | null;
          isStale: boolean;
        }>("/api/admin/shopee/items/snapshot", {}, tk).catch(() => null),
      ]);
      setCred(st.cred);
      if (!st.cred.authorized) setShowConnect(true);
      if (snap && snap.items.length > 0) {
        setListings(snap.items);
        setSnapshotAt(snap.fetchedAt);
        setStale(snap.isStale);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void loadAll(token);
  }, [token, loadAll]);

  // Kéo danh sách mới nhất trực tiếp từ Shopee (chậm hơn — gọi API Shopee).
  const handlePull = async () => {
    if (!token) return;
    setPulling(true);
    const t = toast.loading("Đang lấy danh sách mới nhất từ Shopee…");
    try {
      const data = await api<{ items: ShopeeListing[]; total: number; fetchedAt: string }>(
        "/api/admin/shopee/items/from-shopee",
        {},
        token,
      );
      setListings(data.items);
      setSnapshotAt(data.fetchedAt);
      setStale(false);
      toast.success(`Đã lấy ${data.items.length.toLocaleString("vi-VN")} listing từ Shopee`, { id: t });
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    } finally {
      setPulling(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setSavingCfg(true);
    try {
      const c = await api<CredStatus>(
        "/api/admin/shopee/config",
        {
          method: "POST",
          body: JSON.stringify({
            partnerId: Number(cfg.partnerId),
            partnerKey: cfg.partnerKey,
            shopId: Number(cfg.shopId),
            env: cfg.env,
          }),
        },
        token,
      );
      setCred(c);
      toast.success("Đã lưu cấu hình. Giờ bấm “Uỷ quyền shop”.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingCfg(false);
    }
  };

  const handleAuthUrl = async () => {
    if (!token) return;
    try {
      const data = await api<{ url: string }>("/api/admin/shopee/auth-url", {}, token);
      toast.info("Mở tab mới — đăng nhập & đồng ý uỷ quyền. Code có hạn 10 phút.");
      window.open(data.url, "_blank");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // ── Link Shopee ──
  const shopId = cred?.shopId ?? null;
  const productLink = useCallback(
    (itemId: number) => (shopId ? `https://shopee.vn/product/${shopId}/${itemId}` : ""),
    [shopId],
  );

  const copy = async (text: string, id: number | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((v) => (v === id ? null : v)), 1500);
    } catch {
      toast.error("Trình duyệt chặn sao chép — hãy copy tay.");
    }
  };

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return listings.filter((it) => {
      if (onlyLive && String(it.status).toUpperCase() !== "NORMAL") return false;
      if (!key) return true;
      if (String(it.item_id).includes(key)) return true;
      if (it.item_name.toLowerCase().includes(key)) return true;
      // tìm theo số SIM trong biến thể
      return (it.variants ?? []).some((v) => v.label.replace(/\D/g, "").includes(key.replace(/\D/g, "")) && key.replace(/\D/g, "") !== "");
    });
  }, [listings, q, onlyLive]);

  const copyAll = () => {
    const links = filtered.map((it) => productLink(it.item_id)).filter(Boolean);
    if (links.length === 0) {
      toast.error("Chưa có link nào để sao chép.");
      return;
    }
    void copy(links.join("\n"), "all");
    toast.success(`Đã sao chép ${links.length} link`);
  };

  const liveCount = useMemo(
    () => listings.filter((it) => String(it.status).toUpperCase() === "NORMAL").length,
    [listings],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Quản trị Shopee</h1>
              <p className="text-xs text-muted-foreground">
                {user?.email ?? ""}
                {cred?.authorized ? (
                  <>
                    {" · "}Shop #{cred.shopId ?? "?"}
                    {cred.tokenExpired && <span className="text-gold"> · token hết hạn (tự làm mới)</span>}
                  </>
                ) : (
                  <span className="text-gold"> · chưa uỷ quyền shop</span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowConnect((v) => !v)}>
            <KeyRound className="h-4 w-4" />
            Kết nối
          </Button>
        </div>
      </header>

      <main className="container mx-auto space-y-5 px-4 py-6">
        {/* Panel kết nối (setup) */}
        {showConnect && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-1 text-sm font-semibold">Kết nối shop Shopee</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {cred?.authorized
                ? `Đã uỷ quyền · partner ${cred.partnerId} · ${cred.env}. Uỷ quyền lại nếu đổi shop.`
                : "Khai báo partner_id / partner_key / shop_id (lấy trên Shopee Open Platform) rồi bấm Uỷ quyền."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="partnerId" className="text-xs">Partner ID</Label>
                <Input id="partnerId" inputMode="numeric" value={cfg.partnerId}
                  onChange={(e) => setCfg({ ...cfg, partnerId: e.target.value })} placeholder={cred?.partnerId ?? "vd 1002xxx"} />
              </div>
              <div>
                <Label htmlFor="partnerKey" className="text-xs">Partner Key</Label>
                <Input id="partnerKey" type="password" value={cfg.partnerKey}
                  onChange={(e) => setCfg({ ...cfg, partnerKey: e.target.value })} placeholder="để trống = giữ key cũ" />
              </div>
              <div>
                <Label htmlFor="shopId" className="text-xs">Shop ID</Label>
                <Input id="shopId" inputMode="numeric" value={cfg.shopId}
                  onChange={(e) => setCfg({ ...cfg, shopId: e.target.value })} placeholder={cred?.shopId ?? "vd 123456"} />
              </div>
              <div>
                <Label htmlFor="env" className="text-xs">Môi trường</Label>
                <select id="env" value={cfg.env} onChange={(e) => setCfg({ ...cfg, env: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="live">live</option>
                  <option value="sandbox">sandbox</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleSaveConfig()} disabled={savingCfg}>
                {savingCfg ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Lưu cấu hình
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void handleAuthUrl()} disabled={!cred?.configured}>
                <ExternalLink className="h-4 w-4" />
                Uỷ quyền shop
              </Button>
            </div>
          </section>
        )}

        {/* Thanh công cụ danh sách */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, item_id, hoặc số SIM…"
                className="pl-9"
              />
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={onlyLive} onChange={(e) => setOnlyLive(e.target.checked)} className="h-4 w-4 accent-primary" />
              Chỉ đang bán
            </label>
            <Button size="sm" variant="outline" onClick={copyAll} disabled={filtered.length === 0}>
              {copiedId === "all" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              Sao chép tất cả link
            </Button>
            <Button size="sm" onClick={() => void handlePull()} disabled={pulling}>
              {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Lấy danh sách mới nhất
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              <b className="text-foreground">{listings.length.toLocaleString("vi-VN")}</b> listing
              {" · "}
              <b className="text-emerald-400">{liveCount.toLocaleString("vi-VN")}</b> đang bán
              {filtered.length !== listings.length && <> · lọc còn <b className="text-foreground">{filtered.length}</b></>}
            </span>
            {snapshotAt && (
              <span>
                cập nhật lúc <b className="text-foreground">{new Date(snapshotAt).toLocaleString("vi-VN")}</b>
                {stale && <span className="text-gold"> (đã cũ &gt;6h — bấm “Lấy danh sách mới nhất”)</span>}
              </span>
            )}
          </div>
        </section>

        {/* Danh sách link */}
        {loading ? (
          <div className="grid place-items-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Store className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Chưa có dữ liệu listing.{" "}
              {cred?.authorized ? "Bấm “Lấy danh sách mới nhất” để kéo về." : "Kết nối & uỷ quyền shop trước đã."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Không có listing khớp bộ lọc.</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((it) => {
              const link = productLink(it.item_id);
              const tt = trangThai(it.status);
              return (
                <li
                  key={it.item_id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-gold/40"
                >
                  {/* Ảnh */}
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {it.image ? (
                      <img src={it.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground">
                        <Store className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{it.item_name || `Item #${it.item_id}`}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tt.cls}`}>
                        {tt.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {giaListing(it)}
                      {" · "}kho {it.stock.toLocaleString("vi-VN")}
                      {it.variants && it.variants.length > 0 && <> · {it.variants.length} số</>}
                    </p>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate text-xs text-gold hover:underline"
                        title={link}
                      >
                        {link}
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Chưa biết shop_id — kết nối shop để dựng link</p>
                    )}
                  </div>

                  {/* Hành động */}
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Sao chép link"
                      onClick={() => void copy(link, it.item_id)}
                      disabled={!link}
                    >
                      {copiedId === it.item_id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {link && (
                      <Button asChild variant="ghost" size="icon" title="Mở trên Shopee">
                        <a href={link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function ShopeeAdminPage() {
  return (
    <RequireAdmin>
      <ShopeeAdminContent />
    </RequireAdmin>
  );
}
