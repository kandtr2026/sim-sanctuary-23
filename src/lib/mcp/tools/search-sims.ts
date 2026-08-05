import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { fetchInventory, formatVnd, matchesPattern } from '../lib/inventory';

export default defineTool({
  name: 'search_sims',
  title: 'Tìm SIM số đẹp',
  description:
    'Search the public SIM inventory. Supports a digit pattern (use * as a wildcard, e.g. "*6868" or "09*8888"), network filter, price range and tag filter.',
  inputSchema: {
    pattern: z
      .string()
      .describe('Digits and * only. A plain digit string matches the SIM suffix.')
      .optional(),
    network: z
      .enum(['MobiFone', 'Viettel', 'Vinaphone', 'Vietnamobile', 'Gmobile'])
      .describe('Restrict results to one mobile network.')
      .optional(),
    min_price: z.number().describe('Minimum price in VND.').optional(),
    max_price: z.number().describe('Maximum price in VND.').optional(),
    tag: z
      .string()
      .describe('Tag such as "Tứ quý", "Tam hoa", "Lộc phát", "Thần tài", "Taxi", "Tiến".')
      .optional(),
    limit: z.number().describe('Max results to return (1-50, default 20).').optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ pattern, network, min_price, max_price, tag, limit }) => {
    try {
      const all = await fetchInventory();
      const max = Math.min(Math.max(limit ?? 20, 1), 50);

      const matched = all.filter((sim) => {
        if (pattern && !matchesPattern(sim.digits, pattern)) return false;
        if (network && sim.network !== network) return false;
        if (typeof min_price === 'number' && sim.price < min_price) return false;
        if (typeof max_price === 'number' && sim.price > max_price) return false;
        if (tag && !sim.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
        return true;
      });

      const results = matched.slice(0, max).map((sim) => ({
        id: sim.id,
        number: sim.display,
        digits: sim.digits,
        price: sim.price,
        price_text: formatVnd(sim.price),
        network: sim.network,
        tags: sim.tags,
        url: `https://www.chonsomobifone.com/mua-ngay/${encodeURIComponent(sim.id)}`,
      }));

      const text = results.length
        ? results
            .map((r) => `${r.number} — ${r.price_text} — ${r.network}${r.tags.length ? ` (${r.tags.join(', ')})` : ''}`)
            .join('\n')
        : 'Không tìm thấy SIM phù hợp.';

      return {
        content: [
          { type: 'text' as const, text: `${results.length}/${matched.length} kết quả:\n${text}` },
        ],
        structuredContent: { total_matches: matched.length, returned: results.length, results },
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Không tải được kho SIM: ${(error as Error).message}` }],
        isError: true,
      };
    }
  },
});
