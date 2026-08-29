"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdgeFunctionText, invokeEdgeFunction } from '@/integrations/supabase/edgeFunctions';
import { EDGE_FUNCTIONS_URL } from '@/integrations/supabase/config';
import { ArrowLeft, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { normalizeSIM, parsePrice, formatPrice, type NormalizedSIM } from '@/lib/simUtils';
import { getPromotionalData } from '@/hooks/useSimData';
import { CHEAP_KHO, fetchCheapSimById, isCheapSimId, type CheapSim } from '@/lib/cheapSimSheet';
import { formatSimQuyAware } from '@/lib/simDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const ORDER_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby_3QYkdJSBo43QiJlJ88rSLCsXN7baZtnW5v9VeF3AZJAVzZOjB35bhfFCHZBrVwA/exec";
const MAKE_WEBHOOK_PROXY = `${EDGE_FUNCTIONS_URL}/make-webhook-proxy`;

// --- Helpers ---

/** Normalize a phone/SIM number to digits only, pad to 10 if 9 digits */
const normalizePhoneNumber = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 9) return '0' + digits;
  return digits;
};

/** Detect network from prefix (3-digit) */
const detectNetworkByPrefix = (rawDigits: string): string => {
  const digits = normalizePhoneNumber(rawDigits);
  if (digits.length < 3) return 'Khác';
  const prefix = digits.substring(0, 3);
  if (['090', '093', '089', '070', '076', '077', '078', '079'].includes(prefix)) return 'Mobifone';
  if (['088', '091', '094', '081', '082', '083', '084', '085'].includes(prefix)) return 'Vinaphone';
  if (['099', '059'].includes(prefix)) return 'Gmobile';
  return 'Khác';
};

/** Generate order code: DHyymmdd-random4 */
const generateOrderCode = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `DH${yy}${mm}${dd}-${rand}`;
};

/** Validate Vietnamese name: only Vietnamese letters + spaces, 6-20 chars, no digits/special */
const VIETNAMESE_NAME_REGEX = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;

interface FieldErrors {
  fullName?: string;
  phone?: string;
  address?: string;
}

/**
 * The checkout form's fields. `note` is deliberately absent from FieldErrors:
 * it is optional and has no validation rule, so it can never carry an error.
 */
interface CheckoutFormData {
  fullName: string;
  phone: string;
  address: string;
  note: string;
}

const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
  switch (field) {
    case 'fullName': {
      const v = value.trim();
      if (!v) return 'Vui lòng nhập họ tên';
      if (v.length < 6) return 'Họ tên phải từ 6 ký tự trở lên';
      if (v.length > 20) return 'Họ tên không quá 20 ký tự';
      if (!VIETNAMESE_NAME_REGEX.test(v)) return 'Họ tên chỉ gồm chữ cái tiếng Việt và khoảng trắng';
      return undefined;
    }
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      if (!digits) return 'Vui lòng nhập số điện thoại';
      if (digits.length !== 10) return 'Số điện thoại phải đúng 10 chữ số';
      return undefined;
    }
    case 'address': {
      const v = value.trim();
      if (!v) return 'Vui lòng nhập địa chỉ';
      if (v.length < 10) return 'Địa chỉ phải từ 10 ký tự trở lên';
      if (v.length > 50) return 'Địa chỉ không quá 50 ký tự';
      return undefined;
    }
  }
};

const validateAll = (formData: { fullName: string; phone: string; address: string }): FieldErrors => {
  const errors: FieldErrors = {};
  const fn = validateField('fullName', formData.fullName);
  if (fn) errors.fullName = fn;
  const ph = validateField('phone', formData.phone);
  if (ph) errors.phone = ph;
  const ad = validateField('address', formData.address);
  if (ad) errors.address = ad;
  return errors;
};

const isFormValid = (formData: { fullName: string; phone: string; address: string }): boolean => {
  return Object.keys(validateAll(formData)).length === 0;
};

/**
 * SIM có đặt hàng được hay không, xét theo giá.
 *
 * Đây là bản sao ở phía web của luật `priceVnd` trong
 * `supabase/functions/make-webhook-proxy/_validators.ts`: webhook từ chối mọi
 * đơn có `priceVnd <= 0`. Ba số đang trắng cả `GIÁ BÁN` và `Final_Price`
 * (SIM133091 0779.168.168, SIM133228 0777.997.999, SIM133251 0789.999.919) rơi
 * đúng vào đó — trước đây trang vẫn hiện đủ form, khách điền họ tên/địa chỉ,
 * bấm Xác nhận rồi chỉ nhận được toast "Có lỗi xảy ra. Vui lòng thử lại." mà
 * không biết vì sao. Giá 0 nghĩa là chưa có giá niêm yết, không phải "miễn
 * phí", nên đường đúng là mời Quý khách nhận báo giá chứ không phải cho đặt.
 */
export const isOrderablePrice = (price: number | undefined | null): boolean =>
  typeof price === 'number' && Number.isFinite(price) && price > 0;

// --- CSV Parsing (unchanged logic) ---

interface CheckoutSimData {
  simId: string;
  rawDigits: string;
  displayNumber: string;
  formattedNumber?: string;
  originalPriceVnd: number;
  finalPriceVnd?: number;
  discountType?: string;
  discountValue?: number;
  kho?: string;
  tinhTrang?: string;
  trangThai?: string;
  network: string;
  tags: string[];
}

const parseCSVAndFindSim = (csvText: string, targetSimId: string): CheckoutSimData | null => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const rawHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const getHeaderIndexExact = (names: string[]): number => {
    for (const name of names) {
      const idx = rawHeaders.findIndex(h => h.toUpperCase().replace(/\s+/g, ' ').trim() === name.toUpperCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const getHeaderIndexPartial = (names: string[]): number => {
    for (const name of names) {
      const idx = rawHeaders.findIndex(h => h.toUpperCase().replace(/\s+/g, ' ').includes(name.toUpperCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const simIdIdx = getHeaderIndexPartial(['SIMID', 'SIM ID', 'SimID']);
  const displayIdx = getHeaderIndexExact(['SỐ THUÊ BAO', 'SO THUE BAO']);
  const rawIdx = getHeaderIndexPartial(['SỐ THUÊ BAO CHUẨN', 'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'SO THUE BAO CHUAN']);
  const finalPriceIdx = getHeaderIndexPartial(['FINAL_PRICE', 'Final_Price']);
  const priceIdx = getHeaderIndexPartial(['GIÁ BÁN', 'GIA BAN']);
  const discountTypeIdx = getHeaderIndexPartial(['DISCOUNT_TYPE']);
  const discountValueIdx = getHeaderIndexPartial(['DISCOUNT_VALUE']);
  const khoIdx = getHeaderIndexPartial(['KHO']);
  const tinhTrangIdx = getHeaderIndexPartial(['TÌNH TRẠNG', 'TINH TRANG']);
  const trangThaiIdx = getHeaderIndexPartial(['TRẠNG THÁI', 'TRANG THAI']);

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());

    const rowSimId = simIdIdx >= 0 ? values[simIdIdx]?.trim() : '';

    if (rowSimId === targetSimId) {
      // `TRẠNG THÁI = ẨN` là số shop đã chủ động rút khỏi kho bán. Nhánh CSV này
      // trước đây vẫn trả về hàng đó nên trang đặt hàng hiện đủ form; nay loại
      // ngay tại đây cho khớp guard của `fetch-sim-by-id`. (SIM đã bán thì
      // `fetch-sim-data` đã lọc theo tab SIM_SOLD trước khi CSV tới đây.)
      const rowTrangThai = trangThaiIdx >= 0 ? (values[trangThaiIdx] || '').trim() : '';
      if (rowTrangThai.toUpperCase() === 'ẨN') return null;

      const displayNumber = displayIdx >= 0 ? (values[displayIdx] || '').trim() : '';
      const rawNumber = rawIdx >= 0 ? (values[rawIdx] || '').trim() : '';
      const rawDigits = rawNumber.replace(/\D/g, '') || displayNumber.replace(/\D/g, '');

      const finalPriceStr = finalPriceIdx >= 0 ? (values[finalPriceIdx] || '').trim() : '';
      const originalPriceStr = priceIdx >= 0 ? (values[priceIdx] || '').trim() : '';
      const effectivePrice = parsePrice(finalPriceStr) || parsePrice(originalPriceStr) || 0;

      return {
        simId: rowSimId,
        rawDigits,
        displayNumber: displayNumber || rawNumber || rawDigits,
        originalPriceVnd: parsePrice(originalPriceStr) || effectivePrice,
        finalPriceVnd: parsePrice(finalPriceStr) || undefined,
        discountType: discountTypeIdx >= 0 ? values[discountTypeIdx] : undefined,
        discountValue: discountValueIdx >= 0 ? parsePrice(values[discountValueIdx]) || undefined : undefined,
        kho: khoIdx >= 0 ? values[khoIdx] : undefined,
        tinhTrang: tinhTrangIdx >= 0 ? values[tinhTrangIdx] : undefined,
        trangThai: trangThaiIdx >= 0 ? values[trangThaiIdx] : undefined,
        network: detectNetworkByPrefix(rawDigits),
        tags: []
      };
    }
  }
  return null;
};

/** Map a promo-warehouse row onto the shape the rest of this page expects.
 *  `kho` is set so the summary renders the same badge as the main catalogue's
 *  promo rows; there is no discount to carry because the list price *is* the
 *  promo price. */
const cheapSimToCheckout = (sim: CheapSim): CheckoutSimData => ({
  simId: sim.id,
  rawDigits: sim.rawDigits,
  displayNumber: sim.displayNumber,
  originalPriceVnd: sim.price,
  kho: CHEAP_KHO,
  network: sim.network,
  tags: [],
});

/** Map a homepage NormalizedSIM (from the `['simData']` react-query cache) onto
 *  the shape this page expects. The homepage already fetched + normalised the
 *  whole catalogue, so when the visitor arrives via a SIM card the checkout can
 *  render instantly instead of re-downloading the ~5.5 MB CSV to find one row.
 *  `sim.price` is already `finalPrice ?? originalPrice` (useSimData), so it is
 *  the exact price shown on the card the user clicked. Promo fields come from
 *  the module-level promotional store; `kho`/`tinhTrang`/`trangThai` are not
 *  carried on NormalizedSIM, so they stay undefined on this fast path — the
 *  full-CSV queryFn below backfills them whenever it runs. */
const homeSimToCheckout = (sim: NormalizedSIM): CheckoutSimData => {
  const promo = getPromotionalData(sim.id);
  return {
    simId: sim.id,
    rawDigits: sim.rawDigits,
    displayNumber: sim.displayNumber,
    formattedNumber: sim.formattedNumber,
    originalPriceVnd: promo?.originalPrice ?? sim.price,
    finalPriceVnd: promo?.finalPrice,
    discountType: promo?.discountType,
    discountValue: promo?.discountValue,
    network: sim.network,
    tags: sim.tags,
  };
};

/** Map the JSON response from the `fetch-sim-by-id` edge function onto the
 *  shape this page expects. The edge function returns a single row from the
 *  Google Sheet via a gviz query — a few hundred bytes instead of 5.5 MB. */
interface FetchSimByIdResponse {
  simId: string;
  rawDigits: string;
  displayNumber: string;
  originalPriceVnd: number;
  finalPriceVnd?: number;
  priceVnd: number;
  discountType?: string;
  discountValue?: number;
  kho?: string;
  tinhTrang?: string;
  trangThai?: string;
  network: string;
}

const byIdSimToCheckout = (res: FetchSimByIdResponse): CheckoutSimData => ({
  simId: res.simId,
  rawDigits: res.rawDigits,
  displayNumber: res.displayNumber,
  originalPriceVnd: res.originalPriceVnd,
  finalPriceVnd: res.finalPriceVnd,
  discountType: res.discountType,
  discountValue: res.discountValue,
  kho: res.kho,
  tinhTrang: res.tinhTrang,
  trangThai: res.trangThai,
  network: res.network,
  tags: [],
});

// --- Component ---

const CheckoutClient = () => {
  const params = useParams<{ simId: string }>();
  const simId = params?.simId;
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fast path: when the visitor arrived from the homepage, the whole catalogue
  // is already cached under `['simData']` (same QueryClient at root layout).
  // Use it as initialData so the page renders immediately with the exact SIM the
  // user clicked — no 5.5 MB CSV round-trip. Guard against the placeholder seed:
  // placeholderData is never written to the cache, so `dataUpdatedAt === 0` means
  // only fake seed rows exist and we must fall through to the real fetch.
  const initialCheckoutSim = useMemo(() => {
    if (!simId || isCheapSimId(simId)) return undefined;
    const state = queryClient.getQueryState<NormalizedSIM[]>(['simData']);
    if (!state || state.dataUpdatedAt === 0 || !state.data) return undefined;
    const found = state.data.find((s) => s.id === simId);
    return found ? homeSimToCheckout(found) : undefined;
  }, [simId, queryClient]);

  const [orderCode] = useState(() => generateOrderCode());
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    address: '',
    note: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutFormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: simData, isLoading, error } = useQuery({
    queryKey: ['checkoutSim', simId],
    queryFn: async ({ signal }): Promise<CheckoutSimData | null> => {
      if (!simId) return null;

      // Promo SIMs (SIMKM…) live in a different spreadsheet and are absent from
      // fetch-sim-data entirely — 0 of its 49.608 rows carry that prefix — so
      // without this branch every "ĐẶT NGAY" from /mua-sim-gia-re landed on
      // "SIM không tồn tại". Two targeted gviz queries also cost a few hundred
      // bytes against the 5,5 MB the main catalogue transfers.
      if (isCheapSimId(simId)) {
        const cheap = await fetchCheapSimById(simId, signal);
        return cheap ? cheapSimToCheckout(cheap) : null;
      }

      // Fast path: the edge function resolves ONE row via a gviz query (a few
      // hundred bytes) instead of downloading the whole ~5.5 MB catalogue and
      // parsing 49k rows client-side to find this SIM.
      try {
        const response = await invokeEdgeFunction(
          `fetch-sim-by-id?simId=${encodeURIComponent(simId)}`,
          { method: 'GET', signal, throwOnHttpError: false },
        );
        // 404 là câu trả lời DỨT KHOÁT (không tồn tại / đã bán / đã ẩn) — không
        // phải sự cố, nên không được rơi xuống CSV. Rơi xuống CSV vừa tải 5,5 MB
        // vô ích, vừa có nguy cơ bán lại đúng số mà edge function vừa từ chối.
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`fetch-sim-by-id failed: HTTP ${response.status}`);
        const data = (await response.json()) as FetchSimByIdResponse;
        if (!data || !data.simId) return null;
        return byIdSimToCheckout(data);
      } catch (err) {
        // Fall back to the legacy full-CSV path so a by-id hiccup (e.g. gviz
        // rate-limit) never turns into a hard "not found" for a real SIM.
        console.error('[Checkout] fetch-sim-by-id failed, falling back to CSV:', err);
        const csvText = await invokeEdgeFunctionText('fetch-sim-data', { method: 'GET' });
        return parseCSVAndFindSim(csvText, simId);
      }
    },
    enabled: !!simId,
    initialData: initialCheckoutSim,
    staleTime: 5 * 60 * 1000
  });

  const simWithTags = useMemo(() => {
    if (!simData) return null;
    const normalized = normalizeSIM(simData.rawDigits, simData.displayNumber, simData.originalPriceVnd, simData.simId);
    return {
      ...simData,
      tags: normalized.tags,
      formattedNumber: normalized.formattedNumber,
      // Use our own network detection
      network: detectNetworkByPrefix(simData.rawDigits),
    };
  }, [simData]);

  // Determine the display price (same as SIM card on homepage)
  const displayPrice = useMemo(() => {
    if (!simWithTags) return 0;
    if (simWithTags.finalPriceVnd && simWithTags.finalPriceVnd > 0) return simWithTags.finalPriceVnd;
    return simWithTags.originalPriceVnd;
  }, [simWithTags]);

  // Số thuê bao hiển thị: ưu tiên format quý-aware (tứ quý → 3-3-4) để cụm quý
  // không bị dấu chấm cắt (093.368.6666 thay vì 0933.686.666).
  const checkoutDisplay = simWithTags
    ? formatSimQuyAware(simWithTags.rawDigits || simWithTags.displayNumber || '')
    : '';

  // Mirror the real subscriber number into the tab title once the SIM resolves
  // (same pattern as not-found.tsx). The server title keeps the raw simId and the
  // route is noindex, so this is purely cosmetic for the user reading the tab.
  useEffect(() => {
    if (simWithTags && checkoutDisplay) {
      document.title = `Đặt mua SIM ${checkoutDisplay} | CHONSOMOBIFONE`;
    }
  }, [simWithTags, checkoutDisplay]);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // Live validation. `note` is excluded here rather than passed to
    // validateField, whose switch has no case for it and would return undefined
    // for every value — same outcome, but now the compiler enforces it.
    if (field !== 'note' && (touched[field] || value)) {
      const fieldError = validateField(field, value);
      setErrors(prev => {
        const next = { ...prev };
        if (fieldError) next[field] = fieldError;
        else delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    setErrors(prev => {
      const next = { ...prev };
      if (fieldError) next[field] = fieldError;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all
    const allErrors = validateAll(formData);
    setErrors(allErrors);
    setTouched({ fullName: true, phone: true, address: true });
    if (Object.keys(allErrors).length > 0 || !simWithTags) return;
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    if (!simWithTags) return;
    // Chốt chặn cuối: webhook từ chối `priceVnd <= 0`, nên không gửi đơn không
    // có giá. Form đã không được render ở nhánh dưới, đây là lớp thứ hai cho
    // trường hợp giá đổi về 0 giữa lúc khách đang điền.
    if (!isOrderablePrice(displayPrice)) return;
    setIsSubmitting(true);

    const payload = {
      createdAt: new Date().toISOString(),
      orderCode,
      simId: simWithTags.simId,
      simRawDigits: simWithTags.rawDigits,
      simDisplayNumber: simWithTags.displayNumber,
      originalPriceVnd: simWithTags.originalPriceVnd,
      finalPriceVnd: simWithTags.finalPriceVnd,
      priceVnd: displayPrice,
      discountType: simWithTags.discountType,
      discountValue: simWithTags.discountValue,
      kho: simWithTags.kho,
      tinhTrang: simWithTags.tinhTrang,
      trangThai: simWithTags.trangThai,
      network: simWithTags.network,
      fullName: formData.fullName.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      address: formData.address.trim(),
      note: formData.note.trim(),
      paymentMethod: 'COD',
      source: 'LovableWeb'
    };

    try {
      const makeResponse = await fetch(MAKE_WEBHOOK_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!makeResponse.ok) throw new Error(`Webhook failed: ${makeResponse.status}`);

      fetch(ORDER_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      }).catch(err => console.error('Google Apps Script error:', err));

      setShowConfirm(false);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải thông tin SIM...</p>
        </div>
      </div>
    );
  }

  // Not found — cũng là trạng thái cho SIM đã bán hoặc đã ẩn khỏi kho, nên chữ
  // phải mở đường tiếp cho khách thay vì chỉ báo lỗi kèm mã nội bộ.
  if (error || !simWithTags) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">Số này hiện không còn nhận đặt</h1>
          <p className="text-muted-foreground mb-4">
            Số Quý khách chọn vừa có người đặt hoặc đã được rút khỏi kho. Đội ngũ tư vấn có thể giúp
            Quý khách tìm số tương đương về đuôi số và tầm giá.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button onClick={() => router.push('/')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Xem số khác trong kho
            </Button>
            <a
              href="https://zalo.me/0933356666"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/50"
            >
              Nhắn Zalo tìm số tương đương
            </a>
          </div>
        </div>
      </div>
    );
  }

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Vinaphone: 'bg-blue-500 text-white',
    Gmobile: 'bg-emerald-600 text-white',
    Khác: 'bg-gray-500 text-white'
  };

  const networkBadgeClass = networkColors[simWithTags.network] || networkColors['Khác'];

  // SIM chưa có giá niêm yết: hiện đường nhận báo giá, KHÔNG hiện form đặt hàng.
  // Trước đây trang vẫn dựng đủ form với giá "Liên hệ", khách điền xong mới đụng
  // guard `priceVnd > 0` của webhook và chỉ thấy toast lỗi chung.
  if (!isOrderablePrice(displayPrice)) {
    const zaloQuoteUrl = `https://zalo.me/0933356666?text=${encodeURIComponent(
      `Xin chào, tôi muốn nhận báo giá SIM ${checkoutDisplay || simWithTags.simId}`,
    )}`;

    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0" aria-label="Quay lại">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Quay lại</span>
            </Button>
            <h1 className="text-lg font-bold text-foreground truncate">Nhận báo giá SIM</h1>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="rounded-xl border border-gold/30 overflow-hidden shadow-card">
            <div className="bg-gradient-to-b from-[hsl(0,0%,12%)] to-[hsl(0,0%,8%)] p-5">
              <h2 className="text-center text-sm font-semibold text-gold tracking-widest mb-4">THÔNG TIN SIM</h2>

              <div className="text-center text-3xl md:text-4xl font-bold text-primary tracking-wider">
                {checkoutDisplay || simWithTags.simId}
              </div>

              <div className="text-center mt-2">
                <span className="text-muted-foreground text-xs">Giá bán:</span>
                <div className="font-bold text-gold text-xl md:text-2xl mt-0.5">Báo giá riêng</div>
              </div>

              <div className="mt-4 flex justify-center">
                <span className={`px-3 py-1 rounded text-xs font-bold ${networkBadgeClass}`}>
                  {simWithTags.network}
                </span>
              </div>
            </div>
          </div>

          <section className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground">
              Số này được báo giá trực tiếp cho Quý khách
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <span>Nhân viên giao dịch báo giá trong ít phút cho đúng số Quý khách đang xem.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <span>Giao SIM miễn phí toàn quốc, Quý khách thanh toán khi nhận sim.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                <span>Hỗ trợ sang tên chính chủ và trọn bộ hồ sơ.</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Đây là số chưa niêm yết giá công khai, nên trang này chưa mở đặt hàng. Quý khách vui lòng
              nhắn Zalo hoặc gọi hotline để nhận giá chính xác.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={zaloQuoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
              >
                <span className="font-bold">Z</span>
                Nhắn Zalo 0933356666
              </a>
              <a
                href="tel:0938868868"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Phone className="w-4 h-4" />
                Gọi 0938.868.868
              </a>
            </div>

            <Button variant="ghost" onClick={() => router.push('/')} className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Xem số khác trong kho
            </Button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0" aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Quay lại</span>
          </Button>
          <h1 className="text-lg font-bold text-foreground truncate">Đặt mua SIM</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* KHỐI THÔNG TIN SIM */}
        <div className="rounded-xl border border-gold/30 overflow-hidden shadow-card">
          <div className="bg-gradient-to-b from-[hsl(0,0%,12%)] to-[hsl(0,0%,8%)] p-5">
            <h2 className="text-center text-sm font-semibold text-gold tracking-widest mb-4">THÔNG TIN SIM</h2>

            <div className="text-center text-3xl md:text-4xl font-bold text-primary tracking-wider">
              {checkoutDisplay || simWithTags.simId}
            </div>

            <div className="text-center mt-2 mb-5">
              <span className="text-muted-foreground text-xs">Giá bán:</span>
              <div className="font-bold text-primary text-2xl md:text-3xl mt-0.5">
                {formatPrice(displayPrice)}
              </div>
            </div>

            <div className="flex items-start gap-x-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Mã đơn hàng:</span>
                <div className="font-bold text-foreground mt-0.5">{orderCode}</div>
              </div>
              <div className="ml-auto">
                <span className="text-muted-foreground text-xs">Mạng:</span>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${networkBadgeClass}`}>
                    {simWithTags.network}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KHỐI THÔNG TIN NGƯỜI MUA */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">THÔNG TIN NGƯỜI MUA</h2>

          {/* Họ tên */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ tên <span className="text-destructive">*</span></Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              onBlur={() => handleBlur('fullName')}
              className={`h-11${touched.fullName && errors.fullName ? ' border-destructive' : ''}`}
              maxLength={20}
            />
            {touched.fullName && errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Điện thoại */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Điện thoại liên hệ <span className="text-destructive">*</span></Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0909 123 456"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              className={`h-11${touched.phone && errors.phone ? ' border-destructive' : ''}`}
              maxLength={15}
            />
            {touched.phone && errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Địa chỉ <span className="text-destructive">*</span></Label>
            <Input
              id="address"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              className={`h-11${touched.address && errors.address ? ' border-destructive' : ''}`}
              maxLength={50}
            />
            {touched.address && errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Yêu cầu khác */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Yêu cầu khác</Label>
            <Textarea
              id="note"
              placeholder="Ghi chú thêm cho đơn hàng (nếu có)"
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              rows={3}
            />
          </div>

          {/* Thanh toán */}
          <div className="space-y-2">
            <Label>Hình thức thanh toán</Label>
            <div className="flex items-center space-x-3 rounded-lg border border-border p-3 bg-muted/30">
              <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <Label className="flex-1">Thanh toán khi nhận sim</Label>
            </div>
          </div>

          {/* Nút MUA NGAY */}
          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <span className="flex flex-col items-center leading-tight">
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  MUA NGAY
                </span>
                <span className="text-[10px] font-normal opacity-90">Giao sim nhanh miễn phí toàn quốc</span>
              </span>
            )}
          </Button>
        </form>
      </main>

      {/* POPUP XÁC NHẬN */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        {/* The order summary below is a definition grid, not prose, so there is
            nothing to point aria-describedby at. Passing undefined tells Radix
            to omit the attribute instead of referencing an id that never
            renders. */}
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Xác nhận đơn hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
              <span className="text-muted-foreground">Mã đơn hàng:</span>
              <span className="font-semibold">{orderCode}</span>

              <span className="text-muted-foreground">Số thuê bao:</span>
              <span className="font-semibold text-primary">
                {checkoutDisplay || simWithTags.simId}
              </span>

              <span className="text-muted-foreground">Giá tiền:</span>
              <span className="font-semibold text-cta">{formatPrice(displayPrice)}</span>

              <span className="text-muted-foreground">Mạng:</span>
              <span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkBadgeClass}`}>
                  {simWithTags.network}
                </span>
              </span>

              <span className="text-muted-foreground">Họ tên:</span>
              <span className="font-medium">{formData.fullName.trim()}</span>

              <span className="text-muted-foreground">Số điện thoại:</span>
              <span className="font-medium">{formData.phone}</span>

              <span className="text-muted-foreground">Địa chỉ:</span>
              <span className="font-medium">{formData.address.trim()}</span>

              {formData.note.trim() && (
                <>
                  <span className="text-muted-foreground">Yêu cầu khác:</span>
                  <span className="font-medium">{formData.note.trim()}</span>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full gap-2"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* POPUP THÀNH CÔNG */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm text-center [&>button]:hidden" aria-describedby={undefined}>
          <div className="flex flex-col items-center gap-4 py-4">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
            {/* The confirmation message doubles as this dialog's accessible
                name: it had no DialogTitle, so Radix logged an error and screen
                readers announced an unnamed dialog at the one moment the user
                needs to hear that the order went through. DialogTitle renders an
                h2 — visually identical here once leading/tracking are restated,
                since DialogTitle's leading-none tracking-tight would otherwise
                win the twMerge. */}
            <DialogTitle className="text-lg font-semibold text-foreground leading-relaxed tracking-normal">
              CHONSOMOBIFONE.COM đã nhận đơn hàng của Quý khách. Nhân viên giao dịch sẽ gọi lại xác nhận trong ít phút.
            </DialogTitle>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutClient;
