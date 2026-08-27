import type { NextRequest } from "next/server";
import { getServerSims, querySimsFromDb, type DbQueryCriteria } from "@/lib/serverSimData";
import { filterSims, paginateSims, type SimFilterCriteria } from "@/lib/simFilter";
import { countTags, getUniquePrefixes, PRICE_RANGES } from "@/lib/simUtils";
import type { QuyType, SortOption } from "@/lib/simUtils";

// Cache tầng route để đỡ cold-start; chính thực ra `getServerSims` đã cache CSV
// ở module scope (tải 1 lần/instance, mọi request tái dùng) nên không có cảnh
// mỗi khách kéo 10MB.
export const revalidate = 300;

const QUY_TYPES: QuyType[] = ["Tứ quý", "Ngũ quý", "Lục quý"];
const SORT_OPTIONS: SortOption[] = ["default", "price_asc", "price_desc", "beauty", "suffix_beauty"];
const MAX_LIMIT = 200;

const splitParam = (value: string | null): string[] | undefined => {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
};

const clampInt = (raw: string | null, fallback: number, min: number, max: number): number => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const parseNullableInt = (raw: string | null): number | null => {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const quyRaw = searchParams.get("quyType");
  const quyType = quyRaw && QUY_TYPES.includes(quyRaw as QuyType) ? (quyRaw as QuyType) : null;

  const sortRaw = searchParams.get("sort");
  const sortBy =
    sortRaw && (SORT_OPTIONS as string[]).includes(sortRaw) ? (sortRaw as SortOption) : undefined;

  const vipRaw = searchParams.get("vip");
  const vipFilter =
    vipRaw === "only" || vipRaw === "hide" ? vipRaw : vipRaw === "all" ? "all" : undefined;

  const priceRanges = splitParam(searchParams.get("priceRanges"))?.map((s) => Number(s)).filter((n) => Number.isInteger(n) && n >= 0);

  const criteria: SimFilterCriteria = {
    search: searchParams.get("search") || undefined,
    prefixes: splitParam(searchParams.get("prefixes")),
    suffixes: splitParam(searchParams.get("suffixes")),
    tags: splitParam(searchParams.get("tags")),
    lastDigits: splitParam(searchParams.get("lastDigits")),
    matchAll: searchParams.get("matchAll") === "true" ? true : undefined,
    quyType,
    quyPosition: searchParams.get("quyPosition"),
    priceRanges: priceRanges && priceRanges.length ? priceRanges : undefined,
    customPriceMin: parseNullableInt(searchParams.get("priceMin")),
    customPriceMax: parseNullableInt(searchParams.get("priceMax")),
    networks: splitParam(searchParams.get("networks")),
    vipFilter,
    sortBy,
    mobifoneFirst: searchParams.get("mobifoneFirst") === "true" ? true : undefined,
    birthDateOnly: searchParams.get("birthDateOnly") === "1" ? true : undefined,
  };

  const limit = clampInt(searchParams.get("limit"), 30, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);
  const includeFacets = searchParams.get("includeFacets") === "1";

  // ── Fast path: push filter xuống PostgREST (1 request, không crawl 49k) ──
  // Chỉ dùng khi criteria "đẩy xuống" được: facets cần toàn bộ kho (giữ path cũ),
  // tags/quyType/birthDateOnly/lastDigits/matchAll phải tính trong JS → path cũ.
  const dbCriteria: DbQueryCriteria = {
    search: criteria.search,
    prefixes: criteria.prefixes,
    suffixes: criteria.suffixes,
    networks: criteria.networks,
    priceRanges: criteria.priceRanges,
    customPriceMin: criteria.customPriceMin,
    customPriceMax: criteria.customPriceMax,
    vipFilter: criteria.vipFilter,
    sortBy: criteria.sortBy,
    mobifoneFirst: criteria.mobifoneFirst,
  };
  const canPushToDb =
    !includeFacets &&
    !criteria.quyType &&
    !criteria.birthDateOnly &&
    !criteria.lastDigits?.length &&
    !criteria.matchAll &&
    !criteria.tags?.length;

  if (canPushToDb) {
    const fromDb = await querySimsFromDb(dbCriteria, limit, offset);
    if (fromDb) {
      return Response.json({ items: fromDb.items, total: fromDb.total }, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  }

  const sims = await getServerSims();
  const filtered = filterSims(sims, criteria);
  const items = paginateSims(filtered, limit, offset);

  const body: {
    items: typeof items;
    total: number;
    facets?: {
      tagCounts: Record<string, number>;
      prefixes: { prefix3: string[]; prefix4: string[] };
      networkCounts: Record<string, number>;
      priceCounts: number[];
    };
  } = {
    items,
    total: filtered.length,
  };

  if (includeFacets) {
    // Đếm số lượng SIM cho từng mạng (để sidebar hiển thị trong ngoặc)
    const networkCounts: Record<string, number> = {};
    // Đếm số lượng SIM theo từng khoảng giá (index khớp PRICE_RANGES)
    const priceCounts: number[] = PRICE_RANGES.map(() => 0);

    sims.forEach((s) => {
      networkCounts[s.network] = (networkCounts[s.network] ?? 0) + 1;
      const idx = PRICE_RANGES.findIndex((r) => s.price >= r.min && s.price <= r.max);
      if (idx !== -1) priceCounts[idx]++;
    });

    body.facets = {
      tagCounts: countTags(sims),
      prefixes: getUniquePrefixes(sims),
      networkCounts,
      priceCounts,
    };
  }

  // CDN cache 5 phút (s-maxage) + stale-while-revalidate — đỡ lặp lại getServerSims
  // cold trên mỗi instance/lần vào; browser cũng cache theo url (params khác nhau
  // => cache riêng, an toàn).
  return Response.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
