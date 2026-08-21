import { ChevronRight, Zap } from 'lucide-react';

const steps = [
  { number: '1', title: 'CHỌN SỐ', description: 'Chọn sim trong kho số.' },
  { number: '2', title: 'ĐẶT HÀNG', description: 'Điền thông tin online.' },
  { number: '3', title: 'NHẬN SIM', description: 'Giao tận nhà 2-4h (HCM).', urgent: true },
];

/**
 * Three-step "how to buy" strip.
 *
 * Deliberately small. This used to be 610px tall on mobile (stacked cards with
 * p-5 and py-6 section padding) and sat *above* the SIM grid, which pushed the
 * first SIM card to 1.6 screens down. It now renders below the grid, because
 * "how to buy" only matters once a visitor has found a number worth buying.
 *
 * No `container mx-auto px-4` wrapper here: Index already renders this inside
 * its own container, and the old nested one double-padded the content.
 */
const ProcessSteps = () => {
  return (
    <section className="my-6">
      <h2 className="mb-3 text-center text-sm font-bold text-gold md:text-base">
        QUY TRÌNH MUA SIM (3 BƯỚC)
      </h2>

      {/* One row at every breakpoint. On mobile the three steps share the width
          evenly (items-stretch keeps the cards the same height even when one
          description wraps to two lines); the chevrons only appear from sm up,
          where there is room for them. */}
      <ol className="mx-auto flex max-w-3xl list-none items-stretch justify-center gap-1.5 sm:gap-2">
        {steps.map((step, index) => (
          <li key={step.number} className="flex flex-1 items-center">
            <div className="relative flex-1 rounded-lg border border-border/60 bg-card px-2 py-2.5 text-center">
              {step.urgent && (
                <span
                  // right-0, not -right-1: on the last card a negative offset
                  // pushed the badge 3px past the <ol> and got it clipped at
                  // 375px. Kept -top-2 since there is vertical room above.
                  className="absolute right-0 -top-2 z-10 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold md:text-[10px]"
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #F59E0B 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 0 10px 2px rgba(220, 38, 38, 0.7)',
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <span className="inline-flex items-center gap-0.5">
                    <Zap size={9} className="fill-white" />
                    HỎA TỐC
                  </span>
                </span>
              )}

              <div className="flex items-center justify-center gap-1.5">
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'hsl(var(--gold))', color: 'hsl(var(--background))' }}
                >
                  {step.number}
                </span>
                <h3 className="text-[11px] font-bold text-gold md:text-sm">{step.title}</h3>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-foreground/70 md:text-xs">
                {step.description}
              </p>
            </div>

            {index < steps.length - 1 && (
              <ChevronRight
                className="mx-0.5 hidden flex-shrink-0 text-gold sm:block"
                size={16}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

export default ProcessSteps;
