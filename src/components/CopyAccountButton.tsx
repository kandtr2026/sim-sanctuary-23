"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * The "Số tài khoản" row from the /thanh-toan page. Isolated as a client
 * component so the rest of the page can stay a Server Component (SSG) while the
 * copy-to-clipboard interaction keeps working.
 */
export function CopyAccountButton({ accountNumber }: { accountNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      toast({
        title: "Đã copy số tài khoản",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Không thể copy",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div className="flex items-center gap-3 justify-center md:justify-start">
      <p className="text-xl font-bold text-gold">{accountNumber}</p>
      <button
        onClick={handleCopyAccountNumber}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Đã copy" : "Copy số TK"}
      </button>
    </div>
  );
}
