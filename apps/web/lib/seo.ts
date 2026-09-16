import type { Metadata } from "next";

/**
 * No real production domain exists yet — this falls back to localhost so
 * dev/build never breaks, but every deployment MUST set
 * NEXT_PUBLIC_SITE_URL to the real domain (see .env.example). Canonical
 * URLs, the sitemap, and Open Graph tags are all wrong without it.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "NSE LTP Calculator + Options Intelligence";

export interface PageSeoInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}

/**
 * The one place page metadata gets built, so canonical/OG/Twitter tags
 * stay consistent across every page instead of being hand-assembled per
 * route. Every indexable page in this app should build its `metadata`
 * export through this function (see docs/phase-9/README.md).
 */
export function buildMetadata({ title, description, path, type = "website" }: PageSeoInput): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** For pages that must never be indexed (user-specific, session-specific). */
export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
