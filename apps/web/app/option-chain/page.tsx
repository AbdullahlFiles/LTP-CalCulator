import type { Metadata } from "next";
import { OptionChain } from "@/components/option-chain/OptionChain";

export const metadata: Metadata = {
  title: "Option Chain — NSE Options Intelligence",
  description:
    "Live NIFTY, BANK NIFTY and FINNIFTY option chain with OI, change in OI, IV, Greeks, PCR, Max Pain, support/resistance and unusual-activity detection.",
};

export default function OptionChainPage() {
  return <OptionChain />;
}
