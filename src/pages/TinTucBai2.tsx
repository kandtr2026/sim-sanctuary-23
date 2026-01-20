import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const TinTucBai2 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
            Số tổng đài các mạng: Mobifone / Gmobile / Vina / Viettel mới nhất
          </h1>

          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              1. Bạn đang sử dụng sim số thuộc nhà mạng nào?
            </h2>
            <p className="text-foreground mb-4">
              Đầu tiên để có thể liên hệ đúng với tổng đài hỗ trợ của nhà mạng cung cấp dịch vụ bạn phải biết mình đang sử dụng dịch vụ của nhà mạng nào. Sim số đẹp xin gửi đến bạn đầu số tương ứng của các nhà mang:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground">
              <li>Viettel có các đầu số: 096, 097, 098, 032, 033, 034, 035, 036, 037, 038, 039.</li>
              <li>Mobifone có các đầu số: 089, 090, 093, 070, 079, 077, 076, 078.</li>
              <li>Vinaphone có các đầu số: 091, 094, 081, 082, 083, 084, 085, 088.</li>
              <li>Gmobile (Beeline): 099, 059.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              2. Số tổng đài các nhà mạng Mobifone / Gmobile / Vina /Viettel
            </h2>

            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                Số tổng đài Viettel
              </h3>
              <ul className="list-disc list-inside space-y-2 text-foreground mb-4">
                <li>Số tổng đài miễn phí: 18008198 - Đây là số tổng đài trả lời tự động của Viettel.</li>
                <li>Số tổng đài tính phí: 19008198 (Phí 200đ/phút) hoặc 0989.198.198 (tính phí như cách tính cước phí thông thường) - Hỗ trợ trực tiếp từ các tổng đài viên.</li>
                <li>Số tổng đài 197 cập nhật nhanh chóng các chương trình khuyến mãi, dịch vụ mới của Viettel.</li>
                <li>Số tổng đài 1900.8098/1800.8000 hỗ trợ các doanh nghiệp.</li>
                <li>Số tổng đài 1900.8099 cung cấp đầy đủ thông tin tư vấn về dịch vụ thương mại điện tử như Bankplus, cổng thanh toán trực tuyến Viettel.</li>
                <li>Số tổng đài 1222 dịch vụ quà tặng âm nhạc.</li>
                <li>Số tổng đài 1900.8062 cung cấp đầy đủ các thông tin về nông sản, cây trồng, vật nuôi,...</li>
                <li>Số tổng đài 1789 hỗ trợ đại lý, điểm bán của Viettel.</li>
              </ul>

              <p className="font-semibold text-foreground mb-2">
                Các số Hotline Viettel (cước phí được tính như các cuộc gọi thông thường)
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>Hotline miền Bắc 0989.198.198</li>
                <li>Hotline miền Nam 0983.198.198</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                Số tổng đài Mobifone
              </h3>
              <ul className="list-disc list-inside space-y-2 text-foreground mb-4">
                <li>Số tổng đài: 18001090 (Miễn phí)</li>
              </ul>

              <p className="font-semibold text-foreground mb-2">
                Số tổng đài Mobifone theo từng vùng:
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>Hotline MobiFone miền Bắc: 0904.144.144.</li>
                <li>Hotline MobiFone miền Trung: 0905.144.144.</li>
                <li>Hotline MobiFone miền Nam: 0908.144.144.</li>
                <li>Hotline MobiFone Cần Thơ: 0939.144.144.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                Số tổng đài Vinaphone
              </h3>
              
              <p className="font-semibold text-foreground mb-2">Số tổng đài Vinaphone 9191</p>
              <p className="text-foreground mb-4">
                Đây là đường dây hỗ trợ khách hàng trong nước phục vụ 24h/7 để tư vấn, hướng dẫn và giải đáp thắc mắc về sản phẩm, dịch vụ của mạng VinaPhone và hỗ trợ các trường hợp khẩn cấp (như báo mất máy, mất SIM).
              </p>
              <p className="text-foreground mb-4">
                Mức cước gọi 9191 là 200 đồng/phút (đã bao gồm VAT) theo phương thức tính cước 1+1 và áp dụng cho thuê bao trả trước từ ngày 1/12/2010. Thuê bao VinaPhone trả sau được miễn cước.
              </p>

              <p className="font-semibold text-foreground mb-2">Số tổng đài Vinaphone 9192</p>
              <p className="text-foreground mb-4">
                Đây là đường dây hỗ trợ khách hàng quốc tế bằng 4 ngôn ngữ tiếng Anh, tiếng Hoa, Tiếng Hàn quốc và tiếng Nhật Bản để tư vấn và giải đáp thắc mắc về sản phẩm và dịch vụ của mạng VinaPhone.
              </p>
              <p className="text-foreground mb-4">
                Mức cước gọi 9192 là 200 đồng/phút (đã bao gồm VAT) theo phương thức tính cước 1+1 và áp dụng cho thuê bao trả trước. Thuê bao VinaPhone trả sau được miễn cước.
              </p>

              <p className="font-semibold text-foreground mb-2">
                Hệ thống giải đáp 18001091 - Tổng đài hỗ trợ miễn phí của Vinaphone
              </p>
              <p className="text-foreground mb-4">
                Bao gồm hệ thống trả lời tự động và hệ thống giải đáp nhân công để hỗ trợ kênh bán hàng trực tiếp, các yêu cầu cắt khẩn cấp và giải quyết khiếu nại trong quá trình sử dụng dịch vụ.
              </p>
              <p className="text-foreground mb-4">
                Số 18001091 phục vụ 24h/7, miễn cước cho thuê bao VinaPhone và thuê bao VNPT.
              </p>
              <p className="text-foreground mb-4">
                Hệ thống trả lời tự động cung cấp các nhóm thông tin về cước, thẻ cào, giá dịch vụ, khuyến mại, chương trình chăm sóc khách hàng, các loại dịch vụ (2friends, Call Blocking, Vline, đồng bộ dữ liệu Datasafe, thông báo cuộc gọi nhỡ MCA, Call me back, Ringtunes, GPRS, MMS, VNN-999, chuyển vùng trong nước và quốc tế, hộp thư thoại...) và các thủ tục thương mại (hòa mạng mới, đổi sim, chuyển đổi dịch vụ, đăng ký gói cước, thay đổi thông tin thuê bao, chuyển chủ quyền, tạm khóa và nối lại thông tin thuê bao).
              </p>

              <p className="font-semibold text-foreground mb-2">
                Đường dây nóng- Hotline của Vinaphone
              </p>
              <p className="text-foreground mb-4">
                Hỗ trợ nhu cầu thông tin và giải đáp khách hàng về dịch vụ, chất lượng mạng, chất lượng dịch vụ, giải quyết khiếu nại, đại lý bán hàng và đội bán hàng lưu động .
              </p>
              <p className="text-foreground mb-4">
                Số điện thoại Hotline: Hà Nội - 0912481111; Hồ Chí Minh - 0918681111; Đà Nẵng -0914181111 phục vụ 24h/7 với mức cước như cuộc gọi di động thông thường.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                Số tống đài Gmobile
              </h3>
              <p className="text-foreground">
                Số tổng đài 199 khi ở trong mạng Gmobile, 01998880199 khi đang chuyển vùng trong nước hay gọi từ mạng ngoài. Hỗ trợ khách hàng 24/7, giải đáp mọi thắc mắc về Gmobile và tư vấn sử dụng các sản phầm, dịch vụ do Gmobile cung cấp.
              </p>
            </div>
          </section>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default TinTucBai2;
