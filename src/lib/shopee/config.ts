/**
 * Cấu hình endpoint + hằng số cho Shopee Open API v2 (module Product).
 *
 * Các path dưới đây theo spec Shopee Open API v2. Shopee đổi tên field / thêm
 * field khá thường xuyên và khác nhau giữa các thị trường. Nếu sync báo lỗi
 * "error_param" hoặc thiếu cột thì sửa TRỰC TIẾP trong file này, không cần sửa
 * logic ở chỗ khác.
 *
 * Đối chiếu tại: https://open.shopee.com/documents/v2 (module Product)
 */

export const SHOPEE_HOSTS: Record<string, string> = {
  live: "https://partner.shopeemobile.com",
  sandbox: "https://partner.test-stable.shopeemobile.com",
};

/** Trang uỷ quyền: mở trên browser, chủ shop bấm đồng ý. */
export const PATH_AUTH_PARTNER = "/api/v2/shop/auth_partner";
/**
 * Đổi `code` (Shopee trả về sau khi uỷ quyền) thành access_token.
 * ⚠️ Shopee đổi endpoint từ 2026: lấy token bằng CODE là `/api/v2/auth/token/get`,
 * còn `/api/v2/auth/access_token/get` giờ là REFRESH (đòi refresh_token trong body).
 * Nếu gửi code vào đường cũ sẽ bị lỗi "It should have refresh_token in the request body".
 */
export const PATH_TOKEN_GET = "/api/v2/auth/token/get";
export const PATH_TOKEN_REFRESH = "/api/v2/auth/access_token/get";

// ── Product ───────────────────────────────────────────────────────────────────
export const PATH_ADD_ITEM = "/api/v2/product/add_item";
export const PATH_UPDATE_ITEM = "/api/v2/product/update_item";
export const PATH_GET_ITEM_LIST = "/api/v2/product/get_item_list";
export const PATH_GET_ITEM_BASE_INFO = "/api/v2/product/get_item_base_info";
export const PATH_GET_MODEL_LIST = "/api/v2/product/get_model_list";
export const PATH_ADD_MODEL = "/api/v2/product/add_model";
export const PATH_INIT_TIER_VARIATION = "/api/v2/product/init_tier_variation";
export const PATH_UPDATE_STOCK = "/api/v2/product/update_stock";
export const PATH_DELETE_ITEM = "/api/v2/product/delete_item";
export const PATH_GET_CATEGORY = "/api/v2/product/get_category";
export const PATH_GET_ATTRIBUTES = "/api/v2/product/get_attributes";
export const PATH_GET_LOGISTICS = "/api/v2/logistics/get_logistics_info";

/** Điều kiện sản phẩm: SIM luôn mới. */
export const ITEM_CONDITION = "NEW";

/** Tên sản phẩm mặc định, có chỗ {number} để thay bằng số sim. */
export const ITEM_NAME_TEMPLATE = "Sim số đẹp {number}";

/** Mô tả sản phẩm mặc định (Shopee bắt buộc có). */
export const ITEM_DESCRIPTION =
  "SIM số đẹp chính hãng — miễn phí giao hàng toàn quốc, hỗ trợ đăng ký chính chủ. " +
  "Khách nhận sim kiểm tra đúng số rồi mới thanh toán (COD). " +
  "Shop CHONSOMOBIFONE.COM — 0938.868.868.";

/** Trọng lượng mặc định (gram) cho SIM. */
export const ITEM_WEIGHT = 10;

/** Ảnh sim chung dùng tạm khi chưa có ảnh riêng. */
export const DEFAULT_IMAGE_URL =
  "https://www.chonsomobifone.com/sim-card-default.png";

/** Số sản phẩm tối đa mỗi lần gọi add/update item. */
export const MAX_ITEMS_PER_SYNC = 50;

/** Số item lấy mỗi lần get_item_list. */
export const ITEM_LIST_PAGE_SIZE = 100;
