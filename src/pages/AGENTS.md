# pages — landing, docs, studio, play

## Purpose

The routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction: ONE site voice. The landing speaks the docs' and the
  Studio's language — the dark theme tokens, monospace (`--font-mono`),
  hairlines — so landing → docs → studio reads as one
  product. From the 2000s oakley.com archive (the user's reference) it
  keeps STRUCTURE only: dense panels in columns, lists under a heading.
  From the dither winners on Awwwards (Basement Foundry, MONOGRID,
  ASTRODITHER) it takes SCALE: edge-to-edge art bands (the hero and the
  close), display-size type, tiny mono UI around it. Rejected and gone on purpose: the nodecode
  hairline grid, speed-italic type, slants and cut corners, the calm single
  column, condensed sports caps, bevels/chrome, and red. The kit's ember is
  the one warm light (the brand core, the install prompt, LEDs). Icons
  do the work of labels where they can: kit glyphs for ideas, the tools'
  own marks for tools (see Marks). Additions
  must remove something or justify their presence.
- Copy and markup follow the design.how bans the user picked (from its
  `build-design-system` taste file; reviews follow its `ui-review`
  criteria): NO uppercase or tracked labels (sentence case, the site's
  `.nav-a` keys included), NO eyebrow over a title, NO middle dots or em
  dashes in copy (separate facts with layout; end the sentence), NO link
  that ends in an arrow (every link names where it goes; an external one
  says "(opens in a new tab)" to screen readers). The landing applies them
  now; the docs and the Studio follow in a later pass. No space is left
  empty: a column or flank that runs short gets real content (a fact, a
  live kit surface, a step), never filler. The landing never names the
  tool the films are made with (the user's call; the SDK license asks no
  attribution).
- The landing layer lives ONCE in `chapters.css` (plain CSS under
  `.landing`, imported by `LandingPage`) on top of the SITE voice in
  `app/styles.css` (`.nav-a` set in sentence case here, `.nav-pill`,
  `.led`; never `.eyebrow` or `.micro` on the landing), which the landing
  uses directly: ink levels mapped to theme tokens
  (`--ink`, `--ink-2`, `--ink-3`, `--line`, `--well`), `.display` (mono
  500, tight), `.section-head` (the `.section-title` — the
  page's second size, mono 500 up to 2.6rem — and a `.more-link` naming
  its destination on its baseline), `.panel` (hairline, 12px — the docs'
  card corner), `.thumb` (a darker well, 8px), `.list-head` (a `.list-h`
  heading left, a `.more-link` right), `.lead` and `.more-link` (links
  with a resting hairline underline that inks on hover), `.key-primary` (the
  `.nav-a.nav-pill` key filled with ink), `.seg` (the docs header's
  segmented toggles: `aria-pressed` buttons, the pressed one ringed) and
  the `.live` chip. Components read it, never redeclare it; focus rings
  are the global `:focus-visible`. Page geometry (`--shell` 72rem — the
  docs' width, so the brand never jumps — and `--rhythm`) lives on
  `LandingPage`'s `.landing`.
- Header: the docs header's twin — h-14 on the shell, the 13px diamond
  mark (ember core) + "dither-ui", then `.nav-a` links in sentence case
  (Components → `#directory`, Docs, Agents → `#agents`, GitHub, a new
  tab) and the `.nav-pill` "Open studio"; Components/Agents drop under sm,
  GitHub under md. The
  docs chrome's scroll-edge hairline, no hard border. The header MUST keep
  `relative z-10`: `main` is `relative isolate` and page art lives inside
  it, so a positioned sibling always paints over a static header —
  without the lift the header renders zero visible pixels.
- Hero (`Showcase.vue`): a FULL-BLEED band (the `--well` between
  hairlines) holding, on the shell, the statement beside ONE film (the
  user's call: one film in the hero, the others in the sections they
  show). Left (`.statement`): the mono h1 at display scale
  (`clamp(2.2rem, 4.2vw, 3.25rem)`, two lines in its column), the lede,
  the keys (`.key-primary` "Open the studio" + `.nav-pill` "Read the
  docs"), then the facts strip under a hairline (`.facts`, a `dl`: the
  component count, the section count, the packages beside Vue; each
  number beside its kit glyph, hairlines between, never cards). Right:
  the `hero` film at 8:5, standing on the band's floor, with a caption
  (the Layers glyph, "Four paint layers, one dither rule.", the loupe
  line only where hover exists, a `.lead` into composition). Under 900px
  the statement comes first and the film takes the band's width. The h1
  AND the keys must clear the fold at 1440×900, 1280×800 and 1920×1080.
- Pixel type (`pixel-type.ts` + `PixelWord.vue`): a proportional 5×7
  bitmap face drawn as crisp SVG cells with a seam — the footer's wordmark
  (`cell` 2, `seam` 1/2). A string with a glyph the face lacks throws;
  every string the page sets is covered by `tests/pixel-type.spec.ts`.
- Facts are claims: `facts.ts` holds `COMPONENT_COUNT` (the facts strip,
  "Browse all 264 components") and `RUNTIME_DEPS` (the packages beside
  Vue, which the install bar's commands are built from);
  `tests/landing-facts.spec.ts` recounts the first from
  `dither-kit/index.ts` and holds the second to the kit's
  `peerDependencies`; section counts come from `hub.ts`. A change that
  moves one fails until the page says it.
- Install (`InstallBlock.vue`, under the hero) mirrors the docs install
  story: its four steps (degit folder + npm/pnpm/bun deps) must stay in
  sync with `docs/install.ts` `INSTALL` (the landing never imports the
  docs). One hairline bar: the
  `.seg` step picker (each step under its mark: the kit's Folder glyph,
  then npm, pnpm and Bun's own marks), the command in mono with the ember
  `$`, a hairline Copy through `DitherClipboard` (jolt, a 1px seal, label
  roll); the steps under it sit in glyph squares (Copy, then Check once
  copied; Terminal; Code) and advance on copy; "Source on GitHub" carries
  GitHub's mark; the glint is a one-shot IO → CSS (latched, never
  re-fires).
- Columns (`Showcase.vue`, `.cols` 1.9 : 1 : 1.2, one column under 900px):
  A — the Build panel ("Build your own screens", two `.thumb` product
  tiles of live kit components: Buttons and Controls, the slider re-seeding
  the badge; `.lead` links to the Studio and the docs) over the portraits
  panel (a heading, one line, the `faces` slot in a well — the
  pixel-shake stays in `LandingPage`); B — three 3:2 wells, each with its
  glyph, a `.lead` and a line: 3D models (Box; `DitherWorld` live at 12fps
  on the house ramp, `sampleWorld(7)`), Charts (ChartLine; a live
  `LineChart`) and Video (Film; the `reel` film across the well's middle,
  into `/docs/stage`); live kit canvases carry the `.live` chip; C — lists
  into the docs under `.list-h` headings (the shelved families biggest
  first, each under its glyph, its count in its own element, then the
  five Handbook topics under theirs; notes align with the labels), a
  hairline off the others. The three columns
  end within a few px of each other at desktop: content that changes one
  column's height is balanced in the others.
- Directory (`Hub.vue`, `#directory`): a head (`.dir-head`): left the
  title ("n sections, every one of them live."), one line and "Browse all
  sections"; right the `catalog` film (the docs as a skyline, its
  `catalogPlate` the stand-in) standing on the panel; one column under
  760px, the film under the text. Then a `.panel` — the kit's own
  `DitherTabs`
  (grey; badges = family sizes) over a horizontal snapping shelf of
  `.thumb` cards that deep-link to `/docs/<id>` (the section's seeded
  `DitherAvatar` identicon — decorative, no entrance — its family, its
  name, up to three lines, its path), and an "All n …" `.lead` per
  family; under the shelf, inside the panel, `TOOLS`: what every docs
  preview offers (Inspect, Edit and run, Hand it to your agent, each
  under its glyph: Crosshair, Code, Bot), three columns split by
  hairlines, each with the section that shows it. `hub.ts` is static data (the landing never loads the docs IA —
  no cross-page imports) held honest by `tests/hub.spec.ts`: families and
  counts equal `GROUPS`, every card id is a section of the family it names.
- Rhythm: the hero and the close run full width; everything else sits on
  the shell (`Showcase`'s `.shell` for install and columns,
  `LandingPage`'s `.box` for directory, principles and agents), each a
  flex column spaced by one gap — never stack a row's padding on a
  neighbour's margin.
- Principles (`LandingPage.vue`): a `.section-head` ("One rule under
  every pixel." and "Read the quick start") over a `.panel` — the
  figure in a `.thumb` well, sticky at the viewport's middle, beside six
  numbered statements at a large size (up to 2rem), each a LINK into the
  docs that covers it (`PRINCIPLES`, each a sentence or two, no dashes). The words light as each statement rises (after
  MONOGRID): CSS scroll timelines only — `view-timeline-name: --principle`
  per statement, every `.w` animating `--ink-3` → `--ink` over its own
  slice of the rise (`--p` = its place in the line), both ends ≥ 4.5:1 so
  a half-lit line is still text; no motion under reduced motion or
  without `animation-timeline` support. The STAGE is the statement
  crossing the viewport's middle (ONE IntersectionObserver on a
  zero-height root line, no scroll listener) or the one pointed at (hover
  or focus); the staged statement takes an ink index and an ink rule.
  The figure (`EssayFigure.vue` over `essay-figure.ts`): a 24x24 lattice of
  576 `<rect>`s built once at setup (markup, prerender-able);
  `stageCell(stage, x, y)` paints each scene through the house
  `ditherTone`/`rankOf` rule (01 matrix ramp · 02 bars + avatar ring · 03
  seven seed bands · 04 seeded scatter · 05 nested frames · 06 alias
  arrow), `stageFills()` gives every rect's fill (`OFF` lattice ghost where
  empty), and the CSS `fill` transition is delayed by the cell's Bayer rank
  (`--r` × 22ms) so a scene change IS an ordered-dither wipe; none under
  reduced motion. New scenes are field cases in `essay-figure.ts` with a
  sentence-case caption in `STAGE_CAPTIONS` (shown beside the scene's
  number, no separator) — never a second lattice. Guarded by
  `tests/essay-figure.spec.ts` (lattice ranks, determinism, lit share,
  distinct scenes, stage wrap).
- Agents (`#agents`): a `.section-head` ("Your own agent drives the
  Studio." and "Read the agent skill") over a two-column `.panel` (a real
  border: the well would paint over an inset hairline): left three steps,
  each in a glyph square (an `ol`, so the order is the list's) — run the
  bridge (Node's mark; its command shown as its two lines and copied as
  one through `DitherClipboard`), pick a harness in the Studio's Agent
  panel (Bot; the harnesses `bridge/dither-bridge.mjs` knows, its
  `HARNESSES` ids and names in order — keep in sync — as hairline chips
  each under the harness's own mark), ask for a screen (Sparkles); right,
  on the well, the `studio` film over a solid strip (the harness keeps
  its own login, the Studio never asks for a key). The steps set the
  panel's height: the film's stage is a size container and the film fits
  what it leaves (`min(100cqw, 160cqh)` at 8:5). One column under 760px,
  the film at the band's width.
- The close (`LandingPage.vue`, `.dawn`, after the agents): a FULL-BLEED
  band between hairlines, the last line ("Copy one folder. Every pixel
  is yours.") and its keys ("Read the quick start", "Open the studio") on
  the shell, then the `dawn` film across the band (up to 100rem; its
  `dawnPlate` the stand-in), its pause chip lined up with the shell.
- Marks: tool logos (npm, pnpm, Bun, Node, Vue, Svelte, GitHub and the
  coding agents) come ONLY from `src/shared/ui/marks.ts` through
  `ToolMark`, one-colour in `currentColor` beside the tool's name, never
  restyled or dithered; everything else is a kit glyph (`DitherIcon`).
- No entrance choreography: the page simply is (no load reveal, no scroll
  listener, no soft focus). Motion is the films, the live canvases, the
  principles' scroll-timeline word reveal, the figure's wipe and hover
  answers.
- `senses.ts` is the landing's ONE heartbeat (vanilla): one rAF ticks
  every subscribed organism (`senses().subscribe({ tick(dt) })`, today
  the portraits' shake), paused while the tab is hidden or under reduced
  motion, stopped when nobody is subscribed, dt clamped at 250ms. Canvas
  creatures NEVER run a rAF of their own (a local pointermove on a hover
  target, like the shake's, is theirs). No frame clock (tests,
  prerender) → no heartbeat; organisms still paint their static frame.
  Pinned by `tests/senses.spec.ts`. The figure's "seed 512" and the Build
  panel's slider are literal because the page displays those numbers.
- Films (`ClayzoFilm.vue` over `public/films/<id>.json`) are the page's
  Clayzo motion: documents built by `landing/films/`, each in the section
  it shows (hero → the hero, reel → column B's Video well, catalog → the
  directory's head, studio → the agents panel, dawn → the close) and played
  by `@clayzo/webgl-player`. The license line is a hard rule:
  `films/` imports the authoring package `@clayzo/animation` and is
  NODE-SIDE ONLY (tests and the generator) — the app never imports it, so
  only the JSON documents and the playback runtime ship. A film draws
  TONES, not colours (`kit-dither.ts`: grey t → the SKY ramp at tone t,
  rgb(1, t, 0) → the SUN ramp, below the first level is clear) and renders
  through ONE `custom-sksl` pass that is the kit's own rule — the 4×4
  gradient matrix and the house ramps unrolled into SkSL from kit data,
  each lattice cell sampling its centre, a 1-unit seam between cells (never
  under one device pixel, or it lands on some cells and not others) — so
  Clayzo moves vector shapes (2.5D, springs, morphs, trims, clips) and
  every pixel lands on a screen-aligned lattice in the house palette
  (`pixelFilm({ cool })` swaps the cool ramp: the catalog runs on `GREY`).
  The same pass is the LOUPE: `focus`/`radius` uniforms that
  `pixelFilm({ loupe })` wires to the pointer (`pointerFieldMacro`) —
  under the cursor the lattice halves, loses its seam and lifts a touch;
  at rest `radius` is 0. Uniforms bind positionally in the parameters'
  order (pinned by the spec). `frame.ts` holds the time base (240 ticks/s
  at 30 fps, keys snapped to frames), the house eases, `wave()` (smooth
  periodic tracks) and `cycle()` (a recurring run — particles — whose
  wrap opens the loop with its tail; `start` lays a loop inside one beat),
  and `pixelFilm()` (scene → dither pass → stamp → validate; the document
  background is TRANSPARENT, so a film lies on whatever ground holds it
  (a band, a well, the page) with no black box). Scatter is
  the kit's `mulberry32`, reseeded per build so a build is deterministic.
  Every film loops on the frame it opens on and marks a `still` (its
  resting frame). Clayzo z-sorts group children (higher `z` draws FURTHER
  BACK) — layer order comes from child order, keep z at 0. Strokes and
  features thinner than one cell alias to dots, and a feature must cover a
  cell CENTRE to draw at all: size and place them in whole cells. Light
  (glows, beams, scans) blends `lighten` so it never darkens what it
  crosses; keep cool tones under the ember ≤ 0.7, or lighten turns its
  heat white. A clip node is never drawn but still needs a style.
  `ClayzoFilm` fetches the player chunk (~380KB gzipped) and the document
  only after `load` and once the film is within a screen; until its first
  frame (and with no WebGL2) the `fallback` slot holds the frame, kept in
  the DOM and stepped out by the `data-live` latch (stripped by the
  prerender, so static bytes ship the stand-in). `playing` is the pause
  control (WCAG 2.2.2) — every film shows its `FilmChip` (`chip`: the
  button's name, each film its own — "Pause the layers film", "Pause the
  video film", … — so a page of films never has two buttons called the
  same; a round glass icon button in its corner; with slot text it
  becomes a pill with a timecode); `FilmChip` is a toggle with a stable
  name and `aria-pressed` while paused. Reduced motion starts every film
  paused on its `still`; pressing play is the visitor's ask and plays. The
  pointer parts the hero's layers, the dawn's sky, the reel's strips and
  the catalog's motes (`parallaxLayersMacro`). A film's root takes
  its lattice's `aspect-ratio`. The player owns
  its own rAF and offscreen pause — the one engine outside `senses`.
  The landing re-asserts `html.dark` on mount: the page is always-dark art
  while docs/studio own the persisted theme (storage keeps the user's
  choice).
- Pixel figures are MARKUP, not canvas: `plates.ts` paints a w×h cell field
  with the kit's ordered-dither rule (`ditherTone` on `resolveMatrix`, ranks
  via `rankOf`) and encodes each
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
- The portraits sit in column A's portraits panel as a 3×2 grid (`faces`
  slot).
  Portrait hover is the `pixel-shake.ts` disturbance (vanilla; it owns
  the landing's Bayer matrix builder, `bayerMatrix`, whose 4×4 is the
  kit's gradient matrix): each face canvas holds its crop at NATIVE art resolution;
  pointer moves add ENERGY at the cursor, every frame re-samples the source
  through a Gaussian pool (outward push + per-cell wobble on a 46 rad/s
  clock) gated by the Bayer threshold (dense core, scattered fringe), and
  energy decays 0.9/frame so cells spring home — it is on the `senses`
  heartbeat ONLY while energy is above the floor, nothing at rest, nothing
  under reduced motion, touch pointers ignored. Faster strokes kick harder. `shakeRaster()` is the
  pure raster (`tests/pixel-shake.spec.ts`: identity at zero energy, pool
  locality, Bayer thinning, determinism). Emote reactions stay CSS-only
  (`.emote` + `.group:hover`); no JS timers on the landing.
- Footer (under a hairline): the pixel wordmark and the framework badges
  (Vue 3, Svelte 5, each under its mark: hairline, sentence case) left; one row of
  bar-separated links right (`FOOTER`; 28px hit areas); under it the
  copyright line as separate items with gaps (the year and dither-ui.com,
  `v<version>`, MIT license); then the engraved wordmark.
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
  `wm-pen` class and an svg-INTERNAL `<style>`; the match string includes
  the quote that closes the path's `d` and the replacement MUST keep it —
  dropping it spliced the attributes into `d`, the browser rejected the
  contour, and the rim never drew — v-html children escape
  scoped styles, so the recipe ships inside the string, gated on the
  component's own `data-armed`/`data-live`). No-JS/prerender: no attrs, the
  finished mark renders; reduced motion: full static rim.
- Wells running live kit canvases carry the live chip (`.live`: an
  `.led` + "Live at 12 fps"), stating HONEST data: films and plates never
  do.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 + optional
  "open in studio →") → muted description → `DemoCard` (Preview/Code tabs,
  Inspect → the workbench, Code → the source panel) →
  optional picker gallery (micro-label + grid) → `PropsTable`.
- DemoCard is the page's perf seam: its preview `<slot>` mounts only as the
  card approaches the viewport (IO, 600px rootMargin) and LATCHES — once
  revealed it stays, so demo interaction state never resets on scroll; the
  Code tab mounts `CodeBlock` on first open (`v-if` — under the old `v-show`
  every hidden code block highlighted at initial mount; the panel then
  stays mounted under `v-show`, so edits survive the Preview tab). Section text,
  standalone Handbook CodeBlocks and PropsTables render eagerly, and the
  preview frame keeps `min-h-[280px]` so the box exists from first paint and
  below-fold growth never shifts visible content. Without IO (jsdom) the
  slot renders immediately — tests stay on the eager path.
- Inspect: the `aria-pressed` Inspect chip on the Preview tab mounts the
  workbench (`widgets/workbench`, loaded lazily on first use) over that
  card's preview — Kobra's inspector and tool tray plus the kit's own
  tools (see `src/widgets/workbench/AGENTS.md`). The card marks itself
  `data-demo-card`; its workspace key is `<section id>:<n>` (its place
  among the section's cards); while inspecting the frame takes a bottom
  lane for the tray (`pb-16`) and `role="group"` + tabindex; the Code tab
  closes it, and its exit returns focus to the chip.
- Code: the source panel (`widgets/source`, lazy) — the example as a
  complete file, the kit files it imports, `theme.css` and `prompt.md`,
  editable, copied, zipped and run. The card hands it the authored
  snippet, `docsCode`, the framework, the styling system and where it sits
  (section, place, the section's h2 and first line, its URL, `INSTALL`). A
  run replaces the demo in the frame (shown above the source while it
  runs, with "Restore the demo"), carries its CSS in one `<style>` per card
  and its tokens on the frame (`data-run-*`); the workbench inspects a run
  like the demo.
- Interface sounds (`shared/lib/sound.ts`): the header's "Interface sounds"
  toggle (`aria-pressed`, remembered) beside the theme toggle (which plays
  its own chord); the Preview/Code tabs, the framework and styling chips
  (only when they change something), Inspect on/off and copies sound.
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
- Docs serve any styling system: `docs/svelte.ts` `docsCode()` is the
  framework translation followed by `shared/lib/restyle.ts` with the
  reader's `styling` (header switch at md+, per-card chips beside
  Vue/Svelte; `docsStylings` hides CSS Modules under Svelte and
  `docsStyling` shows CSS in its place). Every DemoCard code tab and
  Handbook `fw()` block goes through it, so a snippet idiom the translator
  mangles gets a rule in `restyle.ts` + a `tests/restyle.spec.ts` case.
- `SNIPPETS`/computed code must match what the demo renders — it now
  RUNS in the source panel, so a snippet that leaves out what the demo
  has (a chart's height: the chart snippets carry `class="h-64"`) renders
  differently there; API tables
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
  `dist/llms.txt` via the `crawlFiles` plugin in `rstack.config.ts`; no
  hand-maintained
  public copies). New sections are added to a `*-nav.ts` pack and spread
  into a group there — never to the sitemap or llms.txt.
- Search metadata: `docs/seo.ts` derives per-section title, canonical,
  description, and BreadcrumbList JSON-LD from `GROUPS`. `DocsPage` applies
  them to the DOM as `activeId` changes (scroll-spy, deep links, search), so
  Google's renderer sees unique metadata per `/docs/<id>` page. Unknown or
  empty ids fall back to the generic `/docs` metadata; keep ids unique.
- Chrome: `.chrome` translucent header (88% background + blur; scroll-edge
  fade, no hard border); honors `prefers-reduced-transparency`. The search
  hint names the visitor's modifier (`⌘K` on Apple platforms, `Ctrl K`
  elsewhere — the handler accepts both). The brand carries the landing's
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
- The Studio's chrome speaks the SITE voice, like the landing and the
  docs: `font-mono` on the page root (the context menu and the kit's
  dialogs, teleported to body, carry it on their own panels), the 7×7 diamond brand, `.micro` panel and
  section labels, 12px hairline panels and toolbars, `.ring-on` pressed
  states, ink primary keys, neutral focus borders. The artboard SURFACE
  (`[data-artboard-surface]`) stays `font-sans`, the player's font, so
  what is designed on the canvas is what the video export renders.
- Studio is canvas-first: Toolbar floats over the full-bleed canvas; Layers,
  Agent and Inspector are dismissible overlay panels (Layers and Agent share
  the left slot — opening one folds the other); the searchable Library is the
  single insertion surface for charts, bespoke widgets, every public kit
  component, screens, and presets. The selection toolbar's "evolve" places a
  generation of the primary selection.
- `StudioPage` opens the agent protocol on mount (`installStudioAgentApi`)
  and closes it on unmount; a project `.json` dropped anywhere on the studio
  loads through `importDocument`, the same path as Open file.
- The selection toolbar's `video` opens `VideoDialog`
  (`features/export-video`, lazy like `ExportDialog`): length, frame rate
  and theme, then download the self-contained HyperFrames composition,
  open the live player preview, or copy the render command.
- The Agent panel (`widgets/agent/AgentPanel.vue`, lazy) is a CONTROL
  PLANE for the user's own harness, in the pi / omp / Claude Code composer
  idiom, over `features/agent/acp.ts`. The head's harness chip (LED while
  one runs) opens the picker: every harness the bridge knows with its PATH
  status, a custom-command field, and stop; `/harness <id | command>` is
  the same. The choice persists and starts again on the next prompt. A
  mode chip appears when the harness has modes (click cycles, `/mode <id>`
  sets). One transcript: `›` your prompt, `⏺` prose streamed in place with
  a `▍` caret, `⇢` a follow-up that started, `⚙ name · args ⎿ result` as
  one `<details>` per Studio tool call (orange `×` and auto-open when the
  Studio rejected it), `⚙/✓/×` activity lines for the harness's own tool
  calls, `☰` plans with per-step status, `⚠` permission prompts answered
  inline ("auto" answers them with their allow option), `·` system lines,
  and a `✻ working… 4.2s · 1 queued (esc to stop)` line. Keys: Enter sends,
  or QUEUES a follow-up while the harness works (ACP has no steering);
  Alt+Up takes the newest queued message back; Esc stops and returns the
  queue to the editor; Shift+Enter newline; ↑/↓ prompt history on a single
  line; Ctrl+O folds every tool block; `/` opens the command listbox (↑/↓
  + Tab/Enter pick): ours (`/help /harness /connect /new /mode /auto
  /evolve /select /code /copy /session /undo /clear /stop /disconnect`)
  plus the harness's own advertised commands, which go to it as text.
  Follow-ups run one at a time, in order. The status line shows the
  harness, session tokens (summed from each turn's usage), the last turn's
  time and an `auto` badge. The conversation persists per project and
  follows the active project; unanswered approvals are not saved. ⚙ holds
  only the bridge address and the auto switch: no key or model setting
  exists in the app.
- Child-only kit exports render as the smallest valid parent composition; do not
  add broken isolated previews merely to satisfy registry coverage.
- `ShortcutsHelp` and lazy `ExportDialog` mount here; keep them on the page, not
  inside widgets. The export dialog's `styling` control (Segmented over
  `STYLINGS`) writes the SFC in the reader's system — the same preference
  the docs use.

### play/

- The player: ONE Studio frame rendered by the Studio's own renderers
  (`ChartRenderer`, `WidgetRenderer`) at its frame size with no editor
  around it — the page an exported HyperFrames composition carries and the
  page the Studio opens for a live preview. `source.ts` reads the document
  from the composition's embedded `#dither-document` JSON (with
  `data-artboard` / `data-theme` on `#dither-stage`) or else from the hash
  `#doc=<base64url document>&artboard=<id>&theme=<dark|light>`; documents
  are untrusted and go through `parseDocument` (persistence) before they
  render. `main.ts` installs `directFromHyperframes()` before mount and
  registers `window.__hf.buildReady["dither-ui"]` as fonts + Vue's mount
  flush + one macrotask — never an animation frame: the renderer drives
  Chrome with begin-frame control, so frames and rAF only happen when it
  captures one, and every surface paints its moment synchronously on seek
  (a chart that measures later repaints the moment through its `wake`).
  `play/index.html` is the route's entry (noindex, not prerendered) and the
  same `main.ts` is the entry of the single-file bundle
  (the `player` environment of `rstack.config.ts`). Nothing here reads the
  project store: the
  page provides `REEL_POOL` (its parsed document's artboards) so a reel
  cuts between the frames that travel with it. Besides `hf-seek`, `main.ts`
  exposes `window.ditherClock` (`seek(seconds)`, `release()`, `directed()`,
  `time()`) for any driver's `evaluate`; `scripts/render-frames.mjs`
  (`npm run frames`) renders a composition or player URL to PNGs and an MP4
  through that contract in Playwright's Chromium, WebKit or Firefox.

## Verification

- `tests/pixel-shake.spec.ts` pins the Bayer matrices (every rank once,
  the 4×4 the kit's) and the shake's pure raster; `tests/senses.spec.ts`
  the heartbeat (one frame request for many organisms, dt clamp, stop
  when the last leaves). jsdom has no canvas, so mount paths are checked
  in the browser walk only.
- `tests/films.spec.ts` is the films' guard AND generator: the SkSL lookup
  evaluated against the kit's matrix, one uniform per ramp level, the
  uniforms in the effect parameters' order, and per
  film a valid deterministic document with a `still`, a frame-aligned loop
  and byte-equality with `public/films/<id>.json`. `npm run films`
  (`rs test -u`) rewrites the documents after a builder edit; review frames in
  a browser (the player seeked to the beats) before committing — the
  Clayzo CLI's render/review need an account, playback does not.
- `tests/landing-facts.spec.ts` recounts `COMPONENT_COUNT` in `facts.ts`.
- `tests/marks.spec.ts`: every harness the bridge starts has a mark under
  its id and name, the landing lists them in the bridge's order, every
  mark is path data in a positive box.
- Browser walk after changes: the landing at desktop AND phone widths (no
  horizontal scroll; the statement above the hero film under 900px), the
  h1 (two lines) and the keys above the fold at 1440×900, 1280×800 and
  1920×1080, the three columns ending level, no uppercase label, eyebrow,
  middle dot, em dash, arrow link or the films' tool's name in the
  rendered copy, every svg decorative or labelled, each of the five films
  mounting over its stand-in where it lives (scrolled into view) with its
  own named chip pausing it and the loupe under the cursor, reduced motion
  holding every film's still with its chip on play, the agents panel's
  film fitting beside the steps with no empty band under either, the
  marks crisp at their sizes (install picker, harness chips, footer
  badges; the Studio's harness picker with the bridge running), the
  Build slider re-seeding its badge, emote hover, a principle re-staging
  the figure on hover, keyboard focus AND scroll (its words lighting in
  reading order; still under reduced motion), the directory tabs'
  underline under the picked tab, canonical
  and legacy docs deep links (`/docs/avatar`, `#/docs/avatar`), and
  Studio deep links (`/studio#new/pie`, `#/studio/new/pie`) each
  create/select exactly one artboard.

## Child DOX Index

- none
