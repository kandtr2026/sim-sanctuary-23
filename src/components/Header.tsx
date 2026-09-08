"use client";

import { Phone, MessageCircle } from "lucide-react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-header-bg text-header-foreground py-4 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl md:text-2xl font-bold tracking-tight" aria-label="CHONSOMOBIFONE.COM — Trang chủ">
            <span className="text-gold">CHONSO</span>
            <span className="text-primary">MOBIFONE</span>
            <span className="text-header-foreground">.COM</span>
          </Link>
        </div>

        {/* Contact — một số duy nhất 0933.686.666 cho cả hai kênh:
            nút Gọi bấm là quay số, nút Zalo mở khung chat. */}
        <div className="flex items-center gap-4">
  <a
  href="tel:+84933686666"
  aria-label="Gọi tư vấn hotline 0933.686.666"
  className="flex items-center gap-2 hover:opacity-80 transition"
>
  <Phone className="w-5 h-5 shrink-0 text-gold" />
  <span className="flex flex-col leading-tight">
    <span className="text-[10px] font-medium uppercase tracking-wide text-header-foreground/60">Gọi tư vấn</span>
    <span className="text-lg font-bold text-primary">0933.686.666</span>
  </span>
</a>



  <a
    href="https://zalo.me/0933686666"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat Zalo tư vấn 0933.686.666"
    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded"
  >
    <MessageCircle className="w-4 h-4 shrink-0" />
    <span className="hidden sm:inline">Chat Zalo</span>
  </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
