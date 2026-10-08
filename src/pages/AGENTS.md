# pages — landing, docs, studio

## Purpose

The three routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction: Japanese minimal (Ma/Kanso) survives the richer page — one
  statement per section, one action, one visual. Sections in order: header ·
  hero stage · install strip · expressions · showcase chapters · essay ·
  closing band · footer. Additions must remove something or justify their
  presence.
- Hero is a hairline STAGE panel (sharp corners): eyebrow (micro-caps + led)
  → statement → lede → ONE primary action (`DitherButton` "Open studio")
  with a quiet text secondary ("Read the docs →", `.cta-quiet`) beside it —
  the lede carries no inline links. The living sky sits right and the dawn
  plate (`plates.ts` `dawnPlate`, rendered by `PixelPlate.vue`) is pinned to
  the floor. The header nav mirrors the hero's verb as a hairline pill
  (`.nav-pill` "Open studio"); `.nav-a` links keep 32px hit areas. The header MUST keep `relative z-10`:
  `main` is `relative isolate` and page art lives inside it, so a positioned
  sibling always paints over a static header — without the lift the header
  renders zero visible pixels (it did, for a while; the pixel census in the
  session ledger caught it).
- `DitherEmblem.vue` is the generated mark: a seeded halftone sphere built
  as real `<rect>` markup at setup (Bayer-4 dither + hash break-up, light
  from the upper-left, navy → ice ramp + sparse ember scatter). It must stay
  deterministic (same seed → same emblem), CSS-only twinkle, no JS timers.
- Install strip mirrors the docs install story: its four steps (degit folder
  + npm/pnpm/bun deps) must stay in sync with `docs/DocsPage.vue`
  `SNIPPETS.install`; tabs are `aria-pressed` pickers, copy goes through
  `DitherClipboard`, and the reveal/sweep is a one-shot IO → CSS (latched,
  never re-fires).
- Showcase chapters are LIVE kit demos only — never screenshots. Each
  chapter: pills + one h2 statement + one panel demo. Chart/stat claims are
  factual (270 exports · 6 chart types · 40+ surfaces — recount when the kit
  surface changes). Canvas surfaces (silk/plasma/grid-scan, including the
  controls panel backdrop) MUST pass the page's own `colors` ramp
  (navy/blue/ice + ember) — the kit defaults (violet/green) clash with the
  dark monochrome identity.
- Vertical rhythm is ONE token: `.landing { --section }` (clamp 5–8rem) is
  the gap above/between/below the showcase chapters, under the install
  strip, and under the essay. Never stack a section's padding on a
  neighbour's margin — every breath on the page is `--section` once.
  Micro-caps (`.micro` / `.eyebrow`: 10.5px, 0.22em, uppercase), the
  `.nav-a` / `.nav-pill` header links and the `.led` dot are the SITE voice,
  defined once in `app/styles.css` (`@layer components`) and shared by the
  landing and docs headers — never re-declared in a page's scoped styles.
- Closing band: the display line + two actions over a `dither-field` dot
  sea (`bandCanvas` mounted in `LandingPage.vue`: 4px cells, 12fps, the four
  dark SKY levels only so the ink keeps contrast, density 0.42 at rest →
  0.64 under hover, cursor body 0.4; `prefers-reduced-transparency` halves
  it). The band is `isolate; overflow: hidden`; its content wrapper stays
  `relative` above the canvas.
- Load choreography: `.reveal` stagger (0/60/140/220/300ms) on the house rise
  curve `cubic-bezier(0.16, 1, 0.3, 1)`, disabled under
  `prefers-reduced-motion`. The hide is gated on the component's own
  `data-armed` (set in `onBeforeMount`): no-JS visitors and the prerendered
  bytes render the complete page. NEVER gate it via a `:global(html.js)`
  scoped rule — that construct white-screened every browser (compositor
  wedge; banned).
- `dither-field.ts` is the landing's living-canvas ENGINE and it is
  vanilla: no Vue, no kit imports — the same module mounts from a Vue
  component, a Svelte action, or a plain `<script type="module">`. One
  seeded luminance field (Gaussian bodies on incommensurate drift clocks +
  the cursor's body) is sampled per lattice cell in CSS px, ordered-dithered
  through a recursive Bayer matrix (8x8 default; the 4x4 equals the kit's
  gradient matrix — `tests/dither-field.spec.ts` pins it) onto a colour
  ramp (darkest first, below the first level = clear; an optional `hot`
  ramp above `hotAt`), written as packed u32 pixels into ONE lattice-sized
  ImageData, put on an offscreen canvas and blitted with
  `imageSmoothingEnabled = false` — nearest-neighbour upscale is the pixel
  look, one drawImage per frame instead of one fillRect per cell. Budget
  rules live inside it: rAF at `fps`, IO + visibilitychange pause, DPR
  clamp, ResizeObserver rebuild, static single frame under reduced motion
  (and the sizzle flicker off), eased pointer body and eased
  `density`/`hoverDensity` (hover = thicker dither), `scroll` parallax, and
  `setAvoid(rect)` — a smoothstep exclusion so art yields to text. The
  raster is the pure `rasterize()`; new behaviour goes there (testable
  headless), never into a second per-cell loop.
- The living sky (`SkyOrganism.vue`) is the stage's ONE canvas exception to
  "figures are markup": it is a backdrop creature, not a figure — a thin
  mount of `dither-field` on the house ramps (`SKY`, and `SUN[0..1]` as the
  hot ramp — never SUN's cream top, which read as a flat plate). It takes
  the stage copy element as `avoid` and excludes the union of its CHILDREN'S
  CONTENTS (a Range per child measures the line boxes — the block boxes are
  full-width and would blank the whole sky); the ref lands after the sky
  mounts, so the binding is a `watch` on the prop, re-measured by a
  ResizeObserver. Wide stages hang the bodies in the upper-right sky; narrow
  (<640) stages put them in the band between the action and the horizon at
  half weight. The cursor's body ignites ember at its core (`hotAt` 0.93).
  The landing re-asserts `html.dark` on mount: the page is always-dark
  art while docs/studio own the persisted theme (storage keeps the user's
  choice).
- Pixel figures are MARKUP, not canvas: `plates.ts` paints a w×h cell field
  with the kit's ordered-dither rule (`ditherTone` on `resolveMatrix`, ranks
  via `rankOf`, seeded matrices via `matrixFromSeed`) and encodes each
  (group, colour) as dashed-stroke lattice runs (`M x y.5h n·p`, dasharray
  `1 p-1`) — one subpath per run, not per cell; same field → same markup
  (`tests/plates.spec.ts` round-trips every cell). `PixelPlate.vue` is the
  one renderer: crispEdges, aria-hidden, strokes/dashes 3% long (float drift
  opened 1px seams under crispEdges), an IO latch (`data-live`) then CSS-only
  motion — `develop` lights groups in Bayer-rank order, `rise` climbs whole
  cells with `steps(lift)` — with heat tiered by the cell's own luminance
  (bright lands white-hot, mid tones glint ember, dark cells just appear),
  `data-done` on the last animation's end, no timers, final frame under
  reduced motion. New figures are field functions in `plates.ts`, never a
  second renderer.
- Sprite crops (`public/faces.webp` band + `public/sprites.webp`) use MEASURED constants
  (`FACES`, emote boxes, `FACE_Y/FACE_H`); if a sheet changes, re-measure
  programmatically in the browser (density-scan pattern) — never eyeball.
- `public/faces.webp` has transparency baked in; do not reintroduce runtime
  `getImageData` chroma-keying on the landing.
- Portrait hover is the `pixel-shake.ts` disturbance (vanilla, sibling of
  `dither-field`): each face canvas holds its crop at NATIVE art resolution;
  pointer moves add ENERGY at the cursor, every frame re-samples the source
  through a Gaussian pool (outward push + per-cell wobble on a 46 rad/s
  clock) gated by the Bayer threshold (dense core, scattered fringe), and
  energy decays 0.9/frame so cells spring home — the rAF exists ONLY while
  energy is above the floor, nothing at rest, nothing under reduced motion,
  touch pointers ignored. Faster strokes kick harder. `shakeRaster()` is the
  pure raster (`tests/pixel-shake.spec.ts`: identity at zero energy, pool
  locality, Bayer thinning, determinism). Emote reactions stay CSS-only
  (`.emote` + `.group:hover`); no JS timers on the landing.
- Footer signature: engraved wordmark (`EngravedWordmark.vue`) — glyph paths
  baked from Consolas Bold via `.scratch/engrave/bake.js` into
  `src/pages/landing/wordmark-layers.ts` as EXPORTED MARKUP STRINGS the
  component renders INLINE via `v-html` (img-embedded svg rasterizes filters
  in isolation = blocky layer artifacts; inline renders in-document at page
  resolution — never move these layers back to `<img src>`). A scale-accurate
  port of ghost.ai's footer recipe (their assets under `gitignored
  ghostai-ref/`, k = H/524.804):
  rim = glyph-masked inside-stroke `#D6EAFF` @0.7 blurred 1.49; letters =
  their ddii filter — two white under-glows + `#00050A` fill at feFuncA
  slope 0.1 + two black inner shadows from above; the letters layer RECEDES
  to 45% opacity on hover — with light pooling over the carve, the dark fill
  and inner shadows must not appear as shadow plates at the pool edge
  (un-lit areas fall back to plain background); hover light = TWO
  pool-masked layers in ghost's stacking — bloom (ramp glyphs, blur 7.5·k +
  feOffset down-right halo) under core (sharper ramp + fine grain), both
  `plus-lighter`, NO glyph clip — the light layer's own letterforms shape it,
  only the cursor pool bounds it (pool focus sits up-left of the cursor; the
  ramp is diagonal — light enters from the upper-left, halo offset down-right
  — white bodies easing to pale ice `#CFF4FF`→`#9EEBFF` at the letter
  bottoms; the ramp tail must stay luminous, a dark end reads as a shadow
  plate). Because all four layers share one DOM, every filter/gradient/mask
  id in the baked module MUST be layer-namespaced (`wm-*-c` / `wm-*-b`).
  Depth registration: rim ×1.0096 centered, letters ×1.0332 at
  -1.66%/-3.47% — the sheen's clipPath takes `WORDMARK_GLYPH_PATH` from the
  SAME bake (never a hand-held path constant: a stale copy clipped the sheen
  to garbled shapes — it surfaced as a dark cross on hover).
  Regenerate with the bake script if the wordmark text ever changes.
- Self-engraving: the rim's contour stroke draws itself on first scroll into
  view (`RIM_DRAW` transform injects `pathLength="1"` + a namespaced
  `wm-pen` class and an svg-INTERNAL `<style>` — v-html children escape
  scoped styles, so the recipe ships inside the string, gated on the
  component's own `data-armed`/`data-live`). No-JS/prerender: no attrs, the
  finished mark renders; reduced motion: full static rim.
- Showcase panels carry the live chip (`.live`: pulsing ember dot +
  micro-caps `live · 8 fps`) — the film-chip anatomy from the reference,
  stating HONEST data: only panels running live kit canvases get one; the
  static grid panel and plates never do.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 + optional
  "open in studio →") → muted description → `DemoCard` (Preview/Code tabs) →
  optional picker gallery (micro-label + grid) → `PropsTable`.
- DemoCard is the page's perf seam: its preview `<slot>` mounts only as the
  card approaches the viewport (IO, 600px rootMargin) and LATCHES — once
  revealed it stays, so demo interaction state never resets on scroll; the
  Code tab mounts `CodeBlock` on first open (`v-if` — under the old `v-show`
  every hidden code block highlighted at initial mount). Section text,
  standalone Handbook CodeBlocks and PropsTables render eagerly, and the
  preview frame keeps `min-h-[280px]` so the box exists from first paint and
  below-fold growth never shifts visible content. Without IO (jsdom) the
  slot renders immediately — tests stay on the eager path.
- Galleries and chip rows are PICKERS, not decoration: `aria-pressed`
  buttons drive the main preview's props; chart previews also bump a
  replay token so the kit's dither entrance is the transition. Code tabs
  are computed from the picked state — what you see is what you copy.
- Docs serve Vue AND Svelte: snippets are authored once in Vue; `docs/svelte.ts`
  derives the Svelte flavor (`toSvelteCode`) for DemoCard code tabs, Handbook
  CodeBlocks (`fw()`), and PropsTable's modelValue/v-model display mapping. The
  global `docsFramework` ref (header toggle + per-card chips, persisted to
  localStorage) drives all of them. The translator parses real export names
  from `dither-kit-svelte/index.ts?raw` (plain-named background/text/animation
  families rename automatically); `V_MODEL_TARGETS` maps the two non-`value`
  bindables (Sidebar→collapsed, SidebarSub→open). New Vue idioms in snippets
  need a translator rule + a `tests/svelte-code.spec.ts` case — never a
  hand-forked Svelte snippet.
- `SNIPPETS`/computed code must match what the demo renders; API tables
  mirror actual kit prop defaults — update both when the kit API changes.
  Core form controls share Field-generated IDs, help/error relationships, and
  unified focus/invalid/disabled states; docs examples should show that path.
- Wayfinding: scroll-spy (IntersectionObserver, rootMargin -56px top) sets
  `activeId` + `aria-current`; clean `/docs/<id>` and legacy `#/docs/<id>`
  deep links both restore and remain shareable.
- Mobile chrome: the phone header keeps the brand `whitespace-nowrap`, drops
  the studio pill (it lives on every section's "open in studio →" and returns
  at sm+) and the github link (the footer carries it), and hides the ⌘K kbd; the section list is a grouped disclosure
  (`browse sections` button with aria-expanded/aria-controls, group headings,
  two-column links, closes on tap) instead of the old flat wall of all ~220
  links.
- `scrollTo(id)` is computed `window.scrollTo` + a settle loop (re-align after
  motion stops, ≤8 tries, bottom-clamp aware): lazy demo reveals and
  content-visibility seeds move the target while the smooth flight is still
  running, and Chromium's `scrollIntoView` refused the short re-aligns — taps
  landed a screen short. Deep links keep the `jump()` path.
- Section IA lives in `docs/groups.ts` — the single source for the sidebar,
  the `/docs/<id>` deep links, and the build-time crawl files
  (`crawler-files.ts` generates `dist/sitemap.xml`, `dist/robots.txt`, and
  `dist/llms.txt` via the vite `crawlFiles` plugin; no hand-maintained
  public copies). New sections are added to a `*-nav.ts` pack and spread
  into a group there — never to the sitemap or llms.txt.
- Search metadata: `docs/seo.ts` derives per-section title, canonical,
  description, and BreadcrumbList JSON-LD from `GROUPS`. `DocsPage` applies
  them to the DOM as `activeId` changes (scroll-spy, deep links, search), so
  Google's renderer sees unique metadata per `/docs/<id>` page. Unknown or
  empty ids fall back to the generic `/docs` metadata; keep ids unique.
- Chrome: `.chrome` translucent header (scroll-edge fade, no hard border);
  honors `prefers-reduced-transparency`. The brand carries the landing's
  7x7 diamond mark, and the studio link is the site's `.nav-a.nav-pill`
  "Open studio" (sm+). The page title sits under a `.eyebrow`
  ("Documentation"); the footer links home via `routePath('/')` and shows
  `v<version> · MIT` like the landing footer.
- Chart sections link to `/studio#new/<type>` — keep in sync with `CHART_TYPES`;
  Studio also accepts legacy `#/studio/new/<type>` links.
- Section packs live in subfolders as self-contained components (sections +
  snippets + local state) with a sibling `*-nav.ts` exporting nav items;
  DocsPage imports both and spreads the nav into the right group.
  `docs/examples/` = Examples packs, `docs/components/` = component-doc
  packs (form/feedback/structure), `docs/backgrounds/` = the full-bleed
  generative canvas surfaces (aurora, faulty-terminal, ferrofluid, ...),
  `docs/text/` = DOM/CSS text animations (gradient/shiny/glitch/split/...),
  `docs/animations/` = interaction/motion effects (content reveals, animated
  borders, cursor + hover effects). New
  packs follow this shape instead of growing DocsPage. `docs/primitives/` =
  the Primitives pack (Box, Text, Divider, VisuallyHidden — the paste-list
  foundation family; new plain primitives extend it + PRIMITIVES_NAV).

### studio/

- Boot order in `StudioPage.vue` matters: `hydrate()` → `startAutosave()` →
  `startHistory()` → deep-link handling (`/studio#new/<type>` or legacy
  `#/studio/new/<type>`), so deep-link artboards are part of the restored doc
  and undoable; the URL is cleaned via `replaceState` to prevent duplication.
- Studio is canvas-first: Toolbar floats over the full-bleed canvas; Layers and
  Inspector are dismissible overlay panels; the searchable Library is the single
  insertion surface for charts, bespoke widgets, every public kit component,
  screens, and presets.
- Child-only kit exports render as the smallest valid parent composition; do not
  add broken isolated previews merely to satisfy registry coverage.
- `ShortcutsHelp` and lazy `ExportDialog` mount here; keep them on the page, not
  inside widgets.

## Verification

- `tests/dither-field.spec.ts` runs the engine's pure raster headless
  (Bayer ranks, quantize monotonicity, determinism, ramp coverage, avoid
  rect, pointer ignition, density scaling) — jsdom has no canvas, so the
  mount path is checked in the browser walk only.
- Browser walk after changes: landing reveal + emote hover + the sky's
  avoid rect at desktop AND phone widths (the creature must never sit under
  the statement or lede), the closing band's hover thickening, canonical and legacy
  docs deep links (`/docs/avatar`, `#/docs/avatar`), and Studio deep links
  (`/studio#new/pie`, `#/studio/new/pie`) each create/select exactly one artboard.

## Child DOX Index

- none
