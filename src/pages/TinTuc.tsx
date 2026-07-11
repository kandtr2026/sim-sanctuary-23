import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import TrustBar from '@/components/TrustBar';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const articles = [
  { title: 'Ý NGHĨA SỐ ĐIỆN THOẠI - Sim số như thế nào là sim đẹp?', href: '/tin-tuc/y-nghia-sim-so-dep' },
  { title: 'SỐ TỔNG ĐÀI CÁC NHÀ MẠNG MỚI NHẤT - Mobifone / Gmobile / Vina / Viettel', href: '/tin-tuc/so-tong-dai-cac-nha-mang' },
  { title: 'Ý NGHĨA CÁC CON SỐ TỪ 1 - 9 CÓ THỂ BẠN CHƯA BIẾT', href: '/tin-tuc/y-nghia-cac-con-so-1-9' },
  { title: 'CÁCH XEM SIM PHONG THUỶ HỢP TUỔI', href: '/tin-tuc/cach-xem-sim-phong-thuy-hop-tuoi' },
  { title: 'CÁCH TRÁNH MẤT TIỀN OAN KHI MUA SIM SỐ ĐẸP', href: '/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep' },
  { title: 'CÁC ĐẦU SỐ MẠNG MOBIFONE MỚI NHẤT - Danh sách đầy đủ & ý nghĩa', href: '/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat' },
];

const TinTuc = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Tin Tức SIM Số Đẹp – Kiến Thức Phong Thủy & Mua Bán SIM</title>
        <meta name="description" content="Tin tức và kiến thức về SIM số đẹp: ý nghĩa các con số, xem SIM phong thủy hợp tuổi, cách tránh mất tiền oan khi mua SIM." />
        <link rel="canonical" href="https://www.chonsomobifone.com/tin-tuc" />
        <meta property="og:title" content="Tin Tức SIM Số Đẹp – CHONSOMOBIFONE.COM" />
        <meta property="og:description" content="Kiến thức SIM số đẹp và phong thủy." />
        <meta property="og:url" content="https://www.chonsomobifone.com/tin-tuc" />
      </Helmet>
      <Header />
      <TrustBar />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-8">
          Tin Tức
        </h1>
        
        <div className="space-y-4">
          {articles.map((article, index) => (
            article.href ? (
              <Link
                key={index}
                to={article.href}
                className="block p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <h2 className="text-base md:text-lg font-medium text-foreground">
                  {index + 1}. {article.title}
                </h2>
              </Link>
            ) : (
              <div
                key={index}
                className="p-4 bg-card rounded-lg border border-border"
              >
                <h2 className="text-base md:text-lg font-medium text-foreground">
                  {index + 1}. {article.title}
                </h2>
              </div>
            )
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TinTuc;
