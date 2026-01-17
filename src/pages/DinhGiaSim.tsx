import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Calculator, Phone, Star, TrendingUp, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  normalizePhone,
  validatePhone,
  valuateSim,
  formatCurrencyVND,
  formatPhoneDisplay,
  type ValuationOutput,
  type Carrier,
} from '@/lib/simValuation';

type ValuationState = 'idle' | 'loading' | 'success' | 'error';

const faqData = [
  {
    question: 'Định giá này có chính xác tuyệt đối không?',
    answer:
      'Công cụ định giá sử dụng thuật toán phân tích các yếu tố phổ biến như đầu số, dạng số, tính phong thủy... để đưa ra mức giá tham khảo. Giá thực tế có thể dao động tùy thuộc nhu cầu thị trường và người mua cụ thể. Để được định giá chính xác hơn, vui lòng liên hệ tư vấn viên.',
  },
  {
    question: 'Những yếu tố nào ảnh hưởng lớn nhất đến giá SIM?',
    answer:
      'Các yếu tố quan trọng bao gồm: Đầu số (090/091 thường có giá cao hơn), dạng số (tứ quý, tam hoa, sảnh tiến...), tính dễ nhớ, ý nghĩa phong thủy, và độ hiếm trên thị trường.',
  },
  {
    question: 'Vì sao cùng một số SIM nhưng giá thị trường có thể khác nhau?',
    answer:
      'Giá SIM phụ thuộc vào nhiều yếu tố chủ quan như: người bán, thời điểm, tình trạng cung cầu, kênh bán hàng, và đặc biệt là nhu cầu của người mua. Một số SIM có thể được định giá cao hơn nếu có ý nghĩa đặc biệt với người mua.',
  },
  {
    question: 'SIM 10 số và 11 số khác nhau thế nào về giá trị?',
    answer:
      'Hiện nay SIM 10 số là tiêu chuẩn phổ biến và thường được ưa chuộng hơn do dễ nhớ. SIM 11 số (đầu 01x cũ) đã chuyển về 10 số nên không còn phổ biến. Tuy nhiên, giá trị thực tế phụ thuộc vào dãy số đẹp chứ không chỉ số lượng chữ số.',
  },
  {
    question: 'Tôi có thể mua hoặc bán SIM theo giá định giá này không?',
    answer:
      'Đây chỉ là giá tham khảo. Nếu bạn muốn mua SIM, hãy tham khảo kho SIM của chúng tôi. Nếu bạn muốn bán SIM, vui lòng liên hệ tư vấn viên để được hỗ trợ định giá chính xác và tìm người mua phù hợp.',
  },
];

const carrierColors: Record<Carrier, string> = {
  Viettel: 'bg-red-500/10 text-red-600 border-red-200',
  Vina: 'bg-blue-500/10 text-blue-600 border-blue-200',
  Mobi: 'bg-purple-500/10 text-purple-600 border-purple-200',
  Vietnamobile: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  iTel: 'bg-green-500/10 text-green-600 border-green-200',
  Gmobile: 'bg-orange-500/10 text-orange-600 border-orange-200',
  Unknown: 'bg-gray-500/10 text-gray-600 border-gray-200',
};

const DinhGiaSim = () => {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<ValuationState>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationOutput | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ cho phép nhập số, tự động loại bỏ ký tự khác
    const value = e.target.value.replace(/[^\d]/g, '');
    setPhone(value);
    setError('');
    setState('idle');
  }, []);

  const handleSubmit = useCallback(async () => {
    const validation = validatePhone(phone);
    
    if (!validation.valid) {
      setError(validation.error || 'Số không hợp lệ');
      setState('error');
      return;
    }

    setState('loading');
    setError('');

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const normalized = normalizePhone(phone);
      const valuation = valuateSim(normalized);

      setResult(valuation);
      setState('success');
    } catch {
      setError('Có lỗi xảy ra khi định giá. Vui lòng thử lại.');
      setState('error');
    }
  }, [phone]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && state !== 'loading') {
        handleSubmit();
      }
    },
    [handleSubmit, state]
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 pt-3 pb-6">
        {/* Banner */}
        <section className="mb-6">
          <div className="relative bg-gradient-to-br from-primary via-primary-dark to-primary rounded-xl overflow-hidden shadow-card">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--gold) / 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.2) 0%, transparent 50%)`,
              }}
            ></div>

            <div className="relative px-4 md:px-6 py-8 md:py-12 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gold/20 flex items-center justify-center">
                  <Calculator className="w-7 h-7 md:w-8 md:h-8 text-gold" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-3">
                Định giá SIM số đẹp
              </h1>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto">
                Nhận mức giá tham khảo nhanh chóng – chính xác – khách quan
              </p>
            </div>
          </div>
        </section>

        {/* Card nhập số */}
        <section className="max-w-2xl mx-auto mb-8">
          <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              Định giá SIM số đẹp
            </h2>

            <div className="space-y-4">
              <div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Nhập số SIM cần định giá (VD: 0907891189)"
                  value={phone}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  maxLength={11}
                  className={`h-14 text-lg ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={state === 'loading'}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-dark"
              >
                {state === 'loading' ? (
                  <>
                    <span className="animate-pulse">Đang định giá...</span>
                  </>
                ) : (
                  'Định giá SIM'
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Kết quả định giá */}
        {state === 'success' && result && (
          <section className="max-w-2xl mx-auto mb-8 animate-fade-in">
            {/* Banner kết quả */}
            <div className="bg-primary-light rounded-xl p-6 mb-6 border border-primary/20">
              <div className="text-center">
                {/* Nhà mạng */}
                <div className="flex justify-center mb-3">
                  <Badge 
                    variant="outline" 
                    className={`text-sm px-3 py-1 ${carrierColors[result.carrier]}`}
                  >
                    <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                    Nhà mạng ước tính: {result.carrier}
                  </Badge>
                </div>

                <p className="text-xl md:text-2xl font-bold text-primary-dark mb-2">
                  SIM {formatPhoneDisplay(result.phone)} được định giá:
                </p>
                <p className="text-3xl md:text-4xl font-extrabold text-gold gold-glow mb-3">
                  {formatCurrencyVND(result.price)} VNĐ
                </p>
                <p className="text-muted-foreground">
                  Khoảng giá tham khảo:{' '}
                  <span className="font-medium text-foreground">
                    {formatCurrencyVND(result.range[0])} – {formatCurrencyVND(result.range[1])} VNĐ
                  </span>
                </p>

                {/* Tags */}
                {result.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {result.tags.map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="text-xs bg-gold/10 text-gold border-gold/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chi tiết đánh giá */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Lý do nổi bật */}
              <div className="bg-card rounded-xl shadow-card border border-border p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Lý do nổi bật
                </h3>
                <ul className="space-y-2">
                  {result.highlights.slice(0, 6).map((highlight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Điểm đánh giá */}
              <div className="bg-card rounded-xl shadow-card border border-border p-5">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  Điểm đánh giá
                </h3>
                <div className="text-center py-4">
                  <div className="text-5xl md:text-6xl font-extrabold text-primary mb-2">
                    {result.score}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      result.score >= 90
                        ? 'text-gold'
                        : result.score >= 80
                        ? 'text-primary'
                        : result.score >= 65
                        ? 'text-primary'
                        : result.score >= 50
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    SIM {result.tierLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Tư vấn */}
            <div className="bg-card rounded-xl shadow-card border border-border p-5">
              <p className="text-center text-muted-foreground mb-4">
                Bạn muốn chốt giá hoặc cần tư vấn kỹ hơn?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://zalo.me/0896888666?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n%20v%E1%BB%81%20%C4%91%E1%BB%8Bnh%20gi%C3%A1%20SIM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
                >
                  <span className="font-bold">Z</span>
                  Chat Zalo
                </a>
                <a
                  href="tel:0909888888"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Nhận tư vấn
                </a>
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              Câu Hỏi Thường Gặp
            </h2>

            <Accordion type="single" collapsible className="space-y-2">
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-4 data-[state=open]:bg-background-secondary"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DinhGiaSim;
