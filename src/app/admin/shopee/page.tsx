"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { useCheapSimData } from "@/hooks/useCheapSimData";
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

interface BulkSyncResult {
  added: number;
  skipped: number;
  total: number;
  itemName: string;
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

const VISIBLE_LIMIT = 300;

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

/**
 * Khớp chuỗi tìm theo luật web chính (xem simFilter.ts): `*678` = đuôi 678,
 * `090*` = đầu 090, `090*6666` = đầu+đuôi, gõ trần ngắn = chứa, 10 số = chính xác.
 */
const khopTim = (rawDigits: string, searchRaw: string): boolean => {
  const search = searchRaw.trim().replace(/[^0-9*]/g, "");
  const digitsOnly = search.replace(/\*/g, "");
  const d = rawDigits.replace(/\D/g, "").padStart(10, "0").slice(-10);
  if (!search || !digitsOnly) return true;
  if (digitsOnly.length === 10 && !search.includes("*")) return d === digitsOnly;
  if (search.includes("*")) {
    const startsWithStar = search.startsWith("*");
    const endsWithStar = search.endsWith("*");
    const parts = search.split("*").filter(Boolean);
    if (endsWithStar && !startsWithStar && parts.length >= 1) return d.startsWith(parts[0]);
    if (startsWithStar && !endsWithStar && parts.length >= 1) return d.endsWith(parts[parts.length - 1]);
    if (!startsWithStar && !endsWithStar && parts.length === 2) {
      return d.startsWith(parts[0]) && d.endsWith(parts[1]);
    }
    if (digitsOnly.length >= 2) return d.includes(digitsOnly);
    return true;
  }
  return d.includes(digitsOnly);
};

// ── Component chính ──────────────────────────────────────────────────────────

const SimRow = memo(function SimRow({
  sim, selected: isSel, synced, onToggle,
}: {
  sim: NormalizedSIM;
  selected: boolean;
  synced: ItemRow | undefined;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onToggle(sim.id)}
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
        isSel ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-primary/30"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <input type="checkbox" checked={isSel} onChange={() => onToggle(sim.id)} readOnly />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{sim.displayNumber}</p>
          <p className="truncate text-xs text-muted-foreground">
            {sim.network} · {sim.tags?.slice(0, 3).join(" · ") || "—"}
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
        <span className="text-sm font-bold text-gold">{formatPrice(sim.price)}</span>
      </div>
    </div>
  );
});

function ShopeeAdminContent() {
  const { user, session, signOut } = useAdminAuth();  const token = session?.access_token;
  const { allSims, isLoading: simsLoading } = useSimData();
  const { sims: cheapSims } = useCheapSimData();

  const [cred, setCred] = useState<CredStatus | null>(null);
  const [settings, setSettings] = useState<ShopeeSettings | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Shopee chỉ bán kho Song Khoa → tập raw_digits của kho này (đọc từ bảng sims).
  const [songKhoaDigits, setSongKhoaDigits] = useState<Set<string> | null>(null);

  // Trạng thái UI
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ partnerId: "", partnerKey: "", shopId: "", env: "live" });
  const [configSaving, setConfigSaving] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncTargetItemId, setSyncTargetItemId] = useState<string>("");
  const [bulkResult, setBulkResult] = useState<BulkSyncResult | null>(null);
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
  const [addForm, setAddForm] = useState({ label: "", display: "", price: "" });
  const [adding, setAdding] = useState(false);
  // Sửa biến thể tại chỗ (đổi nhãn hiển thị / đổi value / đổi giá)
  const [editForm, setEditForm] = useState<{ itemId: number; modelId: number; originalLabel: string; label: string; display: string; price: string } | null>(null);
  const [editing, setEditing] = useState(false);
  // Chọn nguồn khi chọn số: 'tong' (Sheet tổng, có Kho con) | 're' (Sheet giá rẻ)
  const [nguonSo, setNguonSo] = useState<"tong" | "re">("tong");
  const [khoTong, setKhoTong] = useState("all");
  const [danhSachKho, setDanhSachKho] = useState<string[]>([]);
  const [simsTong, setSimsTong] = useState<{ id: string; rawDigits: string; displayNumber: string; price: number }[]>([]);
  const [dangTaiSims, setDangTaiSims] = useState(false);
  // Filter kho khi chọn số
  const [khoFilter, setKhoFilter] = useState({ network: "all", priceMin: "", priceMax: "" });

  // Bộ lọc + chọn lô
  const [network, setNetwork] = useState<string>("all");
  const [priceMax, setPriceMax] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
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

  // Nạp tập số kho Song Khoa (Shopee chỉ bán kho này).
  const loadSongKhoa = useCallback(async (tk?: string) => {
    if (!tk) return;
    try {
      const data = await api<{ digits: string[] }>("/api/admin/shopee/song-khoa-ids", {}, tk);
      setSongKhoaDigits(new Set(data.digits));
    } catch (err) {
      toast.error(`Không lấy được kho Song Khoa: ${(err as Error).message}`);
      setSongKhoaDigits(new Set());
    }
  }, []);

  useEffect(() => {
    if (token) void loadSongKhoa(token);
  }, [token, loadSongKhoa]);

  // Bộ lọc SIM — CHỈ số thuộc kho Song Khoa (Shopee chỉ bán kho này).
  const filtered = useMemo(() => {
    if (!songKhoaDigits) return [];
    let list = allSims.filter((s) => s.price > 0 && songKhoaDigits.has(s.rawDigits));
    if (network !== "all") list = list.filter((s) => s.network === network);
    if (tagFilter !== "all") list = list.filter((s) => s.tags?.includes(tagFilter));
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
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [allSims, songKhoaDigits, network, tagFilter, priceMax, search, selected, showOnlySelected, sortBy]);

  // Các loại số đẹp có trong kho (để lọc: Ngũ quý, Tứ quý, …)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSims) for (const t of s.tags ?? []) set.add(t);
    return Array.from(set);
  }, [allSims]);

  // Chọn N số RẺ NHẤT trong danh sách đang lọc (không phụ thuộc kiểu sắp xếp).
  const selectCheapest = useCallback(
    (n: number) => {
      const cheapest = [...filtered].sort((a, b) => a.price - b.price).slice(0, n);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const s of cheapest) next.add(s.id);
        return next;
      });
    },
    [filtered],
  );

  const visibleSims = useMemo(() => filtered.slice(0, VISIBLE_LIMIT), [filtered]);
  const itemBySimId = useMemo(() => {
    const m = new Map<string, ItemRow>();
    for (const it of items) m.set(it.sim_id, it);
    return m;
  }, [items]);

  // Kiểm tra số trùng: selected SIMs đã tồn tại ở listing KHÁC (trừ listing đích)
  interface DuplicateSim {
    simId: string;
    displayNumber: string;
    rawDigits: string;
    existingListingId: number;
    existingListingName: string;
  }
  const duplicateSims = useMemo((): DuplicateSim[] => {
    if (!pulled || selected.size === 0) return [];
    const targetId = Number(syncTargetItemId) || 0;
    // Build map: rawDigits → { item_id, item_name } cho TẤT CẢ variants (trừ listing đích)
    const existMap = new Map<string, { itemId: number; itemName: string }>();
    for (const row of pulled.items) {
      if (row.item_id === targetId) continue;
      if (!row.variants) continue;
      for (const v of row.variants) {
        const d = v.label.replace(/\D/g, "").padStart(10, "0").slice(-10);
        if (d.length === 10 && !existMap.has(d)) {
          existMap.set(d, { itemId: row.item_id, itemName: row.item_name });
        }
      }
    }
    if (existMap.size === 0) return [];
    // So sánh selected SIMs
    const dupes: DuplicateSim[] = [];
    for (const sim of allSims) {
      if (!selected.has(sim.id)) continue;
      const hit = existMap.get(sim.rawDigits);
      if (hit) {
        dupes.push({
          simId: sim.id,
          displayNumber: sim.displayNumber || sim.rawDigits,
          rawDigits: sim.rawDigits,
          existingListingId: hit.itemId,
          existingListingName: hit.itemName,
        });
      }
    }
    return dupes;
  }, [pulled, selected, syncTargetItemId, allSims]);

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

  // Biến thể "đang bán nhưng hết kho" → chấm đỏ
  const canhBaoHetKho = (v: ShopeeVariant): boolean =>
    laSoDienThoai(v.label) && v.stock > 0 && v.inKho === false;

  // Cảnh báo: biến thể đang bán (stock>0) nhưng không có trong kho thật.
  // Biến thể stock=0 (đã tắt trên Shopee) → gạch ngang, không cảnh báo.
  const soBienTheKhongCo = useMemo(() => {
    const map = new Map<number, number>();
    if (!pulled) return map;
    for (const row of pulled.items) {
      if (!row.variants) continue;
      let n = 0;
      for (const v of row.variants) {
        if (laSoDienThoai(v.label) && v.stock > 0 && v.inKho === false) n++;
      }
      map.set(row.item_id, n);
    }
    return map;
  }, [pulled]);

  const biTheTat = (v: ShopeeVariant): boolean => v.stock === 0;

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
    const targetId = Number(syncTargetItemId);
    if (!targetId) {
      toast.error("Chọn listing đích để đẩy các số đã chọn vào (dạng biến thể).");
      return;
    }
    const targetName = pulled?.items.find((it) => it.item_id === targetId)?.item_name ?? `#${targetId}`;
    setSyncing(true);
    setBulkResult(null);
    try {
      const result = await api<{ added: number; skipped: number; total: number }>(
        "/api/admin/shopee/items/add-models-bulk",
        {
          method: "POST",
          body: JSON.stringify({
            itemId: targetId,
            sims: sims.map((s) => ({
              label: s.rawDigits,
              display: s.displayNumber || s.rawDigits,
              price: s.price,
            })),
          }),
        },
        token,
      );
      setBulkResult({ ...result, itemName: targetName });
      toast.success(`Đã thêm ${result.added} số vào "${targetName}" · bỏ qua ${result.skipped} số trùng.`);
      setSelected(new Set());
      await handlePullFromShopee();
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
      // Tự tích sẵn các biến thể đang bán (stock>0) nhưng không có trong kho
      // — bỏ qua biến thể đã tắt (stock=0) vì chúng đã off trên Shopee rồi.
      const init = new Set<string>();
      for (const row of result.items) {
        if (!row.variants) continue;
        for (const v of row.variants) {
          if (v.stock > 0 && v.inKho === false && v.label && laSoDienThoai(v.label)) init.add(`${row.item_id}:${v.model_id}`);
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
    const digits = (addForm.label || addForm.display).replace(/\D/g, "");
    if (!digits || !price || price <= 0) {
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
            display: addForm.display.trim(),
            price,
            stock: 1,
          }),
        },
        token,
      );
      toast.success(`Đã thêm số ${addForm.display.trim() || addForm.label.trim()} vào listing. Tổng biến thể: ${result.totalModels}`);
      setAddItemId(null);
      setAddForm({ label: "", display: "", price: "" });
      await handlePullFromShopee();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const handleEditModel = async () => {
    if (!token || !editForm) return;
    const price = Number(editForm.price.replace(/[^\d]/g, ""));
    const digits = (editForm.label || editForm.display).replace(/\D/g, "");
    if (!digits) {
      toast.error("Nhập số SIM (dạng 0xxxxxxxxx).");
      return;
    }
    setEditing(true);
    try {
      await api<{ ok: boolean }>(
        "/api/admin/shopee/items/edit-model",
        {
          method: "POST",
          body: JSON.stringify({
            itemId: editForm.itemId,
            modelId: editForm.modelId,
            currentLabel: editForm.originalLabel,
            label: editForm.label.trim(),
            display: editForm.display.trim(),
            price: price > 0 ? price : 0,
          }),
        },
        token,
      );
      toast.success(`Đã sửa biến thể ${editForm.display.trim() || editForm.label.trim()}. Đang đồng bộ lại…`);
      setEditForm(null);
      await handlePullFromShopee();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEditing(false);
    }
  };

  // Nạp danh sách kho tổng (theo Kho + filter) từ server.
  const taiSimsTong = useCallback(async () => {
    if (!token || nguonSo !== "tong") return;
    setDangTaiSims(true);
    try {
      const params = new URLSearchParams();
      if (khoTong && khoTong !== "all") params.set("kho", khoTong);
      if (khoFilter.network !== "all") params.set("network", khoFilter.network);
      const priceMin = Number(khoFilter.priceMin.replace(/[^\d]/g, ""));
      const priceMax = Number(khoFilter.priceMax.replace(/[^\d]/g, ""));
      if (priceMin > 0) params.set("priceMin", String(priceMin));
      if (priceMax > 0) params.set("priceMax", String(priceMax));
      if (addForm.label.trim()) params.set("search", addForm.label.trim());
      const data = await api<{
        sims: { id: string; rawDigits: string; displayNumber: string; price: number }[];
        danhSachKho: string[];
      }>(`/api/admin/shopee/kho-sims?${params.toString()}`, {}, token);
      setSimsTong(data.sims);
      if (data.danhSachKho.length > 0) setDanhSachKho(data.danhSachKho);
    } catch {
      setSimsTong([]);
    } finally {
      setDangTaiSims(false);
    }
  }, [token, nguonSo, khoTong, khoFilter, addForm.label]);

  // Load kho options lần đầu khi mở dialog
  useEffect(() => {
    if (addItemId !== null && nguonSo === "tong") {
      const t = setTimeout(() => void taiSimsTong(), 250);
      return () => clearTimeout(t);
    }
  }, [addItemId, nguonSo, taiSimsTong]);

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
              <Badge variant="outline" className="ml-1 border-gold/40 bg-gold/10 text-gold">
                Kho Song Khoa{songKhoaDigits ? ` · ${songKhoaDigits.size.toLocaleString("vi-VN")} số` : ""}
              </Badge>
              <Badge variant="outline" className="ml-1 text-primary">
                {selected.size} đã chọn
              </Badge>
            </h2>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => void handleSync()} disabled={syncing || selected.size === 0 || !syncTargetItemId}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {syncing ? "Đang đẩy…" : "Đẩy vào listing"}
              </Button>
              {selected.size > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                  Bỏ chọn
                </Button>
              )}
            </div>
          </div>

          {/* Listing đích: các số đã chọn sẽ thành biến thể trong listing này */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">Đẩy vào listing:</span>
            <Select value={syncTargetItemId} onValueChange={setSyncTargetItemId}>
              <SelectTrigger className="h-9 w-full sm:w-[380px]">
                <SelectValue placeholder="Chọn listing biến thể đích (vd 'Số VIP')" />
              </SelectTrigger>
              <SelectContent>
                {(pulled?.items ?? [])
                  .filter((it) => it.variants && it.variants.length > 0)
                  .map((it) => (
                    <SelectItem key={it.item_id} value={String(it.item_id)}>
                      {it.item_name} ({it.variants?.length} số)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {!pulled && (
              <span className="text-xs text-gold">
                Chưa có danh sách listing — bấm "Lấy danh sách từ Shopee" ở mục dưới trước.
              </span>
            )}
          </div>

          {/* Cảnh báo số trùng giữa các listing */}
          {duplicateSims.length > 0 && (
            <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p className="font-semibold text-amber-700">
                <span className="mr-1">⚠</span>
                {duplicateSims.length} số trùng giữa các listing
              </p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-amber-600">
                {duplicateSims.map((d) => (
                  <li key={d.simId}>
                    <span className="font-semibold">{d.displayNumber}</span>
                    {" — đã có trong \""}
                    <span className="font-medium">{d.existingListingName}</span>
                    {"\""}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại số đẹp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi loại số</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Sắp xếp: mặc định</SelectItem>
                <SelectItem value="price-asc">Giá: rẻ → đắt</SelectItem>
                <SelectItem value="price-desc">Giá: đắt → rẻ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Danh sách SIM */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={filtered.length > 0 && filtered.every((s) => selected.has(s.id))}
                onChange={(e) => toggleAll(e.target.checked)}
              />
              Chọn tất cả ({filtered.length} SIM khớp bộ lọc)
            </label>
            <button
              type="button"
              onClick={() => selectCheapest(30)}
              disabled={filtered.length === 0}
              className="rounded border border-primary/40 bg-primary/5 px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              + Chọn 30 rẻ nhất
            </button>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
              />
              Chỉ hiện SIM đã chọn
            </label>
          </div>

          {simsLoading || !songKhoaDigits ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <>
            <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Không có SIM nào khớp bộ lọc.
                </p>
              ) : (
                visibleSims.map((s) => (
                  <SimRow
                    key={s.id}
                    sim={s}
                    selected={selected.has(s.id)}
                    synced={itemBySimId.get(s.id)}
                    onToggle={toggle}
                  />
                ))
              )}
            </div>
            {filtered.length > VISIBLE_LIMIT && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Đang hiện {VISIBLE_LIMIT}/{filtered.length} số khớp bộ lọc — gõ tìm số hoặc lọc nhà mạng/giá để thu hẹp.
              </p>
            )}
            </>
          )}

          {bulkResult && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-semibold text-foreground">
                Đã đẩy vào “{bulkResult.itemName}”
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-emerald-700">Thêm mới: {bulkResult.added}</span>
                <span className="text-muted-foreground">Bỏ qua (trùng): {bulkResult.skipped}</span>
                <span className="text-muted-foreground">Tổng chọn: {bulkResult.total}</span>
              </div>
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
                              setAddForm({ label: "", display: "", price: "" });
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
                                    <th className="px-3 py-1.5 font-medium"></th>
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
                                            disabled={biTheTat(v)}
                                          />
                                          <span className={`truncate ${biTheTat(v) ? "text-muted-foreground line-through" : ""}`}>
                                            {v.label || "(không có nhãn)"}
                                          </span>
                                          {v.label && canhBaoHetKho(v) && (
                                            <span className="inline-block h-2 w-2 shrink-0 rounded-full sd-canh-bao" title="Đang bán nhưng không có trong kho" />
                                          )}
                                        </label>
                                      </td>
                                      <td className="px-3 py-1.5 text-muted-foreground">{v.model_id}</td>
                                      <td className="px-3 py-1.5 text-gold">
                                        {v.price > 0 ? (
                                          <span className={biTheTat(v) ? "text-muted-foreground line-through" : ""}>{formatPrice(v.price)}</span>
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-1.5">
                                        {biTheTat(v) ? (
                                          <Badge variant="outline" className="border-gray-500/40 bg-gray-500/10 text-gray-500">Đã tắt</Badge>
                                        ) : v.stock > 0 ? (
                                          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700">{v.stock}</Badge>
                                        ) : (
                                          <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700">Hết</Badge>
                                        )}
                                      </td>
                                      <td className="px-3 py-1.5 text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                                          onClick={() =>
                                            setEditForm({
                                              itemId: row.item_id,
                                              modelId: v.model_id,
                                              originalLabel: (v.label || "").replace(/\D/g, ""),
                                              label: (v.label || "").replace(/\D/g, ""),
                                              display: v.label || "",
                                              price: v.price > 0 ? String(v.price) : "",
                                            })
                                          }
                                          title="Sửa số hiển thị / đổi số / đổi giá"
                                        >
                                          Sửa
                                        </Button>
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
            <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-lg">
              <div className="shrink-0 border-b border-border px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Thêm số SIM vào Item #{addItemId}
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {/* ── Nhập tay ── */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="sim-label">Số SIM (10 số)</Label>
                    <Input
                      id="sim-label"
                      value={addForm.label}
                      onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                      placeholder="0767777770"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sim-display">Số hiển thị (có chấm)</Label>
                    <Input
                      id="sim-display"
                      value={addForm.display}
                      onChange={(e) => setAddForm({ ...addForm, display: e.target.value })}
                      placeholder="076.55555.94 — để trống = dùng số bên trái"
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
                <p className="mb-4 mt-1.5 text-xs text-muted-foreground">
                  Dấu chấm chỉ để hiển thị cho dễ đọc số đẹp — số thật (khớp kho, mã SKU trên Shopee) vẫn tính theo chữ số nên không làm sai giá trị SIM.
                </p>

                {/* ── Chọn từ kho số ── */}
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground">Chọn từ kho số</p>
                    <div className="flex shrink-0 gap-1 rounded-md bg-border/50 p-0.5">
                      <button
                        type="button"
                        onClick={() => setNguonSo("tong")}
                        className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                          nguonSo === "tong" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        Sheet tổng
                      </button>
                      <button
                        type="button"
                        onClick={() => setNguonSo("re")}
                        className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                          nguonSo === "re" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                        }`}
                      >
                        Giá rẻ 229k
                      </button>
                    </div>
                  </div>

                  {nguonSo === "tong" ? (
                    <>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Input
                          className="h-8 flex-1 text-xs"
                          placeholder="Tìm số: *77777* (chứa), *678 (đuôi), 090* (đầu)"
                          value={addForm.label}
                          onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                        />
                      </div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Select value={khoTong} onValueChange={setKhoTong}>
                          <SelectTrigger className="h-8 w-full text-xs sm:w-[180px]">
                            <SelectValue placeholder="Kho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả kho</SelectItem>
                            {danhSachKho.map((k) => (
                              <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={khoFilter.network} onValueChange={(v) => setKhoFilter((p) => ({ ...p, network: v }))}>
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Nhà mạng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Mọi mạng</SelectItem>
                            {networks.map((n) => (
                              <SelectItem key={n} value={n}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-8 w-[110px] text-xs"
                            placeholder="Giá từ (đ)"
                            value={khoFilter.priceMin}
                            onChange={(e) => setKhoFilter((p) => ({ ...p, priceMin: e.target.value }))}
                          />
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <Input
                            className="h-8 w-[110px] text-xs"
                            placeholder="Giá đến (đ)"
                            value={khoFilter.priceMax}
                            onChange={(e) => setKhoFilter((p) => ({ ...p, priceMax: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {dangTaiSims ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">Đang tải…</p>
                        ) : simsTong.length === 0 ? (
                          <p className="py-4 text-center text-xs text-muted-foreground">
                            Không tìm thấy SIM nào khớp. (Bấm vào ô tìm/đổi Kho để nạp)
                          </p>
                        ) : (
                          simsTong.map((s) => (
                            <div
                              key={s.id}
                              className="flex cursor-pointer items-center justify-between gap-2 rounded border border-border/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-primary/10"
                              onClick={() => setAddForm({ label: s.rawDigits, display: s.displayNumber || s.rawDigits, price: String(s.price) })}
                            >
                              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{s.displayNumber}</span>
                              <span className="shrink-0 text-muted-foreground">{s.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Input
                          className="h-8 flex-1 text-xs"
                          placeholder="Tìm số (*678, 090*, 090*6666)"
                          value={addForm.label}
                          onChange={(e) => setAddForm({ ...addForm, label: e.target.value })}
                        />
                        <Select value={khoFilter.network} onValueChange={(v) => setKhoFilter((p) => ({ ...p, network: v }))}>
                          <SelectTrigger className="h-8 w-[110px] text-xs">
                            <SelectValue placeholder="Nhà mạng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Mọi mạng</SelectItem>
                            {networks.map((n) => (
                              <SelectItem key={n} value={n}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-48 space-y-1 overflow-y-auto">
                        {(cheapSims || [])
                          .filter((s) => {
                            if (khoFilter.network !== "all" && s.network !== khoFilter.network) return false;
                            return khopTim(s.rawDigits, addForm.label);
                          })
                          .slice(0, 100)
                          .map((s) => (
                            <div
                              key={s.id}
                              className="flex cursor-pointer items-center justify-between gap-2 rounded border border-border/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-primary/10"
                              onClick={() => setAddForm({ label: s.rawDigits, display: s.displayNumber || s.rawDigits, price: String(s.price) })}
                            >
                              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                                {s.displayNumber || s.rawDigits}
                                <span className="ml-1.5 rounded bg-gold/15 px-1 py-0.5 text-[10px] font-normal text-gold">229k</span>
                              </span>
                              <span className="shrink-0 text-muted-foreground">{s.price.toLocaleString("vi-VN")}₫</span>
                            </div>
                          ))}
                        {(cheapSims || []).filter((s) => {
                          if (khoFilter.network !== "all" && s.network !== khoFilter.network) return false;
                          return khopTim(s.rawDigits, addForm.label);
                        }).length === 0 && (
                          <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy SIM nào khớp.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => setAddItemId(null)}>Huỷ</Button>
                <Button size="sm" onClick={() => void handleAddModel()} disabled={adding}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {adding ? "Đang thêm…" : "Thêm vào listing"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dialog sửa biến thể (đổi hiển thị / đổi số / đổi giá) ── */}
        {editForm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-lg">
              <div className="border-b border-border px-5 py-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Sửa biến thể (Model #{editForm.modelId})
                </h3>
              </div>
              <div className="p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-label">Số SIM (10 số)</Label>
                    <Input
                      id="edit-label"
                      value={editForm.label}
                      onChange={(e) => setEditForm((p) => (p ? { ...p, label: e.target.value } : p))}
                      placeholder="0767777770"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-display">Số hiển thị (có chấm)</Label>
                    <Input
                      id="edit-display"
                      value={editForm.display}
                      onChange={(e) => setEditForm((p) => (p ? { ...p, display: e.target.value } : p))}
                      placeholder="076.55555.94 — để trống = dùng số bên trái"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-price">Giá (VNĐ)</Label>
                    <Input
                      id="edit-price"
                      value={editForm.price}
                      onChange={(e) => setEditForm((p) => (p ? { ...p, price: e.target.value } : p))}
                      placeholder="Để trống = giữ giá cũ"
                    />
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Sửa tại chỗ, giữ nguyên listing. Muốn đổi hẳn value sang số khác thì nhập số mới ở đây.
                  Dấu chấm chỉ để hiển thị — khớp kho vẫn tính theo chữ số, không làm sai giá trị.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                <Button variant="ghost" size="sm" onClick={() => setEditForm(null)}>Huỷ</Button>
                <Button size="sm" onClick={() => void handleEditModel()} disabled={editing}>
                  {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editing ? "Đang lưu…" : "Lưu & đồng bộ"}
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
