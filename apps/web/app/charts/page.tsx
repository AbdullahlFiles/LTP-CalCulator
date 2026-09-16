import type { Metadata } from "next";
import { HistoricalCharts } from "@/components/charts/HistoricalCharts";

export const metadata: Metadata = {
  title: "Historical Charts — NSE Options Intelligence",
  description:
    "Historical LTP, Open Interest, Volume, IV, PCR and Max Pain charts for NIFTY, BANK NIFTY and FINNIFTY options.",
};

export default function ChartsPage() {
  return <HistoricalCharts />;
}
