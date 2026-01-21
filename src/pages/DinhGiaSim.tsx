import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Calculator, Phone, TrendingUp, Smartphone, ExternalLink, Loader2, Info } from 'lucide-react';
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
  formatCurrencyVND,
  formatPhoneDisplay,
  detectCarrier,
  type Carrier,
} from '@/lib/simValuation';
import { getSimilarSims, extractTagsFromPhone, type SimItem } from '@/lib/simInventorySheet';
import { useSimData } from '@/hooks/useSimData';
import { type NormalizedSIM } from '@/lib/simUtils';

type ValuationState = 'idle' | 'loading' | 'success' | 'error';
type SimilarState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

// Helper: chỉ giữ digits
const toDigits = (s: string): string => s.replace(/\D/g, '');

// Helper: tạo các biến thể chuẩn hóa (84xxx vs 0xxx)
const variants = (digits: string): string[] => {
  const result = new Set<string>();
  result.add(digits);
  
  if (digits.startsWith('84') && digits.length >= 11) {
    // 84xxxxxxxxx -> 0xxxxxxxxx
    result.add('0' + digits.slice(2));
  } else if (digits.startsWith('0') && digits.length >= 10) {
    // 0xxxxxxxxx -> 84xxxxxxxxx
    result.add('84' + digits.slice(1));
  }
  
  return Array.from(result);
};

// Result type cho lookup
interface LookupResult {
  found: boolean;
  phone: string;
  carrier: Carrier;
  price: number;
  tags: string[];
  message?: string;
}

const faqData = [
  {
    question: 'Định giá này có chính xác tuyệt đối không?',
    answer:
      'Công cụ định giá sử dụng thuật toán phân tích các yếu tố phổ biến như đầu số, dạng số, tính phong thủy... để đưa ra mức giá tham khảo. Giá thực tế có thể dao động tùy thuộc nhu cầu thị trường và người mua cụ thể. Để được định giá chính xác hơn, vui lòng liên hệ tư vấn viên.',
  },
  {
    question: 'Những yếu tố nào ảnh hưởng lớn nhất đến giá SIM?',
    answer:
      'Các yếu tố quan trọng bao gồm: Đuôi số (chiếm ~70% giá trị), dạng số (tứ quý, tam hoa, sảnh tiến...), đầu số/nhà mạng, tính dễ nhớ, và ý nghĩa phong thủy.',
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
  const [result, setResult] = useState<LookupResult | null>(null);
  
  // State lưu số đã submit (digits only)
  const [lastSubmittedDigits, setLastSubmittedDigits] = useState<string>('');
  
  // Dùng đúng kho từ trang chủ
  const { allSims, isLoading: inventoryLoading } = useSimData();
  
  // Similar SIMs state
  const [similarState, setSimilarState] = useState<SimilarState>('idle');
  const [similarSims, setSimilarSims] = useState<SimItem[]>([]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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

    const digitsInput = toDigits(phone);
    
    // Lưu số đã submit
    setLastSubmittedDigits(digitsInput);
    setState('loading');
    setError('');
    setResult(null);
    
    // Ngay lập tức chạy gợi ý tương tự
    setSimilarState('loading');
    setSimilarSims([]);
    
    try {
      const normalized = normalizePhone(phone);
      const tags = extractTagsFromPhone(normalized);
      const carrier = detectCarrier(normalized);
      
      const similar = await getSimilarSims({
        phone: normalized,
        carrier: carrier,
        tags: tags,
        range: [2000000, 20000000] as [number, number],
      });
      
      if (similar.length > 0) {
        setSimilarSims(similar);
        setSimilarState('success');
      } else {
        setSimilarState('empty');
      }
    } catch {
      setSimilarState('error');
    }
  }, [phone]);

  // Effect: Đối chiếu số với kho khi allSims load xong hoặc lastSubmittedDigits thay đổi
  useEffect(() => {
    // Chưa submit gì thì không làm gì
    if (!lastSubmittedDigits) return;
    
    // Inventory chưa load xong hoặc rỗng => giữ loading, KHÔNG kết luận "không có"
    if (inventoryLoading || allSims.length === 0) {
      setState('loading');
      return;
    }
    
    // Inventory đã load, tiến hành đối chiếu
    const inputVariants = variants(lastSubmittedDigits);
    
    // Tìm trong kho
    const foundSim = allSims.find((sim: NormalizedSIM) => {
      // Ưu tiên rawDigits, fallback sang formattedNumber
      const simDigits = sim.rawDigits || toDigits(sim.formattedNumber || '');
      return inputVariants.includes(simDigits);
    });
    
    const normalized = normalizePhone(lastSubmittedDigits);
    
    if (foundSim) {
      // Tìm thấy trong kho => dùng giá kho
      const carrier = (foundSim.network as Carrier) || detectCarrier(normalized);
      setResult({
        found: true,
        phone: normalized,
        carrier: carrier,
        price: foundSim.price,
        tags: foundSim.tags || [],
      });
      setState('success');
    } else {
      // Không tìm thấy => hiển thị thông báo liên hệ
      const tags = extractTagsFromPhone(normalized);
      const carrier = detectCarrier(normalized);
      setResult({
        found: false,
        phone: normalized,
        carrier: carrier,
        price: 0,
        tags: tags,
        message: 'Vui lòng liên hệ 0938.868.868 để biết thêm chi tiết . Cảm ơn !',
      });
      setState('success');
    }
  }, [lastSubmittedDigits, allSims, inventoryLoading]);

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
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Đang định giá...</span>
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
                    Nhà mạng: {result.carrier}
                  </Badge>
                </div>

                <p className="text-xl md:text-2xl font-bold text-primary-dark mb-2">
                  SIM {formatPhoneDisplay(result.phone)} được định giá:
                </p>
                
                {result.found ? (
                  <>
                    <p className="text-3xl md:text-4xl font-extrabold text-gold gold-glow mb-3">
                      {formatCurrencyVND(result.price)} VNĐ
                    </p>
                    
                    {/* Market basis indicator */}
                    <div className="flex justify-center mt-3">
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-green-500/10 text-green-600 border-green-200"
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Giá chính xác từ kho SIM
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg md:text-xl font-semibold text-foreground mb-3 px-4">
                      {result.message}
                    </p>
                    
                    {/* Indicator */}
                    <div className="flex justify-center mt-3">
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-orange-500/10 text-orange-600 border-orange-200"
                      >
                        <Info className="w-3 h-3 mr-1" />
                        Số không có trong kho
                      </Badge>
                    </div>
                  </>
                )}

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

            {/* Chi tiết đánh giá - chỉ hiển thị khi tìm thấy */}
            {result.found && (
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Lý do nổi bật */}
                <div className="bg-card rounded-xl shadow-card border border-border p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Đặc điểm nổi bật
                  </h3>
                  <ul className="space-y-2">
                    {result.tags.length > 0 ? (
                      result.tags.map((tag, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-muted-foreground"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                          <span>{tag}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">Số SIM thường</li>
                    )}
                  </ul>
                </div>

                {/* Giá kho */}
                <div className="bg-card rounded-xl shadow-card border border-border p-5">
                  <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-gold" />
                    Thông tin kho
                  </h3>
                  <div className="text-center py-4">
                    <div className="text-2xl md:text-3xl font-extrabold text-primary mb-2">
                      {formatCurrencyVND(result.price)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Giá niêm yết trong kho SIM
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Tư vấn */}
            <div className="bg-card rounded-xl shadow-card border border-border p-5 mb-6">
              <p className="text-center text-muted-foreground mb-4">
                Bạn muốn chốt giá hoặc cần tư vấn kỹ hơn?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://zalo.me/0938868868?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n%20v%E1%BB%81%20%C4%91%E1%BB%8Bnh%20gi%C3%A1%20SIM"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
                >
                  <span className="font-bold">Z</span>
                  Chat Zalo
                </a>
                <a
                  href="tel:0938868868"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Nhận tư vấn
                </a>
              </div>
            </div>

            {/* Similar SIMs Section */}
            <div className="bg-card rounded-xl shadow-card border border-border p-6">
              <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
                <span className="w-1 h-8 bg-primary rounded-full"></span>
                SIM tương tự
              </h3>

              {similarState === 'loading' && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Đang tìm SIM tương tự…</span>
                </div>
              )}

              {similarState === 'empty' && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa tìm được SIM phù hợp. Vui lòng liên hệ tư vấn.</p>
                </div>
              )}

              {similarState === 'error' && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Không thể tải danh sách SIM tương tự.</p>
                </div>
              )}

              {similarState === 'success' && similarSims.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {similarSims.map((sim, idx) => (
                    <div
                      key={idx}
                      className="bg-background rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
                    >
                      {/* Phone number */}
                      <p className="text-lg font-bold text-primary mb-1">
                        {formatPhoneDisplay(sim.phone)}
                      </p>
                      
                      {/* Carrier */}
                      <Badge 
                        variant="outline" 
                        className={`text-xs mb-2 ${carrierColors[sim.carrier]}`}
                      >
                        {sim.carrier}
                      </Badge>
                      
                      {/* Price */}
                      <p className="text-xl font-extrabold text-gold mb-2">
                        {formatCurrencyVND(sim.price)} đ
                      </p>
                      
                      {/* Tags */}
                      {sim.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {sim.tags.slice(0, 3).map((tag, tagIdx) => (
                            <Badge 
                              key={tagIdx}
                              variant="secondary"
                              className="text-xs bg-muted"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Action button */}
                      {sim.url ? (
                        <a
                          href={sim.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground text-sm font-semibold transition-colors"
                        >
                          Mua ngay
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-full"
                          disabled
                        >
                          Liên hệ tư vấn
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
