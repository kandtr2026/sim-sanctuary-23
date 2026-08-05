import { defineTool } from '@lovable.dev/mcp-js';
import { fetchInventory, formatVnd } from '../lib/inventory';

export default defineTool({
  name: 'get_shop_info',
  title: 'Thông tin cửa hàng',
  description:
    'Return CHONSOMOBIFONE contact channels, store address, payment/delivery info and a snapshot of the current public inventory (count, price range, networks).',
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const shop = {
      name: 'CHONSOMOBIFONE',
      website: 'https://www.chonsomobifone.com',
      hotline: '0938.868.868',
      zalo: 'https://zalo.me/0933356666',
      address: '43A Đường số 9, Phường Tân Hưng, TP.HCM',
      payment: {
        bank: 'TECHCOMBANK',
        account_name: 'NGUYỄN HOÀI THƯƠNG',
        account_number: '5286797979',
        page: 'https://www.chonsomobifone.com/thanh-toan',
      },
      delivery: 'Giao sim miễn phí toàn quốc, kiểm tra trước khi nhận, cam kết chính chủ.',
    };

    let inventory: Record<string, unknown> = { available: false };
    try {
      const all = await fetchInventory();
      if (all.length) {
        const prices = all.map((s) => s.price);
        const networks: Record<string, number> = {};
        for (const sim of all) networks[sim.network] = (networks[sim.network] ?? 0) + 1;
        inventory = {
          available: true,
          total_sims: all.length,
          min_price: Math.min(...prices),
          max_price: Math.max(...prices),
          min_price_text: formatVnd(Math.min(...prices)),
          max_price_text: formatVnd(Math.max(...prices)),
          networks,
        };
      }
    } catch {
      inventory = { available: false, note: 'Không tải được kho SIM lúc này.' };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `${shop.name} — Hotline ${shop.hotline} — Zalo ${shop.zalo}\nĐịa chỉ: ${shop.address}\nThanh toán: ${shop.payment.bank} ${shop.payment.account_number} (${shop.payment.account_name})\n${shop.delivery}`,
        },
      ],
      structuredContent: { shop, inventory },
    };
  },
});
