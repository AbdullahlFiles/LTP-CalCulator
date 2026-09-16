import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OptionChain } from "@/components/option-chain/OptionChain";
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
    title: `${instrument.label} Option Chain — Live OI, PCR, Max Pain | NSE Options Intelligence`,
    description: `Live ${instrument.label} option chain with Open Interest, Change in OI, IV, Greeks, PCR, Max Pain, support/resistance, and AI-assisted market explanations.`,
    path: `/option-chain/${instrument.slug}`,
  });
}

export default function InstrumentOptionChainPage({ params }: { params: { instrument: string } }) {
  const instrument = getInstrumentBySlug(params.instrument);
  if (!instrument) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${instrument.label} Option Chain`,
          url: `${SITE_URL}/option-chain/${instrument.slug}`,
          applicationCategory: "FinanceApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          description: `Live option chain analytics for ${instrument.label}: OI, PCR, Max Pain, Greeks and AI-assisted explanations.`,
        }}
      />
      <OptionChain initialInstrument={instrument.symbol} />
    </>
  );
}
