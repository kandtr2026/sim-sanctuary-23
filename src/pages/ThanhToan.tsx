import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import qrTechcombank from '@/assets/qr-techcombank.png';

const ThanhToan = () => {
  const [copied, setCopied] = useState(false);
  
  const accountNumber = "5286797979";
  
  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      toast({
        title: "Đã copy số tài khoản",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Không thể copy",
        variant: "destructive",
        duration: 2000,
      });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gold mb-6">THANH TOÁN</h1>
          
          {/* Section 1: Ordering Guide */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">1. Hướng dẫn đặt mua sim</h2>
            
            <div className="space-y-4 text-foreground/90">
              <div>
                <p className="font-semibold text-gold">Bước 1: ĐẶT SIM</p>
                <p className="mt-1">Quý khách chọn số sim và đặt hàng trên web hoặc gọi điện đến số hotline <span className="font-semibold text-primary">0938.868.868</span> để được hỗ trợ.</p>
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
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-gold">Lưu ý:</span> Khách hàng cần chuẩn bị trước thông tin cá nhân (trên CMND) để được vào tên chính chủ sở hữu sim.
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
                    src={qrTechcombank} 
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
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <p className="text-xl font-bold text-gold">{accountNumber}</p>
                      <button
                        onClick={handleCopyAccountNumber}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Đã copy" : "Copy số TK"}
                      </button>
                    </div>
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

      <Footer />
    </div>
  );
};

export default ThanhToan;
