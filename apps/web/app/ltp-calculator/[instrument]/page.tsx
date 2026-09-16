import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LtpCalculator } from "@/components/LtpCalculator";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { getInstrumentBySlug, INSTRUMENTS } from "@/lib/instruments";

export function generateStaticParams() {
  return INSTRUMENTS.map((i) => ({ instrument: i.slug }));
}

export function generateMetadata({ params }: { params: { instrument: string } }): Metadata {
  const instrument = getInstrumentBySlug(params.instrument);
  if (!instrument) return {};
  return buildMetadata({
    title: `${instrument.label} LTP Calculator — Live Price, OI & Greeks | NSE Options Intelligence`,
    description: `Look up the live last traded price, open interest, IV, and Greeks for ${instrument.label} options by strike and expiry.`,
    path: `/ltp-calculator/${instrument.slug}`,
  });
}

export default function InstrumentLtpCalculatorPage({ params }: { params: { instrument: string } }) {
  const instrument = getInstrumentBySlug(params.instrument);
  if (!instrument) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${instrument.label} LTP Calculator`,
          url: `${SITE_URL}/ltp-calculator/${instrument.slug}`,
          applicationCategory: "FinanceApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          description: `Live LTP, OI, IV and Greeks lookup for ${instrument.label} options.`,
        }}
      />
      <LtpCalculator initialInstrument={instrument.symbol} />
    </>
  );
}
