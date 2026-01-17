import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extend window for global show function
declare global {
  interface Window {
    __showMessengerTemplates?: () => void;
  }
}

const TEMPLATES = {
  PHONG_THUY: {
    label: 'Tư vấn sim phong thuỷ',
    message: 'Chào shop, mình muốn tư vấn SIM phong thuỷ. Năm sinh: __/__/____, giới tính: __, mệnh (nếu biết): __, nhu cầu: (làm ăn/công việc/tình duyên) __, ngân sách: __ triệu.',
  },
  NGAN_SACH: {
    label: 'Sim theo ngân sách',
    message: 'Chào shop, mình muốn tìm SIM theo ngân sách __ triệu. Mình thích đầu số: __, dạng số: (tam hoa/tứ quý/tiến/lặp) __, nhà mạng ưu tiên: __.',
  },
  TRA_GOP: {
    label: 'Sim trả góp',
    message: 'Chào shop, mình cần mua SIM trả góp. Mức giá SIM dự kiến: __, trả trước: __%, khu vực nhận SIM: __, mình cần thủ tục gì?',
  },
};

const MessengerQuickTemplates = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  // Expose global function to show panel
  useEffect(() => {
    window.__showMessengerTemplates = () => {
      setIsOpen(true);
    };

    return () => {
      delete window.__showMessengerTemplates;
    };
  }, []);

  // Auto-hide after 15 seconds
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleCopy = useCallback(async (key: string, message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedKey(key);
      toast({
        title: 'Đã copy tin nhắn mẫu',
        description: 'Bạn dán vào Messenger và bấm Gửi.',
      });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast({
        title: 'Bạn hãy gửi tin nhắn này:',
        description: message.length > 80 ? message.slice(0, 80) + '...' : message,
        duration: 8000,
      });
    }
  }, [toast]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-4 z-[9999] w-full max-w-[260px] bg-card border border-border rounded-xl shadow-lg p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
      role="dialog"
      aria-label="Chọn tin nhắn mẫu"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">Chọn tin nhắn mẫu</span>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Đóng"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Template options */}
      <div className="space-y-2">
        {Object.entries(TEMPLATES).map(([key, { label, message }]) => (
          <button
            key={key}
            onClick={() => handleCopy(key, message)}
            className="w-full flex items-center justify-between gap-2 p-2.5 text-left text-sm rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="text-foreground">{label}</span>
            {copiedKey === key ? (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Nhấn để copy → dán vào Messenger
      </p>
    </div>
  );
};

export default MessengerQuickTemplates;
