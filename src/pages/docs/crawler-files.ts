import * as gif from "../../shared/lib/gif.ts"
import { GROUPS, SECTIONS } from "./groups.ts"
import * as card from "./og-card.ts"
import { docsBreadcrumb, docsMeta, REPO_URL, SITE_URL } from "./seo.ts"

// The crawler-surface files (`dist/sitemap.xml`, `dist/robots.txt`,
// `dist/llms.txt`) are generated at build time from the same GROUPS/SITE_URL
// sources the app renders, so section renames or removals can never rot a
// sitemap entry or an llms.txt link — a dead reference fails the build.
// These render functions are node-side only (rstack.config + tests); the app
// never imports this module. rstack.config.ts loads it under Node's own
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
// by scripts/prerender.mjs (per-section static pages + og images), by the
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
      const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
      const head = [
        `<title>${esc(meta.title)}</title>`,
        `<meta name="description" content="${esc(meta.description)}" />`,
        `<link rel="canonical" href="${meta.url}" />`,
        `<meta property="og:type" content="article" />`,
        `<meta property="og:title" content="${esc(meta.title)}" />`,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
        `<meta property="og:url" content="${meta.url}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${esc(meta.title)}" />`,
        `<meta name="twitter:description" content="${esc(meta.description)}" />`,
        shareHead(sectionCard(s.id)),
        `<script type="application/ld+json">${breadcrumb}</script>`,
      ].join("\n    ")
      return { ...meta, group, breadcrumb, head }
    }),
  )
}

/* ------------------------------ share cards ------------------------------- */

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

/** The route cards (their art is the horizon). The ids share `og/` with the
 * section ids, so none may be one (the tests hold this). */
export const ROUTE_CARDS = [
  {
    id: "home",
    url: `${SITE_URL}/`,
    title: "dither-ui",
    line: "A dithered UI toolkit for Vue and Svelte",
    description:
      "266 Vue components drawn pixel by pixel from one seeded palette, with live docs and a Studio your coding agent can drive. MIT licensed.",
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
      "Explore live Vue examples, API references, component galleries, chart variants, and copy-ready code for dither-ui.",
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
      "Design dithered charts and screens in the browser, export Vue code, images or video, or hand the canvas to your own coding agent.",
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
    alt: `${meta.label} in the dither-ui docs, over a drifting field of dithered blue`,
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
    alt: `${r.title} over two dithered horizons, blue and purple, under a few stars`,
    links: [...r.links],
  }))
  return [...routes, ...SECTIONS.map((s) => sectionCard(s.id))]
}

/** The side bar: the theme-color every page declares, as Discord's integer
 * colour, so the component embed and its og fallback wear the same one. */
const THEME = 0x3f8ff3

/** Discord's component embed for a card: one Container holding the title
 * and description, the playing card and its links (link buttons only, as
 * component embeds allow). Under Discord's 3,000 byte cap. */
export function componentEmbed(card: ShareCard): string {
  const group = GROUPS.find((g) => g.items.some((i) => i.id === card.id))?.title
  const note = group ? `${group}, in the dither-ui docs` : "dither-ui.com"
  return JSON.stringify({
    component: {
      type: 17,
      accent_color: THEME,
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

/** The head tags that point a page's previews at its card: the og and X
 * images (the still), Discord's component embed and the oEmbed photo. */
export function shareHead(card: ShareCard): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
  return [
    `<meta property="og:image" content="${SITE_URL}/og/${card.id}.png" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(card.alt)}" />`,
    `<meta name="twitter:image" content="${SITE_URL}/og/${card.id}.png" />`,
    `<meta name="twitter:image:alt" content="${esc(card.alt)}" />`,
    `<link rel="discord:component-embed" type="application/json" href="${SITE_URL}/embed/${card.id}.json" />`,
    `<link rel="alternate" type="application/json+oembed" href="${SITE_URL}/oembed/${card.id}.json" title="${esc(card.title)}" />`,
  ].join("\n    ")
}

/* --------------------------- og card renderer page ------------------------- */

// The renderer the build draws every card with, written to dist/og/index.html:
// one 1200x630 canvas, the art from og-card.ts and the GIF encoder from
// shared/lib/gif.ts carried inline as their own source (so the page needs
// no bundle and the Discord service can load it from a file), the type set
// on top. `window.og.files(id)` answers a card's PNG and GIF as base64 (the
// prerender's call); `?id=<card>&seed=<n>&inv=<0|1>` draws its first frame
// and flips document.title to "og-ready" (the Discord service's
// screenshot), `&play` loops it in place for a look. Sections come from
// ./sections.json, routes from ROUTE_CARDS.
export function ogCardPage(): string {
  const data = {
    OG_W: card.OG_W,
    OG_H: card.OG_H,
    OG_CELL: card.OG_CELL,
    OG_FRAMES: card.OG_FRAMES,
    OG_DELAY: card.OG_DELAY,
    OG_GROUND: card.OG_GROUND,
    OG_NIGHT: card.OG_NIGHT,
    OG_SKY: card.OG_SKY,
    OG_DUSK: card.OG_DUSK,
    OG_BAYER: card.OG_BAYER,
    TRANSPARENT: gif.TRANSPARENT,
    ROUTES: ROUTE_CARDS.map(({ id, title, line }) => ({ id, title, line })),
  }
  const source = [
    ...Object.entries(data).map(([name, value]) => `const ${name} = ${JSON.stringify(value)}`),
    ...[card.ogSeed, card.ogRandom, card.ogPixel, card.ogLevel, card.ogBodies, card.ogFieldTone, card.ogCrests],
    ...[card.ogArt, card.ogWrap, gif.byteBuffer, gif.medianCut, gif.distinctColours, gif.sample, gif.quantize],
    ...[gif.lzw, gif.deltaBox, gif.encodeGif],
  ].join("\n\n")
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1200" />
<meta name="robots" content="noindex" />
<title>og-loading</title>
<style>
  * { margin: 0; padding: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; background: ${card.OG_GROUND}; }
  canvas { display: block; }
</style>
</head>
<body>
<canvas id="dith" width="1200" height="630"></canvas>
<script>
${source}

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace'
const INK = "#ededed", INK2 = "#b4b8c0", INK3 = "#8b8f98", LINE = "#2c3038", EMBER = "#ff9632"
const canvas = document.getElementById("dith")
const ctx = canvas.getContext("2d", { willReadFrequently: true })
let SECTIONS = []
const ready = fetch("./sections.json").then(r=>r.json()).then((s) => { SECTIONS = s })

function cardOf(id, seed, inv) {
  const route = ROUTES.find((r) => r.id === id)
  if (route) return { id, art: "horizon", title: route.title, line: route.line, tag: "", seed: seed || ogSeed(id), inv: !!inv }
  const s = SECTIONS.find((x) => x.id === id) || SECTIONS[0]
  return {
    id: s.id, art: "field", title: s.label.replace(/\\.+$/, ""), line: s.url.replace(/^https?:\\/\\//, ""),
    tag: s.group, seed: seed || ogSeed(s.id), inv: !!inv,
  }
}

function font(size, weight) {
  ctx.font = (weight || 400) + " " + size + "px " + MONO
}

// The brand: the 7x7 diamond (ember core) and the name, top left.
function brand() {
  ctx.fillStyle = INK
  ;[1, 3, 5, 7, 5, 3, 1].forEach((w, row) => ctx.fillRect(64 + (7 - w) * 1.5, 46 + row * 3, w * 3, 3))
  ctx.fillStyle = EMBER
  ctx.fillRect(64 + 9, 46 + 9, 3, 3)
  ctx.fillStyle = INK
  font(22, 500)
  ctx.letterSpacing = "0px"
  ctx.fillText("dither-ui", 97, 64)
}

// A hairline tag in the top right corner: a section's family.
function tag(text, ground) {
  font(15)
  ctx.letterSpacing = "0px"
  const w = ctx.measureText(text).width + 24
  ctx.fillStyle = ground
  ctx.beginPath()
  ctx.roundRect(1136 - w + 0.5, 40.5, w - 1, 29, 6)
  ctx.fill()
  ctx.strokeStyle = LINE
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = INK3
  ctx.fillText(text, 1136 - w + 12, 60)
}

// The title in as few lines as fit (shrinking a size when three would not),
// its ember stop after the last word; then its line in a quieter ink.
function title(card) {
  const route = card.art === "horizon"
  const max = route ? 760 : 700
  let size = route ? 104 : 64
  let lines
  for (;;) {
    font(size, 500)
    ctx.letterSpacing = (-0.03 * size).toFixed(1) + "px"
    lines = route ? [card.title] : ogWrap(card.title.split(" "), (t) => ctx.measureText(t).width, max)
    const widest = Math.max(...lines.map((l) => ctx.measureText(l + ".").width))
    if ((lines.length <= 2 || size <= 52) && widest <= max) break
    size -= 4
  }
  const lead = Math.round(size * 1.06)
  const last = route ? 318 : 520
  lines.forEach((l, i) => {
    const y = last - (lines.length - 1 - i) * lead
    ctx.fillStyle = INK
    ctx.fillText(l, 64, y)
    if (i === lines.length - 1) {
      ctx.fillStyle = EMBER
      ctx.fillText(".", 64 + ctx.measureText(l).width, y)
    }
  })
  font(route ? 26 : 22)
  ctx.letterSpacing = "0px"
  ctx.fillStyle = route ? INK2 : INK3
  ogWrap(card.line.split(" "), (t) => ctx.measureText(t).width, 720)
    .slice(0, 2)
    .forEach((l, i) => ctx.fillText(l, 64, last + (route ? 60 : 54) + i * 36))
}

function draw(card, t) {
  ctx.putImageData(new ImageData(ogArt(card, t), OG_W, OG_H), 0, 0)
  brand()
  if (card.tag) tag(card.tag, card.inv ? OG_NIGHT : OG_GROUND)
  title(card)
}

function base64(bytes) {
  let s = ""
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

window.og = {
  ready,
  card: cardOf,
  // Every card the build draws: the routes, then each section.
  ids: () => [...ROUTES.map((r) => r.id), ...SECTIONS.map((s) => s.id)],
  // A card's still (its first frame) as a PNG and its loop as a GIF, base64.
  async files(id, seed, inv) {
    await ready
    const card = cardOf(id, seed, inv)
    const frames = []
    for (let i = 0; i < OG_FRAMES; i++) {
      draw(card, i / OG_FRAMES)
      frames.push(ctx.getImageData(0, 0, OG_W, OG_H).data)
    }
    draw(card, 0)
    // The card's own colours stay exact in the GIF (the ember stop is a
    // few hundred pixels of 756,000); its type's antialiasing shares the rest.
    const keep = [OG_GROUND, OG_NIGHT, ...OG_SKY, ...OG_DUSK, INK, INK2, INK3, LINE, EMBER].map((h) =>
      [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)),
    )
    const gif = encodeGif(frames, OG_W, OG_H, OG_DELAY, { keep })
    return { png: canvas.toDataURL("image/png").split(",")[1], gif: base64(gif) }
  },
}

ready.then(() => {
  const q = new URLSearchParams(location.search)
  const card = cardOf(q.get("id") || "getting-started", parseInt(q.get("seed") || "0") || 0, q.get("inv") === "1")
  draw(card, 0)
  document.title = "og-ready"
  if (q.has("play")) {
    let i = 0
    setInterval(() => draw(card, (++i % OG_FRAMES) / OG_FRAMES), OG_DELAY * 10)
  }
}).catch(() => { document.title = "og-error" })
</script>
</body>
</html>
`
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
  "dither-ui is a Vue 3 UI toolkit (plus a Svelte 5 port, dither-kit-svelte) rendered on one " +
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
        desc: "Full source for both kits (dither-kit Vue 3, dither-kit-svelte Svelte 5), benchmarks, and this site.",
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
  "four small runtime dependencies (vue or svelte, tailwindcss, d3-scale, d3-shape), and aliasing " +
  "the folder. The documentation site is served as prerendered static HTML, so every page below " +
  "can be fetched directly without a browser."

export function llmsTxt(): string {
  const groups = LLMS_GROUPS.map((g) => {
    const links = g.links.map((l) => `- [${l.title}](${l.href}): ${l.desc}`).join("\n")
    return `## ${g.title}\n\n${links}`
  }).join("\n\n")
  return `# dither-ui\n\n> ${LLMS_SUMMARY}\n\n${LLMS_CONTEXT}\n\n${groups}\n`
}
