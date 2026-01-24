const ZALO_URL = "https://zalo.me/0901191111?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n.";

type ZaloChatCardProps = { phone?: string; url?: string };

const ZaloChatCard = ({ phone, url }: ZaloChatCardProps) => {
  const digits = (phone || '').replace(/\D/g, '');
  const finalUrl = url || (digits ? `https://zalo.me/${digits}` : ZALO_URL);

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 p-4 rounded-lg bg-black border-2 border-yellow-400 hover:bg-gray-900 transition-colors"
    >
      <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center">
        <span className="text-black font-bold text-lg">Z</span>
      </div>
      <div className="text-left">
        <p className="text-sm text-white">Zalo</p>
        <p className="text-base font-semibold text-white">Chat ngay</p>
      </div>
    </a>
  );
};

export default ZaloChatCard;
