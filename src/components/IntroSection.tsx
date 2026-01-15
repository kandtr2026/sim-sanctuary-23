import { Sparkles, Users, Trophy, Clock } from 'lucide-react';

const IntroSection = () => {
  return (
    <section className="bg-background-secondary rounded-xl p-6 md:p-8">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
          SIM Số Đẹp - Không Còn Là Đặc Quyền
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Chúng tôi tin rằng mỗi người đều xứng đáng sở hữu một số điện thoại đẹp, mang lại may mắn và thành công. 
          Với kho SIM khổng lồ và giá cả minh bạch, CHONSOMOBIFONE.COM cam kết mang đến cho bạn những lựa chọn tốt nhất.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 text-center shadow-soft">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gold mb-1">50.000+</p>
          <p className="text-sm text-muted-foreground">SIM số đẹp</p>
        </div>

        <div className="bg-card rounded-xl p-5 text-center shadow-soft">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gold mb-1">100.000+</p>
          <p className="text-sm text-muted-foreground">Khách hàng</p>
        </div>

        <div className="bg-card rounded-xl p-5 text-center shadow-soft">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gold mb-1">10 Năm</p>
          <p className="text-sm text-muted-foreground">Kinh nghiệm</p>
        </div>

        <div className="bg-card rounded-xl p-5 text-center shadow-soft">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-gold mb-1">24h</p>
          <p className="text-sm text-muted-foreground">Giao hàng</p>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
