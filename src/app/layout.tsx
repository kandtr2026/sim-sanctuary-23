import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/Header";
import TrustBar from "@/components/TrustBar";
import Navigation from "@/components/Navigation";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import FloatingContactButtons from "@/components/FloatingContactButtons";
import MessengerQuickTemplates from "@/components/MessengerQuickTemplates";
import StickyCtaBottomBar from "@/components/StickyCtaBottomBar";
import BuildBadge from "@/components/BuildBadge";
import FacebookPixel from "@/components/FacebookPixel";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const SITE_NAME = "CHONSOMOBIFONE.COM";
const BASE_URL = "https://www.chonsomobifone.com";
// Google Maps Place ID của cửa hàng — trỏ hasMap về đúng vị trí trên Google Maps.
const STORE_PLACE_ID = "ChIJV2BfBgAvdTERQ39odCHMHT0";
const DEFAULT_TITLE = "CHONSOMOBIFONE.COM — Kho SIM số đẹp Mobifone uy tín";
const DEFAULT_DESCRIPTION =
  "Kho SIM số đẹp Mobifone giá tốt: SIM tứ quý, phong thủy, tài lộc, năm sinh. 30 phút giao toàn quốc, sang tên chính chủ. Hotline 0938.868.868.";

// LocalBusiness schema (P1-3). The old index.html only had a bare Organization;
// the business has a physical TPHCM storefront, so `Store` (a LocalBusiness
// subtype) is the accurate type and unlocks local-pack signals. Address, hotline,
// hours and geo are read from the real sources already in the repo (Footer.tsx
// address + the Google Maps embed lat/lng), not invented.
const STORE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: SITE_NAME,
  legalName: "CÔNG TY TNHH TM DV VIỄN THÔNG NAM KHANG",
  url: `${BASE_URL}/`,
  logo: `${BASE_URL}/brand-logo.png`,
  telephone: "+84938868868",
  email: "hotro@chonsomobifone.com",
  priceRange: "$$$",
  hasMap: `https://www.google.com/maps/place/?q=place_id:${STORE_PLACE_ID}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "43A Đường số 9, Phường Tân Hưng",
    addressLocality: "TP. Hồ Chí Minh",
    addressCountry: "VN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 10.74673378940029,
    longitude: 106.70810869335848,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "08:00",
    closes: "21:00",
  },
  sameAs: [
    "https://zalo.me/0933356666",
    "https://www.facebook.com/111745910591052",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84938868868",
    contactType: "customer service",
    areaServed: "VN",
    availableLanguage: ["Vietnamese"],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: `${BASE_URL}/`,
  // SearchAction quay lại được vì trang chủ ĐÃ nhận câu tìm qua URL: SimBrowser
  // seed `searchQuery` từ `?q=` (nhận cả `?search=` cũ) rồi ghi lại vào URL.
  // Lưu ý kỳ vọng: Google đã bỏ hiển thị sitelinks searchbox từ 21/11/2024 nên
  // markup này KHÔNG còn tạo ô tìm trong SERP và không ảnh hưởng thứ hạng; giữ
  // vì nó khai báo đúng khả năng của site cho crawler/agent khác dùng.
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description:
      "Kho SIM số đẹp Mobifone giá tốt: SIM tứ quý, phong thủy, tài lộc, năm sinh. 30 phút giao toàn quốc, sang tên chính chủ.",
    images: [
      {
        url: "/share-banner.png?v=999",
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description:
      "Kho SIM số đẹp Mobifone giá tốt: SIM tứ quý, phong thủy, tài lộc, năm sinh. 30 phút giao toàn quốc, sang tên chính chủ.",
    images: ["/share-banner.png?v=999"],
  },
  // Next's `verification.google` only emits one token, so render both through
  // `other` (array value = multiple <meta> tags with the same name).
  other: {
    "fb:app_id": "111745910591052",
    "google-site-verification": [
      "jk46-wQwH_2WsmoLMdSTcyCXRmJS3hDu5_aN9Xyue0E",
      "Rq6FDIrJQyz4UwtV7J1rB6nixGj-bUmfu1rNHTOkxE8",
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0F0F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        {/* Google Tag Manager */}
        <Script id="gtm-init" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-MWKVVS7M');`}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          id="ga4-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-QGN17FVXPG"
          strategy="beforeInteractive"
        />
        <Script id="ga4-init" strategy="beforeInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-QGN17FVXPG');`}
        </Script>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MWKVVS7M"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Facebook Pixel (gated: inert until NEXT_PUBLIC_FB_PIXEL_ID is set) */}
        <FacebookPixel />

        {/* Structured data (server-rendered → present in the raw HTML) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STORE_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />

        <Providers>
          <Header />
          <TrustBar />
          <Navigation />
          {/* Admin-driven promo / flash-sale bar. Server-fetches the active
              campaign; renders null when there is none. Hides itself on /admin
              (client, via usePathname). Suspense keeps a slow campaign query
              from blocking the page shell. */}
          <Suspense fallback={null}>
            <PromoBanner />
          </Suspense>
          {children}
          <Footer />
          <Toaster />
          <Sonner />
          <FloatingContactButtons />
          <MessengerQuickTemplates />
          <StickyCtaBottomBar />
          <BuildBadge />
        </Providers>
      </body>
    </html>
  );
}
