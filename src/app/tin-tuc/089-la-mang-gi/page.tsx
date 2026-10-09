import type { Metadata } from "next";
import { PrefixArticle, prefixDescription, prefixTitle } from "@/app/tin-tuc/_components/PrefixArticle";

const config = {
  prefix: "089",
  network: "MobiFone" as const,
  simPath: "/sim-dau-so/089",
  meaningNote: "089 là đầu số MobiFone 10 chữ số được nhiều khách thích vì ngắn, dễ nhớ và có số 9 ở đầu dải. Khi chọn SIM 089, nên kết hợp thêm đuôi tam hoa, lộc phát, thần tài hoặc năm sinh.",
};
const PATH = "/tin-tuc/089-la-mang-gi";

export const metadata: Metadata = {
  title: { absolute: prefixTitle(config) },
  description: prefixDescription(config),
  alternates: { canonical: `https://www.chonsomobifone.com${PATH}` },
  openGraph: { type: "article", title: prefixTitle(config), description: prefixDescription(config), url: `https://www.chonsomobifone.com${PATH}` },
};

export default function Page() {
  return <PrefixArticle config={config} />;
}
