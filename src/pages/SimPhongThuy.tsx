import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, ShoppingCart, Search, AlertCircle } from 'lucide-react';
import {
  type Menh,
  type Gender,
  type FengShuiInput,
  type FengShuiSimItem,
  fetchFengShuiInventory,
  getFengShuiSuggestions,
  formatPriceVND
} from '@/lib/fengShuiSim';
import { useIsMobile } from '@/hooks/use-mobile';

const MENH_OPTIONS: Menh[] = ['Kim', 'Mộc', 'Thuỷ', 'Hoả', 'Thổ'];
const GENDER_OPTIONS: Gender[] = ['Nam', 'Nữ'];

const networkColors: Record<string, string> = {
  Mobifone: 'bg-primary text-primary-foreground',
  Viettel: 'bg-red-500 text-white',
  Vinaphone: 'bg-blue-500 text-white',
  iTelecom: 'bg-orange-500 text-white',
  Vietnamobile: 'bg-yellow-600 text-white',
  Gmobile: 'bg-green-600 text-white',
};

const SimPhongThuy = () => {
  const isMobile = useIsMobile();
  const [year, setYear] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [menh, setMenh] = useState<Menh | ''>('');
  const [suggestions, setSuggestions] = useState<FengShuiSimItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Fetch inventory
  const { data: inventory, isLoading: isLoadingInventory, error: inventoryError } = useQuery({
    queryKey: ['fengshui-inventory'],
    queryFn: fetchFengShuiInventory,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate
    const yearNum = parseInt(year, 10);
    if (!year || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setValidationError('Vui lòng nhập năm sinh hợp lệ (1900-2100)');
      return;
    }
    if (!gender) {
      setValidationError('Vui lòng chọn giới tính');
      return;
    }
    if (!menh) {
      setValidationError('Vui lòng chọn mệnh');
      return;
    }

    if (!inventory || inventory.length === 0) {
      setValidationError('Không tải được dữ liệu SIM. Vui lòng thử lại.');
      return;
    }

    const input: FengShuiInput = {
      year: yearNum,
      gender: gender as Gender,
      menh: menh as Menh
    };

    const limit = isMobile ? 24 : 40;
    const results = getFengShuiSuggestions(inventory, input, limit);
    setSuggestions(results);
    setHasSearched(true);
  };

  const handleBuyClick = (sim: FengShuiSimItem) => {
    if (sim.url) {
      window.open(sim.url, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8" />
              SIM Phong Thuỷ
            </h1>
            <p className="text-muted-foreground mt-2">
              Tìm SIM số đẹp phù hợp với mệnh của bạn
            </p>
          </div>

          {/* Form Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Nhập thông tin phong thuỷ</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Year Input */}
                  <div className="space-y-2">
                    <Label htmlFor="year">Năm sinh</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="VD: 1990"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      min={1900}
                      max={2100}
                    />
                  </div>

                  {/* Gender Select */}
                  <div className="space-y-2">
                    <Label>Giới tính</Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Menh Select */}
                  <div className="space-y-2">
                    <Label>Mệnh</Label>
                    <Select value={menh} onValueChange={(v) => setMenh(v as Menh)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mệnh" />
                      </SelectTrigger>
                      <SelectContent>
                        {MENH_OPTIONS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Validation Error */}
                {validationError && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {validationError}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isLoadingInventory}
                >
                  {isLoadingInventory ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Gợi ý SIM phù hợp
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">SIM gợi ý theo phong thuỷ</h2>
              {hasSearched && suggestions.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  Tìm thấy {suggestions.length} SIM phù hợp
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Gợi ý chỉ mang tính tham khảo
            </p>

            {/* Loading State */}
            {isLoadingInventory && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Đang tải dữ liệu SIM...</span>
              </div>
            )}

            {/* Error State */}
            {inventoryError && !isLoadingInventory && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
                <p className="text-muted-foreground">Không thể tải dữ liệu SIM. Vui lòng thử lại.</p>
              </div>
            )}

            {/* Empty State - Not searched yet */}
            {!hasSearched && !isLoadingInventory && !inventoryError && (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nhập thông tin phong thuỷ và bấm "Gợi ý SIM phù hợp" để xem kết quả
                </p>
              </div>
            )}

            {/* Empty State - No results */}
            {hasSearched && suggestions.length === 0 && !isLoadingInventory && (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Chưa tìm được SIM phù hợp. Vui lòng liên hệ tư vấn.
                </p>
                <Button variant="outline" asChild>
                  <a href="/">Xem tất cả SIM</a>
                </Button>
              </div>
            )}

            {/* Results Grid */}
            {hasSearched && suggestions.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {suggestions.map((sim) => (
                  <FengShuiSimCard
                    key={sim.id}
                    sim={sim}
                    onBuy={() => handleBuyClick(sim)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// SIM Card Component for Feng Shui page
interface FengShuiSimCardProps {
  sim: FengShuiSimItem;
  onBuy: () => void;
}

const FengShuiSimCard = ({ sim, onBuy }: FengShuiSimCardProps) => {
  // Highlight last 4 digits
  const formatWithHighlight = (phone: string) => {
    const parts = phone.split('.');
    if (parts.length === 3) {
      return (
        <>
          <span className="text-gold">{parts[0]}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-gold">{parts[1]}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-gold-dark font-extrabold gold-glow">{parts[2]}</span>
        </>
      );
    }
    return <span className="text-gold">{phone}</span>;
  };

  const networkColorClass = networkColors[sim.network] || 'bg-gray-500 text-white';

  return (
    <div className="sim-card group">
      {/* Network Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColorClass}`}>
          {sim.network}
        </span>
        {sim.fengShuiScore !== undefined && sim.fengShuiScore > 5 && (
          <span className="badge-vip flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Hợp mệnh
          </span>
        )}
      </div>

      {/* SIM Number */}
      <div className="text-center py-4">
        <p className="sim-number tracking-wider text-lg md:text-xl font-bold">
          {formatWithHighlight(sim.phone)}
        </p>
      </div>

      {/* Tags */}
      {sim.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
          {sim.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge-type text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Price */}
      <div className="text-center mb-4">
        <p className="text-xl md:text-2xl font-bold text-cta">
          {formatPriceVND(sim.price)}
        </p>
      </div>

      {/* CTA Button */}
      <Button
        className="btn-cta w-full flex items-center justify-center gap-2"
        onClick={onBuy}
        disabled={!sim.url}
      >
        <ShoppingCart className="w-4 h-4" />
        <span>MUA NGAY</span>
      </Button>
    </div>
  );
};

export default SimPhongThuy;
