"use client";

import { useState } from 'react';
import CategorySimGrid from '@/components/CategorySimGrid';
import { chuSoCuaHanh, type NguHanh } from '@/lib/phongThuy';

/**
 * Mệnh picker + SIM grid for the phong thủy hợp mệnh page. The mệnh → digit
 * mapping is DERIVED from the site-wide Hà Đồ table (HANH_CUA_CHU_SO in
 * src/lib/phongThuy.ts: 0,1 Thủy · 2,5,8 Thổ · 3,4 Mộc · 6,7 Kim · 9 Hỏa) —
 * never hard-code digits here. Keeping it in one client component means the
 * filter state (which mệnh) can live next to the grid it filters.
 */
const MENH_THU_TU: NguHanh[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

// Module-level (stable references) — CategorySimGrid lists matchLastDigits in its deps.
const MENH_DIGITS: Record<string, string[]> = Object.fromEntries(
  MENH_THU_TU.map((h) => [h, chuSoCuaHanh(h)]),
);

const MENH_LABEL: Record<string, string> = Object.fromEntries(
  MENH_THU_TU.map((h) => [h, `Mệnh ${h} (${MENH_DIGITS[h].join(', ')})`]),
);

const PhongThuyMenhTool = () => {
  const [menh, setMenh] = useState<string | null>(null);

  return (
    <section id="kho-sim">
      <div className="mb-4 flex flex-col gap-3">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          Chọn mệnh của Quý khách
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MENH_LABEL) as string[]).map((m) => (
            <button
              key={m}
              onClick={() => setMenh(m)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                menh === m
                  ? 'border-gold bg-gold/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              {MENH_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {menh
            ? `Đang lọc những số có đuôi hợp ${MENH_LABEL[menh]}. Quý khách có thể kết hợp ô tìm kiếm để khoanh vùng thêm.`
            : 'Quý khách chọn một mệnh để hệ thống lọc những số có đuôi tương sinh.'}
        </p>
      </div>

      <CategorySimGrid
        title={menh ? `Kho Sim Hợp ${MENH_LABEL[menh]}` : 'Kho Sim Hợp Mệnh Cập Nhật'}
        searchPlaceholder="Nhập số cần tìm, hoặc *đuôi để tìm theo số cuối..."
        emptyText="Kho hiện chưa có số hợp mệnh phù hợp. Quý khách vui lòng xem lại sau hoặc liên hệ 0933.686.666 để được tư vấn."
        matchLastDigits={menh ? MENH_DIGITS[menh] : undefined}
      />
    </section>
  );
};

export default PhongThuyMenhTool;
