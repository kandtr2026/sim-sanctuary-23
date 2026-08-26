import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';
const SHEET1_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
const SIM_SOLD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=SIM_SOLD`;

// Normalize string: lowercase, remove accents, remove spaces
const norm = (s: unknown): string =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, "")
    .trim();

/**
 * Shape of the Google Visualization API response. Only the fields this parser
 * reads are declared; gviz sends more (formatted values, types, row labels)
 * and everything is optional because a blank sheet omits most of it.
 */
interface GvizResponse {
  table?: {
    cols?: { label?: string; id?: string }[];
    rows?: { c?: ({ v?: unknown } | null)[] }[];
  };
}

// Parse gviz response to array of objects
const gvizToObjects = (text: string): Record<string, string>[] => {
  try {
    // Remove wrapper: google.visualization.Query.setResponse({...})
    const jsonStr = text.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonStr) as GvizResponse;

    const cols = data.table?.cols || [];
    const rows = data.table?.rows || [];

    // Get headers - use label, fallback to id, fallback to col index
    const headers = cols.map((c, i) => {
      const label = c.label || c.id || '';
      return label.trim() || `col${i}`;
    });

    return rows.map((row) => {
      const obj: Record<string, string> = {};
      (row.c || []).forEach((cell, i) => {
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

// Mask phone: chỉ ẩn 2 số ở vị trí 7 và 8 -> 079951**59
const masked = (digits: string): string => {
  if (digits.length >= 8) return `${digits.slice(0, 6)}**${digits.slice(8)}`;
  if (digits.length >= 6) return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
  if (digits.length >= 4) return `${digits.slice(0, 2)}****${digits.slice(-1)}`;
  return digits;
};

// Format NgayBan to dd/MM/yyyy (Vietnamese format)
function formatSoldDate(v: unknown): string {
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
  const [realOrders, setRealOrders] = useState<{ phone: string; time: string; price: string }[]>([]);
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

        // Find matching keys using normalized comparison
        // Sheet1: simIdKey = contains "simid", msisdnKey = contains "sothuebao"
        const simIdKey = findKey(sheet1Keys, "simid");
        const msisdnKey = findKey(sheet1Keys, "sothuebao");

        // SIM_SOLD: soldSimIdKey = contains "sothuebao" (this column contains SimID values like SIM036...)
        const soldSimIdKey = findKey(soldKeys, "sothuebao");
        // Detect NgayBan column for sale date
        const soldDateKey = findKey(soldKeys, "ngayban");
        // Detect GiaThu column for sale price
        const soldPriceKey = findKey(soldKeys, "giathu");

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

        // Build orders by joining: SIM_SOLD.SoThueBao -> Sheet1.SimID -> Sheet1.SỐ THUÊ BAO
        const built: { phone: string; time: string; price: string }[] = [];
        
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
          
          // Get GiaThu (sale price) from SIM_SOLD, format as VND
          let priceLabel = "Liên hệ";
          if (soldPriceKey) {
            const rawPrice = String(r[soldPriceKey] ?? "").replace(/\D/g, "");
            if (rawPrice) {
              const num = parseInt(rawPrice, 10);
              if (!isNaN(num) && num > 0) {
                priceLabel = `${num.toLocaleString("vi-VN")}đ`;
              }
            }
          }
          
          built.push({ 
            phone: masked(digits), 
            time: dateLabel || "--",
            price: priceLabel
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
      {/* The "TƯ VẤN ONLINE" card that used to sit here was removed: hotline +
          Zalo + Messenger, all three of which FloatingContactButtons already
          keeps permanently on screen, plus the header and footer copies. Six
          contact affordances rendered at once on desktop. "ĐƠN HÀNG GẦN ĐÂY"
          stays — it is real social proof from the SIM_SOLD sheet and nothing
          else on the page duplicates it. */}

      {/* Recent Orders */}
      <div className="bg-card rounded-xl shadow-card border border-border p-5">
        <h3 className="section-title flex items-center gap-2">
          <Clock className="w-5 h-5" />
          ĐƠN HÀNG GẦN ĐÂY
        </h3>
        
        <div className="space-y-2">
          {ordersLoading ? (
            // Skeleton rows — previously this block rendered nothing while the
            // sheet request was in flight, so the panel showed a bare heading.
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-2 p-3 rounded-lg bg-background-secondary"
              >
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-muted" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <span className="h-3 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))
          ) : orders.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground text-center">
              Chưa có đơn hàng nào được cập nhật.
            </p>
          ) : (
            orders.map((order, index) => (
              <div
                key={`${order.phone}-${index}`}
                className="order-item flex items-center justify-between gap-2 p-3 rounded-lg bg-background-secondary"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Stacked, not side-by-side. The sidebar is a fixed 220px, which
                    leaves this row 178px — too narrow for a masked number plus
                    "Đã đặt (dd/MM/yyyy)". Side-by-side either overflowed the
                    sidebar (giving the whole document a horizontal scroll) or
                    truncated the date to an ellipsis. The card heading already
                    says ĐƠN HÀNG GẦN ĐÂY, so the date needs no "Đã đặt" prefix. */}
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium leading-tight text-foreground">{order.phone}</span>
                  <span className="text-xs leading-tight text-muted-foreground">{order.time}</span>
                  <span className="text-sm font-semibold leading-tight text-primary">{order.price}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
