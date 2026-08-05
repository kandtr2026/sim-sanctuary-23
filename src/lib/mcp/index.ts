import { defineMcp } from '@lovable.dev/mcp-js';
import searchSimsTool from './tools/search-sims';
import getSimDetailsTool from './tools/get-sim-details';
import getShopInfoTool from './tools/get-shop-info';

export default defineMcp({
  name: 'chonsomobifone',
  title: 'CHONSOMOBIFONE',
  version: '0.1.0',
  instructions:
    'Tools for CHONSOMOBIFONE, a Vietnamese beautiful-SIM shop. Use `search_sims` to find SIM numbers by digit pattern (* wildcard), network, price range or tag; `get_sim_details` to check one number; `get_shop_info` for contact, payment and inventory overview. All data is public.',
  tools: [searchSimsTool, getSimDetailsTool, getShopInfoTool],
});
