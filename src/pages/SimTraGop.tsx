import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ZaloChatCard from '@/components/ZaloChatCard';

const SimTraGop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gold mb-6">
            Có Nên Mua Sim Số Đẹp Trả Góp? Phân Tích Lợi Ích Và Những Lưu Ý Cần Biết
          </h1>

          {/* Introduction */}
          <div className="space-y-4 text-foreground/90 mb-8">
            <p>
              Sở hữu một chiếc sim số đẹp (Tứ quý, Ngũ quý, Sim phong thủy...) không chỉ là cách để khẳng định đẳng cấp mà còn là công cụ hỗ trợ đắc lực cho công việc kinh doanh. Tuy nhiên, với mức giá từ vài chục triệu đến hàng tỷ đồng, không phải ai cũng sẵn sàng chi trả toàn bộ trong một lần. Đó là lý do dịch vụ mua sim trả góp ra đời.
            </p>
            <p>
              Vậy hình thức này có thực sự tốt? Hãy cùng phân tích chi tiết ngay dưới đây.
            </p>
          </div>

          {/* Section 1 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">1. Tại sao nên chọn mua sim trả góp?</h2>
            <div className="space-y-4 text-foreground/90">
              <p>
                Mua sim trả góp thực chất là hình thức bạn chỉ cần thanh toán trước một phần giá trị của sim (thường từ 10% - 30%), phần còn lại sẽ được chia nhỏ để trả dần theo từng tháng.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Sở hữu ngay sim VIP khi chưa đủ tài chính:</strong> Bạn không cần đợi đến khi tích lũy đủ hàng trăm triệu đồng mới có thể dùng sim Tứ quý hay Phát lộc.
                </li>
                <li>
                  <strong>Cơ hội đầu tư sinh lời:</strong> Sim số đẹp là tài sản có giá trị gia tăng theo thời gian. Việc chốt mua sớm giúp bạn giữ được mức giá tốt trước khi thị trường tăng giá.
                </li>
                <li>
                  <strong>Tận dụng vốn để kinh doanh:</strong> Thay vì dồn một cục tiền vào sim, bạn có thể dùng số tiền đó để xoay vòng vốn, đầu tư nhập hàng hoặc chạy quảng cáo.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">2. Điểm lợi khi mua sim trả góp</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/90">
              <li>
                <strong>Thủ tục đơn giản, nhanh chóng:</strong> Thường chỉ cần CCCD, không cần chứng minh thu nhập rườm rà như vay ngân hàng.
              </li>
              <li>
                <strong>Thời gian trả góp linh hoạt:</strong> Bạn có thể chọn kỳ hạn từ 6 tháng, 12 tháng hoặc lâu hơn tùy vào khả năng tài chính.
              </li>
              <li>
                <strong>Được sử dụng sim ngay:</strong> Ngay sau khi ký hợp đồng và thanh toán đợt đầu, bạn đã có toàn quyền sử dụng sim để giao dịch, làm ăn.
              </li>
              <li>
                <strong>Lãi suất cạnh tranh:</strong> Hiện nay nhiều đơn vị cung cấp mức lãi suất rất thấp, thậm chí có những chương trình ưu đãi lãi suất 0% trong thời gian đầu.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">3. Điểm hạn chế (Rủi ro cần lưu ý)</h2>
            <p className="text-foreground/90 mb-4">
              Bên cạnh những ưu điểm, hình thức này cũng có những mặt bạn cần cân nhắc kỹ:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/90">
              <li>
                <strong>Tổng chi phí cao hơn:</strong> Do phải chịu thêm phần lãi suất hàng tháng, tổng số tiền bạn bỏ ra sẽ cao hơn so với việc mua đứt 1 lần.
              </li>
              <li>
                <strong>Rủi ro về pháp lý:</strong> Trong thời gian trả góp, sim thường vẫn đứng tên chủ cũ (hoặc kho sim). Nếu bạn chọn đơn vị không uy tín, có thể xảy ra tranh chấp hoặc mất sim nếu cửa hàng đó phá sản.
              </li>
              <li>
                <strong>Áp lực tài chính hàng tháng:</strong> Nếu không tính toán kỹ dòng tiền, việc trả gốc và lãi hàng tháng có thể trở thành gánh nặng.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">4. Lời khuyên để mua sim trả góp an toàn</h2>
            <p className="text-foreground/90 mb-4">
              Để đảm bảo quyền lợi tuyệt đối, bạn nên nằm lòng các nguyên tắc sau:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-foreground/90">
              <li>
                <strong>Chọn địa chỉ uy tín:</strong> Chỉ mua tại các website có địa chỉ rõ ràng, có giấy phép kinh doanh và được cộng đồng chơi sim đánh giá cao.
              </li>
              <li>
                <strong>Hợp đồng minh bạch:</strong> Mọi điều khoản về lãi suất, số tiền trả hàng tháng, thời hạn và cam kết sang tên chính chủ sau khi tất toán phải được ghi rõ trên văn bản có dấu đỏ.
              </li>
              <li>
                <strong>Kiểm tra kỹ tình trạng sim:</strong> Đảm bảo sim sạch, không tranh chấp, không nợ cước trước khi ký hợp đồng.
              </li>
            </ul>
          </div>

          {/* Conclusion */}
          <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-foreground/90">
              <strong className="text-gold">Kết luận:</strong> Mua sim trả góp là giải pháp tài chính thông minh dành cho những người kinh doanh biết tận dụng đòn bẩy vốn. Chỉ cần bạn chọn đúng đơn vị uy tín, đây chính là "lối tắt" để bạn sở hữu tấm danh thiếp đẳng cấp cho riêng mình.
            </p>
          </div>

          {/* Zalo Chat Card */}
          <div className="mt-8 max-w-sm">
            <h3 className="text-lg font-semibold text-foreground mb-3">Liên hệ tư vấn</h3>
            <ZaloChatCard />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SimTraGop;
