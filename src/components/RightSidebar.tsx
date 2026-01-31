import { Phone, AlertCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import ZaloChatCard from '@/components/ZaloChatCard';

const SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';
const SHEET1_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
const SIM_SOLD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=SIM_SOLD`;

// Normalize string: lowercase, remove accents, remove spaces
const norm = (s: any): string =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, "")
    .trim();

// Parse gviz response to array of objects
const gvizToObjects = (text: string): Record<string, string>[] => {
  try {
    // Remove wrapper: google.visualization.Query.setResponse({...})
    const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonStr);
    
    const cols = data.table.cols || [];
    const rows = data.table.rows || [];
    
    // Get headers - use label, fallback to id, fallback to col index
    const headers = cols.map((c: any, i: number) => {
      const label = c.label || c.id || '';
      return label.trim() || `col${i}`;
    });
    
    return rows.map((row: any) => {
      const obj: Record<string, string> = {};
      (row.c || []).forEach((cell: any, i: number) => {
        const header = headers[i];
        if (header) {
          obj[header] = cell?.v != null ? String(cell.v).trim() : '';
        }
      });
      return obj;
    });
  } catch (err) {
    console.error('[gvizToObjects] Parse error:', err);
    return [];
  }
};

// Find key in object keys that matches normalized pattern
const findKey = (keys: string[], pattern: string): string | undefined => {
  return keys.find(k => norm(k).includes(pattern));
};

// Mask phone: 0799515759 -> 0799****59
const masked = (digits: string): string => {
  if (digits.length >= 6) return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
  if (digits.length >= 4) return `${digits.slice(0, 2)}****${digits.slice(-1)}`;
  return digits;
};

// Format NgayBan to dd/MM/yyyy (Vietnamese format)
function formatSoldDate(v: any): string {
  if (v == null) return "";

  // 1) gviz often returns string like: "Date(2026,0,22)" or "Date(2026, 0, 22, 0, 0, 0)"
  const asString = String(v).trim();
  const m = asString.match(/Date\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})(?:\s*,\s*(\d{1,2}))?(?:\s*,\s*(\d{1,2}))?(?:\s*,\s*(\d{1,2}))?\s*\)/i);
  if (m) {
    const yy = parseInt(m[1], 10);
    const mm0 = parseInt(m[2], 10); // 0-based month from gviz
    const dd = parseInt(m[3], 10);

    // Build date safely
    const mm = mm0 + 1; // convert to 1-based
    const DD = String(dd).padStart(2, "0");
    const MM = String(mm).padStart(2, "0");
    return `${DD}/${MM}/${yy}`;
  }

  // 2) If it's a Date object
  if (v instanceof Date && !isNaN(v.getTime())) {
    const dd = String(v.getDate()).padStart(2, "0");
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const yy = v.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  // 3) If it's already dd/mm/yyyy or dd/mm/yyyy hh:mm → keep
  if (/^\d{1,2}\/\d{1,2}\/\d{4}(\s+\d{1,2}:\d{2})?$/.test(asString)) {
    // normalize to dd/MM/yyyy
    const [dPart] = asString.split(" ");
    const [d, mo, y] = dPart.split("/");
    const DD = String(parseInt(d, 10)).padStart(2, "0");
    const MM = String(parseInt(mo, 10)).padStart(2, "0");
    const rest = asString.includes(" ") ? " " + asString.split(" ").slice(1).join(" ") : "";
    return `${DD}/${MM}/${y}${rest}`;
  }

  // 4) If it's M/D/YYYY from Sheets (rare when gviz doesn't wrap)
  const parts = asString.split("/");
  if (parts.length === 3) {
    const A = parseInt(parts[0], 10);
    const B = parseInt(parts[1], 10);
    const Y = parts[2].trim();
    if (!isNaN(A) && !isNaN(B) && /^\d{4}$/.test(Y)) {
      // assume M/D/YYYY (google sheets common)
      const DD = String(B).padStart(2, "0");
      const MM = String(A).padStart(2, "0");
      return `${DD}/${MM}/${Y}`;
    }
  }

  // 5) Final fallback: try Date parse
  const d = new Date(asString);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  return asString;
}

const RightSidebar = () => {
  // ONLY real data from Google Sheet - NO mock/fallback
  const [realOrders, setRealOrders] = useState<{ phone: string; time: string }[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const fetchRealOrders = async () => {
      try {
        // Fetch both sheets in parallel
        const [sheet1Res, soldRes] = await Promise.all([
          fetch(SHEET1_URL),
          fetch(SIM_SOLD_URL)
        ]);
        
        if (!sheet1Res.ok || !soldRes.ok) {
          console.error('[RightSidebar] HTTP error:', sheet1Res.status, soldRes.status);
          setRealOrders([]);
          setOrdersLoading(false);
          return;
        }
        
        const [sheet1Text, soldText] = await Promise.all([
          sheet1Res.text(),
          soldRes.text()
        ]);
        
        const sheet1Rows = gvizToObjects(sheet1Text);
        const soldRows = gvizToObjects(soldText);
        
        // Get keys from first row of each sheet
        const sheet1Keys = Object.keys(sheet1Rows[0] ?? {});
        const soldKeys = Object.keys(soldRows[0] ?? {});
        
        console.log("[RightSidebar] sheet1 keys:", sheet1Keys);
        console.log("[RightSidebar] sold keys:", soldKeys);
        
        // Find matching keys using normalized comparison
        // Sheet1: simIdKey = contains "simid", msisdnKey = contains "sothuebao"
        const simIdKey = findKey(sheet1Keys, "simid");
        const msisdnKey = findKey(sheet1Keys, "sothuebao");
        
        // SIM_SOLD: soldSimIdKey = contains "sothuebao" (this column contains SimID values like SIM036...)
        const soldSimIdKey = findKey(soldKeys, "sothuebao");
        // Detect NgayBan column for sale date
        const soldDateKey = findKey(soldKeys, "ngayban");
        
        console.log("[RightSidebar] detected keys:", { simIdKey, msisdnKey, soldSimIdKey, soldDateKey });
        
        if (!simIdKey || !msisdnKey || !soldSimIdKey) {
          console.error("[RightSidebar] Missing required keys!", { simIdKey, msisdnKey, soldSimIdKey });
          setRealOrders([]);
          setOrdersLoading(false);
          return;
        }
        
        // Build map: SimID -> phone digits from Sheet1
        const simIdToDigits = new Map<string, string>();
        for (const r of sheet1Rows) {
          const simid = String(r[simIdKey] ?? "").trim();
          const raw = String(r[msisdnKey] ?? "");
          const digits = raw.replace(/\D/g, "");
          if (simid && digits) {
            simIdToDigits.set(simid, digits);
          }
        }
        
        console.log("[RightSidebar] simIdToDigits map size:", simIdToDigits.size);
        
        // Build orders by joining: SIM_SOLD.SoThueBao -> Sheet1.SimID -> Sheet1.SỐ THUÊ BAO
        const built: { phone: string; time: string }[] = [];
        
        for (const r of soldRows) {
          const soldSimId = String(r[soldSimIdKey] ?? "").trim(); // e.g. "SIM036227"
          const digits = simIdToDigits.get(soldSimId);
          
          if (!digits) {
            // Skip if we can't find the real phone number
            continue;
          }
          
          // Get NgayBan (sale date) from SIM_SOLD
          const rawDate = soldDateKey ? r[soldDateKey] : "";
          const dateLabel = formatSoldDate(rawDate);
          
          built.push({ 
            phone: masked(digits), 
            time: dateLabel || "--"
          });
        }
        
        // Sort by NgayBan (newest first)
        if (soldDateKey) {
          built.sort((a, b) => {
            // parse dd/MM/yyyy -> timestamp
            const parseVN = (s: string) => {
              const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || "");
              if (!m) return 0;
              const dd = parseInt(m[1], 10);
              const mm = parseInt(m[2], 10);
              const yy = parseInt(m[3], 10);
              return new Date(yy, mm - 1, dd).getTime();
            };
            return parseVN(b.time) - parseVN(a.time);
          });
        }
        
        // Limit to 8 items (already sorted by date)
        const limited = built.slice(0, 8);
        
        console.log("[RightSidebar] orders built:", limited.length, "from", soldRows.length, "sold rows");
        
        // Log first few for verification
        if (limited.length > 0) {
          console.log("[RightSidebar] sample orders:", limited.slice(0, 3));
        }
        
        // Set real orders (even if empty - no mock fallback)
        setRealOrders(limited);
        
      } catch (err) {
        console.error('[RightSidebar] Failed to fetch real orders:', err);
        setRealOrders([]); // No mock fallback
      } finally {
        setOrdersLoading(false);
      }
    };
    
    fetchRealOrders();
  }, []);

  // Use ONLY real orders - never mock data
  const orders = realOrders;

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
