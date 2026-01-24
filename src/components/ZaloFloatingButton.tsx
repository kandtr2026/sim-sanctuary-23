const ZALO_URL = "https://zalo.me/0901191111?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n.";

const ZaloFloatingButton = () => {
  return (
    <>
      {/* Scoped keyframes for pulse animation */}
      <style>{`
        @keyframes zalo-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 14px rgba(0, 104, 255, 0.3);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 6px 20px rgba(0, 104, 255, 0.45);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .zalo-floating-btn {
            animation: none !important;
          }
        }
      `}</style>
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo"
        className="zalo-floating-btn fixed flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:ring-offset-2"
        style={{
          width: 'clamp(52px, 5vw, 64px)',
          height: 'clamp(52px, 5vw, 64px)',
          bottom: 'clamp(16px, 2.5vw, 24px)',
          right: 'clamp(16px, 2.5vw, 24px)',
          zIndex: 9999,
          animation: 'zalo-pulse 2.5s ease-in-out infinite',
        }}
      >
        {/* Zalo Logo SVG - Blue text with chat bubble */}
        <svg
          viewBox="0 0 48 48"
          style={{
            width: 'clamp(32px, 3.2vw, 42px)',
            height: 'clamp(32px, 3.2vw, 42px)',
          }}
        >
          {/* Chat bubble background */}
          <path
            d="M24 4C12.954 4 4 12.954 4 24c0 5.573 2.274 10.614 5.945 14.24L8.28 43.6a1 1 0 001.36 1.28l6.24-3.12C18.56 43.2 21.2 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4z"
            fill="#0068ff"
          />
          {/* Zalo text */}
          <text
            x="24"
            y="28"
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
            style={{ letterSpacing: '-0.5px' }}
          >
            Zalo
          </text>
        </svg>

        {/* Red notification dot */}
        <span
          className="absolute bg-red-500 rounded-full border-2 border-white"
          style={{
            width: 'clamp(10px, 1.2vw, 14px)',
            height: 'clamp(10px, 1.2vw, 14px)',
            top: 'clamp(2px, 0.4vw, 4px)',
            right: 'clamp(2px, 0.4vw, 4px)',
          }}
        />
      </a>
    </>
  );
};

export default ZaloFloatingButton;
