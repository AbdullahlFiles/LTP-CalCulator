import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { getGlossaryEntry, GLOSSARY_ENTRIES } from "@/lib/content/glossary";

export function generateStaticParams() {
  return GLOSSARY_ENTRIES.map((e) => ({ slug: e.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = getGlossaryEntry(params.slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.title,
    description: entry.metaDescription,
    path: `/learn/${entry.slug}`,
    type: "article",
  });
}

export default function GlossaryEntryPage({ params }: { params: { slug: string } }) {
  const entry = getGlossaryEntry(params.slug);
  if (!entry) notFound();

  const relatedEntries = entry.relatedTerms
    .map((slug) => getGlossaryEntry(slug))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: entry.title,
          description: entry.metaDescription,
          url: `${SITE_URL}/learn/${entry.slug}`,
          publisher: { "@type": "Organization", name: "NSE Options Intelligence" },
        }}
      />
      <nav className="text-xs text-neutral-500">
        <Link href="/learn" className="underline">
          Learn
        </Link>{" "}
        / {entry.term}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold">{entry.title}</h1>

      <article className="mt-6 text-sm leading-relaxed">
        {entry.sections.map((section, i) => (
          <section key={i} className="mt-4">
            {section.heading && <h2 className="text-base font-semibold">{section.heading}</h2>}
            {section.paragraphs.map((p, j) => (
              <p key={j} className="mt-2 text-neutral-700 dark:text-neutral-300">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>

      {entry.relatedTools.length > 0 && (
        <div className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs font-medium text-neutral-500">Try it live</div>
          <ul className="mt-2 space-y-1 text-sm">
            {entry.relatedTools.map((tool) => (
              <li key={tool.href}>
                <Link href={tool.href} className="underline">
                  {tool.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedEntries.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium text-neutral-500">Related terms</div>
          <ul className="mt-2 flex flex-wrap gap-2 text-sm">
            {relatedEntries.map((related) => (
              <li key={related.slug}>
                <Link
                  href={`/learn/${related.slug}`}
                  className="rounded-full border border-neutral-300 px-3 py-1 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  {related.term}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
