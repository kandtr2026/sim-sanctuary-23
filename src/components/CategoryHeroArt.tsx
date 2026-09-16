/**
 * Trang trí hero cho các trang category SIM (góp ý #36: thay banner đỏ trơn bằng
 * hình hợp chủ đề cho "đàng hoàng hơn").
 *
 * Là SVG thuần, đặt phủ kín hero (absolute inset-0), aria-hidden + pointer-events
 * none nên không ảnh hưởng nội dung/đọc màn hình. Chủ đề chung "lộc – vàng" hợp
 * mọi dòng sim số đẹp: đồng xu vàng, thỏi vàng, tia sáng, và SỐ MAY đặc trưng của
 * từng category (thần tài 39/79, lộc phát 68/86…) làm hoạ tiết chìm.
 *
 * Bố cục cố ý dồn hoạ tiết đậm sang phải/đáy để chữ (căn giữa) vẫn dễ đọc; số chìm
 * đặt bên trái, mờ. Tông vàng nổi trên nền gradient đỏ của hero.
 */

const GOLD = "#F5B301";
const GOLD_LIGHT = "#FCD34D";

function Coin({ x, y, r, opacity = 1 }: { x: number; y: number; r: number; opacity?: number }) {
  const hole = r * 0.42;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <circle r={r} fill={GOLD} opacity={0.9} />
      <circle r={r} fill="none" stroke={GOLD_LIGHT} strokeWidth={r * 0.06} />
      <circle r={r * 0.78} fill="none" stroke={GOLD_LIGHT} strokeWidth={r * 0.03} opacity={0.7} />
      {/* lỗ vuông kiểu đồng xu cổ */}
      <rect x={-hole / 2} y={-hole / 2} width={hole} height={hole} rx={hole * 0.15} fill="none" stroke={GOLD_LIGHT} strokeWidth={r * 0.05} />
    </g>
  );
}

function Sparkle({ x, y, s, opacity = 1 }: { x: number; y: number; s: number; opacity?: number }) {
  // Ngôi sao 4 cánh (kim cương thon) — tia sáng lấp lánh.
  return (
    <path
      transform={`translate(${x} ${y})`}
      d={`M0 ${-s} C ${s * 0.18} ${-s * 0.18} ${s * 0.18} ${-s * 0.18} ${s} 0 C ${s * 0.18} ${s * 0.18} ${s * 0.18} ${s * 0.18} 0 ${s} C ${-s * 0.18} ${s * 0.18} ${-s * 0.18} ${s * 0.18} ${-s} 0 C ${-s * 0.18} ${-s * 0.18} ${-s * 0.18} ${-s * 0.18} 0 ${-s} Z`}
      fill={GOLD_LIGHT}
      opacity={opacity}
    />
  );
}

export default function CategoryHeroArt({ numerals = [] }: { numerals?: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="chaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="chaIngot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOLD_LIGHT} />
            <stop offset="100%" stopColor={GOLD} />
          </linearGradient>
        </defs>

        {/* Quầng sáng vàng góc phải */}
        <circle cx="1010" cy="150" r="300" fill="url(#chaGlow)" />

        {/* Số may đặc trưng — hoạ tiết chìm bên trái */}
        {numerals.length > 0 && (
          <text
            x="70"
            y="330"
            fontFamily="Arial, sans-serif"
            fontSize="260"
            fontWeight="900"
            fill="none"
            stroke={GOLD_LIGHT}
            strokeWidth="2"
            opacity="0.12"
          >
            {numerals[0]}
          </text>
        )}
        {numerals.length > 1 && (
          <text
            x="250"
            y="150"
            fontFamily="Arial, sans-serif"
            fontSize="150"
            fontWeight="900"
            fill={GOLD}
            opacity="0.08"
          >
            {numerals[1]}
          </text>
        )}

        {/* Cụm đồng xu + thỏi vàng góc phải */}
        <g opacity="0.92">
          {/* thỏi vàng (trapezoid bo góc) */}
          <path
            d="M905 330 L1035 330 Q1050 330 1046 316 L1028 268 Q1024 258 1010 258 L930 258 Q916 258 912 268 L894 316 Q890 330 905 330 Z"
            fill="url(#chaIngot)"
            opacity="0.85"
          />
          <Coin x={1040} y={168} r={78} />
          <Coin x={928} y={210} r={58} opacity={0.95} />
          <Coin x={1108} y={250} r={40} opacity={0.85} />
        </g>

        {/* Tia sáng rải rác */}
        <Sparkle x={840} y={90} s={22} opacity={0.9} />
        <Sparkle x={1150} y={120} s={14} opacity={0.8} />
        <Sparkle x={880} y={300} s={12} opacity={0.7} />
        <Sparkle x={620} y={60} s={10} opacity={0.5} />
        <Sparkle x={980} y={360} s={16} opacity={0.6} />
      </svg>
    </div>
  );
}
