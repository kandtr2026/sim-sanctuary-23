import { defineTool } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { detectNetwork, detectTags, fetchInventory, formatVnd } from '../lib/inventory';

export default defineTool({
  name: 'get_sim_details',
  title: 'Chi tiết SIM',
  description:
    'Look up one SIM number in the public inventory and return its price, network, tags, feng-shui digit sum and order link.',
  inputSchema: {
    number: z.string().describe('The SIM number, digits only or formatted (e.g. 0938.868.868).'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ number }) => {
    let digits = number.replace(/\D/g, '');
    if (digits.length === 9) digits = `0${digits}`;
    if (digits.length < 10) {
      return { content: [{ type: 'text' as const, text: 'Số SIM không hợp lệ.' }], isError: true };
    }

    const sumDigits = [...digits].reduce((acc, d) => acc + Number(d), 0);

    try {
      const all = await fetchInventory();
      const sim = all.find((s) => s.digits === digits);

      if (!sim) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `SIM ${digits} hiện không có trong kho. Mạng: ${detectNetwork(digits)}. Tổng nút: ${sumDigits}. Liên hệ hotline 0938.868.868 để tìm số tương tự.`,
            },
          ],
          structuredContent: {
            available: false,
            digits,
            network: detectNetwork(digits),
            tags: detectTags(digits),
            sum_digits: sumDigits,
          },
        };
      }

      const detail = {
        available: true,
        id: sim.id,
        number: sim.display,
        digits: sim.digits,
        price: sim.price,
        price_text: formatVnd(sim.price),
        original_price: sim.originalPrice,
        discounted: sim.price < sim.originalPrice,
        network: sim.network,
        tags: sim.tags,
        sum_digits: sumDigits,
        url: `https://www.chonsomobifone.com/mua-ngay/${encodeURIComponent(sim.id)}`,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: `${detail.number} — ${detail.price_text} — ${detail.network}${detail.tags.length ? ` (${detail.tags.join(', ')})` : ''}. Tổng nút: ${sumDigits}. Đặt mua: ${detail.url}`,
          },
        ],
        structuredContent: detail,
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `Không tải được kho SIM: ${(error as Error).message}` }],
        isError: true,
      };
    }
  },
});
