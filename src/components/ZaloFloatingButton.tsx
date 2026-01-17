const ZALO_URL = "https://zalo.me/0896888666?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n.";

const ZaloFloatingButton = () => {
  return (
    <a
      href={ZALO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat Zalo"
      className="fixed flex items-center justify-center bg-[#0068ff] hover:bg-[#0054cc] text-white font-bold rounded-full shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0068ff] focus:ring-offset-2"
      style={{
        width: 'clamp(48px, 4.5vw, 60px)',
        height: 'clamp(48px, 4.5vw, 60px)',
        bottom: 'clamp(16px, 2.5vw, 24px)',
        right: 'clamp(16px, 2.5vw, 24px)',
        zIndex: 9999,
        fontSize: 'clamp(10px, 1.2vw, 14px)',
      }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="currentColor"
        style={{
          width: 'clamp(28px, 2.8vw, 36px)',
          height: 'clamp(28px, 2.8vw, 36px)',
        }}
      >
        <path d="M24 4C12.954 4 4 12.954 4 24c0 5.573 2.274 10.614 5.945 14.24L8.28 43.6a1 1 0 001.36 1.28l6.24-3.12C18.56 43.2 21.2 44 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4zm8.4 26.4c-.36.88-2.08 1.72-2.88 1.8-.72.08-1.6.12-5.2-1.12-4.32-1.48-7.08-5.92-7.28-6.2-.2-.28-1.68-2.24-1.68-4.28s1.04-3.04 1.44-3.48c.36-.4.8-.52 1.08-.52h.8c.24 0 .56-.04.88.68.36.8 1.2 2.92 1.28 3.12.12.24.2.48.04.76-.12.28-.2.44-.4.68-.2.24-.4.52-.6.72-.2.2-.4.44-.16.84.24.4 1.04 1.72 2.24 2.8 1.56 1.36 2.84 1.8 3.28 2 .4.2.64.16.88-.08.24-.28 1-1.16 1.28-1.56.28-.4.52-.32.88-.2.36.16 2.28 1.08 2.68 1.28.4.2.64.28.76.44.08.16.08.92-.28 1.8z"/>
      </svg>
    </a>
  );
};

export default ZaloFloatingButton;
