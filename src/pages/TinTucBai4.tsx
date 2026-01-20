import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const TinTucBai4 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Cách Xem Sim Phong Thủy Hợp Tuổi Chính Xác Nhất
          </h1>

          <div className="prose prose-lg max-w-none space-y-4 text-foreground">
            <p>
              Sở hữu một số điện thoại hợp phong thủy không chỉ giúp bạn tự tin hơn trong giao tiếp mà còn được tin là giúp thu hút tài lộc, cải thiện vận mệnh. Dưới đây là 3 cách xem sim phong thủy hợp tuổi phổ biến và chính xác nhất hiện nay.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              1. Xem sim hợp tuổi theo Ngũ Hành Bản Mệnh
            </h2>

            <p>
              Đây là yếu tố quan trọng nhất. Mỗi người sinh ra đều thuộc một trong năm mệnh: Kim, Mộc, Thủy, Hỏa, Thổ. Bạn cần chọn số điện thoại chứa các con số tương sinh với mệnh của mình:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Mệnh Kim: Nên chọn số có đuôi 2, 5, 8 (Thổ sinh Kim) hoặc 6, 7 (Kim hợp Kim).</li>
              <li>Mệnh Mộc: Ưu tiên số có đuôi 0, 1 (Thủy sinh Mộc) hoặc 3, 4 (Mộc hợp Mộc).</li>
              <li>Mệnh Thủy: Hợp với số đuôi 6, 7 (Kim sinh Thủy) hoặc 0, 1 (Thủy hợp Thủy).</li>
              <li>Mệnh Hỏa: Nên chọn số đuôi 3, 4 (Mộc sinh Hỏa) hoặc 9 (Hỏa hợp Hỏa).</li>
              <li>Mệnh Thổ: Hợp với số đuôi 9 (Hỏa sinh Thổ) hoặc 2, 5, 8 (Thổ hợp Thổ).</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              2. Quy tắc Âm Dương Tương Phối
            </h2>

            <p>
              Một số sim phong thủy đẹp cần có sự cân bằng giữa số chẵn và số lẻ:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Số chẵn (0, 2, 4, 6, 8): Mang năng lượng Âm.</li>
              <li>Số lẻ (1, 3, 5, 7, 9): Mang năng lượng Dương.</li>
            </ul>

            <p>
              Tỷ lệ vàng: Một số sim có 5 số chẵn và 5 số lẻ được gọi là sự cân bằng tuyệt đối. Nếu bạn thuộc nhóm tuổi "Dương mệnh", bạn nên chọn sim lệch âm (nhiều số chẵn hơn) để trung hòa và ngược lại.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              3. Cách tính Sim Đại Cát (Chia cho 80)
            </h2>

            <p>
              Đây là phương pháp cực kỳ phổ biến để kiểm tra độ "cát - hung" của 4 số cuối điện thoại:
            </p>

            <ol className="list-decimal pl-6 space-y-2">
              <li>Bước 1: Lấy 4 số cuối điện thoại chia cho 80.</li>
              <li>Bước 2: Lấy kết quả vừa tính được trừ đi phần số nguyên.</li>
              <li>Bước 3: Lấy số thập phân còn lại nhân với 80.</li>
              <li>Bước 4: Đối chiếu kết quả với bảng tra cứu đại cát.</li>
            </ol>

            <p>
              Ví dụ: Kết quả ra 01 (Đại Cát), 03 (Vạn sự hanh thông), 05 (Làm ăn phát đạt).
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              4. Tổng kết
            </h2>

            <p>
              Việc chọn sim hợp tuổi không chỉ dựa vào một yếu tố duy nhất mà là sự kết hợp hài hòa giữa bản mệnh, âm dương và những con số may mắn riêng biệt của mỗi người. Một chiếc sim hợp phong thủy sẽ là người bạn đồng hành tuyệt vời trên con đường sự nghiệp của bạn.
            </p>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default TinTucBai4;