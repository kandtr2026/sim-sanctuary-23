import { Phone, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import ZaloChatCard from '@/components/ZaloChatCard';

const SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';
const SHEET1_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
const SIM_SOLD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=SIM_SOLD`;

// Parse gviz response to array of objects
const parseGvizResponse = (text: string): Record<string, string>[] => {
  // Remove wrapper: google.visualization.Query.setResponse({...})
  const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);
  
  const cols = data.table.cols.map((c: any) => c.label || c.id || '');
  const rows = data.table.rows || [];
  
  return rows.map((row: any) => {
    const obj: Record<string, string> = {};
    row.c?.forEach((cell: any, i: number) => {
      const header = cols[i];
      if (header) {
        obj[header] = cell?.v != null ? String(cell.v).trim() : '';
      }
    });
    return obj;
  });
};

// Format phone: 0799515759 -> 0799****59
const formatPhone = (digits: string): string => {
  const d = digits.replace(/\D/g, '');
  if (d.length < 6) return d;
  return d.slice(0, 4) + '****' + d.slice(-2);
};

// Parse time from NgayBan if available
const parseTime = (dateStr: string): string => {
  if (!dateStr) return '';
  // Try to extract HH:mm from various formats
  const match = dateStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return '';
};

const RightSidebar = () => {
  const [orders, setOrders] = useState<{ phone: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealOrders = async () => {
      try {
        // Fetch both sheets in parallel
        const [sheet1Res, soldRes] = await Promise.all([
          fetch(SHEET1_URL),
          fetch(SIM_SOLD_URL)
        ]);
        
        const [sheet1Text, soldText] = await Promise.all([
          sheet1Res.text(),
          soldRes.text()
        ]);
        
        const sheet1Data = parseGvizResponse(sheet1Text);
        const soldData = parseGvizResponse(soldText);
        
        // Build map: SimID -> phone digits from Sheet1
        const simIdToPhone = new Map<string, string>();
        sheet1Data.forEach((row) => {
          const simId = (row['SimID'] || '').trim().toUpperCase();
          // Try multiple possible column names for phone number
          const phone = row['SỐ THUÊ BAO'] || row['SỐ THUÊ BAO CHUẨN'] || row['SO THUE BAO'] || '';
          const digits = phone.replace(/\D/g, '');
          if (simId && digits) {
            simIdToPhone.set(simId, digits);
          }
        });
        
        // Map SIM_SOLD to real orders
        const realOrders: { phone: string; time: string; date?: Date }[] = [];
        
        soldData.forEach((row) => {
          const soThueBao = (row['SoThueBao'] || row['SOTHUEBAO'] || '').trim().toUpperCase();
          const ngayBan = row['NgayBan'] || row['NGAYBAN'] || '';
          
          const phoneDigits = simIdToPhone.get(soThueBao);
          if (phoneDigits) {
            realOrders.push({
              phone: formatPhone(phoneDigits),
              time: parseTime(ngayBan) || '',
              date: ngayBan ? new Date(ngayBan) : undefined
            });
          }
        });
        
        // Sort by date if available (newest first), otherwise reverse to get latest entries
        realOrders.sort((a, b) => {
          if (a.date && b.date) return b.date.getTime() - a.date.getTime();
          if (a.date) return -1;
          if (b.date) return 1;
          return 0;
        });
        
        // If no dates parsed, reverse to get latest entries from bottom of sheet
        const hasAnyDate = realOrders.some(o => o.date);
        const ordersToShow = hasAnyDate ? realOrders : [...realOrders].reverse();
        
        // Take first 8 and format
        const finalOrders = ordersToShow.slice(0, 8).map(o => ({
          phone: o.phone,
          time: o.time
        }));
        
        if (finalOrders.length > 0) {
          setOrders(finalOrders);
        }
      } catch (err) {
        console.error('[RightSidebar] Failed to fetch real orders:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRealOrders();
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
