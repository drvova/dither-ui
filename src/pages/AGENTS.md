# pages — landing, docs, studio, play

## Purpose

The routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction (the user's picks): the page is PRINTED in the dark, ALWAYS,
  whatever theme the docs or the Studio saved: one bone ink on obsidian
  with a fine grain inside a hairline frame,
  and colour only in the kit's own art, which keeps its Bayer screen. It
  wears a reference print site's TASTE, never its devices (the user's
  call: it must not read as a copy; see root `AGENTS.md`). The dither and
  `--font-mono` stay the signature; it keeps the
  chrome display type and the chrome primary key in the dark finish of
  the site voice (`app/styles.css`, see `src/AGENTS.md`). Its HERO is our
  own (the statement beside a live print the kit makes); under it, the page layout the user picked from a reference,
  kept unnamed (see root `AGENTS.md`): sections under a title with a lead
  beside it, a bento of example cards, a stage of what an ask makes,
  columns, a centred install, link columns over a giant wordmark. Never a
  reference's hero, art, devices, assets, marks, names or words: filled
  with the kit and our own copy. The user's slop bans (root `AGENTS.md`)
  hold here as lifted for the print: the hairline frame is the page's
  only rule, and the kit's art (the poster among it) may print more than
  two inks. Otherwise: no tags,
  no italic or slanted type, no negative tracking, no over-detailed UI, no
  other dividers, two inks (`--ink`, `--ink-3`) on two grounds (the obsidian,
  `--surface`) with no alpha tints, no bordered containers, no diagrams,
  no code paths, tool names or commands as labels, no numbered sections.
  Still banned too: red (the kit's ember is the one warm light: brand
  core, install prompt, the agent's checks, glyphs in "What's inside"),
  an eyebrow over a title, and in copy middle
  dots, em dashes and arrow-ended links. Additions must remove something
  or justify their presence.
- Copy and markup follow the design.how bans the user picked: sentence
  case for headings, keys and links, no uppercase anywhere in the page's
  own copy; every link names where it goes (an
  external one says "(opens in a new tab)" to screen readers). No space
  is left empty. Everything that moves is the kit itself (real
  components, hands on); no film player or animation runtime ships.
- The landing layer lives ONCE in `chapters.css` (plain CSS under
  `.landing`, imported by `LandingPage`) over the site voice (only
  `.nav-a`, `.led`, `.chrome-type` and `.key-chrome` from it): the ground
  on `:root:has(.landing)` (obsidian `#101214`, bone `#e4e1d8`, the muted
  bone `#9c998f` at AA on both grounds, `color-scheme: dark`), so what the
  page teleports to the body (the film's dialog) is printed too; the dark
  theme stays on (`index.html` ships `class="dark"` and `LandingPage`
  re-adds it on mount, since a light theme saved on the docs or the Studio
  persists on `<html>` in this one SPA); the two inks mapped to theme
  tokens (`--ink`, `--ink-3`), `--surface` (the one raised ground, 7% of
  the ink mixed into the obsidian) and `--signal` (the dark theme's ember,
  8.6:1 on the obsidian); the grain (a 96px PNG tile of single cells a
  tone under and over the obsidian, never a grid); the frame (`--frame`,
  a fixed hairline down each side of the page's column from 900px, above
  the page, never taking a pointer); the section head (`.sec-head`: the
  `.section-title` left, in the display face (Michroma 400,
  `clamp(1.6rem, 3.4vw, 2.75rem)`) cast in `.chrome-type`; `.sec-side`
  right, on its baseline, a `.sec-lede` and a `.more-link`; stacked under
  900px), `.lead` and `.more-link` (an underline that inks on hover, a
  24px target through padding cancelled by a negative margin), `.key` (a
  filled shape on `--surface`, never a ring), `.seg` (`aria-pressed`
  buttons, quiet labels, the pressed one filled with `--surface`), and
  `[id]` scroll margins (76px) clear of the header. A card or panel whose
  own ground is `--surface` resets `--surface` to the page's ground on
  what it holds, so its keys and pressed segments stay shapes. Page geometry (`--page` 80rem, `--rhythm`) lives on
  `LandingPage`'s `.landing`; the sections are one flex column on it.
- Header: a floating capsule (`--surface`, `--float-shadow`, no rim), sticky 8px
  under the top and centred (up to 48rem): the 13px diamond mark (ember core) + "dither-ui", the `.nav-a`
  links (Components → `#examples`, Docs, Agents → `#ask`, GitHub under its
  mark in a new tab; Components/Agents drop under sm, GitHub under md) and
  the `.key-chrome` "Open studio". It MUST stay positioned with `z-10`:
  `main` is `relative isolate`, so a positioned sibling paints over a
  static header.
- Hero (`Showcase.vue`, our own): the first screen's height under the
  header (`clamp(34rem, 100svh - 64px, 52rem)`) on the page's own ground,
  holding on the page width the statement beside the print (columns
  1 : 1.2, even from 900 to 1199px so the keys keep one row). Left
  (`.statement`): the h1 in the display face (Michroma 400) and chrome at
  display size (`clamp(2rem, 3.9vw, 3.5rem)`, two or three short lines),
  the lede (three or four lines), the keys (`.key-chrome` "Open the
  studio", `.key` "Read the docs" and "Watch the film" under the Play
  glyph, which opens the trailer; `TrailerDialog` lives in the hero),
  then a quiet line of what the kit works with (`WORKS`: Vue 3, Svelte 5,
  Tailwind, StyleX, CSS Modules, CSS, each under its mark, after "Works
  with"). Right, in `.print-col`: the PRINT, a live `DitherPoster` (seed
  5, cell 4, `INKS`: the kit's blue, the ember and the page's bone ink;
  the ember diamond whole on the blue, half knocked out in bone, the open
  cells showing the obsidian like a print on black stock; its screen
  slides 1.5 cells a second inside the mark) as a portrait sheet (4:5, at
  most 30rem wide) set on the obsidian at the column's right edge with
  breathing room above and below, square cornered and flat: never a
  panel run to the frame or under the header (that is the reference's
  hero). Its pause ("Pause the print") sits on its top right corner. No
  component tour, slides or picker in the hero (the user's call: they
  took the love out of it); the components live in the bento. Under
  900px the statement comes first and the print takes the width under
  it, landscape (5:4); on a phone both keep the page's 16px gutter. The
  h1 AND the keys must clear the fold at 1440×900, 1280×800 and
  1920×1080.
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
  bitmap face drawn as crisp SVG cells with a seam: the footer's brand
  (`cell` 2, `seam` 1/2, `decorative` inside the home link, whose name is
  "dither-ui"). A string with a glyph the face lacks throws; every string
  the page sets is covered by `tests/pixel-type.spec.ts`.
- Facts are claims: `facts.ts` holds `COMPONENT_COUNT` (the examples'
  lede) and `RUNTIME_DEPS` (the packages beside Vue, which the install
  bar's commands are built from); `tests/landing-facts.spec.ts` recounts
  the first from `dither-kit/tailwind/index.ts` and holds the second to
  the kit's required `peerDependencies` (a styling layer's optional one
  aside); section counts come from `hub.ts`. A change that moves one
  fails until the page says it.
- Examples (`Examples.vue`, `#examples`, "Every component, live."): a
  section head (the component count from `facts.ts`, "See every section in
  the docs"), then the bento: `BENTO` (`hub.ts`), nineteen live kit
  components on a 12-column grid row by row: the 3D model (8, two rows
  tall, flush; `sampleWorld` of a seed on a picked ramp: blue, metal or
  ember, and "New model" for the next seed) beside the rating and the
  stat card; the area chart (8; one seed for every fill, "Roll a seed")
  and the button (its four fills and five hues); the slider (a dither's
  settings: cell size with ticks, contrast, each with its value), the pie
  chart and the avatars; the shader (flush; the kit's seeded sample, mono
  blue, a palette ramp or its own colours, "New shader" the next seed) and
  the ferrofluid (flush; blue, ember or grey); the styling card (8, flush,
  `ExportScene.vue`: one snippet rendered live beside its code in the
  picked system through `restyle`, StyleX first; its code alone when the
  card is narrow, a size container) and the slide action ("Slide to
  deploy", its count); the bar chart and the meta balls; progress, the
  radar chart and the hold action ("Hold to purge cache", its count);
  silk and the decrypted text. The shader's WebGL engine, the
  translator's utility map and the fluid's engine are async chunks a
  card loads as it nears the viewport (one IntersectionObserver, 600px
  ahead; without one, at once); their card art keeps a wrapper so the
  flush rule never stretches the pause chip. The demos speak the kit's
  blue, the ember for a second voice and grey for a third (avatars
  `color="blue"`, the silk and meta balls on blue stops; the button's hues
  are its subject); no chart grid. Two columns under 1024px (the wide
  cards and the halves span both, the rest pack densely), one under
  640px. A card is the raised ground (`--surface`, no border, 20px
  radius) holding its art over its name, the link into `/docs/<id>` (no
  family label). Interactive art keeps its own controls, so the card
  itself is never a link; on flush art the pause chip comes before the
  tools in the DOM, as it sits above them.
- `hub.ts` is static data (the landing never loads the docs IA): `FAMILIES`
  (every docs family and its size), `DOCS_FAMILIES` (the five big
  families, a line each and the section each opens on) and `BENTO`, held
  honest by `tests/hub.spec.ts` (families and counts equal `GROUPS`, every
  card and first section is a section of the family it names).
- Ask (`#ask`, "Your agent builds the screen."): a section head ("Read the
  agent skill"), then `AgentStory.vue`, one agent session played as the
  page scrolls: a stage pinned under the header (`--pin`, at most 30rem)
  for a run of a notch of scroll (40svh) per step, seven steps
  (`story.ts`). The stage is one raised ground: left, the screen the
  agent lays out (the page's ground, no ring or handles) building row by
  row (the heading and count, the meter, the switch; every part a live
  kit component), and before it lands a line saying where it lands;
  right, the ask as a sentence in ink, then `DOES`, what the agent does in
  words, each line under the ember check as it happens: reads every
  component and its props (`get_registry`), lays out a Deploys screen
  (`add_screen`), writes it as a Vue file (`get_code`), renders it as an
  MP4 (`export_video`). No call times, arguments, tool names, paths or
  commands show. The step is the marker crossing the viewport's middle
  (one IntersectionObserver, armed after the markers render; no scroll
  listener). What has not happened yet keeps its place, hidden and out of
  reach, except the screen's switch: a real control, it keeps its tab stop
  whatever the scroll (out of the pointer's reach until it shows), and a
  keyboard that reaches it lands the whole screen at once. Under 900px, or without an observer, nothing pins: the whole
  session shows at once, the screen over the session. Screen readers get
  the whole session as a caption; the stage is decoration. A screen is
  made ONLY of registry components (`add_screen` lays them out), so every
  line is true.
- Inside (`#inside`, "Three parts, one engine."): three columns (one
  under 900px), each under its kit glyph in the ember with a paragraph and
  its link: the kit, the Studio, the agent bridge (with the harnesses
  `bridge/dither-bridge.mjs` knows, its `HARNESSES` ids and names in
  order, each under its own mark; keep in sync, `tests/marks.spec.ts`
  checks it). Under them the five big families (`DOCS_FAMILIES`): five
  columns (three under 1024px, two under 640px), each the family's name
  and size as the link to its first section, and its line.
- Install (`#install`, "Copy one folder. Every pixel is yours."): the
  head centred (the lede, then the `.key` "Copy agent prompt" through
  `DitherClipboard`: the prompt names this origin's `SKILL.md`, the degit
  command, the four packages and the alias), then `InstallBlock.vue`: a
  box on the raised ground whose top row is the `.seg` step picker (the
  kit's Folder glyph, then npm, pnpm and Bun's own marks) and the Copy
  key (both filled with the page's ground), the command under them in
  mono with the ember `$`. A copy is ONE gesture: while copied the
  command shows selected (the page's ground behind it) as the key's label
  rolls to "Copied" under a check; both let go together; reduced motion
  swaps both at once. Its four steps (degit folder + npm/pnpm/bun deps)
  stay in sync with `docs/install.ts` `INSTALL.vue` (the landing never
  imports the docs). Then one centred line for Svelte 5
  (`dither-kit-svelte`, the quick start).
- Marks: tool logos (the package managers, Node, Vue, Svelte, Tailwind,
  StyleX, CSS Modules, CSS, GitHub and the coding agents) come ONLY from
  `src/shared/ui/marks.ts` through
  `ToolMark`, one-colour in `currentColor` beside the tool's name, never
  restyled or dithered; everything else is a kit glyph (`DitherIcon`).
- No entrance choreography: the page simply is. Motion is the live kit
  surfaces. Pause chips (`PauseChip.vue`, WCAG 2.2.2): every surface that
  moves by itself for more than five seconds carries one in its corner,
  named for it ("Pause the print", "Pause the model", "Pause the shader",
  "Pause the fluid", "Pause the meta balls", "Pause the silk"),
  `aria-pressed` while paused, wired to the surface's `paused` (the
  model's turn is its `auto-rotate`): a disc of the page's ink with its
  glyph in the ground. Chips stay under reduced motion: the model and the
  shader keep moving there.
- Footer (on the page width, no rule above it): the brand (the pixel
  wordmark in the home link, one line, GitHub under its mark) beside three
  link columns
  (`COLUMNS`: Get started; Docs, the big families each with its size; For
  agents: SKILL.md, llms.txt, the registry, the Studio; 28px hit areas), the
  copyright line as separate items (the year and dither-ui.com,
  `v<version>`, MIT license), then the line-screen wordmark. Three columns
  under the brand under 900px, two under 640px.
- Footer signature: the line-screen wordmark (`LineWordmark.vue`):
  "dither-ui" in the display face across the page width, filled by 24
  rows of ink that thicken toward the baseline (30% of the row's pitch at
  the top to 92% at the foot, each bar at the foot of its pitch), a
  vertical ramp printed through a screen of lines. One SVG: the text is a
  `clipPath` (its `textLength` holds the word to the box's width whichever
  face has loaded) and the rows are rects in `--ink`; flat, one ink,
  decorative (`aria-hidden`), nothing that glows or moves.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 in ink,
  `text-lg`, + optional "Open in the Studio") → muted description →
  `DemoCard` (Preview/Code tabs as machined segments in a `.track`, the
  picked one `.ring-on`; Inspect → the workbench, Code → the source panel, a
  `.hardshell` cut at 12px) → optional picker gallery (an `h3` in
  sentence case, 12px muted, + grid) → `PropsTable`, a spec sheet (a
  `.hardshell` cut at 10px, its column heads `.spec`; a row's `default` is
  its value as code; "" prints "none"). The preview frame is a gel well
  (`.demo-well` + `.rim`: the pebble radius, the well's ground, a gloss on
  its top edge, recessed into the page) whose ground MUST stay one plain
  colour (the workbench's contrast reads the background through
  `backgroundBehind`, which gives up on any ancestor's image), that never
  clips (the workbench draws past it) and keeps its 1px border, clear
  (captures add it). Its padding is 16px on phones and 40px from sm (the
  docs column is 16px from the screen's edge on phones, 24px from sm, as
  the user's design system sets), and every demo fits its well from
  320px up: a wide one (pagination, the bracket, the ASCII art) is
  centred inside an `overflow-x-auto` row by an `mx-auto w-max` box, so
  it centres while it fits and scrolls on the narrowest phones; a fixed
  width becomes `w-full max-w-*`. Chips (framework, styling, Inspect) sit
  in tracks.
- Docs copy follows the landing's bans: no em dashes or middle dots in
  prose, prop `type` notes as `type: note` or `type (note)`, no uppercase
  or tracked label, no arrow-ended link; a snippet's copy matches what its
  demo renders (change both together). Kit default strings quoted in a
  table stay the kit's (the marquee texts keep their dots). The only
  uppercase in the docs' own chrome is `.spec` (the sidebar's group
  counts, the API table's heads) and `.speed-tag` (the title's tags).
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
  links. A `CodeBlock`'s copy chip takes its own band over the first line
  under sm (a long first line ran under it there).
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
- Chrome: the header is the site's floating `.capsule` (`.docs-capsule`,
  44px in a 56px band so the rails' `top-14` and the scroll-spy line
  hold; its smoked polymer at 93% under 640px, where dense tables pass
  under it); the toggles in it are tracks, the picked one `.ring-on`,
  Search a `.nav-pill`, "Open studio" the `.key-chrome`; the "Docs" label
  shows from xl, so the capsule fits from 360px up. The search
  hint names the visitor's modifier (`⌘K` on Apple platforms, `Ctrl K`
  elsewhere — the handler accepts both). The brand carries the landing's
  7x7 diamond mark, and the studio link shows from sm. The Vue/Svelte
  switch carries the tools' marks
  (`ToolMark`), the styling switch their names (`STYLING_LABELS`), sound
  and theme the kit's glyphs (Volume/VolumeOff, Sun/Moon), GitHub its
  mark. The sidebar's groups sit under their glyphs (`GROUP_ICON`), each
  with its section count as a `.spec`; its links and the "On this page"
  rail's are 25px targets at a 27px pitch. The page title is the h1
  "Documentation" in the display face (`font-display`, 1.6rem) and
  `.chrome-type`, no eyebrow; on its
  baseline, the kit's spec as `.speed-tag`s (the section count, Vue 3,
  Svelte 5, Tailwind or StyleX). The "Browse sections" disclosure is a
  `.nav-pill`. At xl the rail right of
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
  borders, cursor + hover effects; a section with its own state lives in
  its own file, as `TransitionSection.vue`, the page transition's stage,
  mounted where the nav orders it; so does `backgrounds/PosterSection.vue`,
  the poster with a seed to roll and its screens, and
  `utils/ScreensSection.vue`, `print-screens`: one `DitherScreen` around a
  chart, an avatar and a gradient, its screen picked by chips). New
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
  section labels in sentence case, `.ring-on` pressed states, neutral
  focus borders, and the look's materials: the floating toolbars, the
  selection toolbar and the zoom bar are `.capsule`s (their tools
  machined, 8px),
  the Library key and the empty canvas's "Add an artboard" are the
  `.key-chrome`, the Layers/Agent/Inspector panels and the dialogs
  (export, video, shortcuts) are `.hardshell`s (12px cut on panels;
  nothing in them pops out, the context menu is teleported), the video
  dialog's download is the `.key-chrome`, and the menus (project, library,
  context menu) are rounded cards with a `.rim`. Every glyph button is a
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
- Studio is canvas-first: Toolbar floats over the full-bleed canvas (a
  `1fr auto 1fr` grid, so the Library key stands at the true centre
  between the two capsules); Layers,
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

- `tests/landing-facts.spec.ts` recounts `COMPONENT_COUNT` in `facts.ts`
  and holds every count the site states to it (`index.html`, the README,
  SKILL.md, `llms.txt`'s source, the Studio film's counters, which also
  count the sections and the Backgrounds);
  `tests/hub.spec.ts` holds `FAMILIES`, `DOCS_FAMILIES` and `BENTO` to the
  docs' `GROUPS`; `tests/pixel-type.spec.ts` every string the pixel face
  sets.
- `tests/marks.spec.ts`: every harness the bridge starts has a mark under
  its id and name, the landing lists them in the bridge's order, every
  mark is path data in a positive box.
- Browser walk after changes: the landing at desktop AND phone widths (no
  horizontal scroll), the h1 and the keys above the fold at 1440x900,
  1280x800 and 1920x1080 with the print beside them, the
  obsidian, its grain and the frame's hairlines whatever theme the docs
  saved (dark on a light preference too),
  "Copy agent prompt" (the install's head) copying a prompt that names
  this origin's SKILL.md, no uppercase label, eyebrow, middle dot, em dash
  or arrow link in the rendered copy, every svg decorative or labelled,
  "Watch the film" (the dialog opens with focus in it, the film plays,
  Escape closes it, focus returns to the key, the video leaves the DOM),
  the bento's rows whole at 1440, 800 and 390px with every card drawn and
  its controls working (the model's ramps and "New model", "Roll a seed",
  the button's fills and hues, "New shader" and its outputs, the fluid's
  palettes, the styling systems, the slide and hold counts, the sliders'
  values, the rating), the lazy cards loading as they near, each pause
  chip stopping its surface,
  the ask story pinned and stepping its lines and the screen's parts as
  the page scrolls (the whole session at once under 900px), the "Works
  with" marks, none of the slop bans in the rendered page (no tag, italic
  or negative tracking outside a kit component, no rule but the frame, no
  bordered container), the header capsule floating over the page with an anchor
  landing clear of it, reduced motion (the surfaces
  still, the film waiting on its poster), and the workbench readings over
  the page (the inspection runner's contrast, audit and Tab walk) clean;
  canonical and legacy docs deep links (`/docs/avatar`, `#/docs/avatar`),
  and Studio deep links (`/studio#new/pie`, `#/studio/new/pie`) each
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
