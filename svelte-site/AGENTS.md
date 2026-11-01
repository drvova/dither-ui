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
  (`src/landing/`), the copy-key state every copy button shares
  (`src/copy.svelte.ts`), the docs (`src/docs/` — `DocsPage.svelte` + `DemoCard`,
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
  `cssColor`/`rgb`/`DitherColor` are surfaced on the kit barrel. The one
  exception: the landing's copied `brand.ts`/`plate.ts` read `xorshift32` and
  `PixelColor` from `dither-kit-svelte/engine/pixel` (not on the barrel).
- `src/app.css` carries the shadcn-style design tokens the kit components read
  (`--background`, `--foreground`, `--muted-foreground`, `--border`, `--accent`,
  swatch vars) and the Tailwind v4 `@theme inline` mapping. It MUST keep
  `@source "../../dither-kit-svelte"` so Tailwind scans the kit and generates the
  utility classes the components render; `<html class="dark">` selects the dark theme.
- `public/faces.webp` is the portrait band the docs' Image demo uses (copied
  from the repo's `public/faces.webp`); keep them in sync.
- The landing (`src/landing/`, `Landing.svelte` composing `Hero`, `Examples`,
  `AgentStory`, `Plate`, `InstallBlock`, `BrandGather`, `LineWordmark`):
  - Printed in the dark, always: `landing.css` sets the ground on
    `:root:has(.landing)` (obsidian `#101214`, bone `#e4e1d8`, muted bone
    `#9c998f`, the ring in bone), the two inks `--ink`/`--ink-3`, the one
    raised ground `--surface`, the ember `--signal`, the grain, and the
    shared pieces (`.sec-head`, `.section-title`, `.more-link`, `.lead`,
    `.key`, `.seg`); the site voice's `.nav-a`, `.chrome-type` and
    `.key-chrome` sit in `@layer components` so a utility (`hidden`) on the
    same element wins. The Vue landing's bans hold: no uppercase, eyebrows,
    middle dots, em dashes, arrow links, badges, italics, borders,
    hairlines or numbered sections; colour only in the kit's art.
  - The display face and the tool marks are the Vue site's own, read by
    path, never copied: `src/shared/fonts/display.css` (Michroma) and
    `src/shared/ui/marks.ts` (through `ToolMark.svelte`).
  - Pure landing modules are copies of the Vue landing's (`brand.ts`,
    `pixel-type.ts`, `plate.ts`, `spotlight.ts`, `story.ts`; each header
    says what differs): re-copy on change there. The bridge's harness list
    in `Landing.svelte` follows `bridge/dither-bridge.mjs` `HARNESSES`.
  - Figures are read, never typed (`facts.ts`): the component count from the
    kit barrel's component exports, the matrix and screens from its engine,
    the packages and version from `dither-kit-svelte/package.json`, the
    docs families and sizes from `docs/nav.ts`. `docsHref(id)` throws on a
    section the docs do not render; every landing docs link goes through it.
  - Left out where the Svelte kit lacks the part (never stubbed): the
    print's floor and the cards' print-in (`DitherReveal`), the 3D model
    (`DitherWorld`), the shader card and the footer's road
    (`DitherShader`), the styling translator card, kit glyphs
    (`DitherIcon`: a CSS triangle or an ember cell stands in where a mark
    is needed). The bento holds eight cards; one moving surface plays at a
    time (`spotlight.ts`), each with its pause chip. The Studio, the
    agent files and the film live on dither-ui.com (`links.ts`).

## Work Guidance

- `App.svelte` is a hash router: `#/docs[...]` renders `DocsPage`, everything else
  the landing (its in-page anchors `#examples`, `#ask` included). Internal nav
  uses `#/` and `#/docs/<id>`; GitHub, the Studio and the agent files link out.
- Docs is a long-scroll page: each `<section id>` is tracked by an IntersectionObserver
  that syncs `#/docs/<id>`; the sidebar highlights the section in view. Demos use
  `DemoCard` (Preview/Code tabs) and `PropsTable`; code snippets are Svelte syntax.
- `DocsPage.svelte` is a thin shell: sidebar from `nav.ts` (`GROUPS`) + the
  IntersectionObserver, composing per-family section packs (`GuidesDocs`,
  `ExamplesDocs`, `ChartsDocs`, `PrimitivesDocs`, `Form/Field/Selection/Feedback/
  Structure/Overlay/Surface/NavigationDocs`, `BackgroundsDocs`, `TextDocs`,
  `AnimationsDocs`, `PaletteDocs`). Each pack renders its own `<section id>` blocks.
- Full parity with the Vue docs (~170 sections). The only gap: the `radar` chart
  (the kit has no radar chart series — `Radar` is a background), omitted from `nav.ts`.
- Extend by adding `<section id>` blocks to a pack + a matching `nav.ts` entry.

## Verification

- `npm run check` (svelte-check) and `npx rs build` must both be green;
  `npx rs fmt --check svelte-site/src` from the repo root (it formats the
  `.ts`/`.css`; `.svelte` files are outside the formatter); visual changes
  verified in `rs preview` + screenshots at 1440 and 375 (no horizontal
  overflow at 375).

## Child DOX Index

- none
