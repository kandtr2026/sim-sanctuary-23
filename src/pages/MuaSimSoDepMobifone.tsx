import { useState } from 'react';
import { Phone, Shield, Truck, Clock, Star, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import SIMCardNew from '@/components/SIMCardNew';
import { useSimData } from '@/hooks/useSimData';

const MuaSimSoDepMobifone = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { allSims, isLoading } = useSimData();

  // Get featured SIMs (first 6 available)
  const featuredSims = allSims.slice(0, 6);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Scroll to SIM section
    document.getElementById('sim-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleZaloClick = () => {
    window.open('https://zalo.me/0901191111?text=Xin%20chào!%20Tôi%20muốn%20tư%20vấn%20mua%20SIM%20số%20đẹp%20Mobifone', '_blank');
  };

  const handleCallClick = () => {
    window.location.href = 'tel:0938868868';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - Optimized for conversions */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--gold) / 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.2) 0%, transparent 50%)`,
          }}></div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full mb-6">
              <Star className="w-4 h-4 fill-gold" />
              <span className="text-sm font-semibold">Đại lý chính hãng Mobifone - 10 năm uy tín</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Mua SIM Số Đẹp Mobifone
              <span className="block text-gold mt-2">Giá Tốt Nhất Thị Trường</span>
            </h1>

            <p className="text-primary-foreground/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Kho SIM khổng lồ 50.000+ số đẹp. Cam kết chính hãng 100%. 
              Giao SIM tận nơi toàn quốc trong 24h.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleZaloClick}
                className="bg-[#0068FF] hover:bg-[#0052CC] text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat Zalo Ngay
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleCallClick}
                className="bg-gold hover:bg-gold/90 text-header-bg border-gold font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Gọi: 0938.868.868
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Chính hãng 100%</p>
                <p className="text-xs text-muted-foreground">Đăng ký chính chủ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Giao toàn quốc</p>
                <p className="text-xs text-muted-foreground">Ship COD 24h</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Hỗ trợ 24/7</p>
                <p className="text-xs text-muted-foreground">Tư vấn miễn phí</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">10 năm kinh nghiệm</p>
                <p className="text-xs text-muted-foreground">100.000+ khách hàng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured SIMs */}
      <section id="sim-section" className="py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              SIM Số Đẹp <span className="text-gold">Nổi Bật</span>
            </h2>
            <p className="text-muted-foreground">
              Những số đẹp được săn đón nhất - Cập nhật hàng ngày
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded mb-3"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featuredSims.map((sim) => (
                <SIMCardNew key={sim.id} sim={sim} />
              ))}
            </div>
          )}

          {/* View More CTA */}
          <div className="text-center mt-8">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
            >
              Xem Thêm 50.000+ SIM Số Đẹp
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-background-secondary py-10 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Tại Sao Chọn <span className="text-primary">CHONSOMOBIFONE.COM</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card border-border shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Kho SIM Khổng Lồ</h3>
                <p className="text-muted-foreground text-sm">
                  Hơn 50.000 SIM số đẹp đa dạng: Tứ quý, Ngũ quý, Lộc phát, Thần tài, Phong thủy...
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Uy Tín 10 Năm</h3>
                <p className="text-muted-foreground text-sm">
                  Đại lý chính hãng Mobifone. Cam kết SIM chính chủ, đăng ký miễn phí, bảo hành trọn đời.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Truck className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-2">Giao Hàng Nhanh</h3>
                <p className="text-muted-foreground text-sm">
                  Ship COD toàn quốc trong 24h. Kiểm tra SIM trước khi thanh toán. Miễn phí ship nội thành.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-primary to-primary-dark py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Sở Hữu SIM Số Đẹp Ngay Hôm Nay!
          </h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            Liên hệ ngay để được tư vấn miễn phí và chọn số đẹp phù hợp nhất với bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleZaloClick}
              className="bg-[#0068FF] hover:bg-[#0052CC] text-white font-bold px-8 py-6 text-lg rounded-xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat Zalo: 090.119.1111
            </Button>
            <Button 
              size="lg" 
              onClick={handleCallClick}
              className="bg-gold hover:bg-gold/90 text-header-bg font-bold px-8 py-6 text-lg rounded-xl"
            >
              <Phone className="w-5 h-5 mr-2" />
              Hotline: 0938.868.868
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MuaSimSoDepMobifone;
