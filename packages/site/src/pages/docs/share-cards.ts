// The share cards and the head tags that point at them: one table the build
// reads (the crawler files, the section manifest, the install surface) and
// the pages read (each route's own head), so a card's tags are written once.
// Loaded under Node by the configs too, so its imports carry `.ts`.
import { FACTS } from "#dither-facts"
import { SECTIONS } from "./groups.ts"
import { docsBreadcrumb, docsMeta, REPO_URL, SITE_URL } from "./seo.ts"

// Every page the site shares has a card: the three routes and each docs
// section. The build writes each one as `og/<id>.png` (the og:image every
// link preview can show), `og/<id>.gif` (the same card looping, for what
// plays an image: Discord, Slack, a README), `embed/<id>.json` (Discord's
// component embed: the title, the line, the playing card and link buttons,
// which Discord shows in place of the og preview) and `oembed/<id>.json`
// (an oEmbed photo of the playing card, which Slack reads first). Copy
// follows the site's bans: sentence case, no eyebrow, no middle dot or em
// dash, buttons that name where they go.

export interface ShareCard {
  id: string
  url: string
  title: string
  /** The page's description, as its og tags carry it. */
  description: string
  /** What the card shows, for its image's alt text. */
  alt: string
  links: { label: string; url: string }[]
}

/** The route cards (their art is a print of the kit's poster, home's the
 * hero's own; the first link names the card's key). The ids share `og/`
 * with the section ids, so none may be one (the tests hold this). */
export const ROUTE_CARDS = [
  {
    id: "home",
    url: `${SITE_URL}/`,
    title: "dither-ui",
    line: "A dithered UI toolkit for Solid",
    description: `${FACTS.components} Solid components drawn pixel by pixel from one seeded palette, with live docs and a Studio your coding agent can drive. MIT licensed.`,
    links: [
      { label: "Read the docs", url: `${SITE_URL}/docs` },
      { label: "Open the studio", url: `${SITE_URL}/studio` },
      { label: "Source on GitHub", url: REPO_URL },
    ],
  },
  {
    id: "docs",
    url: `${SITE_URL}/docs`,
    title: "Documentation",
    line: "Every component live, with its source and its API",
    description:
      "Explore live Solid examples, API references, component galleries, chart variants, and copy-ready code for dither-ui.",
    links: [
      { label: "Read the quick start", url: `${SITE_URL}/docs/getting-started` },
      { label: "Source on GitHub", url: REPO_URL },
    ],
  },
  {
    id: "studio",
    url: `${SITE_URL}/studio`,
    title: "Studio",
    line: "Compose screens from the kit, or have your agent do it",
    description:
      "Design dithered charts and screens in the browser, export Solid code, images or video, or hand the canvas to your own coding agent.",
    links: [
      { label: "Open the studio", url: `${SITE_URL}/studio` },
      { label: "Read the agent skill", url: `${SITE_URL}/agent/SKILL.md` },
    ],
  },
] as const

export function sectionCard(id: string): ShareCard {
  const meta = docsMeta(id)
  return {
    id,
    url: meta.url,
    title: meta.label,
    description: meta.description,
    alt: `${meta.label} in the dither-ui docs, beside a dithered print of blue, orange and bone tone fields around the kit's diamond`,
    links: [
      { label: "Open the docs", url: meta.url },
      { label: "Source on GitHub", url: REPO_URL },
    ],
  }
}

export function shareCards(): ShareCard[] {
  const routes = ROUTE_CARDS.map((r) => ({
    id: r.id,
    url: r.url,
    title: r.title,
    description: r.description,
    alt: `${r.title} beside a dithered print of blue, orange and bone tone fields around the kit's diamond`,
    links: [...r.links],
  }))
  return [...routes, ...SECTIONS.map((s) => sectionCard(s.id))]
}

/* -------------------------------- head tags ------------------------------- */

/** A tag of a page's head, as data: a page renders it through its own
 * framework, the build writes it as HTML (`tagHtml`). */
export type HeadTag =
  | { tag: "meta" | "link"; attrs: Record<string, string> }
  | { tag: "title"; text: string }
  | { tag: "script"; attrs: Record<string, string>; text: string }

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

/** A head tag as the HTML a static page carries. */
export function tagHtml(t: HeadTag): string {
  if (t.tag === "title") return `<title>${esc(t.text)}</title>`
  const attrs = Object.entries(t.attrs)
    .map(([name, value]) => `${name}="${esc(value)}"`)
    .join(" ")
  return t.tag === "script" ? `<script ${attrs}>${t.text}</script>` : `<${t.tag} ${attrs} />`
}

const meta = (key: "name" | "property", id: string, content: string): HeadTag => ({
  tag: "meta",
  attrs: { [key]: id, content },
})

/** The tags that point a page's previews at its card: the og and X images
 * (the still), Discord's component embed and the oEmbed photo. */
export function shareTags(card: ShareCard): HeadTag[] {
  const still = `${SITE_URL}/og/${card.id}.png`
  return [
    meta("property", "og:image", still),
    meta("property", "og:image:type", "image/png"),
    meta("property", "og:image:width", "1200"),
    meta("property", "og:image:height", "630"),
    meta("property", "og:image:alt", card.alt),
    meta("name", "twitter:image", still),
    meta("name", "twitter:image:alt", card.alt),
    {
      tag: "link",
      attrs: {
        rel: "discord:component-embed",
        type: "application/json",
        href: `${SITE_URL}/embed/${card.id}.json`,
      },
    },
    {
      tag: "link",
      attrs: {
        rel: "alternate",
        type: "application/json+oembed",
        href: `${SITE_URL}/oembed/${card.id}.json`,
        title: card.title,
      },
    },
  ]
}

/** A docs section's own head: its meta, its card's tags and its
 * breadcrumb, all from `seo.ts`. */
export function sectionTags(id: string): HeadTag[] {
  const m = docsMeta(id)
  return [
    { tag: "title", text: m.title },
    meta("name", "description", m.description),
    { tag: "link", attrs: { rel: "canonical", href: m.url } },
    meta("property", "og:type", "article"),
    meta("property", "og:title", m.title),
    meta("property", "og:description", m.description),
    meta("property", "og:url", m.url),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", m.title),
    meta("name", "twitter:description", m.description),
    ...shareTags(sectionCard(id)),
    { tag: "script", attrs: { type: "application/ld+json" }, text: docsBreadcrumb(id) },
  ]
}
