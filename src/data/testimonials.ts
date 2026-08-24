export interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  image?: string;
}

/**
 * Để trống: chưa có feedback thật. Khi chủ dự án thu thập được ảnh chụp màn
 * hình chat Zalo / cảm nhận, thêm vào đây — trang CustomerProof tự động hiện.
 * Không bịa.
 */
export const TESTIMONIALS: Testimonial[] = [];