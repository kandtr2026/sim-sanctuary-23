import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { fetchRecentOrders, TICKER_SIZE } from '@/lib/recentOrdersSheet';
import { formatPrice } from '@/lib/simUtils';

// Mask phone: chỉ ẩn 2 số ở vị trí 7 và 8, thêm số 0 đầu, định dạng 4.3.3
// 0799977799 -> 0799.977.**99
const masked = (digits: string): string => {
  let d = digits;
  if (d.length === 9) d = `0${d}`;

  if (d.length >= 8) {
    // Định dạng 4.3.3 trước, rồi ẩn 2 số đầu nhóm cuối
    const p1 = d.slice(0, 4);       // 0799
    const p2 = d.slice(4, 7);       // 977
    const p3 = d.slice(8);          // 99 (bỏ 2 số 7,8)
    return `${p1}.${p2}.**${p3}`;
  }
  return d;
};

const RightSidebar = () => {
  // ONLY real data from Google Sheet - NO mock/fallback
  const [realOrders, setRealOrders] = useState<{ phone: string; time: string; price: string }[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    // Aborted on unmount so a slow sheet-proxy round trip cannot resolve into
    // an unmounted tree.
    const controller = new AbortController();

    const loadRecentOrders = async () => {
      try {
        // Sale price = GIÁ BÁN from Sheet1, joined on SimID. It used to be
        // SIM_SOLD.GiaThu, which is what the shop *pays* — the ticker was
        // publishing 63–75% of the price the same SIMs were still listed at.
        const orders = await fetchRecentOrders(TICKER_SIZE, controller.signal);
        if (controller.signal.aborted) return;

        setRealOrders(
          orders.map((order) => ({
            phone: masked(order.digits),
            time: order.soldLabel || '--',
            price: formatPrice(order.price),
          })),
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('[RightSidebar] Failed to fetch real orders:', err);
        setRealOrders([]); // No mock fallback
      } finally {
        if (!controller.signal.aborted) setOrdersLoading(false);
      }
    };

    loadRecentOrders();

    return () => controller.abort();
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
