"use client";

import { useState } from 'react';
import CategorySimGrid from '@/components/CategorySimGrid';

/**
 * Mệnh picker + SIM grid for the phong thủy hợp mệnh page. The mệnh → lucky
 * digit mapping mirrors the static table in page.tsx (both derive from the same
 * ngũ hành tương sinh convention); keeping it in one client component means
 * the filter state (which mệnh) can live next to the grid it filters.
 */
const MENH_DIGITS: Record<string, string[]> = {
  Kim: ['6', '7'],
  Mộc: ['3', '4'],
  Thủy: ['1', '6'],
  Hỏa: ['9'],
  Thổ: ['2', '5', '8'],
};

const MENH_LABEL: Record<string, string> = {
  Kim: 'Mệnh Kim (6, 7)',
  Mộc: 'Mệnh Mộc (3, 4)',
  Thủy: 'Mệnh Thủy (1, 6)',
  Hỏa: 'Mệnh Hỏa (9)',
  Thổ: 'Mệnh Thổ (2, 5, 8)',
};

const PhongThuyMenhTool = () => {
  const [menh, setMenh] = useState<string | null>(null);

  return (
    <section id="kho-sim">
      <div className="mb-4 flex flex-col gap-3">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          Chọn mệnh của bạn
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
            ? `Đang lọc sim có số cuối hợp ${MENH_LABEL[menh]}. Bạn có thể kết hợp với ô tìm kiếm để khoanh vùng thêm.`
            : 'Chọn một mệnh để lọc kho sim có số cuối phù hợp.'}
        </p>
      </div>

      <CategorySimGrid
        title={menh ? `Kho Sim Hợp ${MENH_LABEL[menh]}` : 'Kho Sim Hợp Mệnh Cập Nhật'}
        searchPlaceholder="Nhập số cần tìm hoặc *đuôi để tìm..."
        emptyText="Hiện chưa có sim hợp mệnh phù hợp trong kho. Vui lòng thử lại sau."
        matchLastDigits={menh ? MENH_DIGITS[menh] : undefined}
      />
    </section>
  );
};

export default PhongThuyMenhTool;
