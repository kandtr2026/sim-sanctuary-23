import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { getPromotionalData } from '@/hooks/useSimData';
import type { NormalizedSIM, PromotionalData } from '@/lib/simUtils';
import { normalizeSIM, parsePrice, detectNetwork } from '@/lib/simUtils';

const ORDER_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby_3QYkdJSBo43QiJlJ88rSLCsXN7baZtnW5v9VeF3AZJAVzZOjB35bhfFCHZBrVwA/exec";

// Extended SIM data for checkout (includes sheet-specific fields)
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

// Parse CSV and find SIM by id
const parseCSVAndFindSim = (csvText: string, targetSimId: string): CheckoutSimData | null => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const rawHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Find header indices
  const getHeaderIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = rawHeaders.findIndex(h => 
        h.toUpperCase().replace(/\s+/g, ' ').includes(name.toUpperCase())
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Map headers exactly as specified: SimID → simId, SỐ THUÊ BAO → displayNumber, SỐ THUÊ BAO CHUẨN → rawDigits
  const simIdIdx = getHeaderIndex(['SIMID', 'SIM ID', 'SimID']);
  const displayIdx = getHeaderIndex(['SỐ THUÊ BAO', 'SO THUE BAO']); // This is the formatted number with dots
  const rawIdx = getHeaderIndex(['SỐ THUÊ BAO CHUẨN', 'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'SO THUE BAO CHUAN']); // Raw digits
  const finalPriceIdx = getHeaderIndex(['FINAL_PRICE', 'Final_Price']); // Priority price column
  const priceIdx = getHeaderIndex(['GIÁ BÁN', 'GIA BAN']); // Fallback price
  const discountTypeIdx = getHeaderIndex(['DISCOUNT_TYPE']);
  const discountValueIdx = getHeaderIndex(['DISCOUNT_VALUE']);
  const khoIdx = getHeaderIndex(['KHO']);
  const tinhTrangIdx = getHeaderIndex(['TÌNH TRẠNG', 'TINH TRANG']);
  const trangThaiIdx = getHeaderIndex(['TRẠNG THÁI', 'TRANG THAI']);

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const rowSimId = simIdIdx >= 0 ? values[simIdIdx]?.trim() : '';
    
    if (rowSimId === targetSimId) {
      // Get displayNumber exactly as-is from "SỐ THUÊ BAO" column (keeps dots)
      const displayNumber = displayIdx >= 0 ? (values[displayIdx] || '').trim() : '';
      // Get rawDigits from "SỐ THUÊ BAO CHUẨN" column (digits only)
      const rawNumber = rawIdx >= 0 ? (values[rawIdx] || '').trim() : '';
      const rawDigits = rawNumber.replace(/\D/g, '') || displayNumber.replace(/\D/g, '');
      
      // Price: prioritize Final_Price, fallback to GIÁ BÁN
      const finalPriceStr = finalPriceIdx >= 0 ? (values[finalPriceIdx] || '').trim() : '';
      const originalPriceStr = priceIdx >= 0 ? (values[priceIdx] || '').trim() : '';
      const effectivePrice = parsePrice(finalPriceStr) || parsePrice(originalPriceStr) || 0;
      
      return {
        simId: rowSimId,
        rawDigits,
        // displayNumber: exact string from "SỐ THUÊ BAO" with dots preserved
        displayNumber: displayNumber || rawNumber || rawDigits,
        originalPriceVnd: parsePrice(originalPriceStr) || effectivePrice,
        finalPriceVnd: parsePrice(finalPriceStr) || undefined,
        discountType: discountTypeIdx >= 0 ? values[discountTypeIdx] : undefined,
        discountValue: discountValueIdx >= 0 ? parsePrice(values[discountValueIdx]) || undefined : undefined,
        kho: khoIdx >= 0 ? values[khoIdx] : undefined,
        tinhTrang: tinhTrangIdx >= 0 ? values[tinhTrangIdx] : undefined,
        trangThai: trangThaiIdx >= 0 ? values[trangThaiIdx] : undefined,
        network: detectNetwork(rawDigits),
        tags: []
      };
    }
  }
  
  return null;
};

const Checkout = () => {
  const { simId } = useParams<{ simId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'COD' as 'COD' | 'BANK'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch SIM data directly from edge function
  const { data: simData, isLoading, error } = useQuery({
    queryKey: ['checkoutSim', simId],
    queryFn: async (): Promise<CheckoutSimData | null> => {
      if (!simId) return null;
      
      const { data, error } = await supabase.functions.invoke('fetch-sim-data');
      if (error) throw error;
      
      const csvText = typeof data === 'string' ? data : String(data);
      return parseCSVAndFindSim(csvText, simId);
    },
    enabled: !!simId,
    staleTime: 5 * 60 * 1000
  });

  // Get tags and formattedNumber from normalized SIM
  const simWithTags = useMemo(() => {
    if (!simData) return null;
    const normalized = normalizeSIM(simData.rawDigits, simData.displayNumber, simData.originalPriceVnd, simData.simId);
    return {
      ...simData,
      tags: normalized.tags,
      formattedNumber: normalized.formattedNumber
    };
  }, [simData]);

  // Format price for display - exact formatting without rounding
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null || isNaN(price) || price <= 0) return 'Liên hệ';
    
    if (price >= 1000000000) {
      const billions = price / 1000000000;
      const rounded = Math.round(billions * 10) / 10;
      if (Number.isInteger(rounded)) {
        return `${rounded} tỷ`;
      }
      return `${rounded.toString().replace('.', ',')} tỷ`;
    }
    
    if (price >= 1000000) {
      const millions = price / 1000000;
      const rounded = Math.round(millions * 10) / 10;
      if (Number.isInteger(rounded)) {
        return `${rounded} triệu`;
      }
      return `${rounded.toString().replace('.', ',')} triệu`;
    }
    
    return `${price.toLocaleString('vi-VN')} đ`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 9 || phoneDigits.length > 11) {
        newErrors.phone = 'Số điện thoại phải có 9-11 chữ số';
      }
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !simWithTags) return;
    
    setIsSubmitting(true);
    
    const hasValidPromo = simWithTags.finalPriceVnd && 
                          simWithTags.finalPriceVnd < simWithTags.originalPriceVnd;
    
    const payload = {
      createdAt: new Date().toISOString(),
      simId: simWithTags.simId,
      simRawDigits: simWithTags.rawDigits,
      simDisplayNumber: simWithTags.displayNumber,
      originalPriceVnd: simWithTags.originalPriceVnd,
      finalPriceVnd: simWithTags.finalPriceVnd,
      priceVnd: hasValidPromo ? simWithTags.finalPriceVnd : simWithTags.originalPriceVnd,
      discountType: simWithTags.discountType,
      discountValue: simWithTags.discountValue,
      kho: simWithTags.kho,
      tinhTrang: simWithTags.tinhTrang,
      trangThai: simWithTags.trangThai,
      fullName: formData.fullName.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      address: formData.address.trim(),
      note: formData.note.trim(),
      paymentMethod: formData.paymentMethod,
      source: 'LovableWeb'
    };

    try {
      await fetch(ORDER_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      
      setIsSuccess(true);
      toast.success('Đặt hàng thành công!');
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Loading state
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

  // Error or not found state
  if (error || !simWithTags) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-foreground mb-2">Không tìm thấy SIM</h1>
          <p className="text-muted-foreground mb-4">
            SIM với mã "{simId}" không tồn tại hoặc đã hết hàng.
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Đã nhận đơn!</h1>
          <p className="text-muted-foreground mb-6">
            Chúng tôi sẽ liên hệ sớm để xác nhận đơn hàng của bạn.
          </p>
          <Button onClick={() => navigate('/')} size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const hasPromotion = simWithTags.finalPriceVnd && 
                       simWithTags.finalPriceVnd < simWithTags.originalPriceVnd;

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Viettel: 'bg-red-500 text-white',
    Vinaphone: 'bg-blue-500 text-white',
    iTelecom: 'bg-orange-500 text-white',
    Khác: 'bg-gray-500 text-white'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground truncate">
            Đặt mua SIM
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* SIM Summary Card */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            THÔNG TIN SIM
          </h2>
          
          {/* SIM Number - prioritize displayNumber (from Sheet "SỐ THUÊ BAO"), keep dots as-is */}
          <div className="text-2xl font-bold text-primary mb-3 tracking-wide">
            {simWithTags.displayNumber || simWithTags.formattedNumber || simWithTags.rawDigits?.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3') || simWithTags.simId}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Price */}
            <div>
              <span className="text-muted-foreground">Giá bán:</span>
              <div className="font-semibold">
                {hasPromotion ? (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground line-through text-xs">
                      {formatPrice(simWithTags.originalPriceVnd)}
                    </span>
                    <span className="text-cta text-lg">
                      {formatPrice(simWithTags.finalPriceVnd)}
                    </span>
                  </div>
                ) : (
                  <span className="text-cta text-lg">
                    {formatPrice(simWithTags.originalPriceVnd)}
                  </span>
                )}
              </div>
            </div>

            {/* Network */}
            <div>
              <span className="text-muted-foreground">Mạng:</span>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColors[simWithTags.network]}`}>
                  {simWithTags.network}
                </span>
              </div>
            </div>

            {/* Tags */}
            {simWithTags.tags.length > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Kiểu số đẹp:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {simWithTags.tags.slice(0, 2).map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold-dark"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            THÔNG TIN NGƯỜI MUA
          </h2>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName">
              Họ tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">
              Điện thoại liên hệ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0909 123 456"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">
              Địa chỉ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={errors.address ? 'border-destructive' : ''}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Note */}
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

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Hình thức thanh toán</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange('paymentMethod', value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="COD" id="cod" />
                <Label htmlFor="cod" className="cursor-pointer flex-1">
                  Thanh toán khi nhận sim
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="BANK" id="bank" />
                <Label htmlFor="bank" className="cursor-pointer flex-1">
                  Thanh toán online (chuyển khoản)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Button */}
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
              <>
                <Phone className="w-4 h-4" />
                MUA NGAY
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
