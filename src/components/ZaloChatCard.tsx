// Link Zalo sạch — Zalo không nhận ?text prefill (ra lỗi "page doesn't exist", #24).
const ZALO_URL = "https://zalo.me/0933686666";

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
