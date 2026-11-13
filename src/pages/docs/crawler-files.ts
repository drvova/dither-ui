import { GROUPS, SECTIONS } from "./groups.ts"
import { docsBreadcrumb, docsMeta, REPO_URL, SITE_URL } from "./seo.ts"
import { sectionTags, type ShareCard, tagHtml } from "./share-cards.ts"

export { ROUTE_CARDS, sectionCard, type ShareCard, shareCards } from "./share-cards.ts"

// The crawler-surface files (`sitemap.xml`, `robots.txt`, `llms.txt`) are
// generated at build time from the same GROUPS/SITE_URL
// sources the app renders, so section renames or removals can never rot a
// sitemap entry or an llms.txt link — a dead reference fails the build.
// These render functions are node-side only (the build's config + tests); the
// app never imports this module. The config loads it under Node's own
// TypeScript, so this module and its graph (groups, seo, the *-nav packs)
// write relative imports with `.ts`.

const REPO_SVELTE_URL = `${REPO_URL}/tree/master/dither-kit-svelte`

const docsUrl = (id: string): string => {
  if (!SECTIONS.some((s) => s.id === id))
    throw new Error(
      `crawler-files.ts: missing docs section "${id}" referenced by a crawl file — ` +
        "add it to a *-nav.ts pack and spread it into GROUPS.",
    )
  return `${SITE_URL}/docs/${id}`
}

/* ------------------------------- robots.txt ------------------------------ */

// Explicit allow-all: the site is public/MIT, nothing is restricted, and the
// named AI-crawler blocks make that open posture intentional rather than
// implied by the wildcard.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "bingbot",
] as const

export function robotsTxt(): string {
  const named = AI_CRAWLERS.map((a) => `User-agent: ${a}\nAllow: /`).join("\n\n")
  return [
    "# dither-ui: everything on this site is public and MIT licensed; no paths",
    "# are restricted. The named AI-crawler allows below make that open posture",
    "# explicit and intentional (the wildcard already permits all crawlers), so",
    "# the policy stays correct if defaults are ever tightened. See also the",
    "# LLM-facing index at /llms.txt.",
    "",
    named,
    "",
    "User-agent: *",
    "Allow: /",
    "# /og/ holds the share cards the meta tags point at, which every link",
    "# preview must be able to fetch (X's bot obeys this file), beside the",
    "# renderer that draws them, which is no page to index.",
    "Disallow: /og/$",
    "Disallow: /og/index.html",
    "Disallow: /og/sections.json",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n")
}

/* ----------------------- sections manifest (og engine) -------------------- */

// The SEO engine's data contract: one JSON record per docs section, consumed
// by the post-build (og images, each section's embed), by the
// /og/ renderer itself and by the Discord service. Same single source as
// the sitemap — meta derives from seo.ts's docsMeta/docsBreadcrumb, never a
// reimplementation. `head` is the section page's whole head block (its
// meta, its card's tags and its breadcrumb), so the prerender only places it.
export interface SectionRecord {
  id: string
  label: string
  group: string
  url: string
  title: string
  description: string
  breadcrumb: string
  head: string
}

export function sectionsManifest(): string {
  return JSON.stringify(
    SECTIONS.map((s): SectionRecord => {
      const meta = docsMeta(s.id)
      const group = GROUPS.find((g) => g.items.some((i) => i.id === s.id))?.title ?? "Docs"
      const breadcrumb = docsBreadcrumb(s.id)
      const head = sectionTags(s.id).map(tagHtml).join("\n    ")
      return { ...meta, group, breadcrumb, head }
    }),
  )
}

/* ------------------------------ share cards ------------------------------- */

// The cards themselves, and the head tags that point at them, are
// `share-cards.ts` (the pages read those too); here, the files a card ships.

/** Discord's component embed for a card: one Container holding the title
 * and description, the playing card and its links (link buttons only, as
 * component embeds allow), with no accent bar (the printed look draws no
 * side line). Under Discord's 3,000 byte cap. */
export function componentEmbed(card: ShareCard): string {
  const group = GROUPS.find((g) => g.items.some((i) => i.id === card.id))?.title
  const note = group ? `${group}, in the dither-ui docs` : "dither-ui.com"
  return JSON.stringify({
    component: {
      type: 17,
      components: [
        { type: 10, content: `## ${card.title}\n${card.description}\n-# ${note}` },
        { type: 12, items: [{ media: { url: `${SITE_URL}/og/${card.id}.gif` }, description: card.alt }] },
        { type: 1, components: card.links.map((l) => ({ type: 2, style: 5, label: l.label, url: l.url })) },
      ],
    },
  })
}

/** An oEmbed photo of the playing card, its still as the thumbnail. */
export function oembed(card: ShareCard): string {
  return JSON.stringify({
    version: "1.0",
    type: "photo",
    title: card.title === "dither-ui" ? card.title : `${card.title} | dither-ui`,
    url: `${SITE_URL}/og/${card.id}.gif`,
    width: 1200,
    height: 630,
    provider_name: "dither-ui",
    provider_url: `${SITE_URL}/`,
    thumbnail_url: `${SITE_URL}/og/${card.id}.png`,
    thumbnail_width: 1200,
    thumbnail_height: 630,
  })
}

/* ------------------------------ sitemap.xml ------------------------------- */

export function sitemapXml(): string {
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0" },
    { loc: `${SITE_URL}/docs`, priority: "0.9" },
    { loc: `${SITE_URL}/studio`, priority: "0.8" },
    ...SECTIONS.map((s) => ({ loc: docsUrl(s.id), priority: "0.7" })),
  ]
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    ),
    "</urlset>",
    "",
  ].join("\n")
}

/* -------------------------------- llms.txt -------------------------------- */

// Curated, not exhaustive: llmstxt.org specifies a hand-picked index of the
// pages an LLM needs, titled `Optional` once the context gets large. URLs are
// derived through docsUrl() so every docs link is validated against GROUPS.

const LLMS_SUMMARY =
  "dither-ui is a Solid UI toolkit (plus a Svelte 5 port, dither-kit-svelte) rendered on one " +
  "ordered-dither canvas engine: composable area, line, bar, pie, radar and sparkline charts, " +
  "55+ Base UI-parity components, generative backgrounds, text and animation effects, all " +
  "seed-generative, MIT licensed, and free to use."

interface LlmsLink {
  title: string
  href: string
  desc: string
}

interface LlmsGroup {
  title: string
  links: LlmsLink[]
}

const LLMS_GROUPS: LlmsGroup[] = [
  {
    title: "Getting started",
    links: [
      {
        title: "Quick start",
        href: docsUrl("getting-started"),
        desc: "Copy the kit folder, install the four runtime dependencies, alias it, and render the first component.",
      },
      {
        title: "Landing page",
        href: `${SITE_URL}/`,
        desc: "Product overview, the dither identity, and links into docs and studio.",
      },
      {
        title: "GitHub repository",
        href: REPO_URL,
        desc: "Full source for both kits (dither-kit for Solid, dither-kit-svelte for Svelte 5), benchmarks, and this site.",
      },
    ],
  },
  {
    title: "Charts",
    links: [
      {
        title: "Area chart",
        href: docsUrl("area"),
        desc: "Composable stacked or percent area chart with gradient, dotted, and hatched variants.",
      },
      {
        title: "Line chart",
        href: docsUrl("line"),
        desc: "Multi-series line chart with dither fill, seeds, and sparkle effects.",
      },
      { title: "Bar chart", href: docsUrl("bar"), desc: "Grouped or stacked bars with dither textures." },
      { title: "Pie chart", href: docsUrl("pie"), desc: "Seed-generative pie and donut with legend and tooltips." },
      { title: "Radar chart", href: docsUrl("radar"), desc: "Multi-line radar with per-series colors." },
      { title: "Sparkline", href: docsUrl("sparkline"), desc: "Tiny inline canvas sparkline, seed-driven." },
    ],
  },
  {
    title: "Components",
    links: [
      {
        title: "Button",
        href: docsUrl("button"),
        desc: "Gradient, dotted, hatched, and solid fills with pixel bloom.",
      },
      { title: "Avatar", href: docsUrl("avatar"), desc: "Seed-generative pixel portraits with reaction emotes." },
      { title: "Gradient", href: docsUrl("gradient"), desc: "Bayer-faded background wash in four directions." },
      { title: "Image", href: docsUrl("image"), desc: "Ordered-dithers any image into chunky cells." },
      {
        title: "Form controls",
        href: docsUrl("switch"),
        desc: "Switch, checkbox, slider, and progress with unified field states.",
      },
      {
        title: "Fields and selection",
        href: docsUrl("input"),
        desc: "Inputs, textareas, selects, comboboxes, radios, and toggles.",
      },
      {
        title: "Overlays and menus",
        href: docsUrl("dialog"),
        desc: "Dialogs, drawers, popovers, context menus, tooltips, and command palettes.",
      },
      {
        title: "Structure and layout",
        href: docsUrl("tabs"),
        desc: "Tabs, collapsibles, shells, rails, consoles, grids, and infinite canvas.",
      },
      {
        title: "Navigation and data",
        href: docsUrl("sidebar"),
        desc: "Sidebars, nav menus, breadcrumbs, pagination, and tables.",
      },
    ],
  },
  {
    title: "Backgrounds, text, and animations",
    links: [
      {
        title: "Backgrounds",
        href: docsUrl("aurora"),
        desc: "Full-bleed generative canvas surfaces: aurora, waves, plasma, dark veil, particles.",
      },
      {
        title: "Text",
        href: docsUrl("gradient-text"),
        desc: "DOM and CSS text effects: gradient, shiny, glitch, split, scramble, ASCII.",
      },
      {
        title: "Animations",
        href: docsUrl("animated-content"),
        desc: "Motion and interaction effects: reveals, borders, cursors, magnets.",
      },
    ],
  },
  {
    title: "Handbook",
    links: [
      { title: "Styling", href: docsUrl("styling"), desc: "Theme tokens, colors, and the dither design language." },
      {
        title: "Seeds",
        href: docsUrl("seeds"),
        desc: "How one integer drives texture, motion, and color deterministically.",
      },
      {
        title: "Animation",
        href: docsUrl("motion"),
        desc: "The dither entrance, replay tokens, and reduced-motion support.",
      },
      {
        title: "Accessibility",
        href: docsUrl("accessibility"),
        desc: "Labels, focus rings, and reduced-motion and reduced-transparency floors.",
      },
    ],
  },
  {
    title: "Studio",
    links: [
      {
        title: "Studio",
        href: `${SITE_URL}/studio`,
        desc: "Infinite-canvas editor to compose, configure, and export dither-ui charts and components as code.",
      },
    ],
  },
  {
    title: "Agents",
    links: [
      {
        title: "Studio skill",
        href: `${SITE_URL}/agent/SKILL.md`,
        desc: "How a coding agent (Claude Code, Codex, pi, omp, any harness) composes dither-ui screens and charts as Studio documents, offline or against a live Studio tab.",
      },
      {
        title: "Component registry",
        href: `${SITE_URL}/agent/registry.json`,
        desc: "Machine-readable registry: every placeable component with typed prop specs, chart and widget kinds, the document shape, and the Studio command vocabulary.",
      },
    ],
  },
  {
    title: "Optional",
    links: [
      {
        title: "All documentation",
        href: `${SITE_URL}/docs`,
        desc: "The complete docs IA: every section lives on this one page, and deep links like /docs/avatar scroll to the section.",
      },
      {
        title: "Svelte port",
        href: REPO_SVELTE_URL,
        desc: "Runes-only Svelte 5 port with a verbatim copy of the engine.",
      },
    ],
  },
]

const LLMS_CONTEXT =
  "dither-ui is not published to a package registry. Install by copying the `dither-kit` folder " +
  "(or `dither-kit-svelte` for Svelte 5) from the GitHub repository into your project, installing " +
  "four small runtime dependencies (d3-scale, d3-shape, clsx, tailwind-merge) beside solid-js or svelte, and aliasing " +
  "the folder. The documentation site is served as prerendered static HTML, so every page below " +
  "can be fetched directly without a browser."

export function llmsTxt(): string {
  const groups = LLMS_GROUPS.map((g) => {
    const links = g.links.map((l) => `- [${l.title}](${l.href}): ${l.desc}`).join("\n")
    return `## ${g.title}\n\n${links}`
  }).join("\n\n")
  return `# dither-ui\n\n> ${LLMS_SUMMARY}\n\n${LLMS_CONTEXT}\n\n${groups}\n`
}
