"use client";

/**
 * Quản lý SỐ (biến thể) của một listing Shopee ngay trên trang /admin/shopee.
 *
 * A Khoa mở 1 sản phẩm → thấy từng số + tồn kho → số nào hết thì "Tắt" (kho=0),
 * và "Thêm số" / "Đổi số" bằng cách chọn thẳng một số CÒN HÀNG trong kho
 * (lọc sẵn theo loại listing: ngũ/tứ/lục quý, hoặc đầu số).
 *
 * Backend đã có sẵn:
 *  - POST /api/admin/shopee/items/disable-models  { models:[{item_id,model_id}] }  → tắt (stock=0)
 *  - POST /api/admin/shopee/items/add-model       { itemId,label,display,price,stock } → thêm số
 *  - POST /api/admin/shopee/items/edit-model      { itemId,modelId,label,display,price,currentLabel } → đổi số tại chỗ
 *  - GET  /api/sims?quyType=…|search=…            → kho số còn bán (public, không cần token)
 */

import { useCallback, useState } from "react";
import { Boxes, Check, Loader2, Package, PencilLine, Plus, PowerOff, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { fetchCheapStock, type CheapSim } from "@/lib/cheapSimSheet";

export interface ShopeeVariant {
  model_id: number;
  label: string; // nhãn hiển thị (có chấm) như đang lưu trên Shopee
  sku: string | null;
  price: number;
  stock: number;
  inKho: boolean;
}

interface KhoSim {
  rawDigits: string;
  displayNumber: string;
  formattedNumber: string;
  price: number;
  isVIP?: boolean;
  /** Gói cước (TK179, M125M…) khi số lấy từ kho SIM giá rẻ; số đẹp thì rỗng. */
  goiCuoc?: string;
}

const QUY_CHIPS = ["Tứ quý", "Ngũ quý", "Lục quý"] as const;

/** Các gói cước có trong kho SIM giá rẻ (khớp normalizeGoiCuoc của sheet). */
const KNOWN_GOI = ["TK179", "TK159", "TK135", "HN125M", "M125M", "MXH120", "PT90", "NA90"] as const;

/**
 * Kho SIM giá rẻ 229K (gói cước / đầu số) đọc từ Google Sheet Khosim_Shopee —
 * cùng nguồn với trang /mua-sim-gia-re. Tải 1 lần rồi lọc tại client; cache ở
 * cấp module (TTL 5') để mở nhiều listing không phải kéo lại ~13k dòng mỗi lần.
 */
let promoCache: { at: number; sims: CheapSim[] } | null = null;
let promoInflight: Promise<CheapSim[]> | null = null;
const PROMO_TTL = 5 * 60 * 1000;

async function getPromoStock(): Promise<CheapSim[]> {
  if (promoCache && Date.now() - promoCache.at < PROMO_TTL) return promoCache.sims;
  if (promoInflight) return promoInflight;
  promoInflight = fetchCheapStock()
    .then((sims) => {
      promoCache = { at: Date.now(), sims };
      return sims;
    })
    .finally(() => {
      promoInflight = null;
    });
  return promoInflight;
}

const formatVnd = (n: number) => (n > 0 ? n.toLocaleString("vi-VN") + "₫" : "—");

const fetchJson = async <T,>(path: string, init?: RequestInit, token?: string): Promise<T> => {
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

/** Đoán bộ lọc kho theo tên listing để mở picker là thấy gợi ý đúng loại ngay. */
function guessFilter(itemName: string): { quyType?: string; search?: string } {
  const s = itemName.toLowerCase();
  if (/ng(?:ũ|u)\s*qu(?:ý|y)/.test(s)) return { quyType: "Ngũ quý" };
  if (/t(?:ứ|u)\s*qu(?:ý|y)/.test(s)) return { quyType: "Tứ quý" };
  if (/l(?:ụ|u)c\s*qu(?:ý|y)/.test(s)) return { quyType: "Lục quý" };
  const dau = itemName.match(/0\d{2}/); // đầu số 3 chữ, vd 093 → "093*"
  if (dau) return { search: dau[0] + "*" };
  return {};
}

type PickerSource = "dep" | "goicuoc";

/** Gói cước xuất hiện trong tên listing (TK179, M125M…) → gợi ý kho SIM giá rẻ. */
function guessGoi(itemName: string): string | null {
  const s = itemName.toUpperCase();
  return KNOWN_GOI.find((g) => s.includes(g)) ?? null;
}

/**
 * Đoán kho nên tra khi mở picker:
 *  - "goicuoc" (kho SIM giá rẻ 229K): TK179 · nguyên kit · data · hàng ~150–400K.
 *  - "dep" (kho số đẹp): thần tài · tứ/ngũ/lục quý · số đẹp — giữ nguyên như cũ.
 * Đoán sai vẫn đổi được bằng nút chuyển kho trong picker.
 */
function guessSource(itemName: string, variants: ShopeeVariant[]): PickerSource {
  if (guessGoi(itemName)) return "goicuoc";
  const s = itemName.toLowerCase();
  if (/nguy[eê]n\s*kit|g[oó]i\s*c[uư][ơớ]c|\bkit\b|\bdata\b|gi[aá]\s*r[eẻ]/.test(s)) return "goicuoc";
  const hasQuy = /qu(?:ý|y)/.test(s);
  const price = suggestPrice(variants);
  if (!hasQuy && price >= 150_000 && price <= 400_000) return "goicuoc";
  return "dep";
}

/** Giá gợi ý khi thêm số mới: giữ mức đang bán trên listing (số còn hàng đầu tiên, không thì cao nhất). */
function suggestPrice(variants: ShopeeVariant[]): number {
  const inStock = variants.find((v) => v.stock > 0 && v.price > 0);
  if (inStock) return inStock.price;
  const prices = variants.map((v) => v.price).filter((p) => p > 0);
  return prices.length ? Math.max(...prices) : 0;
}

type PickerState =
  | { mode: "add"; price: number }
  | { mode: "edit"; modelId: number; currentLabel: string; price: number };

export default function ShopeeListingNumbers({
  itemId,
  itemName,
  variants,
  token,
  stale,
  snapshotAt,
  numberIndex,
  onChange,
  onRefresh,
}: {
  itemId: number;
  itemName: string;
  variants: ShopeeVariant[];
  token?: string;
  stale?: boolean;
  snapshotAt?: string | null;
  /** rawDigits → các listing đang dùng số đó (để chặn gán 1 SIM vào 2 sản phẩm). */
  numberIndex?: Map<string, { itemId: number; itemName: string }[]>;
  onChange: (next: ShopeeVariant[]) => void;
  onRefresh?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  // Sửa kho tại chỗ (không đổi số) — cho ô "số ngẫu nhiên" và bật/tắt số lẻ.
  const [editStock, setEditStock] = useState<{ modelId: number; value: string } | null>(null);

  // Kho picker
  const [source, setSource] = useState<PickerSource>("dep");
  const [q, setQ] = useState("");
  const [quyType, setQuyType] = useState<string | null>(null);
  const [goiPackage, setGoiPackage] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [results, setResults] = useState<KhoSim[]>([]);
  const [searching, setSearching] = useState(false);

  const soDangCo = new Set(variants.map((v) => v.label.replace(/\D/g, "")));

  // Số đang được dùng ở LISTING KHÁC (1 SIM chỉ nên nằm ở 1 sản phẩm) → tên SP đó.
  const usedElsewhere = (digits: string): string | null => {
    const other = numberIndex?.get(digits)?.find((x) => x.itemId !== itemId);
    return other ? other.itemName : null;
  };

  // Ẩn khỏi picker những số đã nằm ở sản phẩm khác — không cho chọn để tránh trùng.
  const shownResults = results.filter((s) => !usedElsewhere(s.rawDigits));
  const hiddenCount = results.length - shownResults.length;

  // Tìm số với bộ lọc TRUYỀN THẲNG (không đọc state) → gọi được ngay khi mở
  // picker / đổi chip mà không phải chờ re-render, và không tìm lại mỗi lần gõ.
  // Nguồn "dep" = /api/sims (kho số đẹp); "goicuoc" = sheet SIM giá rẻ (lọc client).
  const runSearch = useCallback(
    async (opts: { source: PickerSource; quyType?: string | null; goi?: string | null; term: string }) => {
      setSearching(true);
      try {
        if (opts.source === "goicuoc") {
          const stock = await getPromoStock();
          const term = opts.term.trim();
          const digits = term.replace(/\D/g, "");
          const isSuffix = term.startsWith("*");
          let list = stock;
          if (opts.goi) list = list.filter((s) => s.goiCuoc === opts.goi);
          if (digits) {
            if (isSuffix) list = list.filter((s) => s.rawDigits.endsWith(digits));
            else if (digits.startsWith("0")) list = list.filter((s) => s.rawDigits.startsWith(digits));
            else list = list.filter((s) => s.rawDigits.includes(digits));
          }
          setResults(
            list.slice(0, 60).map((s) => ({
              rawDigits: s.rawDigits,
              displayNumber: s.displayNumber,
              formattedNumber: s.displayNumber,
              price: s.price,
              goiCuoc: s.goiCuoc,
            })),
          );
        } else {
          const params = new URLSearchParams();
          if (opts.quyType) params.set("quyType", opts.quyType);
          else if (opts.term.trim()) params.set("search", opts.term.trim());
          params.set("sort", "price-asc");
          params.set("limit", "40");
          const data = await fetchJson<{ items: KhoSim[] }>(`/api/sims?${params.toString()}`);
          setResults(data.items ?? []);
        }
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setSearching(false);
      }
    },
    [],
  );

  // Mở picker: tự chọn kho (số đẹp / gói cước) + lọc theo tên listing.
  const openPicker = (state: PickerState) => {
    const src = guessSource(itemName, variants);
    const g = guessFilter(itemName);
    const goi = guessGoi(itemName);
    setSource(src);
    setQuyType(src === "dep" ? g.quyType ?? null : null);
    setGoiPackage(src === "goicuoc" ? goi : null);
    setQ(g.search ?? "");
    setResults([]);
    setPicker(state);
    void runSearch({ source: src, quyType: g.quyType ?? null, goi, term: g.search ?? "" });
  };

  const openAdd = () => {
    const p = suggestPrice(variants);
    setPriceInput(p ? String(p) : "");
    setQtyInput("1");
    openPicker({ mode: "add", price: p });
  };

  const openEdit = (v: ShopeeVariant) => {
    setPriceInput(v.price ? String(v.price) : "");
    // Ô đang HẾT (kho=0) → mặc định về 1 để đổi số xong bán được ngay; ô còn kho
    // thì giữ nguyên số lượng, khỏi vô tình giảm kho khi chỉ đổi số.
    setQtyInput(String(Math.max(1, v.stock)));
    openPicker({ mode: "edit", modelId: v.model_id, currentLabel: v.label, price: v.price });
  };

  const closePicker = () => setPicker(null);

  const disable = async (v: ShopeeVariant) => {
    if (!token) return;
    if (!window.confirm(`Tắt số ${v.label} (đặt kho = 0)? Số sẽ ngừng bán trên Shopee.`)) return;
    setBusy(`disable-${v.model_id}`);
    try {
      await fetchJson(
        "/api/admin/shopee/items/disable-models",
        { method: "POST", body: JSON.stringify({ models: [{ item_id: itemId, model_id: v.model_id }] }) },
        token,
      );
      onChange(variants.map((x) => (x.model_id === v.model_id ? { ...x, stock: 0 } : x)));
      toast.success(`Đã tắt số ${v.label}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // Đặt lại kho cho 1 biến thể (không đổi số) — "số ngẫu nhiên" chỉnh số lượng,
  // hoặc bật lại số đang Hết mà giữ đúng số đó.
  const saveStock = async (v: ShopeeVariant) => {
    if (!token || !editStock) return;
    const stock = Math.max(0, Number(editStock.value) || 0);
    setBusy(`stock-${v.model_id}`);
    try {
      await fetchJson(
        "/api/admin/shopee/items/set-stock",
        { method: "POST", body: JSON.stringify({ itemId, modelId: v.model_id, stock }) },
        token,
      );
      onChange(variants.map((x) => (x.model_id === v.model_id ? { ...x, stock } : x)));
      toast.success(`Đã đặt kho ${v.label} = ${stock}`);
      setEditStock(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pick = async (sim: KhoSim) => {
    if (!token || !picker) return;
    const label = sim.rawDigits;
    const display = sim.formattedNumber || sim.displayNumber || sim.rawDigits;
    const price = Number(priceInput) > 0 ? Number(priceInput) : sim.price;
    const qty = Math.max(1, Number(qtyInput) || 1);
    if (soDangCo.has(label)) {
      toast.error(`Số ${display} đã có trong listing này.`);
      return;
    }
    const elsewhere = usedElsewhere(label);
    if (elsewhere) {
      toast.error(`Số ${display} đang dùng ở sản phẩm khác (${elsewhere}).`);
      return;
    }
    setBusy("pick");
    try {
      if (picker.mode === "add") {
        await fetchJson(
          "/api/admin/shopee/items/add-model",
          { method: "POST", body: JSON.stringify({ itemId, label, display, price, stock: qty }) },
          token,
        );
        toast.success(`Đã thêm ${display} · ${formatVnd(price)}${qty > 1 ? ` · kho ${qty}` : ""}`);
        closePicker();
        onRefresh?.(); // model_id mới do Shopee cấp → đồng bộ lại cho chuẩn
      } else {
        await fetchJson(
          "/api/admin/shopee/items/edit-model",
          {
            method: "POST",
            body: JSON.stringify({ itemId, modelId: picker.modelId, label, display, price, stock: qty, currentLabel: picker.currentLabel }),
          },
          token,
        );
        onChange(
          variants.map((x) =>
            x.model_id === picker.modelId ? { ...x, label: display, sku: label, price, stock: qty } : x,
          ),
        );
        toast.success(`Đã đổi ${picker.currentLabel} → ${display} · kho ${qty}`);
        closePicker();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {stale && (
        <div className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-gold">
          ⚠️ Danh sách dưới đây là bản chụp
          {snapshotAt ? ` lúc ${new Date(snapshotAt).toLocaleString("vi-VN")}` : ""} — có thể KHÁC Shopee hiện
          tại. Bấm <b>“Lấy danh sách mới nhất”</b> ở đầu trang để đồng bộ trước khi sửa/tắt số.
        </div>
      )}
      {/* Bảng biến thể */}
      {variants.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Listing này chưa có dữ liệu biến thể — bấm “Lấy danh sách mới nhất” để kéo về.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Số</th>
                <th className="px-3 py-2 text-right font-medium">Giá</th>
                <th className="px-3 py-2 text-center font-medium">Kho</th>
                <th className="px-3 py-2 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const het = v.stock <= 0;
                // Ô "số ngẫu nhiên": nhãn không phải dãy số thật → không có kho gốc
                // để đối chiếu, nên bỏ nhãn "hết kho gốc" (vô nghĩa với nó).
                const isRandom = v.label.replace(/\D/g, "").length < 9;
                const editingRow = editStock && editStock.modelId === v.model_id ? editStock : null;
                const dupElsewhere = isRandom ? null : usedElsewhere(v.label.replace(/\D/g, ""));
                return (
                  <tr key={v.model_id} className={`border-t border-border ${het ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2 font-medium tabular-nums">
                      {v.label}
                      {!v.inKho && !isRandom && (
                        <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">hết kho gốc</span>
                      )}
                      {dupElsewhere && (
                        <span
                          className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary"
                          title={`Số này cũng đang ở sản phẩm: ${dupElsewhere}`}
                        >
                          ⚠ trùng SP khác
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatVnd(v.price)}</td>
                    <td className="px-3 py-2 text-center">
                      {editingRow ? (
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            value={editingRow.value}
                            inputMode="numeric"
                            autoFocus
                            onChange={(e) => setEditStock({ modelId: v.model_id, value: e.target.value.replace(/\D/g, "") })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveStock(v);
                              if (e.key === "Escape") setEditStock(null);
                            }}
                            className="h-7 w-16 tabular-nums text-center"
                          />
                          <Button
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => void saveStock(v)}
                            disabled={busy === `stock-${v.model_id}`}
                            title="Lưu kho"
                          >
                            {busy === `stock-${v.model_id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditStock(null)} title="Huỷ">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : het ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">Hết</span>
                      ) : (
                        <span className="tabular-nums">{v.stock}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          title="Sửa số lượng kho (không đổi số)"
                          onClick={() => setEditStock({ modelId: v.model_id, value: String(v.stock) })}
                          disabled={!!busy}
                        >
                          <Boxes className="h-3.5 w-3.5" /> Sửa kho
                        </Button>
                        {!isRandom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            title="Đổi sang số khác trong kho"
                            onClick={() => openEdit(v)}
                            disabled={!!busy}
                          >
                            <PencilLine className="h-3.5 w-3.5" /> Đổi số
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-primary hover:text-primary"
                          title="Tắt số này (kho = 0)"
                          onClick={() => void disable(v)}
                          disabled={het || busy === `disable-${v.model_id}`}
                        >
                          {busy === `disable-${v.model_id}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PowerOff className="h-3.5 w-3.5" />
                          )}
                          Tắt
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

      {/* Nút thêm số */}
      {!picker && (
        <Button size="sm" variant="outline" className="gap-1" onClick={openAdd} disabled={!!busy}>
          <Plus className="h-4 w-4" /> Thêm số vào listing
        </Button>
      )}

      {/* Picker chọn số từ kho (dùng cho cả Thêm và Đổi) */}
      {picker && (
        <div className="rounded-lg border border-gold/40 bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {picker.mode === "add" ? "Thêm số — chọn từ kho" : `Đổi số ${picker.currentLabel} — chọn số mới`}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closePicker} title="Đóng">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chuyển kho: số đẹp ↔ SIM giá rẻ (gói cước) */}
          <div className="mb-2 flex items-center gap-1 rounded-lg border border-border p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setSource("dep");
                setGoiPackage(null);
                void runSearch({ source: "dep", quyType, term: q });
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 transition-colors ${
                source === "dep" ? "bg-gold/15 font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Kho số đẹp
            </button>
            <button
              type="button"
              onClick={() => {
                setSource("goicuoc");
                setQuyType(null);
                void runSearch({ source: "goicuoc", goi: goiPackage, term: q });
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 transition-colors ${
                source === "goicuoc" ? "bg-gold/15 font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-3.5 w-3.5" /> Kho SIM giá rẻ (gói cước)
            </button>
          </div>

          {/* Chip lọc: quý (số đẹp) hoặc gói cước (SIM giá rẻ) */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {source === "dep" ? (
              QUY_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const nextQuy = quyType === c ? null : c;
                    setQuyType(nextQuy);
                    setQ("");
                    void runSearch({ source: "dep", quyType: nextQuy, term: "" });
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    quyType === c ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:border-gold/50"
                  }`}
                >
                  {c}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setGoiPackage(null);
                    void runSearch({ source: "goicuoc", goi: null, term: q });
                  }}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    goiPackage === null ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:border-gold/50"
                  }`}
                >
                  Tất cả gói
                </button>
                {KNOWN_GOI.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      const next = goiPackage === g ? null : g;
                      setGoiPackage(next);
                      void runSearch({ source: "goicuoc", goi: next, term: q });
                    }}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      goiPackage === g ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:border-gold/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (source === "dep" && quyType) setQuyType(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && void runSearch({ source, quyType, goi: goiPackage, term: q })}
                placeholder={
                  source === "goicuoc"
                    ? "Lọc đầu số trong gói: 0938, 0901, 093…"
                    : "Tìm số trong kho: *99999, 093*, 0938…"
                }
                className="h-9 pl-9"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Giá:</span>
              <Input
                value={priceInput}
                inputMode="numeric"
                onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                placeholder="giá bán"
                className="h-9 w-32 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground" title="Số lượng kho cho số này">SL:</span>
              <Input
                value={qtyInput}
                inputMode="numeric"
                onChange={(e) => setQtyInput(e.target.value.replace(/\D/g, ""))}
                placeholder="1"
                className="h-9 w-16 tabular-nums"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void runSearch({ source, quyType, goi: goiPackage, term: q })}
              disabled={searching}
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tìm
            </Button>
          </div>

          {/* Kết quả kho */}
          {searching ? (
            <div className="grid place-items-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : shownResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {results.length > 0
                ? `Đã ẩn ${hiddenCount} số vì đang dùng ở sản phẩm khác — thử số/gói khác.`
                : source === "goicuoc"
                  ? "Không thấy số trong kho SIM giá rẻ — đổi gói hoặc bỏ bớt đầu số."
                  : "Không có số phù hợp trong kho — đổi loại hoặc từ khoá tìm."}
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
              {shownResults.map((sim) => {
                const daCo = soDangCo.has(sim.rawDigits);
                return (
                  <li key={sim.rawDigits} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <span className="font-medium tabular-nums">{sim.formattedNumber || sim.displayNumber}</span>
                      {sim.goiCuoc ? (
                        <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">{sim.goiCuoc}</span>
                      ) : null}
                      {source === "dep" && (
                        <span className="ml-2 text-xs text-muted-foreground tabular-nums">kho: {formatVnd(sim.price)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => void pick(sim)}
                      disabled={daCo || busy === "pick"}
                      title={daCo ? "Đã có trong listing" : "Chọn số này"}
                    >
                      {busy === "pick" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {daCo ? "Đã có" : "Chọn"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {hiddenCount > 0 && shownResults.length > 0 && (
            <p className="mt-1 text-[11px] text-gold">Đã ẩn {hiddenCount} số đang dùng ở sản phẩm khác.</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {source === "goicuoc"
              ? "Số lấy từ kho SIM giá rẻ 229K (Google Sheet). Giá đẩy lên Shopee = ô “Giá” (mặc định giữ giá listing)."
              : "Giá mặc định = mức đang bán trên listing (giữ nguyên giá). Sửa ô “Giá” nếu muốn khác."}{" "}
            Kho mặc định = 1 (số vừa đổi/thêm sẽ bán được ngay); sửa ô “SL” nếu cần nhiều hơn.
          </p>
        </div>
      )}
    </div>
  );
}
