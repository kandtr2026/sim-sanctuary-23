// JSON-LD builders shared across the Phase 1 SSG content pages.
// Pure functions — server/build-time only, no browser APIs.

export const BASE_URL = "https://www.chonsomobifone.com";

export interface BreadcrumbItem {
  name: string;
  /** Path starting with "/", e.g. "/tin-tuc/y-nghia-sim-so-dep". */
  path: string;
}

/** BreadcrumbList (P1-4). Position is 1-based; Home is always item 1. */
export function buildBreadcrumb(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

export interface ArticleSeoInput {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified: string;
  image: string;
}

/**
 * Article schema (P1-6). The old react-helmet Article JSON-LD lacked
 * `datePublished`/`dateModified`/`image`; those fields are now added so the
 * Article rich result can activate.
 */
export function buildArticle(input: ArticleSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    image: input.image,
    author: { "@type": "Organization", name: "CHONSOMOBIFONE.COM" },
    publisher: {
      "@type": "Organization",
      name: "CHONSOMOBIFONE.COM",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/brand-logo.png` },
    },
    mainEntityOfPage: `${BASE_URL}${input.path}`,
  };
}
