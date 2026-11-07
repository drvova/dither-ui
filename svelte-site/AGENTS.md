# svelte-site — the Svelte showcase

## Purpose

A Svelte 5 app on the Rstack CLI (`rs dev`/`rs build`/`rs preview`, Rsbuild with
the Svelte and Tailwind plugins, `rstack.config.ts`) that showcases `dither-kit-svelte`, mirroring the Vue `src/`
site: a landing page and a shadcn-style docs (sidebar rail, Preview/Code tabs, API
tables). It is the Svelte counterpart to `src/` (the Vue site):
same dark, monospace, pixel/dither identity, re-expressed with the Svelte kit.
Its landing mirrors the Vue landing (`src/pages/landing/`, whose contract in
`src/pages/AGENTS.md` it follows) wherever the Svelte kit has the parts.

## Ownership

- Owns the entry (`src/main.ts`), the hash router (`src/App.svelte`), the landing
  (`src/landing/`), the copy-key helper every copy button uses
  (`src/copy.svelte.ts`; each call keeps its own copied flag and timer), the copies shared with the Vue site (`src/shared/`,
  `src/fonts/`), the docs (`src/docs/` — `DocsPage.svelte` + `DemoCard`,
  `PropsTable`, `CodeBlock`), the design-token stylesheet (`src/app.css`), and the
  Rstack/Svelte/TS config.
- Does NOT own components — every visual comes from `dither-kit-svelte` via the
  `@dither-kit-svelte` alias (its `index.ts`). No component logic is duplicated here.

## Local Contracts

- Svelte 5 runes only, no legacy API (same rules as `dither-kit-svelte`).
- One Svelte runtime: the kit folder carries its own `node_modules` (for its
  svelte-check), so `rstack.config.ts` resolves this app's `node_modules`
  FIRST; and `verbatimModuleSyntax` is on here and in the kit's tsconfig —
  without it the Svelte compiler's TS pass drops value imports.
- Import kit components from `@dither-kit-svelte` (alias → `../dither-kit-svelte/index.ts`,
  set in `rstack.config.ts` + `tsconfig.json`). Deep engine imports are avoided;
  `cssColor`/`rgb`/`DitherColor` are surfaced on the kit barrel.
- Nothing here imports from the Vue site (`../src`): the two apps stay apart.
  What they share is COPIED byte for byte and pinned by
  `tests/svelte-site-copies.spec.ts` (repo root, `npx rs test`), which fails
  until a change on either side is copied across: `src/shared/marks.ts`
  (from `src/shared/ui/marks.ts`), `src/fonts/` (Michroma's `display.css`,
  `michroma-latin.woff2` and its `OFL.txt`, from `src/shared/fonts/`), and
  the Vue landing's pure modules (from `src/pages/landing/`; `brand.ts`,
  `command.ts` (the install command's pieces), `film.ts` (the film's
  title and description), `pixel-type.ts`, `plate.ts`, `heat.ts` (the heat of the plates and the
  close, painted by `src/landing/HeatPrint.svelte`), `spotlight.ts`, `stat.ts`, `story.ts`), the
  rise (from `src/shared/lib/`; `rise.ts`, `rise-wait.ts`: `use:rise` on the
  hero's statement, each section head and the block groups under them, the words from
  `src/landing/RiseWords.svelte`), and the
  Vue header's menu table and stylesheet (from `src/widgets/site-header/`;
  `menu.ts`, `site-header.css`, which `src/landing/SiteHeader.svelte` uses
  with its own addresses (`HREF` by link id), its own wipe action over the
  engine's `wipeStyle` (played back as the sheet leaves) and a native
  `<dialog>`). Svelte-specific
  glue stays out of the copies: they import the engine as the Vue site names
  it, so `@dither-kit/engine/*` resolves to the Svelte kit's verbatim engine
  (`rstack.config.ts` alias + `tsconfig.json` path) and the type-only
  `@dither-kit` maps to `src/landing/kit-types.ts` (tsconfig only; a value
  import from it fails the build). The same spec holds `facts.ts`
  `HARNESSES` to `bridge/dither-bridge.mjs`, and every docs link the
  landing makes (`docsHref`, which throws on a dead id) to a section the
  Svelte docs render.
- `src/app.css` carries the shadcn-style design tokens the kit components read
  (`--background`, `--foreground`, `--muted-foreground`, `--border`, `--accent`,
  swatch vars) and the Tailwind v4 `@theme inline` mapping. It MUST keep
  `@source "../../dither-kit-svelte"` so Tailwind scans the kit and generates the
  utility classes the components render; `<html class="dark">` selects the dark theme.
- `public/faces.webp` is the portrait band the docs' Image demo uses (copied
  from the repo's `public/faces.webp`); keep them in sync.
- The landing (`src/landing/`, `Landing.svelte` composing `Hero`, `Examples`,
  `AgentStory`, `WorksWith`, `Plate`, `InstallBlock`, `BrandGather`,
  `PixelWord`, `LineWordmark`), in the Vue landing's order: hero, bento,
  plate, ask, three parts (each card's strip, a tone or, for the bridge,
  the kit's `Circuit` board, its `DitherAvatar`
  character on a plate of the card's ground, its name in the pixel face
  with the title for screen readers), plays well with others, plate,
  install, footer:
  - Printed in the dark, always: `landing.css` sets the ground on
    the root `App.svelte` marks with the page (`data-page`, never a
    `:has()`; `tests/root-has.spec.ts`) (obsidian `#101214`, bone `#e4e1d8`, muted bone
    `#9c998f`, the ring in bone), the two inks `--ink`/`--ink-3`, the one
    raised ground `--surface`, the ember `--signal`, the grain, and the
    shared pieces (`.sec-head`, `.section-title`, `.more-link`, `.lead`,
    `.key`, `.seg`); the site voice's `.nav-a`, `.chrome-type` and
    `.key-chrome` sit in `@layer components` so a utility (`hidden`) on the
    same element wins. The Vue landing's bans hold: no uppercase, eyebrows,
    middle dots, em dashes, arrow links, badges, italics, borders,
    hairlines or numbered sections; colour only in the kit's art.
  - Voice: calm and procedural, warm with a wink, as the Vue landing's.
  - The ask (`AgentStory`) is composed as the Vue landing's (`src/pages/AGENTS.md`,
    Ask): corner bleed, the session beside the Deploys screen that runs off
    the stage, parts resolving in their slots, the line at work under
    `DitherSpinner`; a done line carries the kit's ember cell (the Svelte kit
    has no icon set). Its data is the copied `story.ts`.
  - Figures are read, never typed (`facts.ts`): the component count from the
    kit barrel's component exports, the matrix and screens from its engine,
    the packages and version from `dither-kit-svelte/package.json`, the
    docs families and sizes from `docs/nav.ts`; `WORKS` (the Svelte kit's
    styling: Svelte 5, Tailwind v4, CSS variables) and `HARNESSES` feed
    the hero's line and the Works panel. `docsHref(id)` throws on a
    section the docs do not render; every landing docs link goes through it.
  - Left out where the Svelte kit lacks the part (never stubbed): the
    print's floor and the cards' print-in (`DitherReveal`), the 3D model
    (`DitherWorld`), the shader card and the footer's road
    (`DitherShader`), the styling translator card, the Works panel's
    model formats (no 3D surfaces, so no format list), kit glyphs
    (`DitherIcon`: a CSS triangle or an ember cell stands in where a mark
    is needed). The bento holds eight cards; one moving surface plays at a
    time (`spotlight.ts`), each with its pause chip. The Studio, the
    agent files and the film live on dither-ui.com (`links.ts`).

## Work Guidance

- `App.svelte` is a hash router: `#/docs[...]` renders `DocsPage`, everything else
  the landing (its in-page anchors `#examples`, `#ask` included: moving from
  the docs to one, the router goes there once the landing has rendered, else
  to the top). Internal nav uses `#/` and `#/docs/<id>`; GitHub, the Studio
  and the agent files link out.
- The docs look as the Vue docs (`src/pages/AGENTS.md`, docs/): the site's
  header (the landing's `SiteHeader`, `current="docs"`, its `tools` the
  sections key under lg), the obsidian ground under the grain (the
  landing's ground, `:root:is([data-page="landing"], [data-page="docs"])`
  in `landing.css`, and
  its header pieces under `:is(.landing, .docs-root)`), and `docs/docs.css`
  for the rest, the Vue site's values: the docs' border and card, the
  tracks and their `.ring-on`, `.flat-shell`, `.spec`, `.speed-tag`, the
  demo's gel well (`.demo-well` + `.rim`), each section's own heading in the
  display face at 1.5rem over a 14px lede. One section a page (`nav.ts`:
  `sectionOf` reads `#/docs/<id>`, `#/docs` is the front over the first
  section, `neighbours` the pager, `groupOf` the breadcrumb;
  `tests/svelte-docs-pages.spec.ts`); the rest of the flow hidden, read from
  the top. The rail folds by family (the current one opens itself), each
  under the kit's glyph (`icon` in `GROUPS`, drawn from the Vue kit's
  `dither-kit/engine/icons.ts` data: the Svelte kit has no icon set), its
  count a `.spec`; "On this page" at xl; under lg a modal sheet of the same
  list (focus on its close key, Escape or a pick shuts it, focus back on
  its key). Demos use `DemoCard` (Preview/Code in a track, the preview in
  the well), `PropsTable` (a spec sheet, stacked on a phone) and
  `CodeBlock` (a flat shell); a picked tile or chip wears `.ring-on`, never
  a fill. Code snippets are Svelte syntax.
- The docs' own copy keeps the site's bans (`tests/svelte-docs-copy.spec.ts`):
  no em dash in what a reader sees, labels (the galleries' headings, the
  sidebar's groups) in sentence case at 12px in the muted ink, never
  uppercase, tracked or faded below it; a prop with no default is `""`,
  which `PropsTable` prints as "none". A demo's own strings stay the
  product's. A `CodeBlock`'s copy chip takes its own band over the first
  line under sm.
- `DocsPage.svelte` is the shell: the rail and sheet from `nav.ts`
  (`GROUPS`), composing per-family section packs (`GuidesDocs`,
  `ExamplesDocs`, `ChartsDocs`, `PrimitivesDocs`, `Form/Field/Selection/Feedback/
  Structure/Overlay/Surface/NavigationDocs`, `BackgroundsDocs`, `TextDocs`,
  `AnimationsDocs`, `PaletteDocs`). Each pack renders its own `<section id>` blocks,
  every one a direct child of `.docs-flow` (the page shows one at a time).
- Full parity with the Vue docs (~170 sections). The only gap: the `radar` chart
  (the kit has no radar chart series — `Radar` is a background), omitted from `nav.ts`.
- Extend by adding `<section id>` blocks to a pack + a matching `nav.ts` entry.

## Verification

- `npm run check` (svelte-check) and `npx rs build` must both be green;
  `npx rs fmt --check svelte-site/src` from the repo root (it formats the
  `.ts`/`.css`; `.svelte` files are outside the formatter); visual changes
  verified in `rs preview` + screenshots at 1440 and 375 (no horizontal
  overflow at 375); `npx rs test tests/svelte-site-copies.spec.ts` from the
  repo root after touching a copy.

## Child DOX Index

- none
