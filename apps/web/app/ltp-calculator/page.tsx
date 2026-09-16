import type { Metadata } from "next";
import { LtpCalculator } from "@/components/LtpCalculator";

export const metadata: Metadata = {
  title: "LTP Calculator — NSE Options Intelligence",
  description:
    "Look up the last traded price, open interest, IV, and Greeks for NIFTY, BANK NIFTY and FINNIFTY options.",
};

export default function LtpCalculatorPage() {
  return <LtpCalculator />;
}
