import type { Metadata } from "next";
import { PrefixArticle, prefixDescription, prefixTitle } from "@/app/tin-tuc/_components/PrefixArticle";

const config = {
  prefix: "0706",
  oldPrefix: "01206",
  network: "MobiFone" as const,
  meaningNote: "Đầu số 0706 thường được chọn vì dễ đọc, thuộc nhóm đầu 070 MobiFone sau chuyển đổi. Khi mua nên ưu tiên đuôi số hợp nhu cầu hơn là chỉ nhìn riêng đầu số.",
};
const PATH = "/tin-tuc/0706-la-mang-gi";

export const metadata: Metadata = {
  title: { absolute: prefixTitle(config) },
  description: prefixDescription(config),
  alternates: { canonical: `https://www.chonsomobifone.com${PATH}` },
  openGraph: { type: "article", title: prefixTitle(config), description: prefixDescription(config), url: `https://www.chonsomobifone.com${PATH}` },
};

export default function Page() {
  return <PrefixArticle config={config} />;
}
