/**
 * Danh mục số đẹp (luật kiểu simthanglong: một số thuộc nhiều danh mục) + điểm
 * đẹp/VIP. Code thật nằm ở `supabase/functions/_shared/simCategories.ts` để
 * edge function `sync-sims` (Deno) import CÙNG một file — không còn bản chép tay
 * nào phải giữ khớp. Web import qua đây cho gọn đường dẫn.
 */
export {
  CATEGORY_PRIORITY,
  CATEGORY_RULES,
  VIP_PRICE_THRESHOLD,
  VIP_TAGS,
  calculateBeautyScore,
  detectSimCategories,
  isVIPSim,
  primarySimCategory,
  type SimCategory,
} from "../../supabase/functions/_shared/simCategories";
