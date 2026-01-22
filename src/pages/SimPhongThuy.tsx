import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ZaloChatCard from '@/components/ZaloChatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Copy, AlertCircle, Sparkles, Share2 } from 'lucide-react';
import { toast } from 'sonner';

// ===================== DATA: 80 QUẺ =====================
type HexagramLevel = 'Đại cát' | 'Cát' | 'Bình thường' | 'Hung' | 'Đại hung';

interface Hexagram {
  index: number;
  title: string;
  short: string;
  level: HexagramLevel;
}

const HEXAGRAMS: Record<number, Hexagram> = {
  1: { index: 1, title: "Đại triển hồng đô, khả được thành công", short: "Đại triển hồng đô, khả được thành công", level: "Cát" },
  2: { index: 2, title: "Thăng trầm không số, về già vô công", short: "Thăng trầm không số, về già vô công", level: "Bình thường" },
  3: { index: 3, title: "Ngày ngày tiến tới, vạn sự thuận toàn", short: "Ngày ngày tiến tới, vạn sự thuận toàn", level: "Đại cát" },
  4: { index: 4, title: "Tiền đồ gai góc, dâu khổ theo đuổi", short: "Tiền đồ gai góc, dâu khổ theo đuổi", level: "Hung" },
  5: { index: 5, title: "Làm ăn phát đạt, lợi danh đều có", short: "Làm ăn phát đạt, lợi danh đều có", level: "Đại cát" },
  6: { index: 6, title: "Trời cho số phận có thể thành công", short: "Trời cho số phận có thể thành công", level: "Cát" },
  7: { index: 7, title: "Ôn hòa êm dịu nhất phải thành công", short: "Ôn hòa êm dịu nhất phải thành công", level: "Cát" },
  8: { index: 8, title: "Qua giai đoạn gian nan, có ngày thành công", short: "Qua giai đoạn gian nan, có ngày thành công", level: "Cát" },
  9: { index: 9, title: "Tự làm có sức thất bại khó lường", short: "Tự làm có sức thất bại khó lường", level: "Hung" },
  10: { index: 10, title: "Tâm sức làm không, không được đến bờ", short: "Tâm sức làm không, không được đến bờ", level: "Hung" },
  11: { index: 11, title: "Vững đi từng bước, được người trọng vọng", short: "Vững đi từng bước, được người trọng vọng", level: "Cát" },
  12: { index: 12, title: "Gầy gò yếu đuối, mọi việc khó thành", short: "Gầy gò yếu đuối, mọi việc khó thành", level: "Hung" },
  13: { index: 13, title: "Trời cho cát vận, được người kính trọng", short: "Trời cho cát vận, được người kính trọng", level: "Cát" },
  14: { index: 14, title: "Nửa được nửa bại, dựa vào nghị lực", short: "Nửa được nửa bại, dựa vào nghị lực", level: "Bình thường" },
  15: { index: 15, title: "Đại sự thành tựu, nhất định hưng vương", short: "Đại sự thành tựu, nhất định hưng vương", level: "Cát" },
  16: { index: 16, title: "Thành tựu to lớn, tên tuổi lừng danh", short: "Thành tựu to lớn, tên tuổi lừng danh", level: "Đại cát" },
  17: { index: 17, title: "Quý nhân trợ giúp, sẽ được thành công", short: "Quý nhân trợ giúp, sẽ được thành công", level: "Cát" },
  18: { index: 18, title: "Thuận lợi xương thịnh, trăm việc trôi chảy", short: "Thuận lợi xương thịnh, trăm việc trôi chảy", level: "Đại cát" },
  19: { index: 19, title: "Nội ngoại bất hòa, khó khăn muôn phát", short: "Nội ngoại bất hòa, khó khăn muôn phát", level: "Hung" },
  20: { index: 20, title: "Vượt mọi gian nan, lo xa nghĩ hoài", short: "Vượt mọi gian nan, lo xa nghĩ hoài", level: "Hung" },
  21: { index: 21, title: "Chuyên tâm kinh doanh hay dung trí", short: "Chuyên tâm kinh doanh hay dung trí", level: "Cát" },
  22: { index: 22, title: "Có tài không vận, việc không gặp may", short: "Có tài không vận, việc không gặp may", level: "Hung" },
  23: { index: 23, title: "Tên tuổi 4 phương, sẽ thành đại nghiệp", short: "Tên tuổi 4 phương, sẽ thành đại nghiệp", level: "Đại cát" },
  24: { index: 24, title: "Phải dựa tự lập sẽ thành đại nghiệp", short: "Phải dựa tự lập sẽ thành đại nghiệp", level: "Cát" },
  25: { index: 25, title: "Thiên thời địa lợi vì được nhân cách", short: "Thiên thời địa lợi vì được nhân cách", level: "Cát" },
  26: { index: 26, title: "Bảo táp phong ba qua được hiểm nguy", short: "Bảo táp phong ba qua được hiểm nguy", level: "Hung" },
  27: { index: 27, title: "Lúc thắng lúc thua giữ được thành công", short: "Lúc thắng lúc thua giữ được thành công", level: "Cát" },
  28: { index: 28, title: "Tiến mãi không lùi trí tuệ được dung", short: "Tiến mãi không lùi trí tuệ được dung", level: "Đại cát" },
  29: { index: 29, title: "Cát hung chia đổ, được thua mỗi nửa", short: "Cát hung chia đổ, được thua mỗi nửa", level: "Hung" },
  30: { index: 30, title: "Danh lợi được mùa đại sự thành công", short: "Danh lợi được mùa đại sự thành công", level: "Đại cát" },
  31: { index: 31, title: "Con rồng trong nước thành công sẽ đến", short: "Con rồng trong nước thành công sẽ đến", level: "Đại cát" },
  32: { index: 32, title: "Dùng trí lâu dài, sẽ được thịnh vượng", short: "Dùng trí lâu dài, sẽ được thịnh vượng", level: "Cát" },
  33: { index: 33, title: "Rủi ro không ngừng khó có thành công", short: "Rủi ro không ngừng khó có thành công", level: "Hung" },
  34: { index: 34, title: "Số phận trung cất tiến lùi bảo thủ", short: "Số phận trung cất tiến lùi bảo thủ", level: "Bình thường" },
  35: { index: 35, title: "Trôi nổi bập bùng thường hay gặp nạn", short: "Trôi nổi bập bùng thường hay gặp nạn", level: "Hung" },
  36: { index: 36, title: "Tránh được điểm ác, thuận buồm xuôi gió", short: "Tránh được điểm ác, thuận buồm xuôi gió", level: "Cát" },
  37: { index: 37, title: "Danh thì được tiếng lợi thì bằng không", short: "Danh thì được tiếng lợi thì bằng không", level: "Bình thường" },
  38: { index: 38, title: "Đường rộng thênh thang nhìn thấy tương lai", short: "Đường rộng thênh thang nhìn thấy tương lai", level: "Đại cát" },
  39: { index: 39, title: "Lúc thịnh lúc suy chìm nổi vô định", short: "Lúc thịnh lúc suy chìm nổi vô định", level: "Bình thường" },
  40: { index: 40, title: "Thiên ý cất vận tiền đồ sang sủa", short: "Thiên ý cất vận tiền đồ sang sủa", level: "Đại cát" },
  41: { index: 41, title: "Sự nghiệp không chuyên hầu như không thành", short: "Sự nghiệp không chuyên hầu như không thành", level: "Hung" },
  42: { index: 42, title: "Nhẫn nhịn chịu đựng, xấu sẽ thành tốt", short: "Nhẫn nhịn chịu đựng, xấu sẽ thành tốt", level: "Cát" },
  43: { index: 43, title: "Cây xanh trổ lá đột nhiên thành công", short: "Cây xanh trổ lá đột nhiên thành công", level: "Cát" },
  44: { index: 44, title: "Ngược với ý mình tham công lỡ việc", short: "Ngược với ý mình tham công lỡ việc", level: "Hung" },
  45: { index: 45, title: "Quanh co khúy khỷu khó khăn kéo dài", short: "Quanh co khúy khỷu khó khăn kéo dài", level: "Hung" },
  46: { index: 46, title: "Quý nhân giúp đỡ thành công đại sự", short: "Quý nhân giúp đỡ thành công đại sự", level: "Đại cát" },
  47: { index: 47, title: "Danh lợi đều có thành công tốt đẹp", short: "Danh lợi đều có thành công tốt đẹp", level: "Đại cát" },
  48: { index: 48, title: "Cặp cát được cát gặp hung thì hung", short: "Cặp cát được cát gặp hung thì hung", level: "Bình thường" },
  49: { index: 49, title: "Hung cát cùng có, một thành một bại", short: "Hung cát cùng có, một thành một bại", level: "Bình thường" },
  50: { index: 50, title: "Một thịnh một suy bập bùn sóng gió", short: "Một thịnh một suy bập bùn sóng gió", level: "Bình thường" },
  51: { index: 51, title: "Trời quang mây tạnh nay được thành công", short: "Trời quang mây tạnh nay được thành công", level: "Cát" },
  52: { index: 52, title: "Sướng thịnh nửa số cát trước hung sau", short: "Sướng thịnh nửa số cát trước hung sau", level: "Hung" },
  53: { index: 53, title: "Nổ lực hết mình thành công ích ỏi", short: "Nổ lực hết mình thành công ích ỏi", level: "Bình thường" },
  54: { index: 54, title: "Bề ngoài tươi sang ẩn họa sẽ tới", short: "Bề ngoài tươi sang ẩn họa sẽ tới", level: "Hung" },
  55: { index: 55, title: "Ngược lại ý mình, có có thành công", short: "Ngược lại ý mình, có có thành công", level: "Đại hung" },
  56: { index: 56, title: "Nổ lực phấn đấu phận tốt quay về", short: "Nổ lực phấn đấu phận tốt quay về", level: "Cát" },
  57: { index: 57, title: "Bấp bênh nhiều chuyến hung trước tốt sau", short: "Bấp bênh nhiều chuyến hung trước tốt sau", level: "Bình thường" },
  58: { index: 58, title: "Gặp việc do dự khó có thành công", short: "Gặp việc do dự khó có thành công", level: "Hung" },
  59: { index: 59, title: "Mơ mơ hồ hồ khó có định phương hướng", short: "Mơ mơ hồ hồ khó có định phương hướng", level: "Bình thường" },
  60: { index: 60, title: "Mây che nửa trăng dấu hiệu phong ba", short: "Mây che nửa trăng dấu hiệu phong ba", level: "Hung" },
  61: { index: 61, title: "Lo nghỉ nhiều điều mọi việc không thành", short: "Lo nghỉ nhiều điều mọi việc không thành", level: "Hung" },
  62: { index: 62, title: "Biết hướng nổ lực con đường phồn vinh", short: "Biết hướng nổ lực con đường phồn vinh", level: "Cát" },
  63: { index: 63, title: "Mười việc chín không mất công mất sức", short: "Mười việc chín không mất công mất sức", level: "Hung" },
  64: { index: 64, title: "Cát vận tự đến, có được thành công", short: "Cát vận tự đến, có được thành công", level: "Cát" },
  65: { index: 65, title: "Nội ngoại bất hòa thiếu thốn tín nhiệm", short: "Nội ngoại bất hòa thiếu thốn tín nhiệm", level: "Bình thường" },
  66: { index: 66, title: "Mọi việc như ý phú quý tự đến", short: "Mọi việc như ý phú quý tự đến", level: "Đại cát" },
  67: { index: 67, title: "Nắm được thời cơ, thành công sẽ đến", short: "Nắm được thời cơ, thành công sẽ đến", level: "Cát" },
  68: { index: 68, title: "Lo trước nghĩ sau thường hay gặp nạn", short: "Lo trước nghĩ sau thường hay gặp nạn", level: "Hung" },
  69: { index: 69, title: "Bập bên khó tránh vất vả", short: "Bập bên khó tránh vất vả", level: "Hung" },
  70: { index: 70, title: "Cát hung đều có chỉ dự chí khí", short: "Cát hung đều có chỉ dự chí khí", level: "Bình thường" },
  71: { index: 71, title: "Được rồi lại mất khó có bình yên", short: "Được rồi lại mất khó có bình yên", level: "Hung" },
  72: { index: 72, title: "An lạc tự đến tự nhiên cát tường", short: "An lạc tự đến tự nhiên cát tường", level: "Cát" },
  73: { index: 73, title: "Như là vô mưu khó được thành đạt", short: "Như là vô mưu khó được thành đạt", level: "Bình thường" },
  74: { index: 74, title: "Trong lành có hung tiến không bằng lùi", short: "Trong lành có hung tiến không bằng lùi", level: "Bình thường" },
  75: { index: 75, title: "Nhiều điều đại hung, hiện tượng phân tán", short: "Nhiều điều đại hung, hiện tượng phân tán", level: "Đại hung" },
  76: { index: 76, title: "Khổ trước sướng sau, không bị thất bại", short: "Khổ trước sướng sau, không bị thất bại", level: "Cát" },
  77: { index: 77, title: "Nửa được nửa mất sang mà không thực", short: "Nửa được nửa mất sang mà không thực", level: "Bình thường" },
  78: { index: 78, title: "Tiền đồ tươi sang trăm đầy hy vọng", short: "Tiền đồ tươi sang trăm đầy hy vọng", level: "Đại cát" },
  79: { index: 79, title: "Được rồi lại mất lo cũng bằng không", short: "Được rồi lại mất lo cũng bằng không", level: "Hung" },
  80: { index: 80, title: "Số phận cao nhất, sẽ được thành công", short: "Số phận cao nhất, sẽ được thành công", level: "Đại cát" },
};

// FAQ data
const faqData = [
  {
    question: "Bói số đuôi SIM hoạt động như thế nào?",
    answer: "Công thức dựa trên phép chia 80 quẻ Kinh Dịch: lấy 4 hoặc 6 số cuối của SIM, chia cho 80, số dư (1-80) tương ứng với 1 quẻ. Mỗi quẻ có luận giải và đánh giá riêng."
  },
  {
    question: "Nên chọn 4 số cuối hay 6 số cuối?",
    answer: "4 số cuối phổ biến và dễ nhớ hơn, phù hợp tra cứu nhanh. 6 số cuối cho kết quả chi tiết hơn, thường dùng khi cần phân tích sâu."
  },
  {
    question: "Kết quả bói có chính xác 100% không?",
    answer: "Đây là công cụ tham khảo dựa trên Kinh Dịch và phong thủy dân gian, không phải khoa học chính xác. Kết quả chỉ mang tính giải trí và tham khảo."
  },
  {
    question: "Tại sao cùng một số có thể ra quẻ khác nhau?",
    answer: "Nếu bạn chọn 4 số cuối hoặc 6 số cuối, phép tính sẽ khác nhau nên quẻ cũng khác. Hãy chọn đúng độ dài bạn muốn tra cứu."
  },
  {
    question: "Làm sao để chọn SIM hợp phong thủy?",
    answer: "Ngoài bói số đuôi, bạn nên xem xét thêm ngũ hành bản mệnh, tổng số nút, cân bằng âm dương. Liên hệ tư vấn viên để được hỗ trợ chi tiết."
  }
];

// Level badge colors - Vibrant with glow
const getLevelBadgeClass = (level: HexagramLevel): string => {
  switch (level) {
    case 'Đại cát':
      return 'bg-[#2ecc71] text-white border-[#2ecc71]/60 shadow-[0_0_12px_rgba(46,204,113,0.5)]';
    case 'Cát':
      return 'bg-[#27ae60] text-white border-[#27ae60]/60 shadow-[0_0_12px_rgba(39,174,96,0.5)]';
    case 'Bình thường':
      return 'bg-[#f4b400] text-black border-[#f4b400]/60 shadow-[0_0_12px_rgba(244,180,0,0.5)]';
    case 'Hung':
      return 'bg-[#ff4d4f] text-white border-[#ff4d4f]/60 shadow-[0_0_12px_rgba(255,77,79,0.5)]';
    case 'Đại hung':
      return 'bg-[#ff4d4f] text-white border-[#ff4d4f]/60 shadow-[0_0_12px_rgba(255,77,79,0.6)]';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Generate similar suggestions
const generateSimilarSuggestions = (suffix: string, len: 4 | 6): string[] => {
  const suggestions: string[] = [];
  const prefixes = ['090', '093', '089', '070', '076', '077', '078', '079'];
  
  if (len === 4) {
    // Keep last 2 digits, randomize first 2
    const last2 = suffix.slice(-2);
    for (let i = 0; i < 10; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const mid = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      const first2 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      suggestions.push(`${prefix}.${mid}${first2}.${last2}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`);
    }
  } else {
    // Keep last 3 digits, randomize rest
    const last3 = suffix.slice(-3);
    for (let i = 0; i < 10; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const mid = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      suggestions.push(`${prefix}.${mid}.${last3}${String(Math.floor(Math.random() * 10))}`);
    }
  }
  
  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 10);
};

// Card style classes - Ruby red gradient with radial highlight and golden glow border
const cardBaseClass = "relative rounded-2xl p-6 md:p-8";
const cardStyle = {
  background: 'radial-gradient(ellipse at 50% 30%, rgba(180, 40, 50, 0.5) 0%, transparent 60%), linear-gradient(135deg, #5a0a0e 0%, #8b1a1a 40%, #6d1515 70%, #4a0d0d 100%)',
  border: '1px solid rgba(245, 194, 107, 0.45)',
  boxShadow: '0 0 25px rgba(245, 194, 107, 0.25), inset 0 1px 0 rgba(245, 194, 107, 0.1)',
};

const SimPhongThuy = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState('');
  const [suffixLength, setSuffixLength] = useState<'4' | '6'>('4');
  const [result, setResult] = useState<{ suffix: string; que: number; hexagram: Hexagram } | null>(null);
  const [error, setError] = useState('');

  // Parse URL params on load
  useEffect(() => {
    const sim = searchParams.get('sim');
    const len = searchParams.get('len');
    
    if (sim && (len === '4' || len === '6')) {
      setInputValue(sim);
      setSuffixLength(len);
      // Auto-lookup
      performLookup(sim, len);
    }
  }, []);

  const performLookup = (input: string, len: '4' | '6') => {
    setError('');
    
    // Extract digits only
    const digits = input.replace(/\D/g, '');
    const requiredLen = parseInt(len);
    
    if (digits.length < requiredLen) {
      setError(`Vui lòng nhập ít nhất ${requiredLen} số để tra cứu ${requiredLen} số cuối.`);
      setResult(null);
      return;
    }
    
    // Get suffix
    const suffix = digits.slice(-requiredLen);
    const n = parseInt(suffix, 10);
    let que = n % 80;
    if (que === 0) que = 80;
    
    const hexagram = HEXAGRAMS[que];
    if (!hexagram) {
      setError('Không tìm thấy quẻ tương ứng.');
      setResult(null);
      return;
    }
    
    setResult({ suffix, que, hexagram });
    
    // Update URL
    setSearchParams({ sim: suffix, len });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(inputValue, suffixLength);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Đã copy link!');
    }).catch(() => {
      toast.error('Không thể copy link');
    });
  };

  // Similar suggestions
  const similarSuggestions = useMemo(() => {
    if (!result) return [];
    return generateSimilarSuggestions(result.suffix, parseInt(suffixLength) as 4 | 6);
  }, [result, suffixLength]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <Header />
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#F7C55A', textShadow: '0 0 12px rgba(247, 197, 90, 0.6)' }}>
              <Sparkles className="w-7 h-7" style={{ color: '#F7C55A' }} />
              Bói 4 Số Đuôi / 6 Số Đuôi SIM
            </h1>
            <p style={{ color: 'rgba(237, 237, 237, 0.65)' }} className="text-sm md:text-base">
              Tra cứu ý nghĩa số đuôi SIM theo 80 quẻ Kinh Dịch
            </p>
          </div>

          {/* Card 1: Input Form */}
          <div className={cardBaseClass} style={cardStyle}>
            <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#EDEDED' }}>
              <Search className="w-5 h-5" style={{ color: '#F7C55A' }} />
              Nhập số cần tra cứu
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Input */}
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="phone" style={{ color: '#EDEDED' }} className="text-sm">
                    Số điện thoại hoặc số đuôi
                  </Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="VD: 0909.123.456 hoặc 3456"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-black/50 border-[rgba(245,194,107,0.3)] text-white placeholder:text-gray-500 focus:border-[#F7C55A] focus:ring-[#F7C55A]/30"
                  />
                  <p style={{ color: 'rgba(237, 237, 237, 0.5)' }} className="text-xs">
                    Có thể nhập 4 số, 6 số, hoặc số điện thoại đầy đủ (có thể có dấu chấm/khoảng trắng)
                  </p>
                </div>

                {/* Suffix Length */}
                <div className="space-y-2">
                  <Label style={{ color: '#EDEDED' }} className="text-sm">Độ dài tra cứu</Label>
                  <Select value={suffixLength} onValueChange={(v) => setSuffixLength(v as '4' | '6')}>
                    <SelectTrigger className="bg-black/50 border-[rgba(245,194,107,0.3)] text-white focus:border-[#F7C55A] focus:ring-[#F7C55A]/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-[rgba(245,194,107,0.3)]">
                      <SelectItem value="4" className="text-white hover:bg-neutral-800">4 số cuối</SelectItem>
                      <SelectItem value="6" className="text-white hover:bg-neutral-800">6 số cuối</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-300 text-sm bg-red-950/50 border border-red-400/50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full md:w-auto text-white border-0"
                style={{ 
                  background: 'linear-gradient(135deg, #ff3b3b, #ff7a18)', 
                  boxShadow: '0 6px 20px rgba(255, 90, 50, 0.45)' 
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Tra cứu
              </Button>
            </form>
          </div>

          {/* Card 2: Result Section */}
          {result && (
            <div className={`${cardBaseClass} mt-6 md:mt-8`} style={cardStyle}>
              {/* Header with Copy Link */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2" style={{ color: '#EDEDED' }}>
                  <Sparkles className="w-5 h-5" style={{ color: '#F7C55A' }} />
                  Kết quả tra cứu
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="bg-black/40 hover:bg-black/60 text-white"
                  style={{ 
                    border: '1px solid rgba(245, 194, 107, 0.45)',
                    boxShadow: '0 0 10px rgba(245, 194, 107, 0.2)'
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" style={{ color: '#F7C55A' }} />
                  Copy link
                </Button>
              </div>

              <div className="space-y-6">
                {/* Result Grid */}
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {/* Suffix Display */}
                  <div 
                    className="text-center p-4 rounded-xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(245, 194, 107, 0.25)'
                    }}
                  >
                    <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Số cuối tra cứu</p>
                    <p className="text-2xl md:text-4xl font-bold tracking-wider" style={{ color: '#F7C55A', textShadow: '0 0 10px rgba(247, 197, 90, 0.6)' }}>{result.suffix}</p>
                  </div>

                  {/* Que Number */}
                  <div 
                    className="text-center p-4 rounded-xl"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(245, 194, 107, 0.25)'
                    }}
                  >
                    <p className="text-xs md:text-sm mb-2" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Quẻ số</p>
                    <p className="text-2xl md:text-4xl font-bold" style={{ color: '#ff6b6b', textShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }}>{result.que}</p>
                  </div>
                </div>

                {/* Hexagram Title - Luận giải */}
                <div 
                  className="rounded-xl p-5"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.06)', 
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(245, 194, 107, 0.25)'
                  }}
                >
                  <p className="text-xs md:text-sm mb-3 text-center" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Luận giải</p>
                  <p className="text-base md:text-lg text-center italic" style={{ color: '#f5f5f5' }}>
                    "{result.hexagram.title}"
                  </p>
                </div>

                {/* Level Badge - Đánh giá */}
                <div className="text-center">
                  <p className="text-xs md:text-sm mb-3" style={{ color: 'rgba(237, 237, 237, 0.65)' }}>Đánh giá</p>
                  <Badge className={`text-sm md:text-base px-5 py-2 border font-semibold ${getLevelBadgeClass(result.hexagram.level)}`}>
                    {result.hexagram.level}
                  </Badge>
                </div>

                {/* Disclaimer */}
                <div className="text-center py-4" style={{ borderTop: '1px solid rgba(245, 194, 107, 0.2)' }}>
                  <p className="text-xs flex items-center justify-center gap-2" style={{ color: 'rgba(237, 237, 237, 0.6)' }}>
                    <AlertCircle className="w-4 h-4" style={{ color: '#F7C55A' }} />
                    Nội dung chỉ mang tính tham khảo, giải trí
                  </p>
                </div>

                {/* Share Button */}
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="text-white border-0"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff3b3b, #ff7a18)', 
                      boxShadow: '0 6px 20px rgba(255, 90, 50, 0.45)' 
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Chia sẻ kết quả
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Similar Suggestions */}
          {result && similarSuggestions.length > 0 && (
            <div className={`${cardBaseClass} mt-6 md:mt-8`} style={cardStyle}>
              <h2 className="text-lg font-semibold mb-5" style={{ color: '#F7C55A', textShadow: '0 0 8px rgba(247, 197, 90, 0.4)' }}>Gợi ý số tương tự</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {similarSuggestions.map((phone, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-3 text-center cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(245, 194, 107, 0.25)'
                    }}
                    onClick={() => {
                      setInputValue(phone);
                      performLookup(phone, suffixLength);
                    }}
                  >
                    <p className="font-mono text-sm" style={{ color: '#F7C55A' }}>{phone}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-4 text-center" style={{ color: 'rgba(237, 237, 237, 0.5)' }}>
                Click vào số để tra cứu. Đây là số gợi ý mô phỏng, không phải số thực trong kho.
              </p>
            </div>
          )}

          {/* Zalo Contact */}
          <div className="my-8 max-w-sm mx-auto">
            <ZaloChatCard />
          </div>

          {/* FAQ Section */}
          <div className={cardBaseClass} style={cardStyle}>
            <h2 className="text-lg font-semibold mb-5" style={{ color: '#F7C55A', textShadow: '0 0 8px rgba(247, 197, 90, 0.4)' }}>Câu hỏi thường gặp</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} style={{ borderColor: 'rgba(245, 194, 107, 0.2)' }}>
                  <AccordionTrigger className="text-left hover:no-underline" style={{ color: '#EDEDED' }}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent style={{ color: 'rgba(237, 237, 237, 0.7)' }}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Disclaimer */}
          <div 
            className="rounded-xl p-5 text-center mt-8"
            style={{ 
              background: 'rgba(255, 255, 255, 0.06)', 
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(245, 194, 107, 0.25)'
            }}
          >
            <p className="text-sm" style={{ color: 'rgba(237, 237, 237, 0.8)' }}>
              <strong style={{ color: '#F7C55A' }}>Lưu ý:</strong> Kết quả bói số đuôi SIM dựa trên 80 quẻ Kinh Dịch, chỉ mang tính chất tham khảo và giải trí. 
              Việc lựa chọn SIM nên kết hợp nhiều yếu tố phong thủy khác như ngũ hành, bát tự, tổng số nút...
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SimPhongThuy;
