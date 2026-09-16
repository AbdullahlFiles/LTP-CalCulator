import type { Metadata } from "next";
import { HistoricalCharts } from "@/components/charts/HistoricalCharts";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Historical Charts — NSE Options Intelligence",
  description:
    "Historical LTP, Open Interest, Volume, IV, PCR and Max Pain charts for NIFTY, BANK NIFTY and FINNIFTY options.",
  path: "/charts",
});

export default function ChartsPage() {
  return <HistoricalCharts />;
}
