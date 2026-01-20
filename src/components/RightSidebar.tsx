import { Phone, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import ZaloChatCard from '@/components/ZaloChatCard';

const recentOrdersData = [
  { phone: '0909***888', time: '09:15' },
  { phone: '0936***666', time: '09:12' },
  { phone: '0903***979', time: '09:08' },
  { phone: '0907***123', time: '09:05' },
  { phone: '0935***688', time: '09:01' },
  { phone: '0909***886', time: '08:55' },
  { phone: '0938***397', time: '08:50' },
  { phone: '0901***567', time: '08:45' },
];

const RightSidebar = () => {
  const [orders, setOrders] = useState(recentOrdersData);

  // Simulate new orders coming in
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => {
        const newOrder = {
          phone: `09${Math.floor(Math.random() * 90 + 10)}***${Math.floor(Math.random() * 900 + 100)}`,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        return [newOrder, ...prev.slice(0, 7)];
      });
    }, 30000); // New order every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="space-y-6">
      {/* Online Sales */}
      <div className="bg-card rounded-xl shadow-card border border-border p-5">
        <h3 className="section-title">TƯ VẤN ONLINE</h3>
        
        <div className="space-y-3">
          {/* Hotline */}
          <a
            href="tel:+84938868868"
            className="flex items-center gap-3 p-4 rounded-lg bg-black border-2 border-yellow-400 hover:bg-gray-900 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
              <Phone className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-sm text-white">Hotline</p>
              <p className="text-lg font-bold text-white">
                0938.868.868
              </p>
            </div>
          </a>

          {/* Zalo */}
          <ZaloChatCard />

          {/* Chat tư vấn - Messenger */}
          <button
            onClick={(e) => {
              e.preventDefault();
              const opened = window.__openMessengerChat?.() === true;
              if (!opened) {
                window.open('https://m.me/111745910591052?ref=Ch%C3%A0o%20shop%2C%20t%C3%B4i%20c%E1%BA%A7n%20t%C6%B0%20v%E1%BA%A5n%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p', '_blank', 'noopener,noreferrer');
              }
              window.__showMessengerTemplates?.();
            }}
            className="w-full flex items-center gap-3 p-4 rounded-lg bg-black border-2 border-yellow-400 hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
              {/* Messenger icon SVG */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-black">
                <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.53-.06.91.25 1.87.38 2.9.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.73l-2.88 4.57c-.46.73-1.44.91-2.13.4l-2.29-1.72a.54.54 0 00-.65 0l-3.09 2.35c-.41.31-.95-.18-.68-.62l2.88-4.57c.46-.73 1.44-.91 2.13-.4l2.29 1.72a.54.54 0 00.65 0l3.09-2.35c.41-.31.95.18.68.62z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm text-white">Tư vấn viên</p>
              <p className="text-base font-semibold text-white">Chat tư vấn</p>
            </div>
          </button>

          {/* Khiếu nại */}
          <button className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-border hover:border-primary transition-colors">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Khiếu nại / Góp ý</span>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl shadow-card border border-border p-5">
        <h3 className="section-title flex items-center gap-2">
          <Clock className="w-5 h-5" />
          ĐƠN HÀNG GẦN ĐÂY
        </h3>
        
        <div className="space-y-2">
          {orders.map((order, index) => (
            <div
              key={`${order.phone}-${index}`}
              className="order-item flex items-center justify-between p-3 rounded-lg bg-background-secondary"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
                <span className="font-medium text-foreground">{order.phone}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Đã đặt ({order.time})
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
