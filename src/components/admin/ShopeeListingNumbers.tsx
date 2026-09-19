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
import { Check, Loader2, PencilLine, Plus, PowerOff, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
}

const QUY_CHIPS = ["Tứ quý", "Ngũ quý", "Lục quý"] as const;

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
  onChange,
  onRefresh,
}: {
  itemId: number;
  itemName: string;
  variants: ShopeeVariant[];
  token?: string;
  stale?: boolean;
  snapshotAt?: string | null;
  onChange: (next: ShopeeVariant[]) => void;
  onRefresh?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);

  // Kho picker
  const [q, setQ] = useState("");
  const [quyType, setQuyType] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [results, setResults] = useState<KhoSim[]>([]);
  const [searching, setSearching] = useState(false);

  const soDangCo = new Set(variants.map((v) => v.label.replace(/\D/g, "")));

  // Tìm số trong kho với bộ lọc TRUYỀN THẲNG (không đọc state) → gọi được ngay khi
  // mở picker / đổi chip mà không cần chờ re-render, và không tìm lại mỗi lần gõ.
  const runSearch = useCallback(async (quy: string | null, term: string) => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (quy) params.set("quyType", quy);
      else if (term.trim()) params.set("search", term.trim());
      params.set("sort", "price-asc");
      params.set("limit", "40");
      const data = await fetchJson<{ items: KhoSim[] }>(`/api/sims?${params.toString()}`);
      setResults(data.items ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSearching(false);
    }
  }, []);

  const openAdd = () => {
    const g = guessFilter(itemName);
    setQuyType(g.quyType ?? null);
    setQ(g.search ?? "");
    setResults([]);
    const p = suggestPrice(variants);
    setPriceInput(p ? String(p) : "");
    setPicker({ mode: "add", price: p });
    void runSearch(g.quyType ?? null, g.search ?? "");
  };

  const openEdit = (v: ShopeeVariant) => {
    const g = guessFilter(itemName);
    setQuyType(g.quyType ?? null);
    setQ(g.search ?? "");
    setResults([]);
    setPriceInput(v.price ? String(v.price) : "");
    setPicker({ mode: "edit", modelId: v.model_id, currentLabel: v.label, price: v.price });
    void runSearch(g.quyType ?? null, g.search ?? "");
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

  const pick = async (sim: KhoSim) => {
    if (!token || !picker) return;
    const label = sim.rawDigits;
    const display = sim.formattedNumber || sim.displayNumber || sim.rawDigits;
    const price = Number(priceInput) > 0 ? Number(priceInput) : sim.price;
    if (soDangCo.has(label)) {
      toast.error(`Số ${display} đã có trong listing này.`);
      return;
    }
    setBusy("pick");
    try {
      if (picker.mode === "add") {
        await fetchJson(
          "/api/admin/shopee/items/add-model",
          { method: "POST", body: JSON.stringify({ itemId, label, display, price, stock: 1 }) },
          token,
        );
        toast.success(`Đã thêm ${display} · ${formatVnd(price)}`);
        closePicker();
        onRefresh?.(); // model_id mới do Shopee cấp → đồng bộ lại cho chuẩn
      } else {
        await fetchJson(
          "/api/admin/shopee/items/edit-model",
          {
            method: "POST",
            body: JSON.stringify({ itemId, modelId: picker.modelId, label, display, price, currentLabel: picker.currentLabel }),
          },
          token,
        );
        onChange(
          variants.map((x) =>
            x.model_id === picker.modelId ? { ...x, label: display, sku: label, price, stock: Math.max(1, x.stock) } : x,
          ),
        );
        toast.success(`Đã đổi ${picker.currentLabel} → ${display}`);
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
                return (
                  <tr key={v.model_id} className={`border-t border-border ${het ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2 font-medium tabular-nums">
                      {v.label}
                      {!v.inKho && (
                        <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">hết kho gốc</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatVnd(v.price)}</td>
                    <td className="px-3 py-2 text-center">
                      {het ? (
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
                          title="Đổi sang số khác trong kho"
                          onClick={() => openEdit(v)}
                          disabled={!!busy}
                        >
                          <PencilLine className="h-3.5 w-3.5" /> Đổi số
                        </Button>
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

          {/* Chip loại + ô tìm + giá */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {QUY_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  const nextQuy = quyType === c ? null : c;
                  setQuyType(nextQuy);
                  setQ("");
                  void runSearch(nextQuy, "");
                }}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  quyType === c ? "border-gold bg-gold/10 text-foreground" : "border-border text-muted-foreground hover:border-gold/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (quyType) setQuyType(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && void runSearch(quyType, q)}
                placeholder="Tìm số trong kho: *99999, 093*, 0938…"
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
            <Button size="sm" variant="secondary" onClick={() => void runSearch(quyType, q)} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tìm
            </Button>
          </div>

          {/* Kết quả kho */}
          {searching ? (
            <div className="grid place-items-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Không có số phù hợp trong kho — đổi loại hoặc từ khoá tìm.</p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
              {results.map((sim) => {
                const daCo = soDangCo.has(sim.rawDigits);
                return (
                  <li key={sim.rawDigits} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <span className="font-medium tabular-nums">{sim.formattedNumber || sim.displayNumber}</span>
                      <span className="ml-2 text-xs text-muted-foreground tabular-nums">kho: {formatVnd(sim.price)}</span>
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
          <p className="mt-2 text-[11px] text-muted-foreground">
            Giá mặc định = mức đang bán trên listing (giữ nguyên giá). Sửa ô “Giá” nếu muốn khác.
          </p>
        </div>
      )}
    </div>
  );
}
