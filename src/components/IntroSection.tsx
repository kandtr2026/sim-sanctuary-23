import { Sparkles, Users, Trophy, Clock } from 'lucide-react';

interface IntroSectionProps {
  /**
   * Live inventory size, passed from the homepage's already-loaded SIM dataset
   * so this costs no extra request. This used to be a hard-coded "50.000+"
   * while the real kho held ~14.000 — exactly the kind of claim that rots
   * silently. It is now whatever the sheet actually contains (49.311 at the
   * time of writing, which is why a fixed number was never going to hold).
   * Omitted or 0 while data loads: the stat renders a neutral dash instead of
   * flashing a wrong number.
   */
  simCount?: number;
}

const IntroSection = ({ simCount = 0 }: IntroSectionProps) => {
  // Round down to a clean thousand so the headline number doesn't visibly tick
  // on every refetch, and suffix "+" to stay honest about the rounding.
  const simLabel =
    simCount > 0 ? `${Math.floor(simCount / 1000).toLocaleString('vi-VN')}.000+` : '—';

  const stats = [
    { Icon: Sparkles, value: simLabel, label: 'SIM số đẹp' },
    { Icon: Users, value: '100.000+', label: 'Khách hàng' },
    { Icon: Trophy, value: '10 Năm', label: 'Kinh nghiệm' },
    // "24h Giao hàng" contradicted the TrustBar's "Ship HCM trong 2-4h" at the
    // very top of the same page. The 2-4h figure is the one sales actually
    // promises, and it also matches step 3 of ProcessSteps.
    { Icon: Clock, value: '2-4h', label: 'Ship HCM' },
  ];

  return (
    <section className="rounded-xl bg-background-secondary p-5 md:p-6">
      {/* Heading + one line of copy. The three-sentence version repeated the
          "kho SIM khổng lồ / giá minh bạch" pitch that the FAQ below already
          answers in detail, and cost ~200px of vertical space on mobile to say
          nothing a visitor could act on. */}
      <div className="mx-auto mb-5 max-w-2xl text-center">
        <h2 className="mb-2 text-xl font-bold text-primary md:text-2xl">
          SIM Số Đẹp - Không Còn Là Đặc Quyền
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Kho SIM MobiFone chính hãng, giá niêm yết công khai, sang tên chính chủ.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ Icon, value, label }) => (
          <div key={label} className="rounded-xl bg-card p-3.5 text-center shadow-soft">
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary-light">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mb-0.5 text-xl font-bold text-gold md:text-2xl">{value}</p>
            <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IntroSection;
