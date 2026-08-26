import type { Metadata } from "next";
import qrTechcombank from "@/assets/qr-techcombank.webp";
import { CopyAccountButton } from "@/components/CopyAccountButton";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Hướng Dẫn Thanh Toán & Đặt Mua SIM | CHONSOMOBIFONE";
const DESCRIPTION =
  "Hướng dẫn đặt mua SIM số đẹp Mobifone: quy trình 3 bước, giao SIM miễn phí toàn quốc, địa chỉ cửa hàng và thông tin tài khoản thanh toán chính thức.";
const CANONICAL = "https://www.chonsomobifone.com/thanh-toan";

const STORE_PLACE_ID = "ChIJV2BfBgAvdTERQ39odCHMHT0";
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=place_id:${STORE_PLACE_ID}`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
  },
};

const accountNumber = "5286797979";

export default function ThanhToanPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gold mb-6">THANH TOÁN</h1>

          {/* Section 1: Ordering Guide */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">1. Hướng dẫn đặt mua sim</h2>

            <div className="space-y-4 text-foreground/90">
              <div>
                <p className="font-semibold text-gold">Bước 1: ĐẶT SIM</p>
                <p className="mt-1">Quý khách chọn số sim và đặt hàng trên web hoặc gọi điện đến số hotline{' '}
                  <a
                    href="tel:0938868868"
                    className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80"
                  >
                    0938.868.868
                  </a>{' '}
                  để được hỗ trợ.</p>
              </div>

              <div>
                <p className="font-semibold text-gold">Bước 2: XÁC NHẬN</p>
                <p className="mt-1">Khi nhận được đơn hàng nhân viên bán hàng sẽ kiểm tra số trong kho và gọi điện lại báo cho Quý khách.</p>
              </div>

              <div>
                <p className="font-semibold text-gold">Bước 3: GIAO HÀNG</p>
                <div className="mt-2 space-y-3">
                  <div>
                    <p className="font-medium">* Khách hàng Hồ Chí Minh:</p>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>Cách 1: Quý khách nhận sim trực tiếp tại cửa hàng</li>
                      <li>Cách 2: CHONSOMOBIFONE sẽ giao sim miễn phí tận nhà</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">* Khách Hàng ở Tỉnh/ Tp khác:</p>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                      <li>Cách 1: CHONSOMOBIFONE sẽ giao sim miễn phí tận nhà</li>
                      <li>Cách 2: Quý khách chuyển tiền mua sim vào tài khoản ngân hàng của CHONSOMOBIFONE sau đó ra điểm giao dịch của nhà mạng cấp lại sim sau khi CHONSOMOBIFONE hoàn tất thủ tục vào tên, thông tin cần thiết sẽ do CHONSOMOBIFONE cung cấp. Thông tin về tài khoản ngân hàng vui lòng xem phía dưới đây.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Store Address */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">2. Địa chỉ cửa hàng CHONSOMOBIFONE</h2>
            <p className="text-foreground/90">43A Đường số 9 Phường Tân Hưng TPHCM</p>
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Xem vị trí trên Google Maps →
            </a>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-gold">Lưu ý:</span> Khách hàng cần chuẩn bị trước thông tin cá nhân (trên CCCD thẻ cứng) để được vào tên chính chủ sở hữu sim.
              </p>
            </div>
          </div>

          {/* Section 3: Payment Information */}
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">3. Thông tin thanh toán</h2>
            <p className="text-foreground/90">
              CHONSOMOBIFONE sẽ không chịu trách nhiệm nếu Quý khách gửi tiền mua sim vào số tài khoản không nằm trong danh sách dưới đây:
            </p>
          </div>
          {/* Section 4: Bank Account */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-primary mb-4">4. Tài khoản thanh toán</h2>
            <div className="bg-muted/30 rounded-xl border border-border p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* QR Code - Left on desktop, Top on mobile */}
                <div className="flex-shrink-0">
                  <img
                    src={qrTechcombank.src}
                    alt="QR Techcombank"
                    className="w-48 h-48 md:w-56 md:h-56 rounded-xl object-contain"
                  />
                </div>

                {/* Account Info - Right on desktop, Bottom on mobile */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div>
                    <p className="text-sm text-foreground/70">Tên tài khoản</p>
                    <p className="text-lg font-semibold text-foreground">NGUYỄN HOÀI THƯƠNG</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground/70">Số tài khoản</p>
                    <CopyAccountButton accountNumber={accountNumber} />
                  </div>

                  <div>
                    <p className="text-sm text-foreground/70">Ngân hàng</p>
                    <p className="text-lg font-semibold text-foreground">TECHCOMBANK</p>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-foreground/70">Nội dung chuyển khoản (ví dụ)</p>
                    <p className="text-base text-foreground/80 italic">NGUYEN VAN A + 0901231234</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Thanh toán", path: "/thanh-toan" },
            ]),
          ),
        }}
      />
    </>
  );
}
