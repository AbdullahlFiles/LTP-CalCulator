import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { INSTRUMENTS } from "@/lib/instruments";
import { GLOSSARY_ENTRIES } from "@/lib/content/glossary";

/**
 * Dynamically generated so it can never drift from the actual route
 * structure (INSTRUMENTS, GLOSSARY_ENTRIES) — a hand-maintained sitemap
 * silently goes stale the moment a page is added or removed. Excludes
 * every user-specific/session-specific route (dashboard, login, register,
 * API routes) per the project rule against indexing private pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/ltp-calculator`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${SITE_URL}/option-chain`, lastModified: now, changeFrequency: "always", priority: 0.9 },
    { url: `${SITE_URL}/charts`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: `${SITE_URL}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const instrumentPages: MetadataRoute.Sitemap = INSTRUMENTS.flatMap((i) => [
    { url: `${SITE_URL}/option-chain/${i.slug}`, lastModified: now, changeFrequency: "always" as const, priority: 0.9 },
    { url: `${SITE_URL}/ltp-calculator/${i.slug}`, lastModified: now, changeFrequency: "always" as const, priority: 0.9 },
  ]);

  const glossaryPages: MetadataRoute.Sitemap = GLOSSARY_ENTRIES.map((entry) => ({
    url: `${SITE_URL}/learn/${entry.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...instrumentPages, ...glossaryPages];
}
