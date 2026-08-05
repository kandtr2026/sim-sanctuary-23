import type { CheapSim } from '@/lib/cheapSimSheet';

/**
 * Filters for the 229k warehouse.
 *
 * These are deliberately NOT the tag set used on the homepage
 * (`detectSimTags` in simUtils: tứ quý, ngũ quý, lộc phát, thần tài, taxi…).
 * That vocabulary is for the main catalogue, where those patterns are what the
 * price is made of. In this warehouse they essentially do not exist — a census
 * of all 9.152 available rows found:
 *
 *   tứ quý 0 · tam hoa 0 · thần tài (39/79) 0 · lộc phát (68/86) 1
 *   AABB 0 · ABAB 0 · gánh 0 · taxi 0 · năm sinh 28
 *
 * Offering those as filters would give a visitor five buttons that all return
 * "không tìm thấy". What the stock *does* have, and what is therefore offered
 * here, was measured on the same pass:
 *
 *   đuôi kép      2.417 (26,4%)
 *   tránh 4 & 7   2.298 (25,1%)
 *   đuôi 6/8/9    1.051 (11,5%)
 *   số tiến          81
 *
 * The four barely overlap (đuôi kép × đuôi 6/8/9 = 0, đuôi kép × số tiến = 0,
 * tránh 4&7 × đuôi 6/8/9 = 265), so they partition the stock rather than
 * re-slicing the same numbers four ways.
 */
export type CheapFacet = 'doi' | 'no47' | 'tail689' | 'tien';

export interface CheapFacetDef {
  id: CheapFacet;
  label: string;
  /** Shown on the card as a badge. Shorter than the filter label. */
  badge: string;
  hint: string;
  test: (rawDigits: string) => boolean;
}

/** Last two digits are the same: …33, …77. */
const isDoi = (d: string) => d.length >= 2 && d[d.length - 1] === d[d.length - 2];

/** No 4 and no 7 anywhere in the number — the two digits most often avoided. */
const isNo47 = (d: string) => !d.includes('4') && !d.includes('7');

/** Ends in 6, 8 or 9. */
const isTail689 = (d: string) => ['6', '8', '9'].includes(d[d.length - 1]);

/** Last three digits step up by one: …123, …456, …789. */
const isTien = (d: string) => {
  if (d.length < 3) return false;
  const [a, b, c] = d.slice(-3).split('').map(Number);
  return b === a + 1 && c === b + 1;
};

export const CHEAP_FACETS: CheapFacetDef[] = [
  { id: 'doi', label: 'Đuôi kép', badge: 'Đuôi kép', hint: 'Hai số cuối giống nhau', test: isDoi },
  { id: 'no47', label: 'Tránh 4 và 7', badge: 'Không 4-7', hint: 'Cả dãy không có số 4 và số 7', test: isNo47 },
  { id: 'tail689', label: 'Đuôi 6 - 8 - 9', badge: 'Đuôi 6-8-9', hint: 'Kết thúc bằng 6, 8 hoặc 9', test: isTail689 },
  { id: 'tien', label: 'Số tiến', badge: 'Số tiến', hint: 'Ba số cuối tăng dần: 123, 456, 789', test: isTien },
];

const FACET_BY_ID = new Map(CHEAP_FACETS.map(f => [f.id, f]));

export const matchesFacet = (rawDigits: string, facet: CheapFacet): boolean =>
  FACET_BY_ID.get(facet)?.test(rawDigits) ?? false;

/** Badges for one card, capped at two so a 128px-wide mobile card can hold them. */
export const badgesFor = (rawDigits: string): string[] =>
  CHEAP_FACETS.filter(f => f.test(rawDigits)).map(f => f.badge).slice(0, 2);

/**
 * Facet counts over the whole pool, so a chip can show how many numbers it
 * leads to and a zero-result chip can be hidden instead of offered.
 */
export const countFacets = (sims: CheapSim[]): Record<CheapFacet, number> => {
  const counts = { doi: 0, no47: 0, tail689: 0, tien: 0 } satisfies Record<CheapFacet, number>;
  for (const sim of sims) {
    for (const facet of CHEAP_FACETS) {
      if (facet.test(sim.rawDigits)) counts[facet.id]++;
    }
  }
  return counts;
};

/** Prefixes actually present, biggest first. Derived, never hard-coded: the
 *  warehouse is 090/093 plus a single 076 today, and that will drift. */
export const countPrefixes = (sims: CheapSim[]): { prefix: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const sim of sims) {
    const p = sim.rawDigits.slice(0, 3);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([prefix, count]) => ({ prefix, count }))
    .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));
};
