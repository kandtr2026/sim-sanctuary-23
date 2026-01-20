import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const articles = [
  'Ý NGHĨA SỐ ĐIỆN THOẠI - Sim số như thế nào là sim đẹp?',
  'SỐ TỔNG ĐÀI CÁC NHÀ MẠNG MỚI NHẤT - Mobifone / Gmobile / Vina / Viettel',
  'Ý NGHĨA CÁC CON SỐ TỪ 1 - 9 CÓ THỂ BẠN CHƯA BIẾT',
  'CÁCH XEM SIM PHONG THUỶ HỢP TUỔI',
  'CÁCH TRÁNH MẤT TIỀN OAN KHI MUA SIM SỐ ĐẸP',
];

const TinTuc = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Tin Tức
        </h1>
        
        <div className="space-y-4">
          {articles.map((title, index) => (
            <div
              key={index}
              className="p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
            >
              <h2 className="text-base md:text-lg font-medium text-foreground">
                {index + 1}. {title}
              </h2>
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TinTuc;
