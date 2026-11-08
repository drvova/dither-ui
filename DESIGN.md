# dither-ui design

The one place the look is written down: what dither-ui looks, moves and
reads like, everywhere it appears (the landing, the docs, the Studio, the
Svelte site, the share cards, the films). Every value here is the code's
own; `tests/design-doc.spec.ts` holds the ones that drift to their source,
so a design change is a change to both. The binding rules for contributors
and agents stay in `AGENTS.md` and the `AGENTS.md` files under it; this
file is the same taste, readable in one sitting.

## The identity in one line

A printed thing in the dark: one bone ink on obsidian, a fine grain, the
kit's Bayer dither as the only art, a monospace voice, and an extended
display face for the few words that lead. Engineered, never decorated.

## Principles

1. **The kit is the art.** Every picture on a page is a live kit component
   the reader can touch: a dithered surface, a chart, a model, a shader.
   Never a drawing of one, never stock imagery, never a mock-up.
2. **Printed, not lit.** The landing is a print: ink laid on a ground
   through a screen. Light, glow and gloss belong to the kit's art, not
   to the page around it.
3. **One of everything.** One ink and one ground (plus one raised ground),
   one signal colour, one display face, one motion curve, one structural
   material a surface, one moving layer at a time.
4. **Silhouette first.** A surface reads by its shape before its detail.
   A detail is allowed only where it reads as construction: one credible
   joint a surface, never fasteners, labels or cut corners as filler.
5. **Calm, procedural, warm.** Copy says what a thing does in the order
   it does it, with the occasional wink. Every figure on a page is read
   from the kit, never typed by hand.
6. **Smooth is part of the look.** A hitch reads as a crack in the
   material. Nothing that moves may stall the page (see Performance).
7. **The reader's hand drives.** Art moves on cue (as it comes into view,
   under five seconds), then only while the reader moves the page or the
   pointer. No perpetual loops, no scanning lines.

## Palette

### The print (the landing, always dark; the docs in the dark)

| Role | Token | Value | Notes |
|---|---|---|---|
| Ground | `--background` | `#101214` (obsidian) | the page |
| Ink | `--foreground` / `--ink` | `#e4e1d8` (bone) | all body text |
| Muted ink | `--muted-foreground` / `--ink-3` | `#9c998f` | 6.6:1 on the ground, 5.7:1 raised |
| Raised ground | `--surface` | bone 7% into obsidian (oklab) | a card, a panel, a picked key |
| Signal | `--signal` | the kit's ember, `rgb(255, 150, 50)` | 8.6:1 on the ground; never red |
| Placeholder | `--placeholder` | `#84827a` | a field's hint, AA in a field |

The supporting neutrals, for materials only: graphite `#25292D`, titanium
`#A6ABB1`, chrome `#D4DCE1`.

Rules:

- Two inks on two grounds. The muted ink is a second ink, not an
  alpha tint of the first; no alpha-tinted fills anywhere on the print.
- Colour lives only inside the kit's art (the poster, the heat, the live
  components). The page around it is bone on obsidian.
- One signal: the ember. It marks the one thing that is live or hot
  (the brand's core cells, a pulse, a build piece in flight). Red is out,
  always; a destructive action wears the ember too.
- A lede is two-tone: the muted ink, with the one clause that carries its
  point stepped up to the full ink. One clause a lede, never bold.

### The kit's swatches

The kit's own colours (`dither-kit/engine/palette.ts`, mirrored as
`--swatch-*`), bright on dark: green `rgb(40, 210, 110)`, blue
`rgb(53, 143, 243)`, purple `rgb(150, 110, 255)`, pink `rgb(240, 90, 190)`,
orange (the ember) `rgb(255, 150, 50)`, grey `rgb(92, 92, 100)`. Their
light-theme twins clear 5:1 on white. Swatches are for the art and the
components' own looks, never for page chrome.

### The docs and the Studio

The docs in the dark wear the print's obsidian and bone, keeping their
tool chrome: a hairline a quiet step off the ground (`#2b2e32`), a raised
card (`#17191c`). Their light theme and the Studio keep the kit's
neutrals. All three share one set of materials (`src/app/styles.css`).

## Materials

One structural material a surface:

- **Anodized graphite**: the default shell, a dark gradient lit from the
  top left. Panels, the docs' demo frames.
- **Bone ceramic**: the light theme's shell.
- **Titanium edges**: a single hairline rim where a shell meets the page.
- **Smoked polymer**: an overlay (a sheet, a menu, a dialog): opaque
  enough to read on, never frosted.

Finishes:

- **Satin chrome** on exactly two things: the hero statement's type and
  the primary key. Never body text, never every heading, never a section
  title. Satin before mirror.
- **The grain**: a fixed 96px tile of single cells a tone under and over
  the ground, never a grid, under every printed page.
- **The demo well**: an asymmetric pebble recessed into the page, a gloss
  on its top edge. Where a live demo sits in the docs.

Banned materials: iridescent pearl, frosted glass, arbitrary glow, neon.

## Type

| Use | Face | Size | Notes |
|---|---|---|---|
| Everything by default | the mono (`--font-mono`) | 14px body | the identity |
| Hero statement | Michroma (`--display-face`) | display size | chrome, the only chrome type |
| Section titles, the docs' page title | Michroma | `clamp(1.6rem, 3.4vw, 2.75rem)` | weight 400, plain ink, balanced |
| Ledes | the mono | 14px, line-height 1.65 | two-tone, `text-wrap: pretty` |
| Small print, labels | the mono | 11-12.5px | sentence case |

- One display face (Michroma, SIL OFL, self-hosted), at its one weight,
  with no negative tracking. Headings, labels, figures and code stay mono.
- One exception: the Studio agent panel's thread prose (replies,
  messages, thoughts) reads in the proportional face; its code, steps and
  chrome stay mono.
- Sentence case everywhere: headings, buttons, actions. Field labels and
  option values may keep the lowercase tool voice. Never uppercase, except
  spec labels and speed tags in the docs' and Studio's tool chrome.
- No italic or slanted type (a speed tag's plate slants; its type stays
  upright). No trendy serif.
- Figures are tabular where they change (`tabular-nums`).

## Layout and space

- **The page**: `--page: 80rem` wide with 24px gutters; sections stand
  `--rhythm: 40px` × 3.5 apart; the header is `--head: 64px`, floating as
  a capsule.
- **A section's head**: the title left; on its baseline, right, the lede
  and the link that names where it goes. Stacked under 900px. Never an
  eyebrow over a title, never a numbered section.
- **Alignment**: what stands under the header stands on its lines (a
  sheet's words start on the brand mark's edge and end on the key word's).
  A hover moves only where a pointer hovers; nothing a finger touched is
  left out of line.
- **No empty space**: every region carries content or the kit's art.
  Scale comes from full-bleed art and display-size type, not from air.
- **The landing's order**: hero (the statement beside a live print,
  signed off with the brand forming), a bento of live components, the
  brand built cell by cell as the page scrolls, one agent session played
  as the page scrolls, what's inside, what it plays well with, the install
  closed by the kit's spec sheet, the footer on the kit's own art. Print
  plates of the brand sit between sections.
- **The docs**: one section a page; a sidebar rail of families, the demo
  with Preview and Code, an API table, "On this page" at xl.
- **The Studio**: an app window, chat first: a title bar, a sidebar of
  projects and their chats, the chat as a column, the canvas beside it,
  properties and layers docked right.

## Shape

- Soft shells against a few sharp, machined boundaries; never uniform
  pills.
- One shaped hardshell a page (two cut corners holding a recessed well);
  every other panel is a `flat-shell`: the shell ground, one hairline, a
  10px radius.
- Keys: the primary key is a satin chrome capsule; secondary keys are
  machined segments in a recessed track; a pressed or picked segment is
  filled (ink in a hairline ring and a breath of fill), never a colour
  fill.
- On the landing a card is a filled ground, a key a filled shape: no
  bordered containers, no dividers or hairlines.

## Motion

- **One curve**: the glide, `cubic-bezier(0.22, 1, 0.36, 1)`
  (`GLIDE_BEZIER` in the kit, `--ease-settle` on the site). It leaves at
  full speed and settles long and soft, never past its mark. Every
  transition, wipe, reveal, rise and page transition moves on it.
- **Three durations**: 150ms for a colour (micro feedback), 350ms for a
  hand's movement, 500ms for a sheet.
- **One moving layer at a time** against a still ground.
- **Stepped where it is printed**: the dither art moves in whole cells
  and at a film's cadence (stop-motion), never a smear.
- **On cue**: art moves as it comes into view (under five seconds, so it
  needs no pause control), then only under the reader's hand. A loop that
  runs longer gets a pause.
- **Page to page**: a cross-document view transition dithered through the
  kit's wipe, a band of the signal ink on its front; the theme turns
  through the same engine as an iris.
- **Reduced motion** is honoured everywhere: still frames, no rolls, no
  smooth scrolling, the final state shown at once.

## The dither

- Every kit surface thresholds its density through a 4×4 matrix: Bayer,
  unless a printer's screen is picked (`line`, `diagonal`, `dot`,
  `cross`). A fill that carries a label keeps Bayer, so its letters never
  break into stripes.
- The cell is the unit. Art is sized in cells, moves in cells and lands
  on whole cells.
- **The heat**: the landing's recurring material, ink in water printed
  through the footer's ramp. It builds up through the page in plates of
  the brand and closes in a band behind the install, hottest along its
  foot.
- **The brand**: the kit's diamond and the lockup. The brand forms its own
  way wherever it stands (gathering cell by cell in the hero and each
  plate, struck in typewriter-wise in the footer, built from the wire in
  `#build`).
- **The mascot**: the diamond come alive, our own character, never another
  product's or a cartoon's.
- Two inks on the page; more than two only inside the kit's art.

## Icons and marks

- Icons do the work of labels where they can: kit glyphs (`DitherIcon`)
  for ideas.
- Tools appear by their real marks (npm, pnpm, Bun, Node, Vue, Svelte,
  Tailwind, StyleX, CSS Modules, CSS, GitHub, each coding agent), one
  colour, beside their names, never restyled.
- Every icon button has a name.

## Copy

- Sentence case. No uppercase labels, no eyebrow over a title.
- No middle dots, no em dashes; a comma, a colon or a full stop instead.
- No link that ends in an arrow: a link names its destination.
- No call times, arguments, rulers, selection handles or decorative dot
  grids: no over-detailed UI.
- No code breadcrumbs: no file paths, tool names or commands as labels.
  A command the reader copies is content and stays.
- Calm and procedural, warm with a wink. Say what a thing does, then what
  to do next.
- Every figure is read from the kit (a count of components, sections,
  formats), never typed by hand.
- A kit component's own designed strings inside a demo are the product
  and stay.

## Bans

Held on the landing, and wherever the user extends them:

- tags, badges, spec labels or speed tags (the docs and the Studio keep
  their tool chrome);
- italic or slanted type; a trendy serif; negative tracking;
- over-detailed UI; dividers and hairlines; containers with borders;
- more than two inks on two grounds, or alpha-tinted fills (lifted inside
  the kit's art);
- diagrams (the more detailed, the worse);
- code breadcrumbs; numbered sections;
- red; a numbered hairline grid; a banded poster with a hatched disc; a
  striped band over the footer;
- cyberpunk neon, a HUD dashboard, a retro filter.

## References

The look borrows taste from references the user picked (a print site, a
Y2K tech-sportswear catalogue, industrial product design, a design-system
taste file), never their devices: a borrowing must not read as a copy.
References stay unnamed in everything that ships or is public: code,
docs, commits and pull requests. Describe the layout or the quality
itself instead.

## Accessibility

A floor, not a feature:

- Text at AA (4.5:1) on the rendered page, gradients and materials
  included; controls and focus rings at 3:1.
- One focus colour everywhere: the theme's ring ink.
- Targets of 24px, or spaced to it (WCAG 2.5.8).
- Reduced motion and reduced transparency honoured in every change.
- Fields read at 16px on iOS, so focusing one never zooms the page.
- Every control a finger drags sets `touch-action` and ends on
  `pointercancel`; every right-click menu opens on a long press.

## Performance

Smoothness is part of the look, so these are design rules too:

- Nothing reads layout while a page mounts or while it scrolls: a box is
  read from an observer's report, in the frame, or as the moment that
  needs it comes.
- No `:has()` on the root; a page marks the root with its name instead.
- Every kit surface paints only where it shows, against one paint budget
  a frame (8ms); a heavy one paints in a worker (the heat, a model on the
  CPU engine) and a shader never waits on the GPU: it compiles in the
  driver's background and reads its pixels back behind the frame.
- A page holds only what it shows and what was just read: the docs mount
  the open family and the last ones read, never all of them.
- Art that is not on screen does not move.
- The first paint is the prerendered page: the app mounts over it once its
  page has loaded, never empties it first; the display face comes with the
  HTML; the page a pointer rests on a link to is made ready before the
  click.

## Where it lives

| Part | Source |
|---|---|
| Kit tokens (both themes) | `dither-kit/engine/theme.css` |
| Site materials, chrome, motion | `src/app/styles.css` |
| The landing's print | `src/pages/landing/chapters.css`, `LandingPage.vue` |
| The docs' materials | `src/pages/docs/` (the Svelte site's `svelte-site/src/docs/docs.css`) |
| Motion curves | `dither-kit/engine/dither-paint.ts` (`GLIDE_BEZIER`), `dither-kit/engine/spring.ts` |
| Print screens | `dither-kit/engine/pixel.ts` (`SCREENS`) |
| The heat and the plates | `src/pages/landing/heat.ts`, `plate.ts` |
| The display face | `src/shared/fonts/` |
| Studio audience and principles | `.impeccable.md` |

Changing the look: change the source, then this file, in the same commit;
`tests/design-doc.spec.ts` fails until they agree.
