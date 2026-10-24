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
  says "(opens in a new tab)" to screen readers). The docs and the Studio
  follow them too (see their sections). No space is left
  empty: a column or flank that runs short gets real content (a fact, a
  live kit surface, a step), never filler. Everything that moves is the
  kit itself (the user's call after the trailer: real components, hands
  on, never drawings of them); no film player or animation runtime ships.
- The landing layer lives ONCE in `chapters.css` (plain CSS under
  `.landing`, imported by `LandingPage`) on top of the SITE voice in
  `app/styles.css` (`.nav-a`, sentence case site-wide, `.nav-pill`,
  `.led`), which the landing
  uses directly: ink levels mapped to theme tokens
  (`--ink`, `--ink-2`, `--ink-3`, `--line`, `--well`), `.display` (mono
  500, tight), `.section-head` (the `.section-title` — the
  page's second size, mono 500 up to 2.6rem — and a `.more-link` naming
  its destination on its baseline; under 560px the link sits under the
  title, which beside it squeezed to four lines), `.panel` (hairline, 12px — the docs'
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
  hairlines) holding, on the shell, the statement beside the stage. Left
  (`.statement`): the mono h1 at display scale
  (`clamp(2.2rem, 4.2vw, 3.25rem)`, two lines in its column), the lede,
  the keys (`.key-primary` "Open the studio", `.nav-pill` "Read the
  docs" and "Watch the film" under the Play glyph, which opens the
  trailer), then the facts strip under a hairline (`.facts`, a `dl`: the
  component count, the section count, the packages beside Vue; each
  number beside its kit glyph, hairlines between, never cards). Right:
  `HeroStage.vue`, the kit by hand as the trailer shows it: one real
  component at a time in an 8:5 `.thumb` well (a size container), its
  name top left on a chip of the well's ground, with the controls its
  docs demo has (`SCENES`: button with its fills and five hues, slide
  action, hold actions, text pressure, ferrofluid with its palettes; the
  fluid's engine an async chunk). Under the well a `.seg` picker and the
  tour's progress hairline, then a caption (the scene's glyph, one line,
  a `.lead` to its docs section). The tour advances on the progress
  rule's CSS `animationend` (6s, no timer), paused while the stage is
  hovered or holds focus; its pause chip stops it, and picking a scene or
  using one (a pointer down or a key other than Tab inside the well) stops
  it on that scene; under reduced motion it starts paused. A new scene
  dissolves in through `DitherReveal` (cell 6, 0.6s; shown at once under
  reduced motion); the first scene simply is (manual progress 1), and it
  is the only scene in the static page. Under 900px the statement comes
  first and the stage takes the band's width. The h1 AND the keys must
  clear the fold at 1440×900, 1280×800 and 1920×1080.
- The trailer (`TrailerDialog.vue`): the kit's `DitherDialog` (focus
  trapped and handed back, Escape and the backdrop close it) titled "The
  dither-ui film", its description the film in words (no speech in it).
  The `<video>` exists only while the dialog is open: `public/trailer/`
  `dither-ui.mp4` (H.264 + AAC) first, `dither-ui.webm` (VP9 + Opus) for a
  browser built without H.264, `poster.webp`; it autoplays (opening it
  was the ask) except under reduced motion, where it waits for play.
  Retake all three from the trailer's edit when the film changes (1080p,
  each about 8 MB).
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
  `$`, a hairline Copy through `DitherClipboard`. A copy is ONE gesture:
  while copied the command shows selected (a breath of ink behind it,
  padded by a shadow so no glyph moves) and the key is ringed (the
  `.ring-on` look) as its label rolls to "Copied" under a check; both let
  go together, the selection stepping out in three; nothing kicks, slants
  or draws over the bar, and reduced motion swaps both at once. The steps
  under it sit in glyph squares (Copy, then Check once copied; Terminal;
  Code) and advance on copy; "Source on GitHub" carries
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
  `LineChart`) and Video (Film; the docs' stage scene in a `DitherStage` at
  12fps: an aurora sky and two hills drifting in container units, a moon
  on its arc, with its pause chip, into `/docs/stage`); live kit canvases
  carry the `.live` chip; C — lists
  into the docs under `.list-h` headings (the shelved families biggest
  first, each under its glyph, its count in its own element, then the
  five Handbook topics under theirs; notes align with the labels), a
  hairline off the others. The three columns
  end within a few px of each other at desktop: content that changes one
  column's height is balanced in the others.
- Directory (`Hub.vue`, `#directory`): a head (`.dir-head`): left the
  title ("n sections, every one of them live."), one line and "Browse all
  sections"; right the kit's `BarChart` of the docs (13rem): one row,
  every `FAMILIES` entry its own series in sidebar order, the shelved
  families in a hue and the rest grey, a hover tooltip; one column under
  760px, the chart under the text. The chart is a map of the shelf: the
  picked tab's family is the selected series (`defaultSelectedDataKey`;
  the chart is keyed by the tab, so the kit's entrance is the change) and
  a click on a shelved family's bar picks its tab (`isClickable` on the
  shelved bars only; clicking the picked one again goes back to Explore).
  The tab row is the keyboard's way. Then a `.panel` — the kit's own
  `DitherTabs`
  (grey; badges = family sizes; the row 12px in from the panel's top, as
  flush its labels and badges ran into the hairline; on a phone it
  scrolls sideways, its underline with it) over a horizontal snapping shelf of
  `.thumb` cards that deep-link to `/docs/<id>` (the section's seeded
  `DitherAvatar` identicon — decorative, no entrance — its family, its
  name, up to three lines, its path). The shelf shows WHOLE cards, as many
  as its width holds (a size container: five, four, three; the scroller
  ends 14px in from the panel's edge so a view holds exactly them), and on
  a phone one card with the next one's edge running off the panel; nothing
  ever lies over a card (a fade and a knob over the last card read as
  garbled text). Under it a foot: an "All n …" `.lead` (all sections on
  Explore) and, while the shelf runs past a view, the pager: two real,
  named buttons ("Earlier cards", "More cards"), each disabled at its end,
  paging a whole view (the cards it shows and the gap after them). Under
  that, inside the panel, `TOOLS`: what every docs
  preview offers (Inspect, Edit and run, Hand it to your agent, each
  under its glyph: Crosshair, Code, Bot), three columns split by
  hairlines, each with the section that shows it. The tab row scrolls
  sideways on a narrow screen, so each edge with more past it shows a
  fade in the panel's ground and a chevron that pages it by 80%; the
  chevron is the pointer's way (touch swipes, the keyboard's focus
  scrolls), hidden from assistive tech, and only it takes the pointer.
  `rail()` in `Hub.vue` follows both scrollers (scroll and
  ResizeObserver, no polling; instant under reduced motion). `hub.ts` is static data (the landing never loads the docs IA —
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
  docs that covers it (`PRINCIPLES`, each a sentence or two, no dashes).
  Under 760px the well is a strip across the top of the panel (the
  lattice beside its caption: a container query in `EssayFigure`, the
  well's content 14rem and up; the desktop well's is 212px) pinned to
  the top of the screen while the statements pass under it, so the staged
  statement and its scene stay in view together. The words light as each statement rises (after
  MONOGRID): CSS scroll timelines only — `view-timeline-name: --principle`
  per statement, every `.w` animating `--ink-3` → `--ink` over its own
  slice of the rise (`--p` = its place in the line), both ends ≥ 4.5:1 so
  a half-lit line is still text; no motion under reduced motion or
  without `animation-timeline` support. The STAGE is where the figure
  is: on a wide screen the statement crossing the viewport's middle (ONE
  IntersectionObserver on a zero-height root line, no scroll listener);
  under 760px, where the figure is the strip at the top, the statement
  sitting just under the strip (the topmost one at least half inside a
  band from the strip's foot to the middle; the observer is made again
  when the layout flips), and there a line's words finish lighting as it
  arrives under the strip, not at the middle. Hover or focus stages a
  statement too; the staged one takes an ink index and an ink rule.
  The figure (`EssayFigure.vue` over `essay-figure.ts`): a 24x24 lattice of
  576 `<rect>`s built once at setup (markup, prerender-able);
  `stageCell(stage, x, y)` paints each scene through the house
  `ditherTone`/`rankOf` rule (defined there, on the kit's 4×4 matrix; 01 matrix ramp · 02 bars + avatar ring · 03
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
  on the well, what the ask makes: the Studio's dotted canvas holding the
  ask in the composer's idiom (`›`, `ASK`) and an artboard (its name over
  its frame) of live kit parts, a `DitherHeading`, a count beside a
  `Sparkline`, a `DitherSwitch` with its visible label and a
  `DitherButton`; under it a solid strip (the harness keeps its own login,
  the Studio never asks for a key). The steps set the panel's height. One
  column under 760px.
- The close (`LandingPage.vue`, `.dawn`, after the agents): a FULL-BLEED
  band between hairlines, the last line ("Copy one folder. Every pixel
  is yours.") and its keys ("Read the quick start", "Open the studio") on
  the shell, then the kit's `DitherLightRays` across the band (up to
  100rem, its top edge fading in and its sides past that; `clamp(12rem,
  26vw, 24rem)` tall,
  12fps), its pause chip lined up with the shell. A hand on the keys
  (pointer or focus) brightens the rays (`glow` 1.5 to 2.4).
- Marks: tool logos (npm, pnpm, Bun, Node, Vue, Svelte, GitHub and the
  coding agents) come ONLY from `src/shared/ui/marks.ts` through
  `ToolMark`, one-colour in `currentColor` beside the tool's name, never
  restyled or dithered; everything else is a kit glyph (`DitherIcon`).
- No entrance choreography: the page simply is (no load reveal, no scroll
  listener, no soft focus). Motion is the live kit surfaces (the stage's
  tour and dissolves, the wells, the rays), the principles'
  scroll-timeline word reveal, the figure's wipe and hover answers.
- Pause chips (`PauseChip.vue`, WCAG 2.2.2): every surface that moves by
  itself for more than five seconds carries one, a round glass toggle in
  its corner with its own name ("Pause the component tour", "Pause the
  stage", "Pause the light") and `aria-pressed` while paused, wired to the
  surface's `paused`. Where reduced motion already holds a surface still
  (the stage, the rays) its chip is hidden.
- `senses.ts` is the landing's ONE heartbeat (vanilla): one rAF ticks
  every subscribed organism (`senses().subscribe({ tick(dt) })`, today
  the portraits' shake), paused while the tab is hidden or under reduced
  motion, stopped when nobody is subscribed, dt clamped at 250ms. Canvas
  creatures NEVER run a rAF of their own (a local pointermove on a hover
  target, like the shake's, is theirs). No frame clock (tests,
  prerender) → no heartbeat; organisms still paint their static frame.
  Pinned by `tests/senses.spec.ts`. The figure's "seed 512" and the Build
  panel's slider are literal because the page displays those numbers.
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
  under reduced motion, touch pointers ignored. Faster strokes kick harder.
  The sheet itself loads only once the portraits are within a screen, so
  it never counts toward the page's `load`. `shakeRaster()` is the
  pure raster (`tests/pixel-shake.spec.ts`: identity at zero energy, pool
  locality, Bayer thinning, determinism). Emote reactions stay CSS-only
  (`.emote` + `.group:hover`); no JS timers on the landing.
- Footer (under a hairline): the pixel wordmark and the framework badges
  (Vue 3, Svelte 5, each under its mark: hairline, sentence case) left; one row of
  bar-separated links right (`FOOTER`; 28px hit areas); under it the
  copyright line as separate items with gaps (the year and dither-ui.com,
  `v<version>`, MIT license); then the engraved wordmark. Wrapped (under
  ~950px) the wordmark, the first link's text and the copyright line
  start on the shell's edge; under 760px the links are a grid with no bar
  separators (wrapped, they hung off the ends of rows) and the engraved
  mark spans the shell.
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
  `.led` + "Live at 12 fps"), stating honest data: only a well whose
  surface runs at that rate carries it.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 + optional
  "Open in the Studio") → muted description → `DemoCard` (Preview/Code tabs,
  Inspect → the workbench, Code → the source panel) →
  optional picker gallery (an `h3` in sentence case, 12px muted, + grid) →
  `PropsTable` (a row's `default` is its value as code; "" prints "none").
- Docs copy follows the landing's bans: no em dashes or middle dots in
  prose, prop `type` notes as `type: note` or `type (note)`, no uppercase
  or tracked label, no arrow-ended link; a snippet's copy matches what its
  demo renders (change both together). Kit default strings quoted in a
  table stay the kit's (the marquee texts keep their dots).
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
  `activeId` + `aria-current`; clean `/docs/<id>`, its directory form
  `/docs/<id>/` (where a static host serves the section's prerendered
  page) and legacy `#/docs/<id>` deep links all restore and remain
  shareable.
- Narrow chrome: under sm the Vue/Svelte switch shows its marks and Search
  its glyph (the words stay for screen readers), the studio pill drops (it
  lives on every chart section's "Open in the Studio") and the ⌘K kbd
  hides; the styling switch (on every card anyway) and GitHub (in the
  footer) return at lg. The section list is a grouped disclosure
  ("Browse sections" button with aria-expanded/aria-controls, group headings,
  two-column links, closes on tap) instead of the old flat wall of all ~220
  links.
- `scrollTo(id)` is computed `window.scrollTo` + a settle loop (re-align after
  motion stops, ≤8 tries, bottom-clamp aware): lazy demo reveals and
  content-visibility seeds move the target while the smooth flight is still
  running, and Chromium's `scrollIntoView` refused the short re-aligns — taps
  landed a screen short. Deep links keep the `jump()` path.
- Share cards (`docs/og-card.ts`, the art; `crawler-files.ts`, the cards,
  their embeds and the renderer page): a card is the page's title (ember
  stop) over the house dither in motion, the brand top left, a section's
  family as a hairline tag top right, its address under the title; a
  section's field of three seeded bodies stays out of the title's corner,
  the routes roll two horizons (SKY, then the kit's purple seed as a
  ramp) under stars. Every motion turns a whole number of times per loop
  (36 frames at 10 fps), so the GIF's last frame meets its first; the PNG
  is frame 0. Copy follows the bans (no uppercase, no eyebrow over the
  title, no middle dot or em dash, buttons that name where they go).
  `ROUTE_CARDS` holds the route cards' copy; their ids may never be
  section ids. Guarded by `tests/og-card.spec.ts` (loop, determinism, the
  clear title corner, the lattice, Bayer order, balanced wrap) and the
  share-card cases in `tests/crawler-files.spec.ts` (every page's embed
  under Discord's 3,000 byte cap with link buttons only, the oEmbed photo,
  each route head carrying its card's tags, the bans).
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
  "Open studio" (sm+). The Vue/Svelte switch carries the tools' marks
  (`ToolMark`), the styling switch their names (`STYLING_LABELS`), sound
  and theme the kit's glyphs (Volume/VolumeOff, Sun/Moon), GitHub its
  mark. The sidebar's groups sit under their glyphs (`GROUP_ICON`). The
  page title is the h1 "Documentation", no eyebrow. At xl the rail right of
  the content is "On this page": the section in view, its gallery headings
  and its API table, read from its DOM as the scroll-spy moves (headings
  inside a preview are the demo's), each a button that scrolls to it.
  Under it, Share (`SectionShare.vue`, a disclosure: `aria-expanded`, the
  name "Share this section"): opened, the section's share card playing
  (`og/<id>.gif`, loaded only then, hidden where no build drew it) and
  three copies with the copy sound and a polite announcement: the link,
  the card as a Markdown image and as an HTML image, each linking back to
  the section (absolute `dither-ui.com` URLs, so they embed anywhere). The
  footer: dither-ui.com, GitHub (its mark), `v<version>` and MIT license as
  separate items.
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
  `#new/film` builds the launch film (`addLaunchFilm`, see `src/AGENTS.md`):
  five kit frames and the film cut from them, selected.
- The Studio's chrome speaks the SITE voice, like the landing and the
  docs: `font-mono` on the page root (the context menu and the kit's
  dialogs, teleported to body, carry it on their own panels), the 7×7 diamond brand, `.micro` panel and
  section labels in sentence case, 12px hairline panels and toolbars, `.ring-on` pressed
  states, ink primary keys, neutral focus borders. Every glyph button is a
  kit icon (undo/redo, layers, properties, agent, theme, close, zoom, fit,
  replay, menus); the selection actions are a glyph and a sentence-case
  word (Duplicate, Group, Delete, Evolve, Reel, Data, Code, PNG, Video),
  the words hidden under 1024px with the name kept. Copy follows the
  landing's bans: no middle-dot separators (the Agent panel's status and
  key hints are layout items; its transcript markers stay the composer's
  glyphs), no em dashes, no uppercase label, no eyebrow (the phone notice
  is a plain h1). The artboard SURFACE
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
- `tests/landing-facts.spec.ts` recounts `COMPONENT_COUNT` in `facts.ts`.
- `tests/marks.spec.ts`: every harness the bridge starts has a mark under
  its id and name, the landing lists them in the bridge's order, every
  mark is path data in a positive box.
- Browser walk after changes: the landing at desktop AND phone widths (no
  horizontal scroll; the statement above the stage under 900px; at
  320 to 430px the principles strip pinned while the statements scroll
  with the staged one matching its scene, the footer's edges aligned), the
  h1 (two lines) and the keys above the fold at 1440×900, 1280×800 and
  1920×1080, the three columns ending level, no uppercase label, eyebrow,
  middle dot, em dash or arrow link in the rendered copy, every svg
  decorative or labelled, the stage's tour (it advances after 6s, holds
  while hovered, stops on a pick or a press inside the well, its chip
  pauses it, every scene works with its controls and dissolves in; the
  scene already shown never blanks when picked again), "Watch the film"
  (the dialog opens with focus in it, the film plays with sound,
  Escape closes it, focus returns to the key, the video leaves the DOM),
  the directory chart (a tab selects its bar, a shelved bar picks its
  tab, an unshelved one is not clickable), each pause chip stopping its
  surface, the rays brightening with a key hovered or focused, reduced
  motion (the tour paused, the stage and the rays still with their chips
  hidden, a picked scene shown at once, the film waiting on its poster),
  the agents panel's screen beside the steps with no empty band under
  either, the
  marks crisp at their sizes (install picker, harness chips, footer
  badges; the Studio's harness picker with the bridge running), the
  Build slider re-seeding its badge, emote hover, a principle re-staging
  the figure on hover, keyboard focus AND scroll (its words lighting in
  reading order; still under reduced motion), the directory tabs'
  underline under the picked tab (also after swiping the row on a phone),
  the scroll cues (the tab row's edges only where more lies past them, and
  none at desktop width; the shelf whole cards at 1440, 1024 and 700px,
  one and a peek on a phone, its pager landing the next view's first card
  flush and each button off at its end), canonical
  and legacy docs deep links (`/docs/avatar`, `#/docs/avatar`), and
  Studio deep links (`/studio#new/pie`, `#/studio/new/pie`) each
  create/select exactly one artboard (`#new/film` six: the film and its
  five frames).
- Docs and Studio copy scan (a headless page walk): the rendered text of
  `/docs` (every section) and of `/studio` with each panel and dialog open
  (layers, agent, library, project menu, code, video, data, shortcuts,
  context menu) holds no em dash, middle dot, uppercase label or
  arrow-ended link outside code, kit default strings and kit component
  looks; the docs header fits from 360px to 1280px; the "On this page"
  rail lists the section in view at xl, and its Share opens on the
  section's card playing and copies its link, Markdown and HTML.
- Share cards after a full `npm run build`: every id `window.og.ids()`
  lists has `dist/og/<id>.png` and `.gif` (the GIF's frames move and its
  first is the PNG's card, the ember stop and the mark's core included),
  `dist/embed/<id>.json` and `dist/oembed/<id>.json`, and a section page's
  head points at its own (Discord's Embed Debugger,
  discord.com/developers/embeds, reads a deployed URL as Discord will).

## Child DOX Index

- none
