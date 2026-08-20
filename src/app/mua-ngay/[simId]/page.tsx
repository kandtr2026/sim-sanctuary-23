import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

type Props = { params: Promise<{ simId: string }> };

/**
 * Per-SIM order page. Kept out of the index exactly like the old SPA: the
 * route is `ƒ` (dynamic), and the metadata below marks it noindex/nofollow.
 * robots.txt also disallows /mua-ngay/ as a second, independent guard.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { simId } = await params;
  return {
    title: { absolute: `Đặt mua SIM ${simId} | CHONSOMOBIFONE` },
    robots: { index: false, follow: false },
  };
}

export default function CheckoutPage() {
  return <CheckoutClient />;
}
