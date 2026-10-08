import { GROUPS, SECTIONS } from "./groups"
import { docsBreadcrumb, docsMeta, SITE_URL } from "./seo"

// The crawler-surface files (`dist/sitemap.xml`, `dist/robots.txt`,
// `dist/llms.txt`) are generated at build time from the same GROUPS/SITE_URL
// sources the app renders, so section renames or removals can never rot a
// sitemap entry or an llms.txt link — a dead reference fails the build.
// These render functions are node-side only (vite.config + tests); the app
// never imports this module.

const REPO_URL = "https://github.com/drvova/dither-ui"
const REPO_SVELTE_URL = `${REPO_URL}/tree/master/dither-kit-svelte`

const docsUrl = (id: string): string => {
  if (!SECTIONS.some((s) => s.id === id))
    throw new Error(
      `crawler-files.ts: missing docs section "${id}" referenced by a crawl file — ` +
        "add it to a *-nav.ts pack and spread it into GROUPS."
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
    "# dither-ui — everything on this site is public and MIT licensed; no paths",
    "# are restricted. The named AI-crawler allows below make that open posture",
    "# explicit and intentional (the wildcard already permits all crawlers), so",
    "# the policy stays correct if defaults are ever tightened. See also the",
    "# LLM-facing index at /llms.txt.",
    "",
    named,
    "",
    "User-agent: *",
    "Allow: /",
    "# /og/ renders the social-embed cards (1200x630) the meta tags point at;",
    "they are assets, not content pages.",
    "Disallow: /og/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n")
}

/* ----------------------- sections manifest (og engine) -------------------- */

// The SEO engine's data contract: one JSON record per docs section, consumed
// by scripts/prerender.mjs (per-section static pages + og images) and by the
// /og/ renderer itself. Same single source as the sitemap — meta derives
// from seo.ts's docsMeta/docsBreadcrumb, never a reimplementation.
export interface SectionRecord {
  id: string
  label: string
  group: string
  url: string
  title: string
  description: string
  breadcrumb: string
}

export function sectionsManifest(): string {
  return JSON.stringify(
    SECTIONS.map((s) => {
      const group = GROUPS.find((g) => g.items.some((i) => i.id === s.id))?.title ?? "Docs"
      return {
        ...docsMeta(s.id),
        group,
        breadcrumb: docsBreadcrumb(s.id),
      }
    }),
  )
}

/* --------------------------- og card renderer page ------------------------- */

// A self-contained 1200x630 card renderer written to dist/og/index.html by
// the build: reads ?id=<section>&seed=<n>&inv=<0|1>, draws the section's
// title over a seeded ordered-dither field (the house Bayer 4x4 + ramp), and
// flips document.title to "og-ready" when done. The prerender screenshots it
// per section; the Discord interaction service re-renders it per seed. No
// app bundle, no fonts to load — the browser's default mono is the identity.
export function ogCardPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1200" />
<meta name="robots" content="noindex" />
<title>og-loading</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    font-family: ui-monospace, "SF Mono", "JetBrains Mono", Consolas, monospace;
    background: #05060a;
    color: #ededed;
    position: relative;
  }
  canvas { position: absolute; inset: 0; width: 1200px; height: 630px; }
  .card {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 0 64px 56px;
  }
  .kicker {
    font-size: 15px; letter-spacing: 0.25em; text-transform: uppercase;
    color: #ff9632; margin-bottom: 18px;
  }
  h1 {
    font-size: 64px; font-weight: 500; letter-spacing: -0.03em;
    line-height: 1.05; max-width: 900px; color: #ededed;
    text-wrap: balance;
  }
  h1 .stop { color: #ff9632; }
  .foot {
    position: absolute; left: 64px; right: 64px; bottom: 24px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 16px; color: #8b8f98;
  }
  .foot b { color: #ededed; font-weight: 500; }
  .group-chip {
    position: absolute; top: 40px; left: 64px;
    font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #8b8f98; border: 1px solid #22252b; padding: 6px 12px;
  }
</style>
</head>
<body>
<canvas id="dith" width="1200" height="630"></canvas>
<div class="card">
  <span class="group-chip" id="grp"></span>
  <div class="kicker" id="kick"></div>
  <h1 id="t"></h1>
</div>
<div class="foot"><span><b>dither-ui</b> · a dithered UI toolkit for Vue</span><span>dither-ui.com</span></div>
<script>
  // The house Bayer 4x4 (gradient seed) as 0-1 thresholds.
  const B = [[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>(v+0.5)/16));
  // Deterministic per-section seed: the id hashed the same way everywhere.
  function seedOf(id){ let h=2166136261; for(const ch of id){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619) } return (h>>>0) }
  // Mulberry32 PRNG — small, stable, no deps.
  function rng(seed){ return function(){ seed|=0; seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296 } }
  const SKY = ["#0c1730","#1e429f","#2f6fd0","#7ba3ee","#c9dbff","#f4f8ff"];
  function hex(c){ return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)] }
  const SKYC = SKY.map(hex);
  function draw(seed, inv){
    const cv=document.getElementById("dith"), ctx=cv.getContext("2d");
    const R=rng(seed), CS=12, cols=Math.ceil(1200/CS), rows=Math.ceil(630/CS);
    // Three drifting gaussian bodies, seeded per section.
    const blobs=[0,1,2].map(i=>({x:(0.25+R()*0.5)*1200, y:(0.15+R()*0.55)*630, r:(90+R()*110)*(inv?1.15:1), f:0.4+i*0.23, p:R()*6.28}));
    const field=(px,py,t)=>{ let v=0; for(const b of blobs){ const dx=px-(b.x+Math.sin(t*b.f+b.p)*60), dy=py-(b.y+Math.cos(t*b.f*1.3+b.p)*40); const s=b.r; v+=1.1*Math.exp(-(dx*dx+dy*dy)/(2*s*s/4)) } return Math.min(v,1.15) };
    ctx.fillStyle = inv ? "#0a0a0c" : "#05060a"; ctx.fillRect(0,0,1200,630);
    for(let cy=0;cy<rows;cy++) for(let cx=0;cx<cols;cx++){
      const L=field((cx+0.5)*CS,(cy+0.5)*CS,1.0);
      if(L<0.22) continue;
      const v=Math.min(1,L/0.9)*SKYC.length, base=Math.floor(v), i=base+((v-base)>B[cy&3][cx&3]?1:0);
      if(i<=0) continue;
      const c=SKYC[Math.min(i,SKYC.length)-1];
      ctx.fillStyle="rgb("+c[0]+","+c[1]+","+c[2]+")";
      ctx.fillRect(cx*CS,cy*CS,CS-1,CS-1);
    }
  }
  fetch("./sections.json").then(r=>r.json()).then(sections=>{
    const id=new URLSearchParams(location.search).get("id")||"getting-started";
    const seed=parseInt(new URLSearchParams(location.search).get("seed")||"0")||seedOf(id);
    const inv=new URLSearchParams(location.search).get("inv")==="1";
    const s=sections.find(x=>x.id===id)||sections[0];
    draw(seed, inv);
    document.getElementById("grp").textContent=s.group;
    document.getElementById("kick").textContent=s.group+" — docs";
    const h1=document.getElementById("t");
    h1.textContent=s.label.replace(/\\.+$/,"");
    const stop=document.createElement("span"); stop.className="stop"; stop.textContent=".";
    h1.appendChild(stop);
    document.title="og-ready";
  }).catch(()=>{ document.title="og-error" });
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
        `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
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
  "55+ Base UI-parity components, generative backgrounds, text and animation effects — all " +
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
      { title: "Quick start", href: docsUrl("getting-started"), desc: "Copy the kit folder, install the four runtime dependencies, alias it, and render the first component." },
      { title: "Landing page", href: `${SITE_URL}/`, desc: "Product overview, the dither identity, and links into docs and studio." },
      { title: "GitHub repository", href: REPO_URL, desc: "Full source for both kits (dither-kit Vue 3, dither-kit-svelte Svelte 5), benchmarks, and this site." },
    ],
  },
  {
    title: "Charts",
    links: [
      { title: "Area chart", href: docsUrl("area"), desc: "Composable stacked or percent area chart with gradient, dotted, and hatched variants." },
      { title: "Line chart", href: docsUrl("line"), desc: "Multi-series line chart with dither fill, seeds, and sparkle effects." },
      { title: "Bar chart", href: docsUrl("bar"), desc: "Grouped or stacked bars with dither textures." },
      { title: "Pie chart", href: docsUrl("pie"), desc: "Seed-generative pie and donut with legend and tooltips." },
      { title: "Radar chart", href: docsUrl("radar"), desc: "Multi-line radar with per-series colors." },
      { title: "Sparkline", href: docsUrl("sparkline"), desc: "Tiny inline canvas sparkline, seed-driven." },
    ],
  },
  {
    title: "Components",
    links: [
      { title: "Button", href: docsUrl("button"), desc: "Gradient, dotted, hatched, and solid fills with pixel bloom." },
      { title: "Avatar", href: docsUrl("avatar"), desc: "Seed-generative pixel portraits with reaction emotes." },
      { title: "Gradient", href: docsUrl("gradient"), desc: "Bayer-faded background wash in four directions." },
      { title: "Image", href: docsUrl("image"), desc: "Ordered-dithers any image into chunky cells." },
      { title: "Form controls", href: docsUrl("switch"), desc: "Switch, checkbox, slider, and progress with unified field states." },
      { title: "Fields and selection", href: docsUrl("input"), desc: "Inputs, textareas, selects, comboboxes, radios, and toggles." },
      { title: "Overlays and menus", href: docsUrl("dialog"), desc: "Dialogs, drawers, popovers, context menus, tooltips, and command palettes." },
      { title: "Structure and layout", href: docsUrl("tabs"), desc: "Tabs, collapsibles, shells, rails, consoles, grids, and infinite canvas." },
      { title: "Navigation and data", href: docsUrl("sidebar"), desc: "Sidebars, nav menus, breadcrumbs, pagination, and tables." },
    ],
  },
  {
    title: "Backgrounds, text, and animations",
    links: [
      { title: "Backgrounds", href: docsUrl("aurora"), desc: "Full-bleed generative canvas surfaces — aurora, waves, plasma, dark veil, particles." },
      { title: "Text", href: docsUrl("gradient-text"), desc: "DOM and CSS text effects — gradient, shiny, glitch, split, scramble, ASCII." },
      { title: "Animations", href: docsUrl("animated-content"), desc: "Motion and interaction effects — reveals, borders, cursors, magnets." },
    ],
  },
  {
    title: "Handbook",
    links: [
      { title: "Styling", href: docsUrl("styling"), desc: "Theme tokens, colors, and the dither design language." },
      { title: "Seeds", href: docsUrl("seeds"), desc: "How one integer drives texture, motion, and color deterministically." },
      { title: "Animation", href: docsUrl("motion"), desc: "The dither entrance, replay tokens, and reduced-motion support." },
      { title: "Accessibility", href: docsUrl("accessibility"), desc: "Labels, focus rings, and reduced-motion and reduced-transparency floors." },
    ],
  },
  {
    title: "Studio",
    links: [
      { title: "Studio", href: `${SITE_URL}/studio`, desc: "Infinite-canvas editor to compose, configure, and export dither-ui charts and components as code." },
    ],
  },
  {
    title: "Agents",
    links: [
      { title: "Studio skill", href: `${SITE_URL}/agent/SKILL.md`, desc: "How a coding agent (Claude Code, Codex, pi, omp, any harness) composes dither-ui screens and charts as Studio documents, offline or against a live Studio tab." },
      { title: "Component registry", href: `${SITE_URL}/agent/registry.json`, desc: "Machine-readable registry: every placeable component with typed prop specs, chart and widget kinds, the document shape, and the Studio command vocabulary." },
    ],
  },
  {
    title: "Optional",
    links: [
      { title: "All documentation", href: `${SITE_URL}/docs`, desc: "The complete docs IA — every section lives on this one page; deep links like /docs/avatar scroll to the section." },
      { title: "Svelte port", href: REPO_SVELTE_URL, desc: "Runes-only Svelte 5 port with a verbatim copy of the engine." },
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