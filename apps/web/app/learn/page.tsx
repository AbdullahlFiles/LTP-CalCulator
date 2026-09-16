import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { GLOSSARY_ENTRIES } from "@/lib/content/glossary";

export const metadata: Metadata = buildMetadata({
  title: "Learn Options Trading — Glossary & Guides | NSE Options Intelligence",
  description:
    "Plain-language explanations of LTP, Open Interest, PCR, Max Pain, Implied Volatility, Greeks, and how to read an NSE option chain.",
  path: "/learn",
});

export default function LearnIndexPage() {
  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Learn</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Plain-language guides to the concepts behind the tools — no jargon left undefined.
      </p>
      <ul className="mt-6 space-y-4">
        {GLOSSARY_ENTRIES.map((entry) => (
          <li key={entry.slug} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <Link href={`/learn/${entry.slug}`} className="text-lg font-medium hover:underline">
              {entry.term}
            </Link>
            <p className="mt-1 text-sm text-neutral-500">{entry.metaDescription}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
