import { ChevronRight } from 'lucide-react';
import fastDeliveryIcon from '@/assets/fast-delivery-icon.png';

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
      <style>{`
        @keyframes fast-glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255, 165, 0, 0.8)) drop-shadow(0 0 8px rgba(255, 100, 0, 0.6));
            opacity: 1;
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255, 165, 0, 1)) drop-shadow(0 0 20px rgba(255, 100, 0, 0.9));
            opacity: 0.95;
          }
        }
        .fast-delivery-glow {
          animation: fast-glow 1.1s ease-in-out infinite;
        }
      `}</style>
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8" style={{ color: 'hsl(var(--gold))' }}>
          QUY TRÌNH MUA SIM CHUẨN (3 BƯỚC)
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center w-full md:w-auto">
              <div className="relative bg-card border border-border rounded-lg p-4 md:p-6 flex-1 md:flex-none md:w-64 shadow-card">
                {index === 2 && (
                  <img
                    src={fastDeliveryIcon}
                    alt="Hỏa tốc"
                    className="fast-delivery-glow absolute -top-3 -right-3 w-16 h-16 md:w-20 md:h-20 pointer-events-none z-10"
                  />
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
