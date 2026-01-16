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

      {/* Compact padding: Mobile ~160-200px, Tablet ~200-240px, Desktop ~220-280px */}
      <div className="relative px-4 md:px-6 py-6 md:py-8 lg:py-10">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            className="hidden md:flex w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center max-w-lg">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  index === current ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
              >
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold/20 flex items-center justify-center">
                    <slide.icon className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                  </div>
                </div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-gold text-header-bg text-xs font-semibold mb-2">
                  {slide.highlight}
                </span>
                <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-primary-foreground mb-1.5">
                  {slide.title}
                </h2>
                <p className="text-primary-foreground/80 text-sm md:text-base">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={next}
            className="hidden md:flex w-8 h-8 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 items-center justify-center text-primary-foreground transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === current
                  ? 'w-6 bg-gold'
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
