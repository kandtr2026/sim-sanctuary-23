import type { MetadataRoute } from "next";

// Replaces the old public/robots.txt (deleted). Next.js serves this metadata
// route at /robots.txt. The rules below mirror the old file verbatim:
// allow everything except the checkout route (which is also `noindex`), and
// point every crawler at the absolute sitemap URL.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = "https://www.chonsomobifone.com/sitemap.xml";

  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: "/mua-ngay/" },
      { userAgent: "Bingbot", allow: "/", disallow: "/mua-ngay/" },
      { userAgent: "Twitterbot", allow: "/" },
      { userAgent: "facebookexternalhit", allow: "/" },
      { userAgent: "*", allow: "/", disallow: "/mua-ngay/" },
    ],
    sitemap: sitemapUrl,
  };
}
