# pages — landing, docs, studio, play

## Purpose

The routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction (the user's picks): the page is PRINTED in the dark, ALWAYS,
  whatever theme the docs or the Studio saved: one bone ink on obsidian
  with a fine grain, no frame or side lines (the user's call),
  and colour only in the kit's own art, which keeps its Bayer screen. It
  wears a reference print site's TASTE, never its devices (the user's
  call: it must not read as a copy; see root `AGENTS.md`). The dither and
  `--font-mono` stay the signature; it keeps the
  chrome display type and the chrome primary key in the dark finish of
  the site voice (`app/styles.css`, see `src/AGENTS.md`). Its HERO is our
  own (the statement beside a live print the kit makes); under it, the page layout the user picked from a reference,
  kept unnamed (see root `AGENTS.md`): sections under a title with a lead
  beside it, a bento of example cards, a stage of what an ask makes,
  columns, a panel of what it works with, a centred install, link columns
  over a giant wordmark. Never a
  reference's hero, art, devices, assets, marks, names or words: filled
  with the kit and our own copy. The user's slop bans (root `AGENTS.md`)
  hold here as lifted for the print: the kit's art (the poster among it)
  may print more than two inks. Otherwise: no rules or hairlines, no tags,
  no italic or slanted type, no negative tracking, no over-detailed UI, no
  other dividers, two inks (`--ink`, `--ink-3`) on two grounds (the obsidian,
  `--surface`) with no alpha tints, no bordered containers, no diagrams,
  no code paths, tool names or commands as labels, no numbered sections.
  Still banned too: red (the kit's ember is the one warm light: brand
  core, install prompt, the agent's checks, glyphs in "What's inside"),
  an eyebrow over a title, and in copy middle
  dots, em dashes and arrow-ended links. Additions must remove something
  or justify their presence.
- Voice: calm and procedural, warm with a wink (the user's call, after a
  playful reference site: its taste, never its words or devices). Copy
  says what the kit is and what to do next ("Copy the folder", "poke it",
  "ask for a screen") and may smile while it does ("undo takes it back
  when it gets ideas", "Printed one cell at a time"), never hype and never
  what it will feel like; every figure it states is read from the kit
  through `facts.ts` or `hub.ts`, never typed.
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
  tone under and over the obsidian, never a grid); the section head (`.sec-head`: the
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
- Header: the site's one header, `SiteHeader` (`widgets/site-header`),
  the landing's and the docs' alike: a floating capsule (the raised
  ground, `--float-shadow`, no rim), sticky 8px under the top and centred
  (up to 48rem, `--head` tall with its margin): the 13px diamond mark
  (`shared/ui/BrandMark`, ember core) + "dither-ui", the `.nav-a` links
  (`MENU_LINKS` in `menu.ts`: id, label, the band's line and the width it
  shows from; the page supplies only `HREF` by id, a `Record` the types
  hold whole: Components → the landing's `#examples`, Docs, Agents →
  `#ask`, GitHub under its mark in a new tab; each shows from md, GitHub
  from lg; the page's own link `aria-current`), a page's
  `tools` (the docs' search and, under lg, its sections key under the
  Book glyph) and the `.key-chrome` "Open studio" (from md). Under lg the
  menu key (the sheet's bands in miniature + "Menu") opens the menu: a
  native modal `<dialog>` filling the window, itself clear so the page
  shows wherever the wipe has not reached (focus on its close key, focus
  back on the key, the page held still), arriving as the kit's wipe down
  the screen on the spring (`DitherReveal`, `SHEET_WIPE`: 0.5s,
  `"spring"`). Every sheet's words stand on the header's lines (`--sheet-start`
  and `--sheet-end` in `site-header.css`, from the capsule's own gutter,
  width and padding: the brand mark's edge and the key word's, centred
  capsule included). The close key and Escape (the
  dialog's `cancel`, prevented) play that wipe back, the sheet rolling up
  from its foot before it shuts (`MenuPhase`: shut, open, leaving; at once
  under reduced motion); a taken link and the window reaching lg shut it
  at once. While a sheet stands it covers the page (`coverPage`, the kit's
  `engine/cover.ts`): every kit loop under it holds its frame and wakes as
  the sheet starts to leave, so the wipe is the one moving layer (the
  landing's menu went from 10 frames in its opening 900ms at 4x CPU to
  22). Its head is the header itself, standing where it stood
  (`SheetHead`, the one head of every full-screen sheet: the capsule and
  the brand unmoved, the key that opened the sheet turned to the close
  mark and "Close" in the menu key's place, on the ground, the sheet's
  first stop; the close mark is an X on the brand diamond's 7x7 grid in
  its hand, `CLOSE_CELLS` drawn by `BrandMark`'s `cells`, the ember at its
  crossing; the head keeps `SHEET_HEAD_FOOT` under the capsule so the
  first band's seam never bites into it); under it a band per link sharing the height,
  its name at its foot over a line of what is behind it (`note`; the
  studio's says it wants 1024px), each a step of the ink
  toward the ground (`bandInk(i, n)`: even steps from the full ink to
  `BAND_FLOOR` 64%, so the menu's four are 100/88/76/64%; the ground's
  colour writing on them, AA down to the floor held by
  `tests/theme-contrast.spec.ts`), then
  "Open studio" on the ember; where two bands meet the lower climbs into
  the upper through the Bayer matrix (`SEAM_MASK`, the kit's wipe engine
  at a fixed progress; `seamStyle(fill)` is the seam whole, placed, for any
  sheet's bands). A hovered, focused or pressed band's words lean in
  (8px, 12px pressed, on the spring, 350ms; the hover only under
  `(hover: hover)`, since a tap's hover sticks on a phone) and the menu key's bands
  part on a hover (none of it under reduced motion). A focused band rings
  in the ring ink with the ground inside it. `menu.ts` (fills, seam, wipe) and `site-header.css`
  (the capsule and the sheet) are the one table and stylesheet; the
  Svelte landing carries both byte for byte. It stays positioned
  (`z-40`): `main` is `relative isolate`, so a positioned sibling paints
  over a static header.
- Hero (`Showcase.vue`, our own): the first screen's height under the
  header (`clamp(34rem, 100svh - 64px, 52rem)`) on the page's own ground,
  holding on the page width the statement beside the print (columns
  1 : 1.2, even from 900 to 1199px so the keys keep one row). Left
  (`.statement`): the h1 in the display face (Michroma 400) and chrome at
  display size (`clamp(2rem, 3.9vw, 3.5rem)`, two or three short lines),
  the lede (three or four lines), the keys (`.key-chrome` "Open the
  studio", `.key` "Read the docs" and "Watch the film" under the Play
  glyph, which opens the trailer; `TrailerDialog` lives in the hero),
  then a quiet line of what the kit works with (`WORKS` in `facts.ts`: Vue 3, Svelte 5,
  Tailwind, StyleX, CSS Modules, CSS, each under its mark, after "Works
  with"). Right, in `.print-col`: the PRINT, a live `DitherPoster` (seed
  5, cell 4, `INKS` from `plate.ts`: the kit's blue, the ember and the page's bone ink;
  the ember diamond whole on the blue, half knocked out in bone, the open
  cells showing the obsidian like a print on black stock; its screen
  slides 1.5 cells a second inside the mark) as a portrait sheet (4:5, at
  most 30rem wide) set on the obsidian at the column's right edge with
  breathing room above and below, square cornered and flat: never a
  panel run to the page's edge or under the header (that is the reference's
  hero). Its pause ("Pause the print") sits on its top right corner.
  Under it the print stands over its own floor (`.print-floor`, 40px,
  out of the flow): the same poster at the same moment, turned over and
  thinned through `DitherReveal`'s down wipe held at a third of its travel
  (band 20 cells), so only the wipe's 40% and 20% steps show. A shadow
  cannot show on black; the floor is the print's own cells, never a tint.
  The column keeps 48px under the print below 900px for it. The
  statement signs off with the brand's moment (`.hero-brand`, 20px under
  the works line, `STAGINGS.hero`: the gather), its field the page's column
  (`.hero-in`, positioned): loose in the open rows under it (some cells
  under the print, which paints over them), thrown no higher than just
  above it, clear of the copy; it plays as the page opens and again under
  a resting mouse (`replay`), and the print (and its floor) hold their
  frame until it is home each time (`moving` holds, `settled` frees), one
  moving layer at a time. No
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
  browser built without H.264, `poster.webp`; it starts with `play()` in
  the opening tap's own tick (opening it was the ask, and iOS lets a film
  with sound start only from a gesture), `playsinline`, except under
  reduced motion, where it waits on its poster for play.
  Retake all three from the trailer's edit when the film changes (1080p,
  each about 8 MB).
- Pixel type (`pixel-type.ts`): a proportional 5×7 bitmap face, a string
  in and its lit cells out, with a lowercase set (four wide, x-height from
  the third row); the brand's lockup sets "DITHER-UI" in it and
  `PixelWord.vue` draws the parts' names. A
  string with a glyph the face lacks throws; every string the page sets
  is covered by `tests/pixel-type.spec.ts`.
- Facts are claims: `facts.ts` holds `COMPONENT_COUNT` (the hero's and
  the examples' ledes), `MATRIX` (the threshold matrix as the page writes
  it, read from `SCREENS`), `RUNTIME_DEPS` (the packages beside Vue, which
  the install bar's commands and the install lede's count are built from)
  and `SPECS` (the spec sheet closing the
  install: label and value rows on the raised ground, two columns from
  640px, values read from the kit where they can be: the counts, the
  screens, the license; the facts spec holds the rest to the kit's peers,
  matrices and styling systems); `tests/landing-facts.spec.ts` recounts
  the first from `dither-kit/tailwind/index.ts` and holds the second to
  the kit's required `peerDependencies` (a styling layer's optional one
  aside), and the plates' stock to the raised ground's mix; section counts
  come from `hub.ts`. A change that moves one
  fails until the page says it.
- Examples (`Examples.vue`, `#examples`, "Every component, live."): a
  section head (the component count from `facts.ts`, "See every section in
  the docs"), then the bento: `BENTO` (`hub.ts`), twelve live kit
  components (the strongest; the docs hold the rest) on a 12-column grid
  row by row: the 3D model (8, two rows
  tall, flush; `sampleWorld` of a seed on a picked ramp: blue, metal or
  ember, and "New model" for the next seed) beside the rating (its stars at display size, 44px) and the
  stat card (frames exported a day, `stat.ts`, copied byte for byte to the
  Svelte site: the headline is the total at rest; scrub the `Sparkline`
  (`interactive`) and its own crosshair marks the day under the pointer
  while the headline rolls to that day, the line under it crossfading from
  the week's change to the day's name; `hover-lift` off, so the marked day
  is the only emphasis); print screens (the full row, flush: one bone-to-obsidian
  `DitherGradient` printed through a `DitherScreen` under the same ramp
  raw, the raw one in linear light so the printed cells average to it,
  clipped at a split a full-size range drags or the arrows step, its
  handle a bone disc; the five screens switched in place); the area chart (8; one seed for every fill, "Roll a seed")
  and the ferrofluid (flush; ember first, so it never sits blue beside the
  blue chart; blue or grey); the shader (6, flush;
  the kit's seeded sample, mono blue, a palette ramp or its own colours,
  "New shader" the next seed) and the decrypted text (6, a line that says
  what it does, never a second slogan); the styling card
  (8, flush, `ExportScene.vue`: one snippet, an Invoices card, rendered
  live beside its code in the picked system through `restyle`, StyleX
  first; its code wraps inside its panel, never cut mid-token, each line
  hanging under its own indent, the pane fading at its foot; its code
  alone when the card is narrow, a size container) and
  the slide action ("Slide to confirm", its count); the button (6, its
  four fills and five hues, "Publish") and the silk (6). Planned as one
  picture (the stageshow skill's bento rules): neighbours across and down
  are different kinds, never two moving surfaces side by side, and no
  card repeats another's words or the ask's Deploys screen. Each card's art is a `DitherReveal` (the
  8×8 Bayer dissolve, 0.72s, on the spring): it prints itself once as it comes
  into view, at once under reduced motion, a row's cards one after another
  left to right (`staggers` in `hub.ts`, 90ms apart, read from the laid-out
  bento; a rail's cards past its width arrive as they are swiped in). A
  readout that changes rolls to its new figure (`DitherNumberFlow`: the
  stars, the seed, the slides confirmed), never jumps. Of the surfaces that move by
  themselves (`MOVING`: the model, the shader, the fluid, the silk) ONE plays at a time (`spotlight.ts`; the charts drift by
  nothing, their `sparkles` off, so no idle grain moves beside it): the card a mouse or pen
  hovers or keyboard focus is in; else the reader's last choice while any
  of it shows; else the first, in page order, crossing the middle tenth of
  the viewport; else the last that played. The rest hold a still frame.
  The shader's WebGL engine, the
  translator's utility map and the fluid's engine are async chunks a
  card loads as it nears the viewport (one IntersectionObserver, 600px
  ahead; without one, at once); their card art keeps a wrapper so the
  flush rule never stretches the pause chip. The demos speak the kit's
  blue, the ember for a second voice and grey for a third (the silk on
  blue stops; the button's hues are its subject); no chart grid. Under 1024px the bento is a rail the
  reader swipes (scroll-snapped, a card `min(86%, 440px)` wide with the
  next one's edge in view, every card the rail's height, the rail running
  out past the page's gutter), so it takes one screen on a tablet or a
  phone. A card is the raised ground (`--surface`, no border, 20px
  radius) holding its art over its name at page type (17px; a card's copy
  is the page's, never the size of the UI inside it), the link into
  `/docs/<id>` (no family label). Interactive art keeps its own controls, so the card
  itself is never a link; on flush art the pause chip comes before the
  tools in the DOM, as it sits above them.
- `hub.ts` is static data (the landing never loads the docs IA): `FAMILIES`
  (every docs family and its size), `DOCS_FAMILIES` (the five big
  families, a line each and the section each opens on) and `BENTO`, held
  honest by `tests/hub.spec.ts` (families and counts equal `GROUPS`, every
  card and first section is a section of the family it names).
- Ask (`#ask`, "Your agent builds the screen."): a section head ("Read the
  agent skill"), then `AgentStory.vue`, one agent session played as the
  page scrolls: a stage pinned under the header (`--pin`, most of the
  screen, at most 40rem: the stage is the frame, never a band over bare
  ground)
  for a run of a notch of scroll (32svh) per step, five steps (`story.ts`:
  a step per line of `DOES` plus the last). Composed as a product shot
  (the craft of the stageshow skill: framing, restraint, motion with a
  cause), corner bleed on one raised ground with one gutter (32px):
  left, like copy beside a hero, the session: the ask as the sent message
  (the page's ground, filled, no ring), then `DOES`, what the agent does
  in words, line `i` working at step `i` under the ember `DitherSpinner`
  and in full ink, done after it under the ember check and stepped back
  to the muted ink (`lineState`; one 16px cell for both marks, so a line
  never shifts); not yet said lines keep their place unseen. The lines:
  reads every component and its props (`get_registry`), lays out a
  Deploys screen (`add_screen`), writes it as a Vue file (`get_code`),
  renders it as an MP4 (`export_video`). Right, the hero: the screen the
  agent lays out on the page's ground, a gutter from the stage's top and
  from the session, running off the stage's right edge and foot; its
  title a plain label (no real heading in a figure), then the count (the
  one big number, at 2.75rem the heaviest mark over the chart, `DEPLOYS`, the sum of `DAYS`, a working week with no
  day at zero, so a dip the crop cuts never reads as one) beside the
  meter, the switch, and the week's deploys as a dotted `Sparkline`
  (`sparkles` off, still) right under the switch, taking the rest of the
  screen, the only thing the crop cuts. The render shows its result: a
  chip centred on the screen's top-left corner, half over the stage (a
  step above both grounds), absent until the render line (`RENDER`)
  works, then the ember spinner and "Rendering MP4", then the check and
  "MP4 ready" (the words crossfade in one cell); on phones it rides the
  screen's top edge, whole. Never blank: each part's
  slot (the raised ground, at the part's own size) holds its place from
  the first step, and the part arrives in it as the slot leaves, top to
  bottom (`PARTS`), the screen whole before the last step; the last step,
  every line done and the screen whole, is the still the story ends on.
  One moving layer at a time: the slots are still, only the spinner
  turns. No call times, arguments, tool names, paths or commands show.
  The step is the marker crossing the viewport's middle (one
  IntersectionObserver, armed after the markers render; no scroll
  listener). The screen's switch is a real control: it keeps its tab stop
  whatever the scroll (out of the pointer's reach until it shows), and a
  keyboard that reaches it lands the whole screen at once. Under 900px,
  or without an observer, nothing pins and the last step shows: the
  session over the screen, which keeps its bleed. Screen readers get the
  whole session as a caption; the stage is decoration. A screen is made
  ONLY of registry components (`add_screen` lays them out), so every line
  is true. `tests/agent-story.spec.ts` pins the line walk and the last
  step's still.
- Inside (`#inside`, "Three parts, one engine."): three cards (the
  raised ground, 20px radius, like the bento's; one column under 900px),
  each headed by a tone strip flush to its top (`DitherGradient` from its
  ink to `STOCK`, 120px, 72px on a phone, printing in through
  `DitherReveal`) in its own ink and printer's screen (`INSIDE`: blue in
  Bayer cells, the ember in lines, bone in a halftone dot), its own
  character standing on the strip's foot at the right, half over the card
  (the kit's `DitherAvatar` seeded by its title, in its ink, 56px, on a
  plate of the card's ground so its ink never melts into the strip's), then
  its name chunky in the pixel face (`PixelWord.vue`, 5px cells: "kit",
  "studio", "bridge"; its title the heading's text for screen readers),
  two lines and its link: the kit,
  the Studio, the agent bridge. Under them the five big families, biggest
  first (`DOCS_FAMILIES` sorted by size; the footer keeps the docs'
  order): five columns (three under 1024px, two under 640px, where a lone
  last family takes the row),
  each the family's size as a big figure with its unit ("100 sections":
  sections, never read against the kit's component count) over its name,
  both the link to
  its first section, and its line.
- Works with (`#works`, `WorksWith.vue`, "Plays well with others."): the
  section head (a lede with a wink, the link to the styling docs), then
  one raised panel of three lists at reading size, generous like a menu
  (18px marks, 15px names; three columns down to 640px, one under it with
  each list's rows two abreast): "Your styling" (`WORKS`; then "and any
  app on its compiled stylesheet: UnoCSS, plain CSS or CSS-in-JS"), "Your agent"
  (the harnesses `bridge/dither-bridge.mjs` knows, `HARNESSES` in
  `facts.ts`, its ids and names in order, each under its own mark; keep
  in sync, `tests/marks.spec.ts` checks it; then "or any command you hand
  the bridge"), "Your models" (every format the kit reads, in
  `MODEL_FORMATS` order, named by `MODEL_NAMES`, a `Record` keyed by the
  kit's own type, each after an ember cell; then GLSL).
- The brand's moment (`brand.ts` + `BrandGather.vue`, decorative): the
  brand as `LOCKUP`, `MARK_CELLS` (the diamond's 25 cells around its ember
  core, which the header draws too), three clear columns, then
  "DITHER-UI" in the pixel face, 4px cells seven tall, as spans, each
  knowing its glyph (the mark 0, the letters from 1). Its parent places
  and positions it; its FIELD is its nearest positioned ancestor, and the
  parent stages it (`Staging`: the field's height and the lockup's top in,
  a `Scene` out: its `move` and, in px of that field, the rows its cells
  lie loose in, the rows the gather's burst may throw them to, a seed).
  ONE table, `STAGINGS` in `brand.ts`, stages the hero's and the
  footer's; `plate.ts`'s `sceneOf` the plates'. Each place forms the brand
  its OWN way (the user's call: never the same moment twice on the page),
  one of `MOVES`:
  - `gather` (the hero): the mark's cells lie loose like stars, gather
    left to right into the mark, which holds a beat and bursts to the
    right in a widening cone (a cell thrown past the burst rows is turned
    back), the wordmark's cells, carried unseen on its bone cells until
    then, flying out with it; then each settles home in order across.
  - `rain` (the plate after the bento): the cells hang in one dotted line
    on the scene's first row and fall column by column, left to right,
    each column landing from the bottom up.
  - `converge` (the plate before the install): the seven rows slide in
    whole, even rows from the field's left edge and odd rows from its
    right, top row first, and interlock.
  - `strike` (the footer): a typewriter; the glyphs wait stacked at the
    carriage on the scene's first row, and one by one each slides out to
    its column and strikes down onto the line.
  It is built (each cell's path and its two stepped animations) only as
  the lockup comes within a screen of view, never at mount (all four built
  at mount were a sixth of the landing's script at 4x CPU); unbuilt, its
  cells stand home where nobody sees them. It plays the same at every
  width, phones included (nothing gates it on pointer or size), once, when the lockup stands in view clear of the
  viewport's bottom tenth, and stays; with `replay` (the hero's alone) a
  mouse or pen coming to rest on the lockup plays it again from the top,
  once it is home (never over a moment still playing or still held for its
  first view, never for a finger, never once reduced motion is asked for,
  read at the hover). `choreograph` is pure (a path of
  waypoints per cell, each a whole number of cells from its slot; one
  function per move in a table) on `MOMENT`'s clock, played as two stepped
  animations per cell (an axis each, `steps()` one cell a step). Home by
  4.6s: under five seconds, so no pause; under reduced motion, without
  `IntersectionObserver` or `animate`, and in the prerendered bytes, the
  brand is simply assembled (and a hover replays nothing). It emits
  `moving` as its moment starts (the first time or again) and `settled`
  when home (at once when it does not move), so a parent keeps one moving
  layer at a time; `tests/brand-replay.spec.ts` holds the replay.
  `tests/landing-facts.spec.ts` holds the mark's cells to the diamond, the
  four places to four different moves, each move's opening (rain's one
  line, converge's rows at the edges, strike's stack at the carriage), and every place's moment: home inside five seconds, every
  path in time order, on its grid, inside the field, starting in its
  scene's rows; the gather's burst inside its rows and each wordmark cell
  on its host's squares until it.
- The plates (decorative): two print sheets between the sections, after
  the bento and before the install, each the brand small in a wide field
  and each unlike the other (the audit's call: alike, they read as
  repeated dividers). ONE table, `PLATES` in `plate.ts`, sets each plate's
  tone at the top edge, its clear band and its tone at the foot, where the
  mark's centre stands in the band (left of 0.7, the wordmark reading on
  to its right), its move, its proportion (`aspect`: 3.4, then a slimmer
  4.6) and its printer's screen (`screen`: Bayer, then a halftone dot); `sceneOf` gives its scene (loose in
  the band and the tone's thin edges, thrown anywhere on the sheet,
  seeded by where the mark stands). `Plate.vue` prints a row: a sheet of
  its proportion (at least 112px tall) on the page's width, square cornered and flat like the hero's
  print, on `STOCK` (the `--surface` mix as a colour the kit prints with,
  so its open cells are the plate, never a tint), two `DitherGradient`s in
  the bone ink through its `DitherScreen` showing only the thin ends of
  their ramps, and the brand's moment in the band, pulled in from the
  right edge (16px clear) where the plate is narrow, while the tone prints
  in through `DitherReveal` (0.72s on the spring, the lights coming on).
  `tests/landing-facts.spec.ts` holds `STOCK` to the token's mix and every
  plate's mark inside its band, its tones thin.
  A new plate is a row in the table and a `<Plate>` at a section break.
- Install (`#install`, "Copy one folder. Every pixel is yours."): the
  head centred (the lede, then the `.key` "Copy agent prompt" through
  `DitherClipboard`: the prompt names this origin's `SKILL.md`, the degit
  command, the four packages and the alias), then `InstallBlock.vue`: a
  box on the raised ground whose top row is the `.seg` step picker (the
  kit's Folder glyph, then npm, pnpm and Bun's own marks) and the Copy
  key (both filled with the page's ground), the command under them in
  mono with the ember `$`; the box and the spec sheet under it keep the
  install head's centred measure (52rem). Under 640px the picker takes the
  top row alone and the command wraps beside the key between its words
  (each word unbroken, never at a hyphen), so all of it shows; inline
  `code` on the landing never wraps. A copy is ONE gesture: while copied the
  command shows selected (the page's ground behind it) as the key's label
  rolls to "Copied" under a check; both let go together; reduced motion
  swaps both at once. Its four steps (degit folder + npm/pnpm/bun deps)
  run the docs' own commands (`docs/install.ts`; the landing never imports
  the docs, so `tests/docs-install.spec.ts` holds its folder and
  `RUNTIME_DEPS` to `INSTALL_STEPS.vue` and `INSTALL_DEPS.vue`). Then one centred line for Svelte 5
  (`dither-kit-svelte`, the quick start).
- Marks: tool logos (the package managers, Node, Vue, Svelte, Tailwind,
  StyleX, CSS Modules, CSS, GitHub and the coding agents) come ONLY from
  `src/shared/ui/marks.ts` through
  `ToolMark`, one-colour in `currentColor` beside the tool's name, never
  restyled or dithered; everything else is a kit glyph (`DitherIcon`).
- No entrance choreography but the bento's art printing itself once as it
  nears and the brand's moment (the hero's sign-off as the page opens,
  each plate's and the footer's brand as it nears); the hero's print waits for it, and the type
  simply is. Motion is the live kit
  surfaces, one moving layer at a time in the bento. Pause chips
  (`PauseChip.vue`, WCAG 2.2.2): every surface that moves by itself for
  more than five seconds carries one in its corner, named for it ("Pause
  the print", "Pause the model", "Pause the shader", "Pause the fluid",
  "Pause the silk"), `aria-pressed` while the
  surface is still, wired to its `paused` (the model's turn is its
  `auto-rotate`): a disc of the page's ink with its glyph in the ground.
  In the bento a chip shows whether its surface plays: a pause is the
  reader's and outlasts the spotlight; play on a surface the spotlight
  holds makes it the reader's choice. A touch chooses only through the
  chip, since a tap also focuses and would point at the card and then
  toggle what it just started. Chips stay under reduced motion, where
  every surface paints one frame and holds it.
- Footer ground (`road.ts`): the kit's art under the whole footer, the
  wordmark included (`.foot-art`), one `DitherShader` (loaded with the footer, cell
  `ROAD.cell` CSS px at dpr 1, so the print reads the same on every screen
  and its width in cells is the art's CSS width) whose GLSL `road.ts`
  writes from `ROAD`: a star grain, rare
  and blue over the columns and rarer still where their words and the
  copyright line sit (the footer's words lie on the page's ground, so no
  speck lands on a letter), and on the road (`.foot-road`, the width's
  `ROAD.aspect` share, `narrowAspect` under `ROAD.narrow` px of the art's
  own width: a container query the shader matches by its width in cells,
  pinned by `tests/landing-facts.spec.ts`) a bundle of light trails that
  runs under the brand's diamond (`BrandMark`, placed at `ROAD.mark`) and
  sweeps out and down to the right, widening, a spray of the grain along
  it. Luminance picks the ink through `ROAD_RAMP` (the page's ground, then
  the print's `INKS`), so the trails burn bone at their heads and core and
  cool through the ember to blue. The art dissolves at its edges into the
  page (in from the footer's top, out at the page's foot, the trails'
  tail out of the dark at the left), never showing a box. The road runs
  from the copyright line to the page's foot and the line-screen
  wordmark is printed over its foot (`.foot-mark`, absolute): the trails
  sweep down behind its end and the grain shows between its rows, so the
  galaxy fills the gap between the links and the name and merges into
  it; the diamond stands clear above the wordmark at every width. Around
  the diamond, its heart, a small spiral galaxy turns (two arms of the
  grain wound out of a tilted disc, bone, then the ember, then blue,
  sized by the road's height so a phone's is as full; it fades before the
  road's top, leaving the copyright line its ground), and the ribbon
  dances: its threads weave over each other and the bundle sways on
  either side of the diamond, which it always runs through. It moves by
  itself for `ROAD.dance` (4.5s) each time the road comes into view, once
  the footer's brand is home (a brand that starts forming mid-dance takes
  the stage and the dance comes back after), then only while the reader
  moves the page (a scroll, a pointer across the footer), settling 240ms
  after: under five seconds on its own, so no pause chip (the user's
  call); it holds while the brand forms (`moving` holds, `settled`
  frees); under reduced motion one frame. Decorative (`aria-hidden`); no
  rule, no boxed icons.
- Footer (on the page width, no rule above it): the brand (the brand's
  moment in the home link, whose name is "dither-ui", `STAGINGS.foot`:
  the strike, its carriage on the clear band above it, the footer's top
  padding, clear of every line of text; its field the page's column,
  `.foot-in`, positioned, its top padding the header's height (`--head`,
  the one number the capsule is sized from) and a gutter, so where the
  page comes to rest the floating header never sits on its top row; then
  one line, GitHub under its mark) beside three link columns
  (`COLUMNS`: Get started, closing on Verification; Docs, the big families; For
  agents: SKILL.md, llms.txt, the registry, the Studio; 28px hit areas), the
  copyright line as separate items (the year and dither-ui.com,
  `v<version>`, MIT license), then the road with the line-screen wordmark over its foot. Three columns
  under the brand under 900px, two under 640px.
- Footer signature: the line-screen wordmark (`LineWordmark.vue`):
  "dither-ui" in the display face across the page width, filled by 24
  rows of ink that thicken toward the baseline (30% of the row's pitch at
  the top to 92% at the foot, each bar at the foot of its pitch), a
  vertical ramp printed through a screen of lines. One SVG: the text is a
  `clipPath` (its `textLength` holds the word to the box's width whichever
  face has loaded) and the rows are rects in `--ink`, over the same word
  laid in the page's ground, so the road's art passes behind the letters
  whole and never shows between their rows; flat, one ink,
  decorative (`aria-hidden`), nothing that glows or moves.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Seeds, Engine, Verification, Animation, Accessibility — prose +
  CodeBlock, no DemoCard; Engine, `handbook/EngineSection.vue`, names the
  parts under every surface, each with a figure read from the kit's own
  constants and a link to its section, a dead id failing the render;
  Verification, `handbook/VerificationSection.vue`, is a lab report: each
  claim of the kit (`CHECKS` in `handbook/lab.ts`: what, how, against
  what, the spec that holds it) measured with the kit's engine in the
  reader's browser as the section nears, one check per task, again on
  "Measure again", the engine and time as its conditions, the results
  copied as a Markdown table; the static page ships it unmeasured, and
  linked from the landing footer) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 in ink,
  `text-lg` in the display face, Michroma at its one weight and no
  negative tracking, set by DocsPage for the section's own heading only,
  never a demo's; its name in sentence case like its nav label: "Area chart",
  "OTP field", + optional "Open in the Studio") → muted description →
  `DemoCard` (Preview/Code tabs as machined segments in a `.track`, the
  picked one `.ring-on`; Inspect → the workbench, Code → the source panel, a
  `.hardshell` cut at 12px) → optional picker gallery (an `h3` in
  sentence case, 12px muted, + grid; the picked tile or chip `.ring-on`,
  never a fill a shade off the ground) → `PropsTable`, a spec sheet (a
  `.hardshell` cut at 10px, its column heads `.spec`; Prop 24% and Default
  20%, the type column, which carries the notes, the rest; a row's `default` is
  its value as code; "" prints "none"; under 640px, where three columns
  cannot fit, each prop stacks over its type and default). The preview frame is a gel well
  (`.demo-well` + `.rim`: the pebble radius, the well's ground, a gloss on
  its top edge, recessed into the page) whose ground MUST stay one plain
  colour (the workbench's contrast reads the background through
  `backgroundBehind`, which gives up on any ancestor's image), that never
  clips (the workbench draws past it) and keeps its 1px border, clear
  (captures add it). A demo sits in it by its fit (`DemoCard`'s `fit`,
  `DemoFit`): inset, or bled, where its first frame meets the well's top
  and sides, takes its top corners and drops its own border (a surface
  reads as the well's picture, never a framed thumbnail; the controls
  under it, 24px below); a family sets its default through
  `provide(DEMO_FIT, …)` (Backgrounds bleeds, its square demos and the
  poster opt back in to the inset). Inset, its padding is 16px on phones and 40px from sm (the
  docs column is 16px from the screen's edge on phones, 24px from sm, as
  the user's design system sets), and every demo fits its well from
  320px up: a wide one (pagination, the bracket, the ASCII art) is
  centred inside an `overflow-x-auto` row by an `mx-auto w-max` box, so
  it centres while it fits and scrolls on the narrowest phones; a fixed
  width becomes `w-full max-w-*`. Chips (framework, styling, Inspect) sit
  in tracks, 24px tall; the tab row wraps, so on a phone the Code tab's
  chips drop under the tabs instead of running off the card.
- Docs ground: in the dark the docs wear the landing's print, the user's
  V5 obsidian and bone (`:root.dark:has(.docs-root)` in
  `app/styles.css`: a muted bone at AA on the ground and the raised
  card, the border a quiet step off the ground, the ring bone, the
  landing's float shadow) over the
  grain (`--grain`, the one tile the landing reads too); their light
  theme and the Studio keep the kit's neutrals. The section lists (the
  rail and the sheet) keep each group's heading stuck to the top while
  its sections scroll under it (`NAV_PLACE` in `DocsNav.vue` holds each
  place's top room and the heading's ground: unseen on the rail's page
  ground, a filled band on the page's ground in the sheet's shell).
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
- Interface sounds (`shared/lib/sound.ts`): the page row's "Interface sounds"
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
- Wayfinding: one section per page (`docs/pages.ts` holds the rules:
  `SECTION_IDS` in the sidebar's order, `sectionOf` reading a URL,
  `neighbours` for the pager, `groupOf` for the breadcrumb; pinned by
  `tests/docs-pages.spec.ts`). The URL names the section (clean
  `/docs/<id>`, its directory form `/docs/<id>/` where a static host serves
  the section's prerendered page, or legacy `#/docs/<id>`; `/docs` itself
  opens on the first section and keeps the docs' front, the chrome title,
  its tags and intro, `data-docs-front`, which a section's page keeps only
  as the screen readers' h1). `open(id)` shows that section alone (the
  rest of `.docs-flow` hidden; a pack of sections, `packs.ts` `PACKS`, each
  pack component and the nav naming its sections, mounts only once one of
  its sections is opened here and stays after, so going back is instant
  and keeps each demo's state, while the 300-odd others cost the page
  nothing: 27,564 nodes on a section's page became 4,115;
  `tests/docs-packs.spec.ts` holds every pack to its nav), pushes a history
  entry and reads from the top; back and forward walk them (`popstate`).
  The sidebar, search, the sheet and the pager all open through it. Over
  the section a breadcrumb (the docs, then its group, linking to the
  group's first section); under it the pager, the sections either side
  in the sidebar's order, each with its group. The section's title is the
  page's headline (1.5rem in the display face) and its lede reads at 14px.
  The sidebar's groups fold (`aria-expanded` keys with a turning chevron;
  the current section's group opens itself; a folded group's links stay
  in the DOM, hidden, whole for find-in-page and the crawler), and the
  rail keeps the current link in its own view, scrolling the rail, never
  the page, to centre it when it leaves the middle band.
- The docs' header is the site's (Header, above) with Search in its
  tools (a `.nav-a` with its shortcut, `modKey`); the switches that act on
  the page (framework, styling, sounds, theme) sit in the page's row
  beside the breadcrumb, not in the header. Under sm the Vue/Svelte
  switch shows its marks and Search its glyph (the words stay for screen
  readers); under 360px the brand shows its mark alone (the word stays
  for screen readers); the ⌘K kbd shows from md; the styling switch (on
  every card anyway) returns at lg. Under lg the header's tools add a key,
  "Browse sections" (the Book glyph, `aria-haspopup="dialog"`,
  `aria-expanded`, `aria-controls` = `SHEET_ID`), opens the sections sheet
  from anywhere on the page (`DocsSheet.vue`), the site menu's kind of
  sheet: the whole screen, `SheetHead` at its top ("Sections" and the
  count in the capsule, "Close sections"), the families under it as bands
  (`DocsNav`'s sheet place, read like the menu: one step of the ink per
  family, `bandFill(i, GROUPS.length)`, seamed into the one above, the
  seam riding over the band above's heading and the first one climbing
  into the head's foot room as the menu's does; folded, the bands share
  the screen, each family's name at its foot at the menu's 20px with its
  glyph beside it as GitHub carries its mark, over a line of what it
  holds ("100 sections"; the rail shows the figure alone) and a chevron,
  the whole band the key that opens it; open, its sections follow at the
  names' edge at 15px (`NAV_LINK.sheet`), the one in view printed in
  reverse; a hovered, focused or pressed band's words and section lean in
  as the menu's do, never under reduced motion; each heading sticks on
  its own fill), arriving as the kit's wipe down the screen and rolling back up
  before it goes (it stays mounted while it leaves; at once under reduced
  motion); a modal through `DitherFocusScope` (focus on "Close sections",
  Tab trapped, focus back on the key), shut by Escape, the close key or a
  pick (a pick closes it first, then scrolls); the page under it holds
  still (`overflow: hidden` on the root) and it closes itself at lg. It opens
  centred on the section in view, that section's parts listed under its
  link. A `CodeBlock`'s copy chip takes its own band over the first line
  under sm (a long first line ran under it there). The footer's items
  wrap, never collide.
- Share cards, a spec sheet in the user's V5 look (Oakley's proof
  grammar and the site's materials): `docs/og-card.ts` (the
  design: size, inks by night and by day, the print's box, the type's
  column, the seeds; import-free, as crawler-files.ts reads it under Node),
  `docs/og-art.ts` (the art: the kit's own poster engine at the print's
  size, a seed's composition through a seed's printer's screen; home prints
  the hero's, seed 5 through Bayer), `docs/og-page.ts` (the renderer, the
  build's `og/index` entry over `og/index.html`: `window.og.files(id, seed,
  inv)` for the prerender and the Discord service) and `crawler-files.ts`
  (the cards' copy, embeds and oEmbed). A card is obsidian with one bone
  ink: the brand top left on the print's top line, the card's number of
  all the cards as a spec label at the column's end (its provenance), a
  graphite speed tag under the brand (a section's family, a route's own
  `tag`), the card's number again as a race-bib figure printed through the
  Bayer matrix in the band down to the title (never under type), the
  title in chrome (the display face, the site's chrome ramp one horizon
  per line; a route's on one line, a section's on two at most), a route's
  line in the muted ink, a row of key and value chips (slanted plates:
  screen, seed, cell, the print's real figures), and the address in the
  satin chrome key, its foot on the print's foot; the print stands on the
  right in a hardshell (two corners cut, a chrome glint on its edge), its
  spec run (size, inks) set up its left side. By day (the Discord toggle)
  the same sheet on bone paper, the light chrome, the print's bone
  ink turned obsidian. The loop (72 frames at 12.5 fps, `OG_BEATS`): at
  rest, then the kit's diamond swells over the whole print on the spring,
  turning every tile over into its negative ring by ring, holds, and
  recedes to its place, the screen sliding inside it in whole turns, so
  the GIF's last frame meets its first; the PNG is frame 0, the print at
  rest. Discord's containers draw no accent bar (no side line). Copy
  follows the bans (caps and tracking only on the spec labels and the
  plates, the user's lift for the V5 look; no eyebrow over the title, no
  middle dot or em dash, buttons that name where they go). `ROUTE_CARDS` holds the route cards' copy;
  their ids may never be section ids; the route templates' image alt is
  the card's. Guarded by `tests/og-card.spec.ts` (loop, determinism, the
  screens, the swell's beats, home as the hero's print with its inks, no
  bone on bone, the print clear of the type, AA, balanced wrap, caps only
  on labels and plates) and the share-card and
  renderer cases in `tests/crawler-files.spec.ts` (every page's embed
  under Discord's 3,000 byte cap with link buttons only and no accent bar,
  the oEmbed photo, each route head carrying its card's tags, the bans,
  the renderer as a build page).
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
- Chrome: the header is the site's one `SiteHeader` (Header, above),
  with Search and the sections key in its `tools`; the toggles under it
  are tracks, the picked one `.ring-on`. The search
  hint names the visitor's modifier (`⌘K` on Apple platforms, `Ctrl K`
  elsewhere — the handler accepts both). The Vue/Svelte
  switch carries the tools' marks
  (`ToolMark`), the styling switch their names (`STYLING_LABELS`), sound
  and theme the kit's glyphs (Volume/VolumeOff, Sun/Moon), GitHub its
  mark. The section list is ONE component, `DocsNav.vue` (the sidebar
  rail at lg, the sheet under it; `docsUrl` is the one section address):
  groups under their glyphs (`GROUP_ICON`), each with its section count as
  a `.spec`; `NAV_LINK` sizes its links per place, 25px targets at a 27px
  pitch on the rail, 30px in the sheet; "On this page" is `OnThisPage.vue`. The page title is the h1
  "Documentation" in the display face (`font-display`, 1.6rem) and
  `.chrome-type`, no eyebrow; on its
  baseline, the kit's spec as `.speed-tag`s (the section count, Vue 3,
  Svelte 5, Tailwind or StyleX). At xl the rail right of
  the content is "On this page": the section in view, its gallery headings
  and its API table, read from its DOM as the scroll-spy moves (headings
  inside a preview are the demo's), each a button that scrolls to it (the
  sheet lists the same parts under the section's link).
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
  packs follow this shape instead of growing DocsPage. `docs/overview/` =
  the Quick start (`QuickStart.vue`, `getting-started`): the install as
  steps from `docs/install.ts` (`INSTALL_STEPS` per kind: Vue, the Vue kit
  on StyleX, Svelte; `INSTALL_DEPS`, the packages each needs), one at a
  time, each its title, why where a reader would ask, and its own
  `CodeBlock` (full width on a phone), then "On StyleX" (Vue) and
  "Without Tailwind" (the kit stylesheet, then theming), each short under
  its own heading; `installScript` turns the same steps into the one
  commented script the source panel's prompt.md carries (`INSTALL`). `docs/primitives/` =
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
  Under 1024px the editor gives way to a notice: a still `DitherPoster`,
  why the Studio wants a wide screen and a pointer, the chrome key that
  copies the Studio's own link (to carry to a laptop) and the docs link.
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
- `tests/spotlight.spec.ts` holds the bento's one-moving-layer rule (the
  pointed card, the reader's choice while it shows, the first crossing
  the middle, the last that played).
- `tests/lab.spec.ts` runs the Verification section's checks in Node,
  each one holding (the inks check among them: the landing's bone, muted
  bone and ember printed through the matrix on the obsidian, 4.5:1 at
  full tone and 3:1 at half, its colours held to `chapters.css` and the
  dark theme's ember), every named spec existing, and pins `POSTER_HASH`
  (the poster's bytes, the cross-engine row): a change to the poster's
  arithmetic fails it until the hash is recorded again.
- `tests/docs-sheet.spec.ts`: the rail scrolls itself (never the page) to
  the current link,
  `DocsNav` lists every section once with 24px targets per
  place, and the sections sheet opens as a modal (focus in, page held,
  Escape, backdrop and close key, focus back, the parts under the link).
- `tests/marks.spec.ts`: every harness the bridge starts has a mark under
  its id and name, the landing lists them in the bridge's order, every
  mark is path data in a positive box.
- Browser walk after changes: the landing at desktop AND phone widths (no
  horizontal scroll), the h1 and the keys above the fold at 1440x900,
  1280x800 and 1920x1080 with the print beside them, the
  obsidian and its grain whatever theme the docs
  saved (dark on a light preference too),
  "Copy agent prompt" (the install's head) copying a prompt that names
  this origin's SKILL.md, no uppercase label, eyebrow, middle dot, em dash
  or arrow link in the rendered copy, every svg decorative or labelled,
  "Watch the film" (the dialog opens with focus in it, the film plays,
  Escape closes it, focus returns to the key, the video leaves the DOM),
  the bento's rows whole at 1440px and its rail swiping at 800 and 390px
  (no page scroll sideways) with every card drawn and
  its controls working (the model's ramps and "New model", "Roll a seed",
  the button's fills and hues, "New shader" and its outputs, the fluid's
  palettes, the styling systems, the slide count, the rating), the lazy cards loading as they near, each pause
  chip stopping its surface, at most one bento surface playing at every
  scroll stop (a mouse hover, keyboard focus and a chip tap each taking
  it as set above), each card's art printing once as it nears,
  the ask story pinned and stepping its lines and the screen's parts as
  the page scrolls (the whole session at once under 900px), the "Works
  with" marks, none of the slop bans in the rendered page (no tag, italic
  or negative tracking outside a kit component, no rule or side line, no
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
  looks; the docs header fits from 320px to 1280px (no page scroll
  sideways); with touch at 320, 375, 430 and 768 the sections sheet opens
  from deep in the page, traps and returns focus, holds the page and lands
  a pick at its scroll margin; the "On this page"
  rail lists the section in view at xl, and its Share opens on the
  section's card playing and copies its link, Markdown and HTML.
- Share cards after a full `npm run build`: every id `window.og.ids()`
  lists has `dist/og/<id>.png` and `.gif` (the GIF's frames move and its
  first is the PNG's card, the mark's core included),
  `dist/embed/<id>.json` and `dist/oembed/<id>.json`, and a section page's
  head points at its own (Discord's Embed Debugger,
  discord.com/developers/embeds, reads a deployed URL as Discord will).

## Child DOX Index

- none
