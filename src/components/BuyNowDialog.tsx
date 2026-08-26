"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Phone, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/simUtils";
import { EDGE_FUNCTIONS_URL } from "@/integrations/supabase/config";

const ORDER_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycby_3QYkdJSBo43QiJlJ88rSLCsXN7baZtnW5v9VeF3AZJAVzZOjB35bhfFCHZBrVwA/exec";
const MAKE_WEBHOOK_PROXY = `${EDGE_FUNCTIONS_URL}/make-webhook-proxy`;

export interface BuyNowSim {
  id: string;
  displayNumber: string;
  rawDigits?: string;
  price: number;
  network?: string;
}

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sim: BuyNowSim;
}

const VIETNAMESE_NAME_REGEX =
  /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;

const detectNetworkByPrefix = (rawDigits: string): string => {
  const digits = (rawDigits || "").replace(/\D/g, "");
  const prefix = digits.substring(0, 3);
  if (["090", "093", "089", "070", "076", "077", "078", "079"].includes(prefix)) return "Mobifone";
  if (["088", "091", "094", "081", "082", "083", "084", "085"].includes(prefix)) return "Vinaphone";
  if (["099", "059"].includes(prefix)) return "Gmobile";
  return "Khác";
};

const generateOrderCode = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `DH${yy}${mm}${dd}-${rand}`;
};

interface FormData {
  fullName: string;
  phone: string;
  address: string;
  note: string;
}

const validateField = (field: "fullName" | "phone" | "address", value: string): string | undefined => {
  switch (field) {
    case "fullName": {
      const v = value.trim();
      if (!v) return "Vui lòng nhập họ tên";
      if (v.length < 6) return "Họ tên phải từ 6 ký tự trở lên";
      if (v.length > 20) return "Họ tên không quá 20 ký tự";
      if (!VIETNAMESE_NAME_REGEX.test(v)) return "Họ tên chỉ gồm chữ cái tiếng Việt và khoảng trắng";
      return undefined;
    }
    case "phone": {
      const digits = value.replace(/\D/g, "");
      if (!digits) return "Vui lòng nhập số điện thoại";
      if (digits.length !== 10) return "Số điện thoại phải đúng 10 chữ số";
      return undefined;
    }
    case "address": {
      const v = value.trim();
      if (!v) return "Vui lòng nhập địa chỉ";
      if (v.length < 10) return "Địa chỉ phải từ 10 ký tự trở lên";
      if (v.length > 50) return "Địa chỉ không quá 50 ký tự";
      return undefined;
    }
  }
};

const BuyNowDialog = ({ open, onOpenChange, sim }: BuyNowDialogProps) => {
  const [orderCode] = useState(() => generateOrderCode());
  const [formData, setFormData] = useState<FormData>({ fullName: "", phone: "", address: "", note: "" });
  const [errors, setErrors] = useState<Partial<Record<"fullName" | "phone" | "address", string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const network = useMemo(
    () => sim.network || detectNetworkByPrefix(sim.rawDigits || sim.displayNumber),
    [sim]
  );

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field !== "note") {
      const fieldError = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (fieldError) next[field] = fieldError;
        else delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: "fullName" | "phone" | "address") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validateField(field, formData[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) next[field] = fieldError;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const allErrors: Partial<Record<"fullName" | "phone" | "address", string>> = {};
    const fn = validateField("fullName", formData.fullName);
    if (fn) allErrors.fullName = fn;
    const ph = validateField("phone", formData.phone);
    if (ph) allErrors.phone = ph;
    const ad = validateField("address", formData.address);
    if (ad) allErrors.address = ad;
    setErrors(allErrors);
    setTouched({ fullName: true, phone: true, address: true });
    if (Object.keys(allErrors).length > 0) return;
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    const payload = {
      createdAt: new Date().toISOString(),
      orderCode,
      simId: sim.id,
      simRawDigits: (sim.rawDigits || sim.displayNumber).replace(/\D/g, ""),
      simDisplayNumber: sim.displayNumber,
      priceVnd: sim.price,
      network,
      fullName: formData.fullName.trim(),
      phone: formData.phone.replace(/\D/g, ""),
      address: formData.address.trim(),
      note: formData.note.trim(),
      paymentMethod: "COD",
      source: "BuyNowPopup",
    };

    try {
      const makeResponse = await fetch(MAKE_WEBHOOK_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!makeResponse.ok) throw new Error(`Webhook failed: ${makeResponse.status}`);

      fetch(ORDER_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "no-cors",
      }).catch((err) => console.error("Google Apps Script error:", err));

      setShowConfirm(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onOpenChange(false);
        setFormData({ fullName: "", phone: "", address: "", note: "" });
        setErrors({});
        setTouched({});
      }, 2000);
    } catch (err) {
      console.error("Order submission error:", err);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const networkColors: Record<string, string> = {
    Mobifone: "bg-primary text-primary-foreground",
    Vinaphone: "bg-blue-500 text-white",
    Gmobile: "bg-emerald-600 text-white",
    Khác: "bg-gray-500 text-white",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        {showSuccess ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
            <DialogTitle className="text-lg font-semibold text-foreground leading-relaxed tracking-normal">
              Cảm ơn bạn đã đặt hàng thành công tại CHONSOMOBIFONE.COM
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Nhân viên giao dịch sẽ gọi lại sau ít phút.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-lg">Mua ngay</DialogTitle>
            </DialogHeader>

            {/* Thông tin sim — render ngay, không cần fetch */}
            <div className="rounded-xl border border-gold/30 bg-gradient-to-b from-[hsl(0,0%,12%)] to-[hsl(0,0%,8%)] p-4 text-center">
              <div className="text-2xl font-bold text-primary tracking-wider">
                {sim.displayNumber}
              </div>
              <div className="mt-1 flex items-center justify-center gap-3">
                <span className="font-bold text-cta">{formatPrice(sim.price)}</span>
                {network && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${networkColors[network] || networkColors["Khác"]}`}>
                    {network}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bn-fullName">Họ tên <span className="text-destructive">*</span></Label>
                <Input
                  id="bn-fullName"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  className={`h-11${touched.fullName && errors.fullName ? " border-destructive" : ""}`}
                  maxLength={20}
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bn-phone">Điện thoại liên hệ <span className="text-destructive">*</span></Label>
                <Input
                  id="bn-phone"
                  type="tel"
                  placeholder="0909 123 456"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  className={`h-11${touched.phone && errors.phone ? " border-destructive" : ""}`}
                  maxLength={15}
                />
                {touched.phone && errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bn-address">Địa chỉ <span className="text-destructive">*</span></Label>
                <Input
                  id="bn-address"
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  onBlur={() => handleBlur("address")}
                  className={`h-11${touched.address && errors.address ? " border-destructive" : ""}`}
                  maxLength={50}
                />
                {touched.address && errors.address && (
                  <p className="text-xs text-destructive">{errors.address}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bn-note">Yêu cầu khác</Label>
                <Textarea
                  id="bn-note"
                  placeholder="Ghi chú thêm cho đơn hàng (nếu có)"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 bg-muted/30">
                <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                </div>
                <Label className="flex-1">Thanh toán khi nhận sim</Label>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={isSubmitting}>
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

            {/* Xác nhận đơn hàng */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
              <DialogContent className="max-w-md" aria-describedby={undefined}>
                <DialogHeader>
                  <DialogTitle className="text-center text-lg">Xác nhận đơn hàng</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
                    <span className="text-muted-foreground">Mã đơn hàng:</span>
                    <span className="font-semibold">{orderCode}</span>
                    <span className="text-muted-foreground">Số thuê bao:</span>
                    <span className="font-semibold text-primary">{sim.displayNumber}</span>
                    <span className="text-muted-foreground">Giá tiền:</span>
                    <span className="font-semibold text-cta">{formatPrice(sim.price)}</span>
                    <span className="text-muted-foreground">Mạng:</span>
                    <span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColors[network] || networkColors["Khác"]}`}>
                        {network}
                      </span>
                    </span>
                    <span className="text-muted-foreground">Họ tên:</span>
                    <span className="font-medium">{formData.fullName.trim()}</span>
                    <span className="text-muted-foreground">Số điện thoại:</span>
                    <span className="font-medium">{formData.phone}</span>
                    <span className="text-muted-foreground">Địa chỉ:</span>
                    <span className="font-medium">{formData.address.trim()}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>
                    Huỷ
                  </Button>
                  <Button type="button" className="flex-1 gap-2" onClick={handleConfirmOrder} disabled={isSubmitting}>
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
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuyNowDialog;
