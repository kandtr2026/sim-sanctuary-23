import type { Metadata } from "next";
import { PrefixArticle, prefixDescription, prefixTitle } from "@/app/tin-tuc/_components/PrefixArticle";

const config = {
  prefix: "0707",
  oldPrefix: "01207",
  network: "MobiFone" as const,
  meaningNote: "Dải 0707 dễ nhớ vì có cặp 07 lặp lại ở đầu số, phù hợp với khách thích cấu trúc gọn, hiện đại và giá thường mềm hơn các đầu 090/093 cổ điển.",
};
const PATH = "/tin-tuc/0707-la-mang-gi";

export const metadata: Metadata = {
  title: { absolute: prefixTitle(config) },
  description: prefixDescription(config),
  alternates: { canonical: `https://www.chonsomobifone.com${PATH}` },
  openGraph: { type: "article", title: prefixTitle(config), description: prefixDescription(config), url: `https://www.chonsomobifone.com${PATH}` },
};

export default function Page() {
  return <PrefixArticle config={config} />;
}
