/**
 * Renders a JSON-LD block server-side. `data` must come only from this
 * codebase (page copy, fixed schema shape) — never from unsanitized user
 * input — since it's serialized straight into a <script> tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
