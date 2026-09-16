import type { Metadata } from "next";
import Link from "next/link";
import { OptionChain } from "@/components/option-chain/OptionChain";
import { buildMetadata } from "@/lib/seo";
import { INSTRUMENTS } from "@/lib/instruments";

export const metadata: Metadata = buildMetadata({
  title: "Option Chain — Live OI, PCR, Max Pain | NSE Options Intelligence",
  description:
    "Live NIFTY, BANK NIFTY and FINNIFTY option chain with OI, change in OI, IV, Greeks, PCR, Max Pain, support/resistance and unusual-activity detection.",
  path: "/option-chain",
});

export default function OptionChainPage() {
  return (
    <>
      <OptionChain />
      <nav className="mx-auto max-w-6xl px-4 pb-8 text-xs text-neutral-500 sm:px-8">
        Jump to:{" "}
        {INSTRUMENTS.map((i, idx) => (
          <span key={i.slug}>
            {idx > 0 && " · "}
            <Link href={`/option-chain/${i.slug}`} className="underline">
              {i.label} option chain
            </Link>
          </span>
        ))}
      </nav>
    </>
  );
}
