# pages — landing, docs, studio, play

## Purpose

The routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here. A page's
components and its framework-free modules are side by side in
`pages/<page>/` (`../AGENTS.md`); a file named below without a folder is
in the page's folder.

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
  on the root marked with its route (`:root[data-page="landing"]`, and
  `missing`; the shell renders `data-page` into the page's bytes and `PageHead` keeps it as the route changes, never a `:has()`,
  which re-matched the root on every node added anywhere and restyled the
  whole document as the page scrolled; `tests/root-has.spec.ts`)
  (obsidian `#101214`, bone `#e4e1d8`, the muted
  bone `#9c998f` at AA on both grounds, `color-scheme: dark`), so what the
  page portals to the body (the film's dialog) is printed too; the dark
  theme stays on (the shell ships `class="dark"` and `LandingPage`
  re-adds it on mount, since a light theme saved on the docs or the Studio
  persists on `<html>` across a client-side move); the two inks mapped to theme
  tokens (`--ink`, `--ink-3`), `--surface` (the one raised ground, 7% of
  the ink mixed into the obsidian) and `--signal` (the dark theme's ember,
  8.6:1 on the obsidian); the grain (a 96px PNG tile of single cells a
  tone under and over the obsidian, never a grid); the section head (`.sec-head`: the
  `.section-title` left, in the display face (Michroma 400,
  `clamp(1.6rem, 3.4vw, 2.75rem)`) in the plain bone ink (chrome is the
  hero statement's and the primary key's alone); `.sec-side`
  right, on its baseline, a `.sec-lede` (two tones: the muted ink, its one
  key clause, `.lede-key`, in the full ink, so the eye finds the point
  without bold; `tests/ledes.spec.ts`) and a `.more-link`; stacked under
  900px; it rises as it comes into view: `ref={rise}` on the head, the title's
  words through `RiseWords`, the lede and the link `data-rise` after them,
  the hero's statement likewise, and the blocks under a head (the three
  parts' cards, the families, what it works with, the spec sheet's rows)
  one after another, 90ms apart; the bento keeps its own reveal and the
  footer its own motion; `shared/lib/rise.ts`, and every riser
  stands inside an element `rise` holds, `tests/rise.spec.ts`), `.lead` and `.more-link` (an underline that inks on hover, a
  24px target through padding cancelled by a negative margin), `.key` (a
  filled shape on `--surface`, never a ring), `.seg` (`aria-pressed`
  buttons, quiet labels, the pressed one filled with `--surface`), and
  `[id]` scroll margins (76px) clear of the header, an in-page link
  travelling there by the browser's own smooth scroll (`:root[data-page="landing"]`,
  none under reduced motion;
  `tests/motion.spec.ts`). A card or panel whose
  own ground is `--surface` resets `--surface` to the page's ground on
  what it holds, so its keys and pressed segments stay shapes. Page geometry (`--page` 80rem, `--rhythm`) lives on
  `LandingPage`'s `.landing`; the sections are one flex column on it.
- Header: the site's one header, `SiteHeader` (`widgets/site-header`),
  the landing's and the docs' alike: a floating capsule (the raised
  ground, `--float-shadow`, no rim), sticky 8px under the top and centred
  (up to 48rem, `--head` tall with its margin): the 13px diamond mark
  (`shared/ui/BrandMark`, ember core) + "dither-ui" + the mascot beside
  it (alive, from 480px), the `.nav-a` links
  (`MENU_LINKS` in `menu.ts`: id, label, the band's line and the width it
  shows from; the page supplies only `HREF` by id, a `Record` the types
  hold whole: Components → the landing's `#examples`, Docs, Agents →
  `#ask`, GitHub under its mark in a new tab; each shows from md, GitHub
  from lg; the page's own link `aria-current`), a page's
  `tools` (the docs' search and, under lg, its sections key under the
  Book glyph) and the `.key-chrome` "Open studio" (from md). Under lg the
  menu key (the sheet's bands in miniature + "Menu") opens the menu as a
  BOTTOM SHEET (the user's call, after a phone's bottom sheet; `sheet.ts`):
  a native modal `<dialog>` filling the window, itself clear so the page
  shows above the sheet, held still (focus on its close key, focus back
  on the key), the sheet at its foot as wide as the header's lines (the
  capsule's width and its gutters), its top a soft shell (20px) on the
  raised ground, sliding up from the window's foot on the glide
  (`SHEET_SLIDE`: 500ms). Every sheet's words stand on the header's lines
  (`--sheet-start` and `--sheet-end` in `site-header.css`, from the
  capsule's own gutter, width and padding: the brand mark's edge and the
  key word's, centred capsule included). Its head (`.menu-grab`, the
  sheet's first stop: a handle, "Menu", the close key, 44px, under the
  close mark, an X on the brand diamond's 7x7 grid, `CLOSE_CELLS` drawn
  by `BrandMark`'s `cells`, the ember at its crossing; `SHEET_HEAD_FOOT`
  under it so the first band's seam never bites into it) is where a
  finger, a pen or a mouse drags the sheet (`touch-action: none`; a drag
  only past `SHEET_DRAG.slop`, so a tap on the close key stays a tap):
  down it follows whole, up it gives a fifth, 24px at most (`pullOf`); let
  go past 30% of its height or thrown down (0.5px a ms) it closes on the
  hand's spring from the finger's velocity, else it springs back up
  (`releaseOf`, `velocityOf`); a `pointercancel` springs it back. The
  sheet reaches 40px under the window's foot (`--sheet-reach`), so a
  spring past its rest never shows a gap; the dialog clips, never
  scrolls (`overflow: clip`: WebKit scrolled a hidden overflow to the
  focused key). The close key, Escape (the dialog's `cancel`, prevented)
  and a tap on the page above it slide it back down from where it stands
  before it shuts (`MenuPhase`: shut, open, leaving; at once under
  reduced motion, and a drag let go there lands at once); a taken link
  and the window reaching lg shut it at once. While a sheet stands it
  covers the page (`coverPage`, the kit's `engine/cover.ts`): every kit
  loop under it holds its frame and wakes as the sheet starts to leave,
  so the sheet is the one moving layer. The docs' sections sheet stays a
  full-screen sheet arriving as the kit's wipe down the screen
  (`DitherReveal`, `SHEET_WIPE`: 0.5s, `"glide"`) under `SheetHead` (the
  head of a full-screen sheet: the capsule and the brand unmoved, the key
  that opened it turned to the close mark and "Close" in its place). In
  the menu a band per link, at least 72px tall (the bands scroll inside
  the sheet on a short screen, the last running on under the window's
  foot), its name at its foot over a line of what is behind it (`note`; the
  studio's says it wants 1024px), each a step of the ink
  toward the ground (`bandInk(i, n)`: even steps from the full ink to
  `BAND_FLOOR` 64%, so the menu's four are 100/88/76/64%; the ground's
  colour writing on them, AA down to the floor held by
  `tests/theme-contrast.spec.ts`), then
  "Open studio" on the ember; where two bands meet the lower climbs into
  the upper through the Bayer matrix (`SEAM_MASK`, the kit's wipe engine
  at a fixed progress; `seamStyle(fill)` is the seam whole, placed, for any
  sheet's bands). A hovered, focused or pressed band's words lean in
  (8px, 12px pressed, on the glide, 350ms; the hover only under
  `(hover: hover)`, since a tap's hover sticks on a phone) and the menu key's bands
  part on a hover (none of it under reduced motion). A focused band rings
  in the ring ink with the ground inside it. `menu.ts` (fills, seam, wipe), `sheet.ts` (the
  sheet under the hand) and `site-header.css` (the capsule and the sheet)
  are the one tables and stylesheet; `tests/site/shared.spec.tsx` drags
  it, `tests/spring.spec.ts` holds its release. The nav's links share
  one hover ground (`shared/lib/glide.ts`, `ref={glide}`). It stays positioned
  (`z-40`): `main` is `relative isolate`, so a positioned sibling paints
  over a static header.
- Hero (`Showcase.tsx`, our own): the first screen's height under the
  header (`clamp(34rem, 100svh - 64px, 52rem)`) on the page's own ground,
  where the pointer prints as it does on every section's ground (the
  page's one `.page-trail`, a `DitherHeatTrail` `pinned` to the viewport
  under everything the landing holds, its print scrolling with the page,
  as `TRAIL` in `plate.ts` sets it, inks, reach and cooling in one table:
  a slender stroke, hot in the ember at the hand, cooling to the bone as
  it tapers and dissolves, gone in under a second; never a wide rope of
  every ink, which read as a cable dragged over the copy),
  holding on the page width the statement beside the print (columns
  1 : 1.2, even from 900 to 1199px so the keys keep one row). Left
  (`.statement`, rising as the page opens): the h1 in the display face
  (Michroma 400) and chrome on each of its words at display size (`clamp(2rem, 3.9vw, 3.5rem)`, two or three short lines),
  the lede (three or four lines), the keys (`.key-chrome` "Open the
  studio", `.key` "Read the docs" and "Watch the film" under the Play
  glyph, which opens the trailer; `TrailerDialog` lives in the hero),
  then a quiet line of what the kit works with (`WORKS` in `facts.ts`: Solid,
  Tailwind, StyleX, CSS Modules, CSS, each under its mark, after "Works
  with"). Right, in `.print-col`: the PRINT, a live `DitherPoster` (seed
  5, cell 4, `INKS` from `plate.ts`: the kit's blue, the ember and the page's bone ink;
  the ember diamond whole on the blue, half knocked out in bone, the open
  cells showing the obsidian like a print on black stock; its screen
  slides 1.5 cells a second inside the mark) as a portrait sheet (4:5, at
  most 30rem wide) set on the obsidian at the column's right edge with
  breathing room above and below, square cornered and flat: never a
  panel run to the page's edge or under the header (that is the reference's
  hero). It moves on cue (the industrial brief: no perpetual loops): its
  screen slides for 4s once the brand is home, then only while a pointer
  moves over the print (`drive.ts`), under five seconds by itself, so it
  carries no pause.
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
  moving layer at a time. As the page leaves it the hero eases back in
  step with the scroll (`SCENES.hero` in `scenes.ts`, a scroll scene from
  its top at the viewport's top to its foot leaving it, on the glide): the
  statement recedes (to 92%, about its left edge, inside its own box so
  no line passes the hero's clipped edge) and fades (to a fifth), the brand's
  moment in it, the print drifts down behind it (14% of its column, the
  hero clipping it) and fades (to two fifths); the print never scales, so
  its cells stay whole. No
  component tour, slides or picker in the hero (the user's call: they
  took the love out of it); the components live in the bento. Under
  900px the statement comes first and the print takes the width under
  it, landscape (5:4); on a phone both keep the page's 16px gutter. The
  h1 AND the keys must clear the fold at 1440×900, 1280×800 and
  1920×1080.
- The missing page (`MissingPage.tsx`, an address nothing lives at):
  the landing's print and header, centred on one screen: the mascot
  (alive), "This page did not print." rising word by word, a two-tone
  line saying why, and the keys back (the chrome "Back to the start",
  then the docs and the Studio), the pointer printing over the whole
  ground (`TRAIL` in `plate.ts`, the hero's stroke). It turns the shell's
  robots tag to `noindex` while it stands and gives it back after.
- The trailer (`TrailerDialog.tsx`): the kit's `DitherDialog` (focus
  trapped and handed back, Escape and the backdrop close it) titled "The
  dither-ui film", its description the film in words (no speech in it;
  both in `film.ts`).
  The `<video>` exists only while the dialog is open: `public/trailer/`
  `dither-ui.mp4` (H.264 + AAC) first, `dither-ui.webm` (VP9 + Opus) for a
  browser built without H.264, `poster.webp`; it starts with `play()` in
  the opening tap's own tick (opening it was the ask, and iOS lets a film
  with sound start only from a gesture), `playsinline`, except under
  reduced motion, where it waits on its poster for play.
  The film is a raea edit cut in a sportswear ad's grammar (React
  compositions the raea CLI renders: the brand's diamond in 3D under one
  cold light, an absolute claim, the diamond taken apart with its parts
  named, the mechanism with a dry kicker, a figure-first spec run read
  off instrument dials (the kit's gauge, its needle swinging to each
  figure: the atomic-age panel the user asked for), names
  in chrome, the site in use captured frame by frame from the production
  build, a torture test it passes on screen, a silent sign-off; hard cuts
  on the beat), set at night (the user's call, a neo-noir's taste and
  none of its devices: rain through every shot, the 3D shots in a haze
  with light through a blind cutting shafts across the mark, the type
  under that light's pool, a deeper black than the site's obsidian, a
  synth score of pads in a long hall, the Bayer motif on an echoing lead
  and rain hiss). The mascot hosts the spec run and
  flies in on its rotor to sign off, drawn from `shared/ui/mascot.ts`'s
  table; after the 3D models it drives its car through the rain, a 3D
  supercar of our own modelled to read as a real one (a smoothed body
  with flared haunches and side intakes, a tinted glass canopy, LED-strip
  headlights, a full-width ember tail bar, torus tyres on multi-spoke rims
  with ember calipers, metallic titanium paint under a clear coat), never
  a real maker's car, badge or name (the user's call, after weighing a
  licence from the maker: its shapes are protected and marketplace
  models carry only editorial rights); the mascot drives it, voxels of
  its own cells behind the glass. Its captions are the site's own copy and figures. Retake all three from the edit when the film changes
  (1080p, 9 to 13 MB each: rain over haze needs bits in the darks) and say what it shows in the dialog's
  description.
- Pixel type (`pixel-type.ts`): a proportional 5×7 bitmap face, a string
  in and its lit cells out, with a lowercase set (four wide, x-height from
  the third row); the brand's lockup sets "DITHER-UI" in it and
  `PixelWord.tsx` draws the parts' names. A
  string with a glyph the face lacks throws; every string the page sets
  is covered by `tests/pixel-type.spec.ts`.
- Facts are claims: `facts.ts` holds `COMPONENT_COUNT` (the hero's and
  the examples' ledes), `MATRIX` (the threshold matrix as the page writes
  it, read from `SCREENS`), `RUNTIME_DEPS` (the packages beside Solid, which
  the install bar's commands and the install lede's count are built from)
  and `SPECS` (the spec sheet closing the
  install: label and value rows on the raised ground, two columns from
  640px, values read from the kit where they can be: the counts, the
  screens, the license; the facts spec holds the rest to the kit's peers,
  matrices and styling systems); `tests/landing-facts.spec.ts` recounts
  the first from `@dither-ui/kit/solid/index.ts` and holds the second to
  the kit's required `peerDependencies` (a styling layer's optional one
  aside), and the plates' stock to the raised ground's mix; section counts
  come from `hub.ts`. A change that moves one
  fails until the page says it.
- Examples (`Examples.tsx`, `#examples`, "Every component, live."): a
  section head (the component count from `facts.ts`, "See every section in
  the docs"), then the bento: `BENTO` (`hub.ts`), twelve live kit
  components (the strongest; the docs hold the rest) on a 12-column grid
  row by row: the 3D model (8, two rows
  tall, flush; `sampleWorld` of a seed on a picked ramp: blue, metal or
  ember, and "New model" for the next seed) beside the gauge (an
  instrument: the kit's `DitherKnob` sets the load and the `DitherGauge`
  needle settles on it) and the
  stat card (frames exported a day, `stat.ts`: the headline is the total at rest; scrub the `Sparkline`
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
  what it does, never a second slogan; its lines never wrap, so their
  size follows the card, a size container, and the longest fits from a
  320px phone's rail up: `tests/landing-fit.spec.ts`); the styling card
  (8, flush, `ExportScene.tsx`: one snippet, an Invoices card, rendered
  live beside its code in the picked system through `restyle`, StyleX
  first; its code wraps inside its panel, never cut mid-token, each line
  hanging under its own indent, the pane fading at its foot; its code
  alone when the card is narrow, a size container) and
  the slide action ("Slide to confirm", its count); the button (6, its
  four fills and five hues, "Publish") and the silk (6). Planned as one
  picture (the stageshow skill's bento rules): neighbours across and down
  are different kinds, never two moving surfaces side by side, and no
  card repeats another's words or the ask's Deploys screen. Each card's art is a `DitherReveal` (the
  8×8 Bayer dissolve, 0.72s, on the glide): it prints itself once as it comes
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
  phone; one card a flick (`scroll-snap-stop: always`), and under it a
  dot a card (`rail.ts`, the user's call): a 6px cell in the muted ink,
  the card at the rail's start a long cell in the ink, each a 24px key
  that takes the rail to its card. A card is the raised ground (`--surface`, no border, 20px
  radius) holding its art over its name at page type (17px; a card's copy
  is the page's, never the size of the UI inside it), the link into
  `/docs/<id>` (no family label). Interactive art keeps its own controls, so the card
  itself is never a link; on flush art the pause chip comes before the
  tools in the DOM, as it sits above them. From 1024px each card slides
  up into place in step with the scroll as it comes in (`SCENES.tile`:
  56px, from its top at the viewport's foot to six tenths of the way up,
  on the glide; a row together); the rail moves only under the finger.
  A press on a card's ground gives (`data-press="card"`), never one on its
  controls, links or canvases, which take the press themselves.
- `hub.ts` is static data (the landing never loads the docs IA): `FAMILIES`
  (every docs family and its size), `DOCS_FAMILIES` (the five big
  families, a line each and the section each opens on) and `BENTO`, held
  honest by `tests/hub.spec.ts` (families and counts equal `GROUPS`, every
  card and first section is a section of the family it names).
- Build (`#build`, "Built from the wire up."), between the bento's plate
  and the ask: a section head (the cell count read from the model, "See
  the world engine"), then `BrandBuild.tsx`: the brand itself as a model
  (`build.ts`: every cell of `LOCKUP`, the mark and the pixel wordmark, a
  deep block with chamfered front edges and a hairline seam, the mark
  standing proud of the word, on a plinth of thin tiles written as the
  file's first shape, so the floor lays itself from its middle out before
  a cell starts (the user's call); the mark's core is a shape of its own,
  written last, whose material gives off the ember (`BUILD_HEAT`, the
  colour the cells fly in with), so it lands last and stays lit, as the
  header's mark has it (the user's call); the user's call: the brand, never a borrowed
  object; written as VRML97 lit by its own `LIGHTS`, a key from the upper
  left, low enough that the floor's tops sit in the middle tones under the
  lockup's bright faces, and a weak fill with no camera light, so tops, fronts, chamfers and
  sides each take their tone and the light stays put as it turns: the
  user asked for it real, and at the few cells a block gets on screen,
  volume and light are what read as real) raised by
  `DitherWorld`'s build as the page scrolls a 260svh run past its pinned
  stage (`stageAt`: the build, floor then cells, over the first stretch, the whole holding
  and turning through the middle, the cells apart as the page leaves; one
  passive scroll listener, live only while the run is near). The camera
  zooms by the stage's aspect (the long lockup nearly spans a wide stage
  and stays whole on a phone) and looks down 22 degrees. The metal is a
  seven-band ramp from the obsidian (shadowed sides sink into the page)
  through graphite and titanium to chrome and bone, with a fine grain;
  the cells in flight the ember. It moves
  only while the reader does (held still 1.2s after the last scroll or
  pointer move, so no pause chip); a pointer over it leans the cells
  away, a drag turns it. Reduced motion: no run, the lockup whole and
  still. `tests/assemble.spec.ts` holds its piece count to the lockup and
  the run's mapping.
- Ask (`#ask`, "Your agent builds the screen."): a section head ("Read the
  agent skill"), then `AgentStory.tsx`, one agent session played as the
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
  Deploys screen (`add_screen`), writes it as a component file (`get_code`),
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
  each headed by a strip flush to its top (120px, 72px on a phone,
  printing in through `DitherReveal`) in its own ink and printer's screen
  (`INSIDE`: blue in Bayer cells, the ember in lines, bone in a halftone
  dot), its `art` a union: a tone (`DitherGradient` from its ink to
  `STOCK`) for the kit and the Studio, a board (`DitherCircuit` in its
  ink, seed 11, full density on a 3-cell lattice, its signals in the
  ember) for the bridge, which carries signals between the tab and the
  agent, its signals running on cue (`drive.ts`'s `useDrive`, which the
  footer's road runs on too: 3s as its card comes into view, then the
  reader's scroll); its own
  character standing on the strip's foot at the right, half over the card
  (the kit's `DitherAvatar` seeded by its title, in its ink, 56px, on a
  plate of the card's ground so its ink never melts into the strip's), then
  its name chunky in the pixel face (`PixelWord.tsx`, 5px cells: "kit",
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
- Works with (`#works`, `WorksWith.tsx`, "Plays well with others."): the
  section head (a lede with a wink, the link to the styling docs), then
  one raised panel of three lists at reading size, generous like a menu
  (18px marks, 15px names; three columns down to 640px, one under it with
  each list's rows two abreast): "Your styling" (`WORKS`; then "and any
  app on its compiled stylesheet: UnoCSS, plain CSS or CSS-in-JS"), "Your agent"
  (the harnesses `packages/bridge/src/dither-bridge.mjs` knows, `HARNESSES` in
  `facts.ts`, its ids and names in order, each under its own mark; keep
  in sync, `tests/marks.spec.ts` checks it; then "or any command you hand
  the bridge"), "Your models" (every format the kit reads, in
  `MODEL_FORMATS` order, named by `MODEL_NAMES`, a `Record` keyed by the
  kit's own type, each after an ember cell; then GLSL).
- The brand's moment (`brand.ts` + `BrandGather.tsx`, decorative): the
  brand as `LOCKUP`, the mark's `MARK_CELLS` (the diamond's 25 cells
  around its ember core, ONE table in `shared/ui/brand-mark.ts` that the
  header, the install icons and the share cards' brand read too), three
  clear columns, then
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
  - `converge` (the plate after the three parts): the seven rows slide in
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
  brand is simply assembled (and a hover replays nothing). It calls
  `onMoving` as its moment starts (the first time or again) and `onSettled`
  when home (at once when it does not move), so a parent keeps one moving
  layer at a time; the brand's moment cases of
  `tests/site/landing.spec.tsx` hold the replay.
  `tests/landing-facts.spec.ts` holds the mark's cells to the diamond, the
  four places to four different moves, each move's opening (rain's one
  line, converge's rows at the edges, strike's stack at the carriage), and every place's moment: home inside five seconds, every
  path in time order, on its grid, inside the field, starting in its
  scene's rows; the gather's burst inside its rows and each wordmark cell
  on its host's squares until it.
- The plates (decorative): two print sheets between the sections, after
  the bento and after the three parts (so the close comes after the works
  as the heat's payoff, never a second heat in a row), each the brand
  small in a wide field and each unlike the other (the audit's call:
  alike, they read as repeated dividers). Each is a sheet of the heat, the
  close's material (the user's call: carry it through the page), so it
  builds up to the close. ONE table, `PLATES` in `plate.ts`, sets each
  plate's clear band (`plateField`: the heat prints from its top edge to
  the band and from the band to its foot, two clouds that rise out of
  nothing and sink back, never in the band), where the
  mark's centre stands in the band (left of 0.7, the wordmark reading on
  to its right), its move, its proportion (`aspect`: 2.4, then a slimmer
  2.8, tall enough that each cloud billows rather than printing as a
  streak) and its printer's screen (`screen`: Bayer, then a halftone dot); `sceneOf` gives its scene (loose in
  the band and its thin edges, thrown anywhere on the sheet,
  seeded by where the mark stands) and its heat's grain (`grain`: finer
  folds than the close's, each plate its own region of the noise, read for
  a balanced mix of clear ground and each ink at the page's full width,
  `span`: a narrower sheet folds finer by as much, so a phone prints the
  same picture smaller, never a cold corner of it). `Plate.tsx` prints a row:
  a passage of its proportion (at least 240px tall, so a phone's clouds
  billow rather than print as scraps) on the page's width,
  on the page's own ground (no box, no stock: the user's call, the
  sections must flow), its heat (`HeatPrint`, still) through its
  `DitherScreen` as two clouds, above the band and below it, each rising
  out of nothing and sinking back and thinning to nothing at the plate's
  ends (`plateau`), so no edge of a box ever shows, and the brand's moment
  in the band, pulled in from the right edge (16px clear) where the plate
  is narrow, while the heat prints in through `DitherReveal` (0.72s on the
  glide, the lights coming on). Each holds as a scroll scene
  (`SCENES.plate`, the user's call): a run of the plate and a hold
  (`.plate-hold`, 40svh), the plate pinned mid-screen through it (sticky,
  under the header at least) and scaling up from 88% into place on the
  glide, then let go; under reduced motion no hold, no pin, no scale. The
  plate reads its height from the run's width (a size container,
  `--plate-h`). `tests/landing-facts.spec.ts` holds every
  plate's mark inside its band; `tests/heat.spec.ts` its clouds full in
  their middles, nothing at the sheet's edges and nothing in the band,
  and a phone's sheet as inked as the page's.
  A new plate is a row in the table and a `<Plate>` at a section break.
- The close (`#install`, out of the page column, the full width): the
  install stands in a clear field over a print of heat (`heat.ts`,
  `paintHeat` on the kit's own `fbm` where a field lets it, its fold (the
  two warp fields) sampled on a grid at a sixteenth of the scale, at most
  every fourth cell, and blended between, the final noise per cell: within
  a cell in a hundred of the exact fold at a quarter of its noise, a
  phone's finer fold every cell (`tests/heat.spec.ts`), `closeField`
  here; `HeatPrint.tsx` paints
  it on the kit's background runtime at `CLOSE.fps`; while it runs the
  close is painted in a worker, `heat-offload.ts` (the page's side: each
  paint takes the worker's latest frame and asks for the one due at the
  next paint) and `heat-ask.ts` + `heat-worker.ts` (the worker's), a
  still sheet and the first paint painting at once, every paint without
  workers; `tests/heat-offload.spec.ts`): ink in water through
  `RAMP`, so the plates, the close and the footer's road are one material.
  Its top is the page's open ground (4 rhythms of air above the head, as
  between sections): heat rises off the band's flat foot (`CLOSE.reach`,
  the foot padded by it through `--reach`, so no ink lands under a word)
  and climbs the sides beside the install's column (`CLOSE.column`),
  thinning out before the top: never a lid, never a frame round the
  install. The sides climb only where the screen leaves them room to read
  as heat (about 1800px and up); a narrower one keeps the foot alone,
  never a sliver at its edge. Where a field thins the heat cools rather
  than fading in rows, so every edge follows the ink's contours, never a
  ruled line. The foot never goes cold: its last rows keep a `floor` of
  the coolest inks, its density still the noise's, so it runs the whole
  width. The footer's ground rises into that foot
  as ONE tab on the page's axis (`.close-tab`: 224px wide (28vw on a phone, 120px at least) by 40px, rounded
  shoulders, two concave fillets into the ground; the industrial brief's
  one credible joint). The heat drifts for `CLOSE.drift` as the band
  arrives (under five seconds, no pause), then only while a pointer moves
  over the band, which pulls the heat toward it; one still frame under
  reduced motion. `tests/heat.spec.ts` holds the column clear, no lid,
  the sides' room, the foot hot and never cold at any band height or
  moment, the ramp's inks only and a moment's bytes.
- Install (`#install`, "Copy one folder. Every pixel is yours."): the
  head centred (the lede, then the `.key` "Copy agent prompt" through
  `DitherClipboard`: the prompt names this origin's `SKILL.md`, the degit
  command, the four packages and the alias), then `InstallBlock.tsx`: a
  box on the raised ground whose top row is the `.seg` step picker (the
  kit's Folder glyph, then npm, pnpm and Bun's own marks) and the Copy
  key (both filled with the page's ground), the command under them in
  mono with the ember `$`; the box and the spec sheet under it keep the
  install head's centred measure (52rem). Under 640px the picker takes the
  top row alone and the command wraps beside the key between its words
  or after a path's slash (`command.ts`;
  each piece unbroken, never at a hyphen), the caret flowing after the last
  word, so all of it shows; inline
  `code` on the landing never wraps. A copy is ONE gesture: while copied the
  command shows selected (the page's ground behind it) as the key's label
  rolls to "Copied" under a check; both let go together; reduced motion
  swaps both at once. Its four steps (degit folder + npm/pnpm/bun deps)
  run the docs' own commands (`docs/install.ts`; the landing never imports
  the docs, so `tests/docs-install.spec.ts` holds its folder and
  `RUNTIME_DEPS` to `INSTALL_STEPS` and `INSTALL_DEPS`).
- Marks: tool logos (the package managers, Node, Solid, Tailwind,
  StyleX, CSS Modules, CSS, GitHub and the coding agents) come ONLY from
  `src/shared/ui/marks.ts` through
  `ToolMark`, one-colour in `currentColor` beside the tool's name, never
  restyled or dithered; everything else is a kit glyph (`DitherIcon`).
- No entrance choreography but the bento's art printing itself once as it
  nears and the brand's moment (the hero's sign-off as the page opens,
  each plate's and the footer's brand as it nears); the hero's print waits for it, and the type
  simply is. Scroll scenes (`scenes.ts`, `shared/lib/scroll-scene.ts`)
  move only under the reader's scroll: the hero easing back, the bento's
  cards sliding in, the plates holding while they scale in; never a
  section's head or the blocks under it, which the rise moves (two
  motions on one thing read as neither). Pressed keys and cards give and
  spring back (`shared/lib/press.ts`: the hand's spring, the one motion
  past its mark, the user's lift for direct manipulation). Motion is the live kit
  surfaces, one moving layer at a time in the bento. Pause chips
  (`PauseChip.tsx`, WCAG 2.2.2): every surface that moves by itself for
  more than five seconds carries one in its corner, named for it ("Pause
  the model", "Pause the shader", "Pause the fluid", "Pause the silk"), `aria-pressed` while the
  surface is still, wired to its `paused` (the model's turn is its
  `auto-rotate`): a disc of the page's ink with its glyph in the ground.
  In the bento a chip shows whether its surface plays: a pause is the
  reader's and outlasts the spotlight; play on a surface the spotlight
  holds makes it the reader's choice. A touch chooses only through the
  chip, since a tap also focuses and would point at the card and then
  toggle what it just started. Chips stay under reduced motion, where
  every surface paints one frame and holds it.
- Mounting reads no layout (the mounting cases of
  `tests/site/landing.spec.tsx`): a read of a
  box, `scrollY` or `offsetParent` while the landing mounts forced a
  layout of the whole page that the rest of the mount then undid (about
  350ms of a 4x-throttled load, now about 30ms). A reading waits for the
  frame (`BrandBuild`'s first measure), the moment that needs it (the
  brand's field, read as it builds), an observer's report (the bento's
  stagger, from an IntersectionObserver's first boxes) or the event that
  brings it (the pointer trail's scroll baseline). Numbers format through
  the kit's `formatFixed` (one formatter a precision).
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
  it. Luminance picks the ink through `RAMP` (`plate.ts`: the page's ground, then
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
  frees); under reduced motion one frame. The mascot drives its car
  (`shared/ui/MascotCar.tsx`, the user's call: a wedge speedster of our
  own, never a real maker's car, badge or name) along the wordmark's top,
  its wheels a screen row under the ink's top (`WORDMARK` in `road.ts`,
  the one geometry the wordmark and the car read): it drives exactly
  while the art moves (the dance, a scroll, a pointer across the footer),
  so the reader drives it, parks as it settles, leaves at the right of
  the wordmark's box and comes back in at the left; under reduced motion
  it stays parked. A scroll drives the road only while it is on screen
  (driven from anywhere, the car's loop ran through the whole page), and
  the car's loop reads the road's and the car's widths from a
  ResizeObserver, never from layout each frame. Decorative (`aria-hidden`); no
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
- Footer signature: the line-screen wordmark (`LineWordmark.tsx`):
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
  CodeBlock, no DemoCard; Engine, `handbook/EngineSection.tsx`, names the
  parts under every surface, each with a figure read from the kit's own
  constants and a link to its section, a dead id failing the render;
  Verification, `handbook/VerificationSection.tsx`, is a lab report: each
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
  `.flat-shell`: the page's one shaped panel is the demo's gel well) → optional picker gallery (an `h3` in
  sentence case, 12px muted, + grid; the picked tile or chip `.ring-on`,
  never a fill a shade off the ground) → `PropsTable`, a spec sheet (a
  `.flat-shell`, its column heads `.spec`; Prop 24% and Default
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
  `<DEMO_FIT.Provider>` (Backgrounds bleeds, its square demos and the
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
  V5 obsidian and bone (`:root.dark[data-page="docs"]` in
  `app/styles.css`: a muted bone at AA on the ground and the raised
  card, the border a quiet step off the ground, the ring bone, the
  landing's float shadow) over the
  grain (`--grain`, the one tile the landing reads too); their light
  theme and the Studio keep the kit's neutrals. The section lists (the
  rail and the sheet) keep each group's heading stuck to the top while
  its sections scroll under it (`NAV_PLACE` in `DocsNav.tsx` holds each
  place's top room and the heading's ground: unseen on the rail's page
  ground, a filled band on the page's ground in the sheet's shell).
- Docs copy follows the landing's bans: no em dashes or middle dots in
  prose, prop `type` notes as `type: note` or `type (note)`, no uppercase
  or tracked label, no arrow-ended link; a snippet's copy matches what its
  demo renders (change both together). Kit default strings quoted in a
  table stay the kit's (the marquee texts keep their dots). The only
  uppercase in the docs' own chrome is `.spec` (the sidebar's group
  counts, the API table's heads) and `.speed-tag` (the title's tags).
- DemoCard is the page's perf seam: its preview's children mount only as the
  card approaches the viewport (IO, 600px rootMargin) and LATCH — once
  revealed they stay, so demo interaction state never resets on scroll; the
  Code tab mounts its source panel on first open (mounted with the page,
  every hidden code block rendered at initial mount; once opened the panel
  stays mounted, hidden by `display`, so edits survive the Preview tab). Section text,
  standalone Handbook CodeBlocks and PropsTables render eagerly, and the
  preview frame keeps `min-h-[280px]` so the box exists from first paint and
  below-fold growth never shifts visible content. Without IO (jsdom) the
  demo renders immediately — tests stay on the eager path.
- Inspect: the `aria-pressed` Inspect chip on the Preview tab mounts the
  workbench (`widgets/workbench`, loaded lazily on first use) over that
  card's preview — Kobra's inspector and tool tray plus the kit's own
  tools (see `widgets/workbench/AGENTS.md`). The card marks itself
  `data-demo-card`; its workspace key is `<section id>:<n>` (its place
  among the section's cards); while inspecting the frame takes a bottom
  lane for the tray (`pb-16`) and `role="group"` + tabindex; the Code tab
  closes it, and its exit returns focus to the chip.
- Code: the source panel (`widgets/source`, lazy) — the example as a
  complete file, the kit files it imports, `theme.css` and `prompt.md`,
  editable, copied, zipped and run. The card hands it the snippet as
  written, `docsFiles`, the framework, the styling system and where it sits
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
- The World section's rocket (`docs/components/rocket.ts`, guarded by
  `tests/rocket.spec.ts`) is our own atomic-age rocket, never a real
  vehicle, flag or marking: a VRML file whose flame flickers and whose
  climb and fireball run on its own tracks, the page's Launch key driving
  one clock (`launchAt`: the file's moment, then `scatter` blowing the
  pieces apart at the top; reduced motion goes straight to the debris).
- Live readings: the Gauge section's second card is an instrument panel
  reading the page itself (frames a second, the worst frame over the last
  `FRAME_WINDOW` ms, the page's elements in thousands), measured by one
  rAF loop that runs only while the card is in view (`createInviewLoop`) and
  read through `docs/components/frames.ts` (`readFrames`, guarded by
  `tests/frames.spec.ts`); its snippet measures the same way on its own,
  so Run plays it.
- Docs serve Solid: snippets are written in Solid, once, for DemoCard
  code tabs and Handbook CodeBlocks (a fragment, or a whole `.tsx`
  module; the source panel completes a fragment, see
  `widgets/source/AGENTS.md`); the API tables are written in Solid's
  words. `tests/site/source.spec.tsx` compiles every snippet in every
  styling system and holds every one to Solid (no Vue notation: no
  `<template>`, directives, `:prop`/`@event` bindings, `{{ }}` or HTML
  comments in markup).
- Docs serve any styling system: `docs/snippet.ts` `docsCode()` (and
  `docsFiles()`, the file with its stylesheet for the source panel) is the
  `@dither-ui/restyle` package's rewriter with the reader's
  `styling` (header switch at lg+, per-card chips). Every DemoCard code tab
  and Handbook block goes through it, so a snippet idiom the rewriter mangles
  gets a rule in `packages/restyle/src/index.ts` + a
  `packages/restyle/tests/restyle.spec.ts` case.
- `SNIPPETS`/derived code must match what the demo renders — it now
  RUNS in the source panel, so a snippet that leaves out what the demo
  has (a chart's height: the chart snippets carry `class="h-64"`) renders
  differently there. Every example runs as written (its state, handlers
  and data declared, the data printed by `dataCode` from the demo's own
  values, no elision, only assets the site holds; see
  `widgets/source/AGENTS.md`); a demo stays inside its card (an overlay
  demo is `absolute` in its box, never `fixed` over the page); API tables
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
  its sections is opened here and stays while it is among the last
  `PACKS_KEPT` (3) read (`visitPack`), so going back is instant and keeps
  each demo's state, while the 300-odd others cost the page nothing:
  27,564 nodes on a section's page became 4,115, and a long read lets the
  oldest pack go (every section opened in one tab had kept 62k nodes and
  461 canvases; now about 37k and 218 at worst, the three heaviest); each
  pack is a chunk of its own (`pack-loaders.ts`: `PACK_LOADERS`, prefetched
  at idle, so moving family stays instant; the page evaluates only the
  pack it shows), the open section's pack loaded before the page first
  renders (`preloadOpenPacks`, from the section route's preload), so it never shows
  empty, and a pack's sections, arriving after the page, are hidden and
  read for "On this page" as they come (a MutationObserver on the flow's
  children; once missed, a family's every section showed at once); the sections DocsPage writes itself keep their element but
  render their contents only while open or among the last read (`opened`,
  `PACKS_KEPT`; they held 3,000 of a section page's 4,200 nodes and all
  its canvases, hidden); `tests/docs-packs.spec.ts` holds every pack to its nav,
  `tests/site/docs-page.spec.tsx` the page's own sections), pushes a history
  entry and reads from the top; back and forward walk them (`popstate`).
  The sidebar, search, the sheet and the pager all open through it. Over
  the section a breadcrumb (the docs, then its group, linking to the
  group's first section; each link a 24px target); under it the pager, the sections either side
  in the sidebar's order, each with its group. The section's title is the
  page's headline (1.5rem in the display face) and its lede reads at 14px.
  The sidebar's groups fold (`aria-expanded` keys with a turning chevron;
  the current section's group opens itself; a folded group's links stay
  in the DOM, hidden, whole for find-in-page and the crawler), and the
  rail keeps the current link in its own view, scrolling the rail, never
  the page, to centre it when it leaves the middle band.
- The docs' header is the site's (Header, above) with Search in its
  tools (a `.nav-a` with its shortcut, `modKey`); the switches that act on
  the page (styling, sounds, theme) sit in the page's row
  beside the breadcrumb, not in the header. Under sm Search shows its
  glyph (the words stay for screen
  readers); under 360px the brand shows its mark alone (the word stays
  for screen readers); the ⌘K kbd shows from md; the styling switch (on
  every card anyway) returns at lg. Under lg the header's tools add a key,
  "Browse sections" (the Book glyph, `aria-haspopup="dialog"`,
  `aria-expanded`, `aria-controls` = `SHEET_ID`), opens the sections sheet
  from anywhere on the page (`DocsSheet.tsx`), a sheet of the site
  menu's bands but the whole screen, `SheetHead` at its top ("Sections" and the
  count in the capsule, "Close sections"), the families under it as bands
  (`DocsNav`'s sheet place, read like the menu: one step of the ink per
  family, `bandFill(i, GROUPS.length)`, seamed into the one above, the
  seam riding over the band above's heading and the first one climbing
  into the head's foot room (`SHEET_HEAD_FOOT`); folded, the bands share
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
- Share cards, set as the landing's hero (the user's pick over a spec
  sheet and a hardware shell; restraint, the print alone on its field):
  `docs/og-card.ts` (the design: size, inks by night and by day, the print's box, the type's
  column, the seeds; import-free, as crawler-files.ts reads it under Node),
  `docs/og-art.ts` (the art: the kit's own poster engine at the print's
  size, a seed's composition through a seed's printer's screen; home prints
  the hero's, seed 5 through Bayer), `docs/og-page.ts` (the renderer, the script of the
  build's `og/index.html`, which `build/og-page.ts` builds over
  `og-shell.html`: `window.og.files(id, seed,
  inv)` for the post-build and the Discord service) and `crawler-files.ts`
  (the cards' copy, embeds and oEmbed).
  A card is obsidian with one bone ink: the brand top left (the header's
  diamond and name), the statement standing on the print's middle (the
  title in chrome, the display face and the site's ramp one horizon per
  line, a route's on one line and a section's on two at most; its line in
  the muted mono, a route's own or a section's lede, which the post-build
  reads off each section's built page into `og/ledes.json` before it draws the
  cards, `ogLede` setting whole sentences in two lines, else a word cut
  and an ellipsis; then the keys, the satin one naming where the card's
  first link goes and a filled one carrying the address), and the print
  on the right, 4:5 as the hero's, its top on the brand's line, standing
  over its floor (the same print turned over and thinned through the
  Bayer matrix). No tags, chips, numbers or frames. By day (the Discord
  toggle) the same card on bone paper in the light chrome, the print's bone
  ink turned obsidian. The loop (72 frames at 12.5 fps, `OG_BEATS`): at
  rest, then the kit's diamond swells over the whole print on the spring,
  turning every tile over into its negative ring by ring, holds, and
  recedes to its place, the screen sliding inside it in whole turns, so
  the GIF's last frame meets its first; the PNG is frame 0, the print at
  rest. Discord's containers draw no accent bar (no side line). Copy
  follows the landing's bans (no caps or tracking, no eyebrow over the
  title, no middle dot or em dash, buttons that name where they go).
  `ROUTE_CARDS` holds the route cards' copy; their ids may never be section ids; each page's image alt is
  the card's. Guarded by `tests/og-card.spec.ts` (loop, determinism, the
  screens, the swell's beats, home as the hero's print with its inks, no
  bone on bone, the print and its floor clear of the type, AA, balanced
  wrap, the lede's cut, the landing's copy bans) and the share-card and
  renderer cases in `tests/crawler-files.spec.ts` (every page's embed
  under Discord's 3,000 byte cap with link buttons only and no accent bar,
  the oEmbed photo, each route head carrying its card's tags, the bans,
  the renderer as a build page).
- Section IA lives in `docs/groups.ts` — the single source for the sidebar,
  the `/docs/<id>` deep links, and the build-time crawl files
  (`crawler-files.ts` generates `sitemap.xml`, `robots.txt` and
  `llms.txt`, emitted by the `siteFiles` plugin in
  `build/site-files.ts`; no hand-maintained
  public copies). New sections are added to a `*-nav.ts` pack and spread
  into a group there — never to the sitemap or llms.txt.
- Search metadata: `docs/seo.ts` derives per-section title, canonical,
  description, and BreadcrumbList JSON-LD from `GROUPS`. `DocsPage` renders
  them through `PageHead` (the one head table, `docs/heads.ts`) for its
  `activeId`, into each section's prerendered page and again as the section
  changes (deep links, search), so every `/docs/<id>` page carries unique
  metadata in its bytes. Unknown or
  empty ids fall back to the generic `/docs` metadata; keep ids unique.
- Chrome: the header is the site's one `SiteHeader` (Header, above),
  with Search and the sections key in its `tools`; the toggles under it
  are tracks, the picked one `.ring-on`. The search
  hint names the visitor's modifier (`⌘K` on Apple platforms, `Ctrl K`
  elsewhere — the handler accepts both). The styling switch carries the
  systems' names (`STYLING_LABELS`), sound
  and theme the kit's glyphs (Volume/VolumeOff, Sun/Moon), GitHub its
  mark. The section list is ONE component, `DocsNav.tsx` (the sidebar
  rail at lg, the sheet under it; `docsUrl` is the one section address):
  groups under their glyphs (`GROUP_ICON`), each with its section count as
  a `.spec`; `NAV_LINK` sizes its links per place, 25px targets at a 27px
  pitch on the rail, 30px in the sheet; "On this page" is `OnThisPage.tsx`. The page title is the h1
  "Documentation" in the display face (`font-display`, 1.6rem) in plain
  ink, no eyebrow; on its
  baseline, the kit's spec as `.speed-tag`s (the section count, Solid,
  Tailwind or StyleX). At xl the rail right of
  the content is "On this page": the section in view, its gallery headings
  and its API table, read from its DOM as the scroll-spy moves (headings
  inside a preview are the demo's), each a button that scrolls to it (the
  sheet lists the same parts under the section's link).
  Under it, Share (`SectionShare.tsx`, a disclosure: `aria-expanded`, the
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
  `docs/examples/` = Examples packs (the sidebar pack's app windows,
  `AppFrame`, keep a desktop's width and scroll in their card on a phone,
  as the bracket does, rather than crush the page beside the sidebar),
  `docs/components/` = component-doc
  packs (form/feedback/structure), `docs/backgrounds/` = the full-bleed
  generative canvas surfaces (aurora, faulty-terminal, ferrofluid, ...),
  `docs/text/` = DOM/CSS text animations (gradient/shiny/glitch/split/...),
  `docs/animations/` = interaction/motion effects (content reveals, animated
  borders, cursor + hover effects; a section with its own state lives in
  its own file, as `TransitionSection.tsx`, the page transition's stage,
  mounted where the nav orders it; so does `backgrounds/PosterSection.tsx`,
  the poster with a seed to roll and its screens, and
  `utils/ScreensSection.tsx`, `print-screens`: one `DitherScreen` around a
  chart, an avatar and a gradient, its screen picked by chips). New
  packs follow this shape instead of growing DocsPage. `docs/overview/` =
  the Quick start (`QuickStart.tsx`, `getting-started`): the install as
  steps from `docs/install.ts` (`INSTALL_STEPS`; `INSTALL_DEPS`, the packages the kit needs), one at a
  time, each its title, why where a reader would ask, and its own
  `CodeBlock` (full width on a phone), then
  "Without Tailwind" (the kit stylesheet, then theming), short under
  its own heading; `INSTALL` is the same steps as the one
  commented script the source panel's prompt.md carries. `docs/primitives/` =
  the Primitives pack (Box, Text, Divider, VisuallyHidden — the paste-list
  foundation family; new plain primitives extend it + PRIMITIVES_NAV).

### studio/

- Boot order in `StudioPage.tsx` matters: `hydrate()` → `startAutosave()` →
  `startHistory()` → deep-link handling (`/studio#new/<type>` or legacy
  `#/studio/new/<type>`), so deep-link artboards are part of the restored doc
  and undoable; the URL is cleaned via `replaceState` to prevent duplication.
  `#new/film` builds the launch film (`addLaunchFilm`, see `src/AGENTS.md`):
  five kit frames and the film cut from them, selected.
- The Studio's chrome speaks the SITE voice, like the landing and the
  docs: `font-mono` on the page root (the context menu and the kit's
  dialogs, portaled to body, carry it on their own panels), the 7×7 diamond brand, `.micro` panel and
  section labels in sentence case, `.ring-on` pressed states, neutral
  focus borders, and the look's materials: the canvas bar is a `.capsule`
  (its tools machined, 8px; `widgets/toolbar/tool.css` is the one tool
  key of it and the title bar),
  the Library key and the empty canvas's "Add an artboard" are the
  `.key-chrome`, the canvas and the dialogs (export, video, shortcuts)
  are `.hardshell`s (14px cut on the canvas, recessed as a well; a
  dialog is its moment's one shaped panel), the chat and the right
  column `.flat-shell`s (the user's industrial brief: one shaped hero
  panel a page; nothing in them pops out, the context menu is
  portaled), the video
  dialog's download is the `.key-chrome`, and the menus (project, library,
  context menu) are rounded cards with a `.rim`. Every glyph button is a
  kit icon (the sidebar, undo/redo, properties, agent, theme, close, zoom,
  fit, replay, menus). The canvas bar (`widgets/toolbar/CanvasBar.tsx`) is
  ONE bar at the canvas's foot, centred: the view (zoom out, the
  percentage, which goes to 100%, zoom in, fit every frame), the
  selection's name in a slot of its own width, then Duplicate,
  Group/Ungroup (one slot), Delete; Replay, Evolve, Reel, Data; Code, PNG,
  Video; Inspect. Every key is a glyph with its name (`aria-label`) and its
  words and keys in the title, always present: one that does not apply is
  disabled, never removed, so the bar keeps its width whatever is picked
  (the canvas bar cases of `tests/site/panels.spec.tsx`). A narrower canvas
  (container queries)
  lets the label go under 760px, the zoom steps under 600px, and closes
  the keys to 28px under 540px (the 1024px window with both columns
  open). Every key names the agent's action that does the same
  (`data-agent`, a `STUDIO_TOOLS` name, pinned by the same spec). It
  stands aside while the workbench inspects or frames are picked for the
  agent, and rides over the data editor while it is open. Copy follows the
  landing's bans: no middle-dot separators, no em dashes, no uppercase label, no eyebrow (the phone notice
  is a plain h1). The artboard SURFACE
  (`[data-artboard-surface]`) stays `font-sans`, the player's font, so
  what is designed on the canvas is what the video export renders.
- The Studio is an app window (the user's call, after an agent app's
  desktop window and its PWA: its layout taken, our materials and mono
  kept), chat first, one CSS grid in `StudioPage`: the title bar across
  the top (`Toolbar`, a `1fr auto 1fr` grid: the sidebar key and
  undo/redo on the left, the project and its menu at the window's centre,
  the Library chrome key, the Chat key, the properties key, the mascot's
  tour key and the theme on the right); under it the sidebar (`ui/StudioSidebar.tsx`, folded by
  the sidebar key or ⌘B: New chat, Search with its ⌘K hint, Add a frame
  (the Library); Projects, a plus for a new one, each project a row with
  its `DitherAvatar` and a row menu (`ui/RowMenu.tsx`, a real menu:
  Rename, Duplicate, Delete project behind a confirm whose words come
  from `deleteWarning`, the title bar's too; a double-click renames in
  place; the key shows on hover or focus, always where there is no hover); the open project unfolds into its chats grouped
  Pinned, Today, Yesterday, This week, Earlier (`chatGroups`), each with
  how long ago it moved and a row menu (Rename, Pin or Unpin, Delete
  chat); switching held while a turn runs; then the tools your agent
  built, folded under their count, each with a remove; the brand home and
  Docs at the foot), the chat column (`AgentPanel`, always mounted, ⌘I or
  the Chat key hides and shows it), the canvas in its shell (the canvas
  bar and the data editor inside it) and the right column: the panel
  (`ui/StudioPanel.tsx`: Properties and Layers tabs, arrow keys between
  them, the tab kept; open by default from 1600px, the choice kept),
  gone when closed. ⌘K opens Search (`ui/SearchPalette.tsx`, a
  combobox): every project's chats (the open one's first; one in another
  project opens that project, then the chat), the projects, the open
  project's frames (one picked is selected and framed) and the actions
  to start something; arrows, Enter, Escape, focus handed back. ⌘⇧↑ and
  ⌘⇧↓ step between the open project's chats outside a field
  (`stepChat`). Below 1280px the chat and the right column take turns
  beside the canvas: opening one puts the other away. Inspect (the canvas
  bar's last key) puts the docs' workbench over the canvas
  (`widgets/workbench`, lazy, keyed `studio:<projectId>`): its overlay
  and tray portaled into the canvas (`Canvas` hands its `ref` `host` and the
  `world` layer the frames stand in, what it inspects), its readout in the
  right column (wide, scrolling) in place of the panel there.
  `startInspecting` (editor) goes to 100% on the selection first, since the
  readings are the frames' own px, and the zoom holds there (keys, wheel,
  pinch, the agent's `view`) until it ends; the canvas's keys step aside
  for the workbench's; the wheel still pans. Escape (the workbench's last
  step), opening the panel or switching project ends it. Below 1440px
  and 1200px the side columns narrow so the canvas keeps room at the
  1024px floor, where a fresh document's first frame is framed (zoomed
  out to fit beside the chat). The
  searchable Library is the single insertion surface for charts, bespoke
  widgets, every public kit component, screens, and presets. New frames
  land at the centre of the canvas as seen (`editor.stage`, which the
  canvas measures; never the window's size). The canvas bar's Evolve
  places a generation of the primary selection.
- The mascot (`shared/ui/Mascot.tsx`) stands in the Studio's moments:
  the empty chat's hello and the bridge setup card (alive), the sidebar's
  empty chats, Search with no match (blinking) and the narrow notice;
  the agent's run row, flying in the spinner's slot while the harness
  works; in the docs, their search with no match (blinking, through
  `DitherCommand`'s `empty`). Its
  tour (`guide.ts`, `ui/StudioGuide.tsx`) flies it, rotor turning, to
  each part of the window by the page's own refs (the canvas, its bar,
  the sidebar, the chat, the panel, then its own key; a thin part from
  beside it, over it at the window's foot), opening a part folded
  away, and it lands to say what the part is for in a bubble: Next flies
  on, Skip, Done or Escape ends it and hands the focus back; shortcuts
  read as the keyboard writes them (`modKey`). It runs once on a first
  desktop visit (`GUIDE_SEEN_KEY`), never under automation
  (`navigator.webdriver`: the build's browser would meet it), and again from
  the title bar's key. Guarded by `tests/studio-guide.spec.ts` (where it
  hovers, the first visit) and the tour cases of
  `tests/site/studio.spec.tsx`.
- `StudioPage` opens the agent protocol on mount (`installStudioAgentApi`)
  and closes it on unmount; a project `.json` dropped anywhere on the studio
  loads through `importDocument`, the same path as Open file.
  Under 1024px the editor gives way to a notice: a still `DitherPoster`,
  why the Studio wants a wide screen and a pointer, the chrome key that
  copies the Studio's own link (to carry to a laptop) and the docs link.
- The canvas bar's Video opens `VideoDialog`
  (`features/export-video`, lazy like `ExportDialog`): length, frame rate
  and theme, then download the self-contained HyperFrames composition,
  open the live player preview, or copy the render command.
- The Agent panel (`widgets/agent/AgentPanel.tsx`, the chat column; ⌘I
  hides and shows it; it stays mounted and closing only hides it, so a
  turn keeps running, and the title bar's Chat key carries a dot while the
  chat is hidden: breathing while it works, the signal ink while a
  permission prompt waits, still when a turn ended unseen,
  `AgentActivity`) is a CONTROL PLANE for the user's own harness, set as an
  agent app's composer, over `features/agent/acp.ts`. The panel holds the
  session; `ui/ThreadEntry.tsx` draws one entry, `ui/TurnTrays.tsx` the
  trays over the input, `model/thread.ts` every reading of the thread
  (title, to-dos, a turn's changes, the blocks it draws; one shared set
  of keys, folds, chips and the spinner lives unscoped under `.agent`).
  It shows the project's open chat (`features/agent/chats.ts`): a new
  chat, or one picked in the sidebar, restores its thread and starts a
  new session with the harness.
  The head: who answers (the harness's mark, else
  the brand mark), the chat's title (its first message), a new chat
  (`/new`) and close. An empty chat stands in the middle of the panel: the
  mark in a recessed well, a greeting and a line, the composer, and the
  starters under it as rows; the first message sends the composer down.
  The thread: your message as a bubble on the right with the frames it
  carried, and beside it (on hover) a restore key that puts the canvas
  back to the checkpoint taken before it (`features/history` `checkpoint`
  / `restoreCheckpoint`: ONE undoable step; checkpoints live in memory,
  so a reloaded chat keeps none); the harness's reasoning as a fold, open
  while it streams ("Thinking"), then closed under how long it took; the
  reply as prose (`widgets/agent/model/prose.ts` reads the harness's Markdown
  into blocks, `Prose.tsx` renders them as elements, never as HTML, a
  caret while it streams) with a copy key under it; each Studio tool call
  one step in words with a kit glyph (`widgets/agent/model/steps.ts` `STEPS`,
  one row per Studio tool, held to `STUDIO_TOOLS` by the test), its args
  and result folded under it, destructive ink when the Studio rejected
  it; the harness's own tool calls as steps with a spinner or a check;
  a run of three or more steps in a row folded under what it did in
  words ("Read 3 files, searched twice, made 1 edit on the canvas", then
  how many failed; `runLabel` reads the harness's ACP tool kinds; open
  while it is the newest thing the harness does, or once opened);
  permission prompts answered inline, their options numbered while one
  waits; each turn closed by "Worked for", "Stopped after" (with
  Continue) or "Failed after" (with Try again) its length; a message past
  8 lines or 600 characters folded under Show more; a copy key on every
  code block; system lines small and muted. A screen reader hears one
  quiet status (needs your answer, done, stopped, failed), never the
  stream; the field announces the listbox option it highlights. The thread
  follows what arrives only while you read its end: scrolled up, it holds
  still and a "Latest" key brings you back. Replies, your messages and
  thoughts read in the proportional face (`--font-sans`, the user's call
  after the composer board); code, steps and the chrome stay mono. The
  composer is ONE surface: the stack (`ui/TurnTrays.tsx`, rows straight
  on it, a hairline between parts, none over the card) rests on the
  input card, and a row under the card says where it runs. Alignment
  (the user's call, measured in a browser, never eyeballed): the panel
  has one 14px line on each side (the header's mark and its last key's
  glyph, loose thread text and steps, every box's edge: bubbles,
  approval cards, the composer), a box's contents sit 13px in, and in the
  composer one `--inset` (10px from its inner edge) puts every glyph, chip
  edge and the placeholder on one left line and every key, the send key
  and the settings glyph on one right line, the text beside a 12px glyph
  on one column (12px, then 7px); a key's glyph, not its hover fill, is
  what sits on a line. Across a row, the words centre on their capitals:
  every one-line label on a row, chip or key is a `.row-label` span
  (the site's stylesheet, used by the sidebar too: one line, ellipsis,
  and where the browser has `text-box`, trimmed to cap height and
  baseline with even padding back), never bare text in the flex row, whose face's line box
  sits the words high beside a glyph; `tests/site/agent-panel.spec.tsx` finds
  bare words on a row. The stack, top to bottom: after a
  turn that finished on its own and while the field is empty, up to three
  next prompts (`model/suggest.ts` `nextPrompts`, from the frames the turn
  changed, else the frames in hand: evolve, show the code, export a video,
  cut a reel; one tap sends); the turn's plan as to-dos (circles, a ringed
  one in progress, done struck through; open while work is left, folded
  once all are done unless the reader chose); the queue (`Queued`, its
  words and what it carries; per message Move up, Edit (back into the
  field), Send now (a running turn stops for it) and Remove; Clear; after
  a stop it waits, paused, saying so, with Send next); the run (thinking, writing or working, its time, a quiet
  Stop with "esc" beside it); once it ends, the turn's changes, last and
  resting on the card (the frames its editing steps touched, folded
  under their count; Undo all restores the turn's checkpoint, Keep
  settles it; each frame opens to Show, Undo (that frame alone back to
  the checkpoint, `restoreFrame`, one undo step; a row then says "Undid
  <frame>" with Put it back while nothing else moved) and Keep, each
  named with its frame for a screen reader; the bar goes once no frame
  is left). The
  input card is the recessed well with a hairline (the ring ink edges it
  while it holds the focus), two lines tall when empty: the context chips
  (the selection, any of it left out by its x, plus frames picked on the
  canvas or by name with `@`, typed or from the @ key, through a
  listbox) and the attachments (`model/compose.ts`, `ui/Attached.tsx`:
  a paste of `FOLD_LINES` lines or `FOLD_CHARS` characters folds into a
  "Pasted text" chip that, pressed, goes back into the field as text, and
  Cmd/Ctrl+Shift+V pastes it raw; a pasted or dropped picture, scaled to
  `IMAGE_EDGE`, at most `MAX_IMAGES`, as a thumbnail chip with its size,
  sent as image blocks and refused with a line saying so when the harness
  takes no pictures; a dropped text file up to `TEXT_FILE_MAX`; anything
  else says why it stays out; the card rings while a file is held over
  it; texts go to the harness fenced so they cannot close their fence and
  marked as material, instructions inside them not the user's, and the
  sent bubble shows each as a chip; a quote of a reply: the reply's
  Quote key or a selection in a reply, which floats a Quote key beside
  it, both a chip that goes first, as a block quote, `QUOTE_MAX`); the message; a foot with the pick key (crosshair: picking
  frames on the canvas, below), the @ key, who answers (LED while it
  runs and its name: a harness picked from the bridge's list by that
  name, Claude Code and not its adapter's package, any other command by
  the title it introduced itself with; it opens the picker: every harness
  the bridge knows with its PATH status, a custom command, stop;
  `/harness <id | command>` is the same; the choice persists and starts
  again on the next prompt; when no bridge answers, the thread shows
  `ui/BridgeSetup.tsx` in place of the greeting and the starters: the one
  line that starts it (`bridgeCommand`: curl the bridge the site serves,
  then node, with `--origin` or `--port` only when needed) with a copy
  key, and the panel looking again every 2.5s for five minutes, then Look
  again; the message waits in the field, and a bridge that answers says
  "bridge connected" and takes the card away), the model it runs when its session says
  (the harness's own list, a menu when it offers more than one; picking
  asks the harness, nothing is kept in the app), and the send key: grey until there is text or an attachment, then
  the chrome key (while a turn runs it queues, Cmd/Ctrl+Enter stops the
  turn and sends now; Stop lives in the run row). Your messages carry, on
  hover or focus, Edit from here (not while a turn runs: the message back
  in the field with its frames, a bar above the card saying the messages
  after it leave the thread, "Canvas back to before it" on when its
  checkpoint is kept, Cancel or Esc; sending restores that checkpoint
  when chosen, drops the later entries, and tells the harness it is a
  revision, whose session keeps the rest), Restore checkpoint and Copy. The row under the card: Ask or Auto (how
  permission prompts are answered; Auto takes their allow option), the
  harness's mode when it has modes (click cycles, `/mode <id>` sets),
  Follow (an eye, pressed: as a step changes frames the canvas centres on
  them, never while the user inspects; kept in `AgentConfig.follow`),
  the bridge's folder (the one key that gives way when the row is
  short), how full the harness's context is when it reports
  (`usage_update`: a ring and its percentage, the tokens and cost in its
  title, `ui/ContextMeter.tsx`; the destructive ink from 90%; in this row,
  not the foot, which it would crowd: the harness's and model's names keep
  their room), and the settings key (the bridge address, each other
  setting the harness offers (effort, thinking, as many as it has: a
  select of its values under its own name, asked of the harness,
  `setOption`; in this sheet, not the row, which they would crowd), tokens in and out
  summed from each turn's usage, the last turn's time, the full cwd; no
  key exists in the app). The thread carries no plumbing: no "starting"
  or "connected" lines (the row and the LED say it), a harness's call
  waits for its title before it shows, and a permission prompt for a
  Studio tool says what it will do in the Studio's words (`STEPS[tool]
  .ask` beside its past tense, `askTitle`), any other MCP tool by its
  tool and server; the one tool's prompt names the action its input
  asks for. A run of a tool the harness built asks first, every time, in
  the thread ("Run <tool>, a tool <harness> built", Run it or Don't run)
  with its code folded open under it; Auto never answers it. Its own
  Studio calls are steps of their own, then "Ran <tool>", so the changes
  bar and checkpoints cover what generated code did. Every grid in the
  panel that stacks blocks names one `minmax(0, 1fr)` column, so a long
  line (a path, a code line, a long suggestion) never widens the panel
  (`tests/site/agent-panel.spec.tsx` reads the styles). Words that are content
  wrap, never cut short: a to-do, a queued message, a suggestion, a
  changed frame, a context chip, a permission choice, a step's title
  (`.row-label.is-wrap`, breaking inside a word only when one word is
  wider than its line); their row, chip or key is `first-line`: its glyphs
  and keys stand on the label's first line, centred on its capitals
  (`--first`, 0.3em and half a cap from the label's top, each glyph's
  `--glyph` its height), and a one-line row keeps its 24px. One-line
  metadata (the header's title, the harness and model, the folder) keeps
  its ellipsis and its full text on hover. A key is never wider than its
  row (a long choice wraps inside it, read from the left). A menu over
  the composer is as tall as the room above it (`--room`, measured on
  open and on resize), and the harness picker's command field, Start and
  Stop are its pinned foot, the harnesses above them what scrolls. Placeholders fit one line at 320px ("Ask, /
  for commands", "Queue a follow-up", "Answer 1 to 3, or redirect", "Queue for
  after the stop", "Ask; this starts the bridge", "Ask; this starts your
  harness"). The canvas hands the agent frames two ways, through
  `features/agent/handoff`: picking (the pick key; a press on a frame
  hands it over or takes it back, a dashed ring in the signal ink marks
  it, nothing inside the frame sees the press, the canvas shows a
  crosshair and a "Click frames to hand them to the agent" bar with Done,
  Esc ends it) and the ask at the selection (`widgets/canvas/SelectionAsk.tsx`:
  one frame selected, a one-line composer under it, or above its label
  when there is no room above the bar at the canvas's foot (`FOOT`, the
  canvas bar's 60px; the selection's ask cases of
  `tests/site/render.spec.tsx`), away while a pointer is down, picking or
  inspecting; its
  message opens the panel, which sends it with the frame as context; asks
  waiting before the panel mounted are taken once it has). The harness reads
  the context as the frames' names and ids ahead of the message, each
  under its own heading (`withContext`: a message that names a thing is
  never read as the frame's caption), and,
  when it takes images, the first three as pictures (each frame drawn to
  a PNG by `features/export-image` `artboardPng`; the bubble's chips show
  a picture then). The field grows with what is typed to 176px, then
  scrolls; its placeholder says what sending does now; the unsent message
  and its chips are kept per chat (closing the panel, a reload, another
  chat and back: saved 250ms after a change, on a chat switch and on
  pagehide, `loadDraft`/`saveDraft`); Try again resends the last message
  with what it carried. Keys: Enter sends, or
  QUEUES a follow-up while the harness works (ACP has no steering; each
  runs as its own turn, in order; Cmd/Ctrl+Enter is the honest steer, a
  stop and a send), except while a permission prompt waits: then what is
  typed is the answer, the prompt declined (its reject option) and the
  words sent next in its place, never on the Enter that ends an IME
  composition (or comes within 500ms of one, as iPad Safari sends it) or
  a held key's repeat; on a touch screen Enter is a newline and only the
  send key sends, which puts the keyboard away, and the field never takes
  focus on its own; Shift+Enter newline; Up brings back what was sent
  (read off the thread) only from an empty field, Down past the newest
  empties it; 1 to 9 answer the waiting permission prompt from an empty
  field (not while it just came up under your typing: 1.5s); Alt+Up takes
  the newest queued message back; Esc closes a menu (the command menu
  stays away until the field changes), else stops (the queue stays,
  paused; Enter in an empty field goes on with it), else ends an edit,
  else leaves the field; Ctrl+O folds every step. The panel is
  its own keyboard scope: its keys never reach the canvas (whose arrows
  nudge and whose Backspace deletes), the page's chords still pass, and a
  character typed on one of its keys lands in the field, as focus returns
  there after every key of the panel. The send and stop keys keep focus
  in the field and ignore a double-click's second press (one send, never
  a stop); a stop reads "Stopping…" until the harness answers, and after
  5s unanswered offers Force stop (the bridge ends the harness's
  process). `/` opens the command listbox (Up/Down + Tab/Enter
  pick): ours (`/help /harness /connect /new /mode /auto /evolve /select
  /code /copy /session /undo /clear /stop /disconnect`) plus the
  harness's own advertised commands, which go to it as text
  (`model/slash.ts`); a command picked and waiting for what it takes says
  it over the field (`/harness <id | command>`, a harness command's own
  hint), and a /word that is no command stays in the field with a line
  saying so, a second Enter sending it as words. A turn's
  reply starts under its message, even when the harness spoke while its
  session opened. The conversation persists per project and follows the
  active project; unanswered approvals are not saved. Pinned by
  `tests/agent-composer.spec.ts` (the reply's prose),
  `tests/site/agent-panel.spec.tsx` (steps, the
  thread's readings, the panel mounted:
  its setup in order, the draft back, history, IME, Esc, the key scope,
  picked frames as context and the pick key, asks taken off the queue),
  `tests/site/carried.spec.tsx` (the harness's updates, slash
  commands, next prompts) and the checkpoint, handoff, thought, picture
  and draft cases in `tests/site/state.spec.tsx`;
  the attachments, the queue tray, edit from here and the context ring by
  `tests/agent-compose.spec.ts`, with the quote, the drafts, Follow, the
  harness's settings, the slash hint and refusal and the frames' heading.
- Child-only kit exports render as the smallest valid parent composition; do not
  add broken isolated previews merely to satisfy registry coverage.
- `ShortcutsHelp` and lazy `ExportDialog` mount here; keep them on the page, not
  inside widgets. The export dialog's `styling` control (Segmented over
  `STYLINGS`) writes the component in the reader's system — the same preference
  the docs use.

### play/

- The player: ONE Studio frame rendered by the Studio's own renderers
  (`ChartRenderer`, `WidgetRenderer`) at its frame size with no editor
  around it — the page an exported HyperFrames composition carries and the
  page the Studio opens for a live preview. A window narrower than the
  frame (a preview link opened on a phone) shows it scaled down to fit
  (`fitScale`, never up), laid out and painted at its own size; a
  composition's window is the frame, so there it stands at 1. `source.ts` reads the document
  from the composition's embedded `#dither-document` JSON (with
  `data-artboard` / `data-theme` on `#dither-stage`) or else from the hash
  `#doc=<base64url document>&artboard=<id>&theme=<dark|light>`; documents
  are untrusted and go through `parseDocument` (persistence) before they
  render. `main.ts` installs `directFromHyperframes()` before mount and
  registers `window.__hf.buildReady["dither-ui"]` as fonts + one
  macrotask (Solid mounts in the call itself) — never an animation frame: the renderer drives
  Chrome with begin-frame control, so frames and rAF only happen when it
  captures one, and every surface paints its moment synchronously on seek
  (a chart that measures later repaints the moment through its `wake`).
  `routes/play.tsx` is the page (noindex, outside the site's shell,
  prerendered as `play/index.html`) and the
  same `main.ts` (`mountPlayer`) is the entry of the single-file bundle
  (`build/standalone.ts`). Nothing here reads the
  project store: the
  page provides `REEL_POOL` (its parsed document's artboards) so a reel
  cuts between the frames that travel with it. Besides `hf-seek`, `main.ts`
  exposes `window.ditherClock` (`seek(seconds)`, `release()`, `directed()`,
  `time()`) for any driver's `evaluate`; `packages/tasks/src/render-frames.mjs`
  (`npm run frames`) renders a composition or player URL to PNGs and an MP4
  through that contract in Playwright's Chromium, WebKit or Firefox.

## Verification

- `tests/landing-facts.spec.ts` recounts `COMPONENT_COUNT` in `facts.ts`
  and holds every count the site states to it (the files its spec lists:
  the README, SKILL.md, `llms.txt`'s source, the Studio film's counters,
  which also count the sections and the Backgrounds);
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
- `tests/site/docs-page.spec.tsx`: the rail scrolls itself (never the page) to
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
  palettes, the styling systems, the slide count, the gauge's knob), the lazy cards loading as they near, each pause
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
  lists has `og/<id>.png` and `.gif` in the package's `.output/public` (the
  GIF's frames move and its
  first is the PNG's card, the mark's core included),
  `embed/<id>.json` and `oembed/<id>.json`, and a section page's
  head points at its own (Discord's Embed Debugger,
  discord.com/developers/embeds, reads a deployed URL as Discord will).

## Child DOX Index

- none
