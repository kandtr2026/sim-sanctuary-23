import { Phone } from 'lucide-react';

const ZALO_URL = "https://zalo.me/0896888666?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n.";
const CALL_URL = "tel:+84938868868";

const FloatingContactButtons = () => {
  return (
    <>
      {/* Scoped keyframes for bounce-pulse animation */}
      <style>{`
        @keyframes floating-bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          }
          25% {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          }
          50% {
            transform: translateY(-1px) scale(1.08);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
          }
          75% {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 7px 16px rgba(0, 0, 0, 0.18);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .floating-contact-btn {
            animation: none !important;
          }
        }
      `}</style>

      {/* Container for both buttons - stacked vertically */}
      <div
        className="fixed flex flex-col items-center"
        style={{
          bottom: 'clamp(16px, 2.5vw, 24px)',
          right: 'clamp(16px, 2.5vw, 24px)',
          zIndex: 9999,
          gap: 'clamp(10px, 1.2vw, 14px)',
        }}
      >
        {/* CALL Button - on top */}
        <a
          href={CALL_URL}
          aria-label="Gọi điện tư vấn"
          className="floating-contact-btn flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{
            width: 'clamp(48px, 4.5vw, 60px)',
            height: 'clamp(48px, 4.5vw, 60px)',
            animation: 'floating-bounce 1.4s ease-in-out infinite',
          }}
        >
          <Phone 
            className="text-white" 
            style={{
              width: 'clamp(24px, 2.4vw, 30px)',
              height: 'clamp(24px, 2.4vw, 30px)',
            }}
          />
        </a>

        {/* ZALO Button - on bottom */}
        <a
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat Zalo"
          className="floating-contact-btn relative flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:ring-offset-2"
          style={{
            width: 'clamp(48px, 4.5vw, 60px)',
            height: 'clamp(48px, 4.5vw, 60px)',
            animation: 'floating-bounce 1.4s ease-in-out infinite 0.2s',
          }}
        >
          {/* Zalo Logo SVG - Blue text with chat bubble */}
          <svg
            viewBox="0 0 48 48"
            style={{
              width: 'clamp(30px, 3vw, 38px)',
              height: 'clamp(30px, 3vw, 38px)',
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
      </div>
    </>
  );
};

export default FloatingContactButtons;
