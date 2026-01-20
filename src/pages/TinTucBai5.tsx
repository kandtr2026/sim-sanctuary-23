import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const TinTucBai5 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Cách Tránh Mất Tiền Oan Khi Mua Sim Số Đẹp
          </h1>

          <div className="prose prose-lg max-w-none space-y-4 text-foreground">
            <p>
              Thị trường sim số đẹp luôn sôi động với những giao dịch từ vài triệu đến hàng tỷ đồng. Tuy nhiên, đây cũng là mảnh đất màu mỡ cho các đối tượng lừa đảo. Để sở hữu được một số thuê bao ưng ý mà không bị "tiền mất tật mang", bạn cần lưu ý những quy tắc vàng dưới đây.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              1. Không thanh toán 100% tiền khi chưa sang tên chính chủ
            </h2>

            <p>
              Đây là cái bẫy phổ biến nhất. Kẻ xấu thường yêu cầu bạn chuyển khoản toàn bộ số tiền với lý do "giữ số" hoặc "làm thủ tục nhanh".
            </p>

            <p>
              <strong>Lời khuyên:</strong> Chỉ nên đặt cọc một khoản nhỏ (không quá 10-20%) nếu mua từ xa. Tốt nhất là thực hiện giao dịch trực tiếp tại điểm giao dịch của nhà mạng.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              2. Kiểm tra tình trạng hoạt động của Sim
            </h2>

            <p>
              Trước khi xuống tiền, hãy thử gọi vào số máy đó:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Nếu đổ chuông: Hãy yêu cầu người bán chứng minh họ là chủ sở hữu (bằng cách gọi lại cho bạn từ chính số đó).</li>
              <li>Nếu báo số không tồn tại: Có thể sim đã bị thu hồi về kho số, hãy cẩn trọng với các lời hứa "đấu nối lại".</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              3. Cảnh giác với Sim số đẹp giá "rẻ bất ngờ"
            </h2>

            <p>
              Một số sim Tứ Quý hay Lộc Phát có giá thị trường 50 triệu nhưng lại được rao bán chỉ 5-10 triệu với lý do "cần tiền gấp".
            </p>

            <p>
              <strong>Sự thật:</strong> Đa phần đây là sim tranh chấp, sim đang trả góp hoặc sim ảo. Hãy khảo sát giá ở ít nhất 3 website uy tín như Tongkhosim.com để nắm được mức giá chung.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              4. Kiểm tra thông tin thuê bao (TTTB) ngay sau khi mua
            </h2>

            <p>
              Sau khi nhận sim, việc đầu tiên cần làm là soạn tin nhắn:
            </p>

            <p className="font-semibold bg-muted p-3 rounded-md">
              TTTB gửi 1414.
            </p>

            <p>
              Hệ thống sẽ trả về tên chủ sở hữu, ngày sinh, số CMND/CCCD.
            </p>

            <p>
              Nếu thông tin trả về không phải của bạn, hãy yêu cầu người bán hỗ trợ sang tên ngay lập tức tại cửa hàng nhà mạng.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              5. Lưu giữ bằng chứng giao dịch
            </h2>

            <p>
              Luôn giữ lại ảnh chụp tin nhắn, hóa đơn chuyển khoản hoặc hợp đồng mua bán tay. Đây là bằng chứng duy nhất giúp bạn đòi lại quyền lợi nếu xảy ra tranh chấp hoặc khiếu nại về sau.
            </p>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default TinTucBai5;