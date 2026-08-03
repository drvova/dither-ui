import { GROUPS, SECTIONS, type DocsGroup } from "./groups"

// Per-section search metadata for the docs deep links (`/docs/<id>`). The docs
// render client-side from one HTML entry, so Google's JS renderer is what sees
// the actual page — this module keeps the `<title>`, canonical, description,
// and breadcrumb structured data in sync with the section in view. It is also
// the source for the build-time sitemap (see vite.config.ts).
export const SITE_URL = "https://dither-ui.com"

const SITE_OVERVIEW = "dither-ui — a Vue 3 UI toolkit on one ordered-dither canvas engine."

export const DOCS_ROOT = {
  url: `${SITE_URL}/docs`,
  title: "Vue dither components and chart documentation | dither-ui",
  description:
    "Documentation, live examples, API references, and copy-ready Vue code for dither-ui charts, components, composition, animation, and accessibility.",
}

export interface DocsMeta {
  id: string
  label: string
  url: string
  title: string
  description: string
}

const groupOf = new Map(SECTIONS.map((s) => [s.id, GROUPS.find((g) => g.items.includes(s))]))

export function docsSection(id: string): DocsGroup["items"][number] | undefined {
  return SECTIONS.find((s) => s.id === id)
}

export function docsMeta(id: string): DocsMeta {
  const section = docsSection(id)
  if (!section) return { ...DOCS_ROOT, id: "", label: "Docs" }
  const group = groupOf.get(section.id)?.title ?? ""
  const url = `${SITE_URL}/docs/${section.id}`
  return {
    id: section.id,
    label: section.label,
    url,
    title: `${section.label} | dither-ui`,
    description: `${section.label} — live example, props API, and copy-ready ${
      group === "Overview" || group === "Handbook" || group === "Utils" ? "guide" : "code"
    } in the dither-ui ${group.toLowerCase()} docs. ${SITE_OVERVIEW}`,
  }
}

export function docsBreadcrumb(id: string): string {
  const m = docsMeta(id)
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "dither-ui", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Docs", item: `${SITE_URL}/docs` },
      { "@type": "ListItem", position: 3, name: m.label, item: m.url },
    ],
  })
}