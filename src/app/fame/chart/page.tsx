import type { Metadata } from "next";
import { FameChartPage } from "@/features/fame-chart/components/FameChartPage";

export const metadata: Metadata = {
  title: "$FAME market chart",
  description:
    "FAME price and trading volume on Base. Five-minute candles in USD and ETH.",
};

export default function Page() {
  return <FameChartPage />;
}
