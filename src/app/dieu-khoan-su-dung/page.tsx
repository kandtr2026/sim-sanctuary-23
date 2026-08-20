import type { Metadata } from "next";
import { PolicyArticle, POLICY_DOCS } from "@/components/PolicyArticle";

const doc = POLICY_DOCS["dieu-khoan-su-dung"];
const canonical = `https://www.chonsomobifone.com/${doc.slug}`;

export const metadata: Metadata = {
  title: { absolute: `${doc.title} | CHONSOMOBIFONE.COM` },
  description: doc.description,
  alternates: { canonical },
  openGraph: {
    type: "website",
    url: canonical,
    title: `${doc.title} | CHONSOMOBIFONE.COM`,
    description: doc.description,
  },
};

export default function DieuKhoanSuDungPage() {
  return <PolicyArticle doc={doc} />;
}
