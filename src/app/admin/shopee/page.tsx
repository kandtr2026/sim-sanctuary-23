"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSimData } from "@/hooks/useSimData";
import { formatPrice, PRICE_RANGES, type NormalizedSIM } from "@/lib/simUtils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface CredStatus {
  configured: boolean;
  authorized: boolean;
  partnerId: string | null;
  shopId: string | null;
  env: string;
  partnerKeyMasked: string;
  tokenExpired: boolean;
  source: "db" | "env" | "none";
}

interface ShopeeSettings {
  categoryId: number | null;
  imageUrl: string | null;
  logisticId: number | null;
}

interface ItemRow {
  sim_id: string;
  item_id: number | null;
  status: string;
  price: number | null;
  stock: number;
  last_synced_at: string | null;
  last_error: string | null;
}

interface SyncResult {
  batchId: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: { simId: string; number: string; error: string }[];
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

interface ShopeeVariant {
  model_id: number;
  label: string;
  sku: string | null;
  price: number;
  stock: number;
  inKho: boolean;
}

interface PullResult {
  items: ShopeeListing[];
  total: number;
  fetched: number;
  pages: number;
  syncedCount: number;
}

const HIEN_THI_TRANG_THAI: Record<string, string> = {
  NORMAL: "Đang bán",
  DELETED: "Đã xoá",
  BANNED: "Bị khoá",
  UNLIST: "Ngừng bán",
  UNLISTED: "Ngừng bán",
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
  if (!res.ok) {
    throw new Error((body as { error?: string })?.error || `HTTP ${res.status}`);
  }
  return body as T;
};

// ── Component chính ──────────────────────────────────────────────────────────

function ShopeeAdminContent() {
  const { user, session, signOut } = useAdminAuth();
  const token = session?.access_token;
  const { allSims, isLoading: simsLoading } = useSimData();

  const [cred, setCred] = useState<CredStatus | null>(null);
  const [settings, setSettings] = useState<ShopeeSettings | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Trạng thái UI
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ partnerId: "", partnerKey: "", shopId: "", env: "live" });
  const [configSaving, setConfigSaving] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Kéo toàn bộ listing từ Shopee
  const [pulling, setPulling] = useState(false);
  const [pulled, setPulled] = useState<PullResult | null>(null);
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null);
  const [snapshotStale, setSnapshotStale] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  // Biến thể được chọn để xoá: "item_id:model_id"
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [disabling, setDisabling] = useState(false);
  // Thêm số mới vào listing
  const [addItemId, setAddItemId] = useState<number | null>(null);
  const [addForm, setAddForm] = useState({ label: "", price: "" });
  const [adding, setAdding] = useState(false);

  // Bộ lọc + chọn lô
  const [network, setNetwork] = useState<string>("all");
  const [priceMax, setPriceMax] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const loadStatus = useCallback(
    async (tk?: string) => {
      if (!tk) return;
      try {
        const data = await api<{
          cred: CredStatus;
          settings: ShopeeSettings;
          items: ItemRow[];
        }>("/api/admin/shopee/status", {}, tk);
        setCred(data.cred);
        setSettings(data.settings);
        setItems(data.items);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    document.title = "Shopee bán hàng – CHONSOMOBIFONE.COM";
  }, []);

  useEffect(() => {
    if (token) void loadStatus(token);
  }, [token, loadStatus]);

  // Nạp snapshot (cache) từ DB để vào trang thấy ngay bảng, không chờ fetch Shopee.
  const loadSnapshot = useCallback(
    async (tk?: string) => {
      if (!tk) return;
      try {
        const snap = await api<{
          items: ShopeeListing[];
          total: number;
          pages: number;
          syncedCount: number;
          fetchedAt: string | null;
          isStale: boolean;
        }>("/api/admin/shopee/items/snapshot", {}, tk);
        if (snap.items.length > 0) {
          setPulled({ items: snap.items, total: snap.total, fetched: snap.items.length, pages: snap.pages, syncedCount: snap.syncedCount });
          setSnapshotAt(snap.fetchedAt);
          setSnapshotStale(snap.isStale);
        }
      } catch {
        // Không có snapshot thì để trống, chờ bấm "Lấy danh sách từ Shopee".
      }
    },
    [],
  );

  useEffect(() => {
    if (token) void loadSnapshot(token);
  }, [token, loadSnapshot]);

  // Bộ lọc SIM
  const filtered = useMemo(() => {
    let list = allSims.filter((s) => s.price > 0);
    if (network !== "all") list = list.filter((s) => s.network === network);
    if (priceMax !== "all") {
      const max = Number(priceMax);
      list = list.filter((s) => s.price <= max);
    }
    const q = search.trim();
    if (q) {
      const digits = q.replace(/\D/g, "");
      if (digits) list = list.filter((s) => s.rawDigits.includes(digits));
    }
    if (showOnlySelected) list = list.filter((s) => selected.has(s.id));
    return list;
  }, [allSims, network, priceMax, search, selected, showOnlySelected]);

  const networks = useMemo(() => {
    const set = new Set(allSims.map((s) => s.network));
    return Array.from(set);
  }, [allSims]);

  // Lọc: label nào là số điện thoại thật? (9-10 chữ số, không chứa chữ cái)
  // Text random như "Sim Sảnh Tiến 789" có chủ đích, không bao giờ hết hàng.
  const laSoDienThoai = (label: string): boolean => {
    if (!label) return false;
    if (/[a-zA-Zàáảãạăâêôơưủũúýỳỷỹỵđ]/i.test(label)) return false; // có chữ cái → text
    const d = label.replace(/\D/g, "");
    return d.length >= 9 && d.length <= 10;
  };

  // Snapshot cũ (lưu trước khi server tính inKho) thì thiếu field → báo cần refresh.
  const isOldSnapshot = useMemo(
    () =>
      pulled !== null &&
      pulled.items.some((row) => row.variants && row.variants.length > 0 && row.variants.every((v) => v.inKho === undefined)),
    [pulled],
  );

  // Cảnh báo: số biến thể KHÔNG còn trong kho thật (server đã tính inKho),
  // chỉ tính với label là số điện thoại (text ngẫu nhiên có chủ đích, ko hết hàng).
  const soBienTheKhongCo = useMemo(() => {
    const map = new Map<number, number>();
    if (!pulled) return map;
    for (const row of pulled.items) {
      if (!row.variants) continue;
      let n = 0;
      for (const v of row.variants) {
        if (v.label && laSoDienThoai(v.label) && v.inKho === false) n++;
      }
      map.set(row.item_id, n);
    }
    return map;
  }, [pulled]);

  const tonTaiTrongKho = (v: ShopeeVariant): boolean =>
    !laSoDienThoai(v.label) || v.inKho !== false;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) filtered.forEach((s) => next.add(s.id));
      else filtered.forEach((s) => next.delete(s.id));
      return next;
    });
  };

  // ── Hành động ──
  const openConfig = () => {
    setConfigForm((prev) => ({
      ...prev,
      partnerId: configForm.partnerId || (cred?.partnerId ?? ""),
      shopId: configForm.shopId || (cred?.shopId ?? ""),
      env: cred?.env ?? prev.env,
    }));
    setShowConfig((v) => !v);
  };

  const handleSaveConfig = async () => {
    if (!token) return;
    setConfigSaving(true);
    try {
      const cred2 = await api<CredStatus>("/api/admin/shopee/config", {
        method: "POST",
        body: JSON.stringify({
          partnerId: Number(configForm.partnerId),
          partnerKey: configForm.partnerKey,
          shopId: Number(configForm.shopId),
          env: configForm.env,
        }),
      }, token);
      setCred(cred2);
      setShowConfig(false);
      toast.success("Đã lưu cấu hình Shopee.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleAuthUrl = async () => {
    if (!token) return;
    try {
      const data = await api<{ url: string; redirect: string }>("/api/admin/shopee/auth-url", {}, token);
      toast.info("Mở tab mới và đồng ý uỷ quyền. Code có hạn 10 phút.");
      window.open(data.url, "_blank");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    try {
      const data = await api<{ settings: ShopeeSettings }>("/api/admin/shopee/settings", {
        method: "POST",
        body: JSON.stringify({
          categoryId: settings?.categoryId ?? null,
          imageUrl: settings?.imageUrl ?? "",
        }),
      }, token);
      setSettings(data.settings);
      toast.success("Đã lưu cài đặt đăng bán.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSync = async () => {
    if (!token) return;
    const sims = filtered.filter((s) => selected.has(s.id));
    if (sims.length === 0) {
      toast.error("Chưa chọn SIM nào để đồng bộ.");
      return;
    }
    setSyncing(true);
    setLastResult(null);
    try {
      const result = await api<SyncResult>("/api/admin/shopee/sync", {
        method: "POST",
        body: JSON.stringify({ sims }),
      }, token);
      setLastResult(result);
      toast.success(`Đồng bộ xong: ${result.created} tạo mới · ${result.updated} cập nhật · ${result.failed} lỗi.`);
      await loadStatus(token);
      setSelected(new Set());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleRemove = async (row: ItemRow) => {
    if (!token || !row.item_id) return;
    if (!window.confirm(`Gỡ sản phẩm ${row.sim_id} khỏi Shopee?`)) return;
    setRemovingId(row.sim_id);
    try {
      await api<{ ok: boolean }>("/api/admin/shopee/items/remove", {
        method: "POST",
        body: JSON.stringify({ simId: row.sim_id, itemId: row.item_id }),
      }, token);
      toast.success("Đã gỡ khỏi Shopee.");
      await loadStatus(token);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRemovingId(null);
    }
  };

  const handlePullFromShopee = async () => {
    if (!token) return;
    setPulling(true);
    setPulled(null);
    setSelectedModels(new Set());
    try {
      const result = await api<PullResult & { saved?: boolean; fetchedAt?: string }>(
        "/api/admin/shopee/items/from-shopee",
        {},
        token,
      );
      setPulled(result);
      setSnapshotAt(result.fetchedAt ?? new Date().toISOString());
      setSnapshotStale(false);
      // Tự tích sẵn các biến thể không còn trong kho — chỉ tích label là số điện thoại
      const init = new Set<string>();
      for (const row of result.items) {
        if (!row.variants) continue;
        for (const v of row.variants) {
          if (v.inKho === false && v.label && laSoDienThoai(v.label)) init.add(`${row.item_id}:${v.model_id}`);
        }
      }
      setSelectedModels(init);
      toast.success(`Đã lấy ${result.fetched} sản phẩm từ Shopee (${result.pages} trang) và lưu lại.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPulling(false);
    }
  };

  const toggleModel = (itemId: number, modelId: number) => {
    setSelectedModels((prev) => {
      const key = `${itemId}:${modelId}`;
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDisableSelected = async () => {
    if (!token || selectedModels.size === 0) return;
    if (!window.confirm(`Tắt ${selectedModels.size} biến thể đã chọn trên Shopee (set kho = 0)?`)) return;
    setDisabling(true);
    try {
      const models = Array.from(selectedModels).map((key) => {
        const [itemId, modelId] = key.split(":");
        return { item_id: Number(itemId), model_id: Number(modelId) };
      });
      const result = await api<{ ok: number; failed: number; errors: { error: string }[] }>(
        "/api/admin/shopee/items/disable-models",
        { method: "POST", body: JSON.stringify({ models }) },
        token,
      );
      toast.success(`Đã tắt ${result.ok} biến thể. Lỗi: ${result.failed}`);
      setSelectedModels(new Set());
      await handlePullFromShopee();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDisabling(false);
    }
  };

  const handleAddModel = async () => {
    if (!token || addItemId === null) return;
    const price = Number(addForm.price.replace(/[^\d]/g, ""));
    if (!addForm.label.trim() || !price || price <= 0) {
      toast.error("Nhập đủ số SIM (dạng 0xxxxxxxxx) và giá.");
      return;
    }
    setAdding(true);
    try {
      const result = await api<{ ok: boolean; totalModels: number; error?: string }>(
        "/api/admin/shopee/items/add-model",
        {
          method: "POST",
          body: JSON.stringify({
            itemId: addItemId,
            label: addForm.label.trim(),
            price,
            stock: 1,
          }),
        },
        token,
      );
      toast.success(`Đã thêm số ${addForm.label.trim()} vào listing. Tổng biến thể: ${result.totalModels}`);
      setAddItemId(null);
      setAddForm({ label: "", price: "" });
      await handlePullFromShopee();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const handleDiagnose = async (itemId?: number) => {
    if (!token) return;
    setDiagnosing(true);
    setDiag(null);
    try {
      const qs = itemId ? `?itemId=${itemId}` : "";
      const result = await api<Record<string, unknown>>(`/api/admin/shopee/diagnose${qs}`, {}, token);
      setDiag(result);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDiagnosing(false);
    }
  };

  const liveItems = items.filter((i) => i.status === "live").length;
  const failedItems = items.filter((i) => i.status === "failed").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes sd-blink {
          0%, 100% { box-shadow: 0 0 4px 2px rgba(255,80,0,0.6); background: radial-gradient(circle at 40% 40%, #fff 0%, #ff6b35 40%, #dc2626 100%); }
          50% { box-shadow: 0 0 12px 6px rgba(255,80,0,0.9); background: radial-gradient(circle at 40% 40%, #fff 0%, #ff4500 30%, #b91c1c 100%); }
        }
        .sd-canh-bao {
          animation: sd-blink 0.8s ease-in-out infinite;
        }
      `}</style>
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
              Shopee bán hàng
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {user?.email ?? ""} · {cred?.configured ? `Shop #${cred.shopId ?? "?"}` : "Chưa cấu hình"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm" className="px-2.5 sm:px-3">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Xem website</span>
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-2.5 sm:px-3"
              onClick={() => void loadStatus(token)}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
            <Button variant="outline" size="sm" className="px-2.5 sm:px-3" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 px-4 py-6">
        {/* ── Trạng thái kết nối Shopee ── */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Kết nối Shopee Open Platform</p>
                <p className="text-xs text-muted-foreground">
                  {!cred?.configured
                    ? "Chưa khai báo partner_id / partner_key / shop_id."
                    : !cred.authorized
                      ? "Đã khai cấu hình nhưng chưa uỷ quyền shop."
                      : `Đã uỷ quyền shop #${cred.shopId} · partner ${cred.partnerId} (${cred.env})`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  cred?.authorized
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                    : "border-gold/40 bg-gold/10 text-gold"
                }
              >
                {cred?.authorized ? "Đã uỷ quyền" : "Chưa uỷ quyền"}
              </Badge>
              {!cred?.configured ? (
                <Button size="sm" onClick={openConfig}>
                  <KeyRound className="h-4 w-4" /> Cấu hình
                </Button>
              ) : !cred.authorized ? (
                <>
                  <Button size="sm" onClick={() => void handleAuthUrl()}>
                    <ShieldCheck className="h-4 w-4" /> Uỷ quyền shop
                  </Button>
                  <Button size="sm" variant="ghost" onClick={openConfig}>
                    <Settings className="h-4 w-4" /> Cấu hình
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={openConfig}>
                  <Settings className="h-4 w-4" /> Cấu hình lại
                </Button>
              )}
            </div>
          </div>

          {showConfig && (
            <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="partnerId">Partner ID</Label>
                <Input
                  id="partnerId"
                  value={configForm.partnerId}
                  onChange={(e) => setConfigForm({ ...configForm, partnerId: e.target.value })}
                  placeholder={cred?.partnerId ?? "2031725"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shopId">Shop ID</Label>
                <Input
                  id="shopId"
                  value={configForm.shopId}
                  onChange={(e) => setConfigForm({ ...configForm, shopId: e.target.value })}
                  placeholder="Để trống cũng được — Shopee tự trả khi uỷ quyền"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="partnerKey">Partner Key</Label>
                <Input
                  id="partnerKey"
                  type="password"
                  value={configForm.partnerKey}
                  onChange={(e) => setConfigForm({ ...configForm, partnerKey: e.target.value })}
                  placeholder={cred?.configured ? "•••• đã lưu (bỏ trống để giữ nguyên)" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Partner Key là bí mật — chỉ lưu mã hoá trong DB, không hiện lại.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="env">Môi trường</Label>
                <Select
                  value={configForm.env}
                  onValueChange={(v) => setConfigForm({ ...configForm, env: v })}
                >
                  <SelectTrigger id="env">
                    <SelectValue placeholder="Chọn môi trường" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (kiểm thử)</SelectItem>
                    <SelectItem value="live">Live (bán thật)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {configForm.env === "sandbox"
                    ? "Dùng khi app còn \"Developing\" — chỉ đăng lên shop thử nghiệm."
                    : "Dùng khi app đã được Shopee duyệt — đăng lên shop bán thật."}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => void handleSaveConfig()} disabled={configSaving}>
                  {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Lưu cấu hình
                </Button>
                <Button variant="ghost" onClick={() => setShowConfig(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* ── Cài đặt đăng bán ── */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Settings className="h-4 w-4 text-gold" /> Cài đặt đăng bán
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Danh mục sản phẩm (category)</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={async () => {
                  if (!token) return;
                  try {
                    const data = await api<{ categories: { category_id: number; category_name: string }[] }>(
                      "/api/admin/shopee/categories",
                      {},
                      token,
                    );
                    const cats = data.categories ?? [];
                    if (cats.length === 0) {
                      toast.info("Chưa lấy được danh mục. Có thể cần uỷ quyền shop trước.");
                      return;
                    }
                    const pick = window.prompt(
                      "Nhập category_id (xem danh sách bên dưới). Chọn mục Sim/Thẻ cào:\n" +
                        cats
                          .filter((c) => /sim|thẻ|cào|điện thoại|phụ kiện/i.test(c.category_name))
                          .map((c) => `${c.category_id} = ${c.category_name}`)
                          .slice(0, 30)
                          .join("\n"),
                      settings?.categoryId ? String(settings.categoryId) : "",
                    );
                    if (pick) {
                      const n = Number(pick.trim());
                      if (Number.isFinite(n) && n > 0) {
                        setSettings((prev) => ({ ...prev!, categoryId: n }));
                      }
                    }
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                {settings?.categoryId ? `Category #${settings.categoryId}` : "Chọn danh mục…"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Nhấn để lấy danh mục trực tiếp từ Shopee và chọn mục SIM/Thẻ cào.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Ảnh sản phẩm (URL)</Label>
              <Input
                id="imageUrl"
                value={settings?.imageUrl ?? ""}
                onChange={(e) => setSettings((prev) => ({ ...prev!, imageUrl: e.target.value }))}
                placeholder="https://www.chonsomobifone.com/sim-card-default.png"
              />
              <p className="text-xs text-muted-foreground">
                Shopee bắt buộc ít nhất 1 ảnh. Mặc định dùng ảnh sim chung.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Button size="sm" onClick={() => void handleSaveSettings()}>
              Lưu cài đặt
            </Button>
          </div>
        </section>

        {/* ── Chọn lô & đồng bộ ── */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShoppingCart className="h-4 w-4 text-gold" /> Chọn lô SIM để đồng bộ
              <Badge variant="outline" className="ml-1 text-primary">
                {selected.size} đã chọn
              </Badge>
            </h2>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => void handleSync()} disabled={syncing || selected.size === 0}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {syncing ? "Đang đồng bộ…" : "Đồng bộ lên Shopee"}
              </Button>
              {selected.size > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Bỏ chọn
                </Button>
              )}
            </div>
          </div>

          {!cred?.authorized && (
            <div className="mb-3 rounded-lg border border-gold/40 bg-gold/5 p-3 text-sm text-gold">
              Chưa uỷ quyền shop nên chưa đồng bộ được. Bấm <b>Uỷ quyền shop</b> ở mục Kết nối
              trước.
            </div>
          )}

          {/* Bộ lọc */}
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Tìm số (vd 0903, *8888)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger>
                <SelectValue placeholder="Nhà mạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhà mạng</SelectItem>
                {networks.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceMax} onValueChange={setPriceMax}>
              <SelectTrigger>
                <SelectValue placeholder="Giá tối đa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi mức giá</SelectItem>
                {PRICE_RANGES.map((r) => (
                  <SelectItem key={r.max} value={String(r.max)}>
                    Dưới {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Danh sách SIM */}
          <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((s) => selected.has(s.id))}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              Chọn tất cả ({filtered.length} SIM đang hiện)
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
              />
              Chỉ hiện SIM đã chọn
            </label>
          </div>

          {simsLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Không có SIM nào khớp bộ lọc.
                </p>
              ) : (
                filtered.map((s) => {
                  const isSel = selected.has(s.id);
                  const synced = items.find((i) => i.sim_id === s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        isSel
                          ? "border-primary/50 bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input type="checkbox" checked={isSel} onChange={() => toggle(s.id)} readOnly />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {s.displayNumber}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.network} · {s.tags?.slice(0, 3).join(" · ") || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {synced ? (
                          synced.status === "live" ? (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Đã đăng
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700">
                              <XCircle className="mr-1 h-3 w-3" /> Lỗi
                            </Badge>
                          )
                        ) : null}
                        <span className="text-sm font-bold text-gold">{formatPrice(s.price)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {lastResult && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-semibold text-foreground">
                Kết quả lô {lastResult.batchId}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-emerald-700">Tạo mới: {lastResult.created}</span>
                <span className="text-blue-700">Cập nhật: {lastResult.updated}</span>
                <span className="text-red-700">Lỗi: {lastResult.failed}</span>
              </div>
              {lastResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {lastResult.errors.map((e, i) => (
                    <p key={i} className="break-words text-red-700">
                      {e.number}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Đã đăng lên Shopee ── */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Store className="h-4 w-4 text-gold" /> Sản phẩm đã đăng
            <Badge variant="outline" className="ml-1">
              {liveItems} đang bán · {failedItems} lỗi
            </Badge>
          </h2>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có SIM nào được đồng bộ lên Shopee.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">SIM</th>
                    <th className="py-2 pr-3 font-medium">Item ID</th>
                    <th className="py-2 pr-3 font-medium">Trạng thái</th>
                    <th className="py-2 pr-3 font-medium">Giá</th>
                    <th className="py-2 pr-3 font-medium">Lần sync</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice(0, 50).map((row) => (
                    <tr key={row.sim_id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-medium text-foreground">{row.sim_id}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.item_id ?? "—"}</td>
                      <td className="py-2 pr-3">
                        {row.status === "live" ? (
                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
                            Đang bán
                          </Badge>
                        ) : row.status === "failed" ? (
                          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700">
                            Lỗi
                          </Badge>
                        ) : (
                          <Badge variant="outline">{row.status}</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-gold">{row.price ? formatPrice(row.price) : "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {row.last_synced_at ? new Date(row.last_synced_at).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="py-2 text-right">
                        {row.item_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-red-600"
                            onClick={() => void handleRemove(row)}
                            disabled={removingId === row.sim_id}
                          >
                            {removingId === row.sim_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  …và {items.length - 50} sản phẩm nữa (chỉ hiện 50 gần nhất).
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Toàn bộ sản phẩm trên Shopee ── */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Store className="h-4 w-4 text-gold" /> Toàn bộ sản phẩm trên Shopee
              {pulled && (
                <Badge variant="outline" className="ml-1">
                  {pulled.fetched} sản phẩm · {pulled.syncedCount} là SIM đã sync
                </Badge>
              )}
            </h2>
            <Button size="sm" onClick={() => void handlePullFromShopee()} disabled={pulling}>
              {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {pulling ? "Đang lấy…" : "Lấy danh sách từ Shopee"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleDiagnose()} disabled={diagnosing}>
              {diagnosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Chẩn đoán
            </Button>
          </div>

          {diag && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="mb-1 font-semibold text-foreground">Kết quả chẩn đoán</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-muted-foreground">
                {JSON.stringify(diag, null, 2)}
              </pre>
            </div>
          )}

          {isOldSnapshot && (
            <div className="mb-4 rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-gold">
              Bảng này là bản lưu cũ (trước khi có tính năng cảnh báo kho) nên chưa đánh dấu được số nào hết.
              Bấm <b>Lấy danh sách từ Shopee</b> để nạp lại và có cảnh báo chính xác.
            </div>
          )}
          <p className="mb-3 text-xs text-muted-foreground">
            Kéo trực tiếp từ Shopee (get_item_list) — hiện tất cả sản phẩm đang có trên shop, kể cả đăng tay,
            để biết mình còn thiếu hay trùng gì.
            {snapshotAt && (
              <span className="ml-2">
                · đang xem bản lưu lúc{" "}
                <b className="text-foreground">{new Date(snapshotAt).toLocaleString("vi-VN")}</b>
                {snapshotStale && <span className="text-gold"> (đã cũ &gt;6h — bấm Lấy danh sách để cập nhật)</span>}
              </span>
            )}
          </p>

          {!pulled && !pulling && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Bấm "Lấy danh sách từ Shopee" để nạp toàn bộ sản phẩm đang live trên shop.
            </p>
          )}

          {pulled && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Tổng trên Shopee: <b className="text-foreground">{pulled.total}</b></span>
                  <span>Đã lấy: <b className="text-foreground">{pulled.fetched}</b></span>
                  <span>Số trang: <b className="text-foreground">{pulled.pages}</b></span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selectedModels.size > 0 && (
                    <Button size="sm" variant="destructive" onClick={() => void handleDisableSelected()} disabled={disabling}>
                      {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {disabling ? "Đang tắt…" : `Tắt ${selectedModels.size} biến thể đã chọn`}
                    </Button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Sản phẩm</th>
                      <th className="py-2 pr-3 font-medium">Item ID</th>
                      <th className="py-2 pr-3 font-medium">Trạng thái</th>
                      <th className="py-2 pr-3 font-medium">Giá</th>
                      <th className="py-2 pr-3 font-medium">Kho</th>
                      <th className="py-2 pr-3 font-medium">SIM</th>
                      <th className="py-2 pr-3 font-medium">Biến thể</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pulled.items.map((row) => (
                      <Fragment key={row.item_id}>
                      <tr className="border-b border-border/60 last:border-0">
                        <td className="max-w-[280px] py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            {(soBienTheKhongCo.get(row.item_id) ?? 0) > 0 && (
                              <span
                                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full sd-canh-bao"
                                title={`${soBienTheKhongCo.get(row.item_id) ?? 0} biến thể không có trong kho số`}
                              />
                            )}
                            <span className="block truncate font-medium text-foreground">{row.item_name}</span>
                          </div>
                          {row.image && (
                            <img src={row.image} alt="" className="mt-1 h-8 w-8 rounded object-cover" />
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.item_id}</td>
                        <td className="py-2 pr-3">
                          {row.status === "NORMAL" ? (
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">
                              {HIEN_THI_TRANG_THAI[row.status] ?? row.status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{HIEN_THI_TRANG_THAI[row.status] ?? row.status}</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-gold">
                          {row.price > 0 ? (
                            <>
                              {formatPrice(row.price)}
                              {row.priceNote ? (
                                <span className="ml-1 text-xs text-muted-foreground">{row.priceNote}</span>
                              ) : null}
                            </>
                          ) : (
                            formatPrice(row.price)
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">{row.stock}</td>
                        <td className="py-2">
                          {row.sim_id ? (
                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-700">
                              {row.sim_id}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {row.variants ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-muted-foreground"
                              onClick={() => {
                                setExpandedItems((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(row.item_id)) next.delete(row.item_id);
                                  else next.add(row.item_id);
                                  return next;
                                });
                              }}
                            >
                              {expandedItems.has(row.item_id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              {row.variants.length} số
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground"
                            onClick={() => {
                              setAddItemId(row.item_id);
                              setAddForm({ label: "", price: "" });
                            }}
                            title="Thêm số SIM mới vào biến thể"
                          >
                            <span className="text-base leading-none">+</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => void handleDiagnose(row.item_id)}
                            disabled={diagnosing}
                            title="Soi raw JSON của sản phẩm này"
                          >
                            {diagnosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                      {expandedItems.has(row.item_id) && row.variants && row.variants.length > 0 && (
                        <tr key={`${row.item_id}-variants`}>
                          <td colSpan={8} className="bg-muted/20 p-0">
                            <div className="max-h-64 overflow-y-auto border-t border-border/60">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-muted-foreground">
                                    <th className="px-3 py-1.5 font-medium">Số SIM</th>
                                    <th className="px-3 py-1.5 font-medium">Model ID</th>
                                    <th className="px-3 py-1.5 font-medium">Giá</th>
                                    <th className="px-3 py-1.5 font-medium">Kho</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.variants.map((v) => (
                                    <tr key={v.model_id} className="border-t border-border/40">
                                      <td className="px-3 py-1.5 font-medium text-foreground">
                                        <label className="flex cursor-pointer items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={selectedModels.has(`${row.item_id}:${v.model_id}`)}
                                            onChange={() => toggleModel(row.item_id, v.model_id)}
                                          />
                                          <span className="truncate">{v.label || "(không có nhãn)"}</span>
                                          {v.label && !tonTaiTrongKho(v) && (
                                            <span className="inline-block h-2 w-2 shrink-0 rounded-full sd-canh-bao" title="Không còn trong kho" />
                                          )}
                                        </label>
                                      </td>
                                      <td className="px-3 py-1.5 text-muted-foreground">{v.model_id}</td>
                                      <td className="px-3 py-1.5 text-gold">{v.price > 0 ? formatPrice(v.price) : <span className="text-muted-foreground">—</span>}</td>
                                      <td className="px-3 py-1.5">
                                        {v.stock > 0 ? (
                                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">{v.stock}</Badge>
                                        ) : (
                                          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700">Hết</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ── Dialog thêm số mới vào biến thể ── */}
        {addItemId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Thêm số SIM vào Item #{addItemId}
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="sim-label">Số SIM (10 số, dạng 0xxxxxxxxx)</Label>
                  <Input
                    id="sim-label"
                    value={addForm.label}
                    onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                    placeholder="0767777770"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sim-price">Giá (VNĐ)</Label>
                  <Input
                    id="sim-price"
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    placeholder="1100000"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAddItemId(null)}>Huỷ</Button>
                <Button size="sm" onClick={() => void handleAddModel()} disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {adding ? "Đang thêm…" : "Thêm vào listing"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}

export default function ShopeeAdminPage() {
  return (
    <RequireAdmin>
      <ShopeeAdminContent />
    </RequireAdmin>
  );
}
