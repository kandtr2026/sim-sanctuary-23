import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shield, Truck, Award } from 'lucide-react';

const slides = [
  {
    title: 'Kho SIM Số Đẹp Lớn Nhất',
    subtitle: 'Hàng ngàn số VIP, phong thủy, tài lộc',
    icon: Award,
    highlight: '50.000+ SIM',
  },
  {
    title: 'Cam Kết Chính Hãng',
    subtitle: 'Hỗ trợ đăng ký chính chủ miễn phí',
    icon: Shield,
    highlight: '100% Uy Tín',
  },
  {
    title: 'Giao SIM Toàn Quốc',
    subtitle: 'Giao hàng nhanh trong 24h - COD toàn quốc',
    icon: Truck,
    highlight: 'Miễn Phí Ship',
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative bg-gradient-to-br from-primary via-primary-dark to-primary rounded-xl overflow-hidden shadow-card">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--gold) / 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.2) 0%, transparent 50%)`,
        }}></div>
      </div>

      <div className="relative px-8 py-12 md:py-16">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prev}
            className="hidden md:flex w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center max-w-xl">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  index === current ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                    <slide.icon className="w-8 h-8 text-gold" />
                  </div>
                </div>
                <span className="inline-block px-4 py-1 rounded-full bg-gold text-header-bg text-sm font-semibold mb-4">
                  {slide.highlight}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                  {slide.title}
                </h2>
                <p className="text-primary-foreground/80 text-lg">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={next}
            className="hidden md:flex w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === current
                  ? 'w-8 bg-gold'
                  : 'bg-primary-foreground/30 hover:bg-primary-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
