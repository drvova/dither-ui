// Every page's head, from one table: what a crawler, a link preview and a
// search result read of the landing, the docs and the Studio, and of each
// docs section (`sectionTags`, the list the section manifest writes).
// `PageHead` renders a page's tags; the shell (`entry-server.tsx`) reads
// `pageOf` for the page an address opens on.
import { FACTS } from "#dither-facts"
import { docsSection } from "@/pages/docs/seo"
import { type HeadTag, sectionTags, shareCards, shareTags } from "@/pages/docs/share-cards"
import { ROUTE_TITLES, type RouteName } from "@/shared/config/titles"

/** A page with an address of its own (the missing page has none). */
export type SitePage = Exclude<RouteName, "missing">

/** The docs' breadcrumb's id in the head. */
export const BREADCRUMB_ID = "docs-breadcrumb"

const SITE = { "@type": "WebSite", name: "dither-ui", url: "https://dither-ui.com/" }
const FREE = { "@type": "Offer", price: "0", priceCurrency: "USD" }
const APP = { "@type": "SoftwareApplication", applicationCategory: "DeveloperApplication" }

/** What each page says of itself: its share card, its description for a
 * search result, for a link preview (`og`, the card's own unless given) and
 * for X (`x`, the preview's unless given), and its structured data (which
 * also takes the page's URL and, an application, its card). */
const PAGES: Record<
  SitePage,
  { card: string; description: string; keywords?: string; og?: string; x?: string; data: Record<string, unknown> }
> = {
  landing: {
    card: "home",
    description: `dither-ui is a Solid UI toolkit of ${FACTS.components} components drawn pixel by pixel from one seeded palette: charts, controls, forms, overlays, backgrounds, text effects, 3D models and shaders. A live docs section for every component and a Studio your coding agent can drive. MIT licensed.`,
    keywords:
      "dither, dithering, Solid, SolidJS, UI toolkit, component library, charts, canvas, pixel art, ordered dither, Bayer, seed-generative, shadcn, Base UI, data visualization",
    data: {
      ...APP,
      name: "dither-ui",
      description: `A Solid UI toolkit of ${FACTS.components} components drawn pixel by pixel from one seeded palette, with live docs and a Studio your coding agent can drive.`,
      operatingSystem: "Web",
      license: "https://opensource.org/licenses/MIT",
      author: { "@type": "Organization", name: "dither-ui" },
      offers: FREE,
    },
  },
  docs: {
    card: "docs",
    description:
      "Documentation, live examples, API references, and copy-ready Solid code for dither-ui charts, components, composition, animation, and accessibility.",
    x: "Live Solid examples, API references, chart variants, and copy-ready code for dither-ui.",
    data: {
      "@type": "TechArticle",
      headline: "dither-ui documentation",
      description: "Documentation and live examples for dither-ui Solid charts and components.",
      isPartOf: SITE,
      about: { ...APP, name: "dither-ui" },
    },
  },
  studio: {
    card: "studio",
    description:
      "Arrange, configure, preview, and export dither-ui Solid charts and components on an infinite canvas with direct manipulation, layers, and contextual properties.",
    og: "Build dithered Solid interfaces on an infinite canvas, then export working component code.",
    x: "Arrange, configure, preview, and export dithered Solid charts and components on an infinite canvas.",
    data: {
      ...APP,
      name: "dither-ui Studio",
      description: "An infinite-canvas editor for composing and exporting dither-ui Solid charts and components.",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: FREE,
    },
  },
}

const meta = (key: "name" | "property", id: string, content: string): HeadTag => ({
  tag: "meta",
  attrs: { [key]: id, content },
})

/** What every indexed page says: whose it is, and that it may be indexed. */
const INDEXED: HeadTag[] = [meta("name", "author", "dither-ui"), meta("name", "robots", "index, follow")]

/** A page's head: a docs section's own when `section` names one, the
 * page's otherwise. The missing page has only its title (it says itself
 * that it is not indexed). */
export function pageTags(page: RouteName, section = ""): HeadTag[] {
  if (page === "missing") return [{ tag: "title", text: ROUTE_TITLES.missing }]
  if (page === "docs" && docsSection(section))
    return [
      ...sectionTags(section).map((t) => (t.tag === "script" ? { ...t, attrs: { ...t.attrs, id: BREADCRUMB_ID } } : t)),
      ...INDEXED,
    ]
  const row = PAGES[page]
  const card = shareCards().find((c) => c.id === row.card)!
  const title = ROUTE_TITLES[page]
  const og = row.og ?? card.description
  const data: Record<string, unknown> = { "@context": "https://schema.org", ...row.data, url: card.url }
  if (data["@type"] === APP["@type"]) data.image = `https://dither-ui.com/og/${card.id}.png`
  return [
    { tag: "title", text: title },
    meta("name", "description", row.description),
    ...(row.keywords ? [meta("name", "keywords", row.keywords)] : []),
    ...INDEXED,
    { tag: "link", attrs: { rel: "canonical", href: card.url } },
    meta("property", "og:type", "website"),
    meta("property", "og:site_name", "dither-ui"),
    meta("property", "og:title", title),
    meta("property", "og:description", og),
    meta("property", "og:url", card.url),
    ...shareTags(card),
    meta("property", "og:locale", "en_US"),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", row.x ?? og),
    { tag: "script", attrs: { type: "application/ld+json" }, text: JSON.stringify(data) },
  ]
}

/** Addresses of the build that are no page of the site: the player and the
 * share cards' renderer carry none of the site's head. */
const NOT_SITE = ["/play", "/og"]

/** Whether a page sets type in the display face, so the shell fetches the
 * face with its HTML: the landing, the docs and the missing page do; the
 * Studio sets none, and a preload a page never uses is a fetch wasted on
 * every load (the browser warns of it once the page has loaded). */
export const DISPLAY_FACE: Record<RouteName, boolean> = {
  landing: true,
  docs: true,
  missing: true,
  studio: false,
}

/** Whether a page turns with the reader's theme, so the shell sets the
 * stored one on the root before the first paint (`THEME_HEAD_SCRIPT`):
 * the docs and the Studio do; the landing and the missing page are
 * printed in the dark, always. Without it a reader in light met the
 * prerendered dark until the app mounted. */
export const TURNS_WITH_THEME: Record<RouteName, boolean> = {
  landing: false,
  docs: true,
  missing: false,
  studio: true,
}

/** The page an app path (`appPathname`) opens on, as the routes resolve
 * it: a docs address is the docs only when its section exists, and any
 * other address none of the pages own is the missing page. `null` for an
 * address that is no page of the site. */
export function pageOf(path: string): RouteName | null {
  const at = path.replace(/\/(index\.html)?$/, "") || "/"
  if (NOT_SITE.some((p) => at === p || at.startsWith(`${p}/`))) return null
  if (at === "/") return "landing"
  if (at === "/studio" || at === "/docs") return at === "/docs" ? "docs" : "studio"
  const section = /^\/docs\/([^/]+)$/.exec(at)?.[1]
  return section && docsSection(section) ? "docs" : "missing"
}
