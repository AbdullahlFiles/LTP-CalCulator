import type { Metadata } from "next";
import Link from "next/link";
import { LtpCalculator } from "@/components/LtpCalculator";
import { buildMetadata } from "@/lib/seo";
import { INSTRUMENTS } from "@/lib/instruments";

export const metadata: Metadata = buildMetadata({
  title: "LTP Calculator — NSE Options Intelligence",
  description:
    "Look up the last traded price, open interest, IV, and Greeks for NIFTY, BANK NIFTY and FINNIFTY options.",
  path: "/ltp-calculator",
});

export default function LtpCalculatorPage() {
  return (
    <>
      <LtpCalculator />
      <nav className="mx-auto max-w-4xl px-4 pb-8 text-xs text-neutral-500 sm:px-8">
        Jump to:{" "}
        {INSTRUMENTS.map((i, idx) => (
          <span key={i.slug}>
            {idx > 0 && " · "}
            <Link href={`/ltp-calculator/${i.slug}`} className="underline">
              {i.label} LTP calculator
            </Link>
          </span>
        ))}
      </nav>
    </>
  );
}
