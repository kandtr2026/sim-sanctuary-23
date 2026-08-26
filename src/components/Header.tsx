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

        {/* Contact */}
        <div className="flex items-center gap-4">
  <a
  href="tel:+84938868868"
  className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition"
>
  <Phone className="w-5 h-5 text-gold" />
  <span className="text-primary">0938.868.868</span>
</a>



  <a
    href="https://zalo.me/0933356666"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat Zalo tư vấn"
    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded"
  >
    <MessageCircle className="w-4 h-4" />
    <span className="hidden sm:inline">Chat tư vấn</span>
  </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
