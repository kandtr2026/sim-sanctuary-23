import type { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { filterSims, paginateSims, type SimFilterCriteria } from "@/lib/simFilter";
import type { QuyType } from "@/lib/simUtils";

// Cache tầng route để đỡ cold-start; chính thực ra `getServerSims` đã cache CSV
// ở module scope (tải 1 lần/instance, mọi request tái dùng) nên không có cảnh
// mỗi khách kéo 10MB.
export const revalidate = 300;

const QUY_TYPES: QuyType[] = ["Tứ quý", "Ngũ quý", "Lục quý"];
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

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const quyRaw = searchParams.get("quyType");
  const quyType = quyRaw && QUY_TYPES.includes(quyRaw as QuyType) ? (quyRaw as QuyType) : null;

  const criteria: SimFilterCriteria = {
    search: searchParams.get("search") || undefined,
    prefixes: splitParam(searchParams.get("prefixes")),
    suffixes: splitParam(searchParams.get("suffixes")),
    tags: splitParam(searchParams.get("tags")),
    lastDigits: splitParam(searchParams.get("lastDigits")),
    matchAll: searchParams.get("matchAll") === "true" ? true : undefined,
    quyType,
    quyPosition: searchParams.get("quyPosition"),
  };

  const limit = clampInt(searchParams.get("limit"), 30, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

  const sims = await getServerSims();
  const filtered = filterSims(sims, criteria);
  const items = paginateSims(filtered, limit, offset);

  return Response.json({ items, total: filtered.length });
}
