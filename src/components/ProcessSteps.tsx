import { ChevronRight, Zap } from 'lucide-react';

const ProcessSteps = () => {
  const steps = [
    {
      number: '①',
      title: 'CHỌN SỐ',
      description: 'Chọn sim yêu thích trong kho số.',
    },
    {
      number: '②',
      title: 'ĐẶT HÀNG ONLINE',
      description: 'Điền thông tin đặt hàng online.',
    },
    {
      number: '③',
      title: 'NHẬN SIM TẠI NHÀ',
      description: 'Giao sim tận nhà trong 2-4h (HCM).',
    },
  ];

  return (
    <section className="bg-background-secondary py-8 md:py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8" style={{ color: 'hsl(var(--gold))' }}>
          QUY TRÌNH MUA SIM CHUẨN (3 BƯỚC)
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center w-full md:w-auto">
              <div className="bg-card border border-border rounded-lg p-4 md:p-6 flex-1 md:flex-none md:w-64 shadow-card relative">
                {/* Badge "HỎA TỐC" cho bước 3 */}
                {index === 2 && (
                  <div 
                    className="absolute -top-2 -right-2 md:-top-3 md:-right-3 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold whitespace-nowrap animate-fire-badge"
                    style={{ 
                      background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 50%, #F59E0B 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 0 15px 3px rgba(220, 38, 38, 0.8), 0 0 30px 6px rgba(234, 88, 12, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                      textShadow: '0 0 4px rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      zIndex: 10
                    }}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      <Zap size={10} className="fill-white" />
                      HỎA TỐC
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3 font-bold text-2xl"
                    style={{ 
                      backgroundColor: 'hsl(var(--gold))', 
                      color: 'hsl(var(--background))' 
                    }}
                  >
                    {step.number}
                  </div>
                  <h3 
                    className="text-base md:text-lg font-bold mb-2"
                    style={{ color: 'hsl(var(--gold))' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-foreground/80">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <ChevronRight 
                  className="hidden md:block mx-2 flex-shrink-0" 
                  size={32}
                  style={{ color: 'hsl(var(--gold))' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSteps;
