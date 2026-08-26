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
          { method: 'GET', signal },
        );
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

  // Mirror the real subscriber number into the tab title once the SIM resolves
  // (same pattern as not-found.tsx). The server title keeps the raw simId and the
  // route is noindex, so this is purely cosmetic for the user reading the tab.
  useEffect(() => {
    if (simWithTags) {
      const number = simWithTags.displayNumber || simWithTags.formattedNumber || simWithTags.rawDigits;
      if (number) document.title = `Đặt mua SIM ${number} | CHONSOMOBIFONE`;
    }
  }, [simWithTags]);

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

  // Not found
  if (error || !simWithTags) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">Không tìm thấy SIM</h1>
          <p className="text-muted-foreground mb-4">
            SIM với mã "{simId}" không tồn tại hoặc đã hết hàng.
          </p>
          <Button onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
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
              {simWithTags.displayNumber || simWithTags.formattedNumber || simWithTags.rawDigits?.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3') || simWithTags.simId}
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
                  <span className={`px-3 py-1 rounded text-xs font-bold ${networkColors[simWithTags.network] || networkColors['Khác']}`}>
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
                {simWithTags.displayNumber || simWithTags.formattedNumber}
              </span>

              <span className="text-muted-foreground">Giá tiền:</span>
              <span className="font-semibold text-cta">{formatPrice(displayPrice)}</span>

              <span className="text-muted-foreground">Mạng:</span>
              <span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColors[simWithTags.network] || networkColors['Khác']}`}>
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
              Cảm ơn bạn đã đặt hàng thành công tại CHONSOMOBIFONE.COM
            </DialogTitle>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutClient;
