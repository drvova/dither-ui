# pages — landing, docs, studio, play

## Purpose

The routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction: ONE site voice. The landing speaks the docs' and the
  Studio's language — the dark theme tokens, monospace (`--font-mono`),
  hairlines, micro-caps — so landing → docs → studio reads as one
  product. From the 2000s oakley.com archive (the user's reference) it
  keeps STRUCTURE only: a campaign stage with tabs, dense panels in
  columns, lists under a mark. From the dither winners on Awwwards
  (Basement Foundry, MONOGRID, ASTRODITHER) it takes SCALE: one big
  edge-to-edge art band, display-size type, tiny mono UI around it. Rejected and gone on purpose: the nodecode
  hairline grid, speed-italic type, slants and cut corners, the calm single
  column, condensed sports caps, bevels/chrome, and red. The kit's ember is
  the one warm light (the brand core, the install prompt, LEDs). Additions
  must remove something or justify their presence.
- The landing layer lives ONCE in `chapters.css` (plain CSS under
  `.landing`, imported by `LandingPage`) on top of the SITE voice in
  `app/styles.css` (`.nav-a`, `.nav-pill`, `.eyebrow`, `.micro`, `.led`),
  which the landing uses directly: ink levels mapped to theme tokens
  (`--ink`, `--ink-2`, `--ink-3`, `--line`, `--well`), `.display` (mono
  500, tight), `.section-head` (an `.eyebrow`, the `.section-title` — the
  page's second size, mono 500 up to 2.6rem — and a `.more-link` on its
  baseline), `.panel` (hairline, 12px — the docs' card corner), `.thumb`
  (a darker well, 8px), `.list-head` (an `.eyebrow` left, `.more-link`
  "all →" right), `.lead` (ink text + a quiet →), `.key-primary` (the
  `.nav-a.nav-pill` key filled with ink), `.seg` (the docs header's
  segmented toggles: `aria-pressed` buttons, the pressed one ringed) and
  the `.live` chip. Components read it, never redeclare it; focus rings
  are the global `:focus-visible`. Page geometry (`--shell` 72rem — the
  docs' width, so the brand never jumps — and `--rhythm`) lives on
  `LandingPage`'s `.landing`.
- Header: the docs header's twin — h-14 on the shell, the 13px diamond
  mark (ember core) + "dither-ui", then `.nav-a` links (Components →
  `#directory`, Docs, Agents → `#agents`, GitHub ↗) and the `.nav-pill`
  "Open studio"; Components/Agents drop under sm, GitHub under md. The
  docs chrome's scroll-edge hairline, no hard border. The header MUST keep
  `relative z-10`: `main` is `relative isolate` and page art lives inside
  it, so a positioned sibling always paints over a static header —
  without the lift the header renders zero visible pixels.
- Stage (`Showcase.vue`): a FULL-BLEED band (the `--well` between
  hairlines, content edges aligned to the shell via `--edge`), its art the
  films as tabbed campaigns — ONE `ClayzoFilm` mounted at a time (`:key` =
  the picked film), 8:5 films centred at the band's full height
  (`clamp(20rem, 50vh, 34rem)`), the wide catalog and dawn across its
  floor — with the film's label top-right (a backed `.micro`). The `.seg`
  film tabs (`role="group"`) and the "dither-kit × Clayzo" mark have their
  OWN floor row under the art, so no film ever runs under them. Under it,
  on the shell, the statement (`.intro`): an `.eyebrow`, the mono h1 at
  display scale across the shell (`clamp(2.4rem, 5.3vw, 5rem)`, two lines
  at desktop), then one row of the lede and the keys (`.key-primary`
  "Open the studio" + `.nav-pill` "Read the docs"). The h1 AND the keys
  must clear the fold at 1440×900, 1280×800 and 1920×1080. Under 760px the
  film takes the band's width and the tabs share it.
- Pixel type (`pixel-type.ts` + `PixelWord.vue`): a proportional 5×7
  bitmap face drawn as crisp SVG cells with a seam — the footer's wordmark
  (`cell` 2, `seam` 1/2). A string with a glyph the face lacks throws;
  every string the page sets is covered by `tests/pixel-type.spec.ts`.
- Facts are claims: `facts.ts` holds `COMPONENT_COUNT` (the Build panel's
  "Choose from 264 components") and `tests/landing-facts.spec.ts` recounts
  it from `dither-kit/index.ts`; section counts come from `hub.ts`. A
  change that moves one fails until the page says it.
- Install (`InstallBlock.vue`, under the stage) mirrors the docs install
  story: its four steps (degit folder + npm/pnpm/bun deps) must stay in
  sync with `docs/install.ts` `INSTALL` (the landing never imports the
  docs). One hairline bar: the
  `.seg` step picker · the command in mono with the ember `$` · a hairline
  Copy through `DitherClipboard` (jolt, a 1px seal, label roll); the
  steps under it are separated by `›`; the glint is a one-shot IO → CSS
  (latched, never re-fires).
- Columns (`Showcase.vue`, `.cols` 2 : 1 : 1.1, one column under 900px):
  A — the Build panel ("Build your own screens", two `.thumb` product
  tiles of live kit components: Buttons and Controls, the slider re-seeding
  the badge; `.lead` links to the Studio and the docs) over the portraits
  panel (a heading, one line, the `faces` slot in a well — the
  pixel-shake stays in `LandingPage`); B — wells with a `.lead` and a
  line: World 3D (`DitherWorld` live at 12fps on the house ramp,
  `sampleWorld(7)`, with the `.live` chip) and Charts (a live
  `LineChart`); C — lists into the docs under eyebrows (the shelved
  families biggest first, then the Handbook), a hairline off the others.
- Directory (`Hub.vue`, `#directory`): a `.section-head` ("Directory" ·
  "n sections, every one of them live." · "all sections →") and one line
  over a `.panel` — the kit's own `DitherTabs`
  (grey; badges = family sizes) over a horizontal snapping shelf of
  `.thumb` cards that deep-link to `/docs/<id>` (the section's seeded
  `DitherAvatar` identicon — decorative, no entrance — its family in
  `.micro`, its name, a line, its path), and an "All n …" `.lead` per
  family. `hub.ts` is static data (the landing never loads the docs IA —
  no cross-page imports) held honest by `tests/hub.spec.ts`: families and
  counts equal `GROUPS`, every card id is a section of the family it names.
- Rhythm: the band runs full width; everything else sits on the shell
  (`Showcase`'s `.shell` for the statement, install and columns,
  `LandingPage`'s `.box` for directory, principles and agents), each a
  flex column spaced by one gap — never stack a row's padding on a
  neighbour's margin.
- Principles (`LandingPage.vue`): a `.section-head` ("Principles" · "One
  rule under every pixel." · "quick start →") over a `.panel` — the
  figure in a `.thumb` well, sticky at the viewport's middle, beside six
  numbered statements at a large size (up to 2rem), each a LINK into the
  docs that covers it (`PRINCIPLES`; a dash is bound to the word before it
  with a no-break space). The words light as each statement rises (after
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
  caption in `STAGE_CAPTIONS` — never a second lattice. Guarded by
  `tests/essay-figure.spec.ts` (lattice ranks, determinism, lit share,
  distinct scenes, stage wrap).
- Agents (`#agents`): a `.section-head` ("Agents" · "Your own agent
  drives the Studio." · "agent skill →") over a `.panel` of the harnesses
  `bridge/dither-bridge.mjs` knows (its `HARNESSES` names, in order — keep
  in sync) as hairline chips with an ember square LED, over a
  `dither-field` dot sea (`bandCanvas` mounted in `LandingPage.vue`, seed
  `seedFor("band")`: 4px cells, 12fps, the four dark SKY levels only so
  the ink keeps contrast, density 0.42 at rest → 0.64 under hover, cursor
  body 0.4; `prefers-reduced-transparency` halves it). The panel is
  `isolate; overflow: hidden`; the chips stay `relative` above the canvas.
- No entrance choreography: the page simply is (no load reveal, no scroll
  listener, no soft focus). Motion is the films, the live canvases, the
  principles' scroll-timeline word reveal, the figure's wipe and hover
  answers.
- The landing is one organism with shared organs (all vanilla modules):
  - `senses.ts` — the nervous + endocrine system. ONE sensorium (pointer,
    scroll, visibility, reduced motion) and ONE heartbeat rAF that ticks
    every subscribed organism (`senses().subscribe({ tick(dt, tempo) })`).
    Canvas creatures NEVER register their own rAF, pointer, scroll,
    visibility or reduced-motion listeners — they read `senses()` on each
    tick (a local pointermove on a hover target, like the shake's, is a
    nerve ending, not a second sensorium). Hormones: `arousal` (pointer
    speed, ~4s half-life → `tempo` = 1 + 0.6·arousal speeds every clock),
    `drowsy` (45s idle, 30s ramp → organisms halve fps and thin density by
    35%; any input wakes), `daylight` (local-hour cosine). Metabolism: a
    governor EMAs the heartbeat's frame work and steps `quality`
    1 → 0.75 → 0.5 after 30 over-budget frames (9ms), back up after 300
    frames under 3ms; organisms scale fps by quality, and at 0.5 coarsen
    the cell by 1px and drop sizzle. No frame clock (tests, prerender) →
    no heartbeat, organisms still paint their static frame. Pure parts
    (`daylight`, `stepHormones`, `createGovernor`) are pinned by
    `tests/senses.spec.ts`.
  - `genome.ts` — ONE site seed (`SITE_SEED`, fixed per build, never per
    visit) and `seedFor(organ)`; every creature's seed derives from it
    (the band). The figure's "seed 512" and the Build panel's slider stay
    literal because the page displays those numbers.
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
  look, one drawImage per frame instead of one fillRect per cell. It rides
  the `senses` heartbeat (subscribes while its own IntersectionObserver says
  it is on screen), paints at `fps` × quality × drowsiness, advances its
  clock by `tempo`, reads the shared pointer and scroll, DPR clamp,
  ResizeObserver rebuild, static single frame under reduced motion (and
  the sizzle flicker off), eased pointer body and eased
  `density`/`hoverDensity` (hover = thicker dither), `scroll` parallax, and
  `setAvoid(rect)` — a smoothstep exclusion so art yields to text. The
  raster is the pure `rasterize()`; new behaviour goes there (testable
  headless), never into a second per-cell loop.
- Films (`ClayzoFilm.vue` over `public/films/<id>.json`) are the page's
  Clayzo motion: documents built by `landing/films/` (hero, studio, reel,
  catalog and dawn — the stage's five tabs) and played
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
  background is TRANSPARENT, so a film lies on whatever ground holds it —
  the stage — with no black box). Scatter is
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
  control (WCAG 2.2.2) — the stage's film shows its `FilmChip`
  (`chip`: a round glass icon button in its corner; with slot
  text it becomes a pill with a timecode); `FilmChip` is a toggle with a stable
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
  Portrait hover is the `pixel-shake.ts` disturbance (vanilla, sibling of
  `dither-field`): each face canvas holds its crop at NATIVE art resolution;
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
  (Vue 3 · Svelte 5, hairline `.micro`) left; one row of
  bar-separated links right (`FOOTER`; 28px hit areas); under it the
  copyright line (year · dither-ui.com · `v<version> · MIT` · "Films made
  with Clayzo ↗"); then the engraved wordmark.
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
- Wells running live kit canvases carry the live chip (`.live micro`: an
  `.led` + `live · 12 fps`), stating HONEST data: films and plates never
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

- `tests/dither-field.spec.ts` runs the engine's pure raster headless
  (Bayer ranks, quantize monotonicity, determinism, ramp coverage, avoid
  rect, pointer ignition, density scaling) — jsdom has no canvas, so the
  mount path is checked in the browser walk only.
- `tests/films.spec.ts` is the films' guard AND generator: the SkSL lookup
  evaluated against the kit's matrix, one uniform per ramp level, the
  uniforms in the effect parameters' order, and per
  film a valid deterministic document with a `still`, a frame-aligned loop
  and byte-equality with `public/films/<id>.json`. `npm run films`
  (`rs test -u`) rewrites the documents after a builder edit; review frames in
  a browser (the player seeked to the beats) before committing — the
  Clayzo CLI's render/review need an account, playback does not.
- `tests/landing-facts.spec.ts` recounts `COMPONENT_COUNT` in `facts.ts`.
- Browser walk after changes: the landing at desktop AND phone widths (no
  horizontal scroll; the band's tabs sharing the width under 760px), the
  h1 and the keys above the fold at 1440×900, 1280×800 and 1920×1080,
  each stage tab mounting its
  film over its stand-in with the round chip pausing it and the loupe
  under the cursor, reduced motion holding the film's still with the chip
  on play, the Build slider re-seeding its badge, emote hover, a principle
  re-staging the figure on hover, keyboard focus AND scroll (its words
  lighting in reading order; still under reduced motion), the directory tabs'
  underline under the picked tab, the agents panel's hover thickening, canonical
  and legacy docs deep links (`/docs/avatar`, `#/docs/avatar`), and
  Studio deep links (`/studio#new/pie`, `#/studio/new/pie`) each
  create/select exactly one artboard.

## Child DOX Index

- none
