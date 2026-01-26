import { Phone } from "lucide-react";

const ZALO_URL =
  "https://zalo.me/0901191111?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n.";
const CALL_URL = "tel:+84938868868";

const MESSENGER_FALLBACK_URL =
  "https://m.me/111745910591052?ref=Ch%C3%A0o%20shop%2C%20t%C3%B4i%20c%E1%BA%A7n%20t%C6%B0%20v%E1%BA%A5n%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p";

const handleOpenMessengerChat = (e: React.MouseEvent) => {
  e.preventDefault();
  const opened = window.__openMessengerChat?.() === true;
  if (!opened) {
    window.open(MESSENGER_FALLBACK_URL, "_blank", "noopener,noreferrer");
  }
  // Show quick templates panel
  window.__showMessengerTemplates?.();
};

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

      {/* Container for all buttons - stacked vertically */}
      <div
        className="fixed flex flex-col items-center"
        style={{
          bottom: "clamp(16px, 2.5vw, 24px)",
          right: "clamp(16px, 2.5vw, 24px)",
          zIndex: 9999,
          gap: "clamp(10px, 1.2vw, 14px)",
        }}
      >
        {/* MESSENGER Button - on top */}
        <button
          onClick={handleOpenMessengerChat}
          aria-label="Chat Messenger"
          className="floating-contact-btn flex items-center justify-center rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0084ff] focus:ring-offset-2"
          style={{
            width: "clamp(48px, 4.5vw, 60px)",
            height: "clamp(48px, 4.5vw, 60px)",
            animation: "floating-bounce 1.4s ease-in-out infinite",
            background: "linear-gradient(135deg, #0084ff 0%, #00c6ff 100%)",
          }}
        >
          {/* Messenger Logo SVG */}
          <svg
            viewBox="0 0 24 24"
            fill="white"
            style={{
              width: "clamp(26px, 2.6vw, 34px)",
              height: "clamp(26px, 2.6vw, 34px)",
            }}
          >
            <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.26.35.27.57l.05 1.78c.04.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.53-.06.91.25 1.87.38 2.9.38 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.73l-2.88 4.57c-.46.73-1.44.91-2.13.4l-2.29-1.72a.54.54 0 00-.65 0l-3.09 2.35c-.41.31-.95-.18-.68-.62l2.88-4.57c.46-.73 1.44-.91 2.13-.4l2.29 1.72a.54.54 0 00.65 0l3.09-2.35c.41-.31.95.18.68.62z" />
          </svg>
        </button>

        {/* CALL Button - middle */}
        <a
          href={CALL_URL}
          aria-label="Gọi điện tư vấn"
          onClick={() => {
            (window as any).gtag?.("event", "click_call", {
              event_category: "contact",
              event_label: "floating_call",
              phone_number: CALL_URL.replace("tel:", ""),
            });
          }}
          className="floating-contact-btn flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          style={{
            width: "clamp(48px, 4.5vw, 60px)",
            height: "clamp(48px, 4.5vw, 60px)",
            animation: "floating-bounce 1.4s ease-in-out infinite 0.1s",
          }}
        >
          <Phone
            className="text-white"
            style={{
              width: "clamp(24px, 2.4vw, 30px)",
              height: "clamp(24px, 2.4vw, 30px)",
            }}
          />
        </a>

        {/* ZALO Button - on bottom */}
        <a
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat Zalo"
          onClick={() => {
            (window as any).gtag?.("event", "click_zalo", {
              event_category: "contact",
              event_label: "floating_zalo",
            });
          }}
          className="floating-contact-btn relative flex items-center justify-center bg-white hover:bg-gray-50 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:ring-offset-2"
          style={{
            width: "clamp(48px, 4.5vw, 60px)",
            height: "clamp(48px, 4.5vw, 60px)",
            animation: "floating-bounce 1.4s ease-in-out infinite 0.2s",
          }}
        >
          {/* Zalo Logo SVG - Blue text with chat bubble */}
          <svg
            viewBox="0 0 48 48"
            style={{
              width: "clamp(30px, 3vw, 38px)",
              height: "clamp(30px, 3vw, 38px)",
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
              style={{ letterSpacing: "-0.5px" }}
            >
              Zalo
            </text>
          </svg>

          {/* Red notification dot */}
          <span
            className="absolute bg-red-500 rounded-full border-2 border-white"
            style={{
              width: "clamp(10px, 1.2vw, 14px)",
              height: "clamp(10px, 1.2vw, 14px)",
              top: "clamp(2px, 0.4vw, 4px)",
              right: "clamp(2px, 0.4vw, 4px)",
            }}
          />
        </a>
      </div>
    </>
  );
};

export default FloatingContactButtons;
