import { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { countTags } from "@/lib/simUtils";

export const revalidate = 300;

export async function GET(_req: NextRequest) {
  const sims = await getServerSims();
  if (sims.length === 0)
    return Response.json({ total: 0, totalValue: 0, networkCounts: {}, tagCounts: {}, priceCounts: [] });

  const networkCounts: Record<string, number> = {};
  const priceCounts: number[] = [
    { label: "Dưới 1 Tr", min: 0, max: 999999 },
    { label: "1 - 3 Tr", min: 1000000, max: 2999999 },
    { label: "3 - 5 Tr", min: 3000000, max: 4999999 },
    { label: "5 - 10 Tr", min: 5000000, max: 9999999 },
    { label: "10 - 50 Tr", min: 10000000, max: 49999999 },
    { label: "50 - 100 Tr", min: 50000000, max: 99999999 },
    { label: "100 - 200 Tr", min: 100000000, max: 199999999 },
    { label: "200 - 500 Tr", min: 200000000, max: 499999999 },
    { label: "Trên 500 Tr", min: 500000000, max: Infinity },
  ].map(() => 0);

  let totalValue = 0;
  let total = 0;

  for (const s of sims) {
    if (s.price <= 0) continue;
    total++;
    totalValue += s.price;
    networkCounts[s.network] = (networkCounts[s.network] ?? 0) + 1;
    const idx = [
      { min: 0, max: 999999 },
      { min: 1000000, max: 2999999 },
      { min: 3000000, max: 4999999 },
      { min: 5000000, max: 9999999 },
      { min: 10000000, max: 49999999 },
      { min: 50000000, max: 99999999 },
      { min: 100000000, max: 199999999 },
      { min: 200000000, max: 499999999 },
      { min: 500000000, max: Infinity },
    ].findIndex((r) => s.price >= r.min && s.price <= r.max);
    if (idx !== -1) priceCounts[idx]++;
  }

  const tagCounts = countTags(sims);

  return Response.json({
    total,
    totalValue,
    networkCounts,
    tagCounts,
    priceCounts,
  });
}