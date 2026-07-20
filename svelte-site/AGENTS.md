# svelte-site — the Svelte showcase

## Purpose

A Vite + Svelte 5 app that showcases `dither-kit-svelte`, mirroring the Vue `src/`
site: a landing page and a shadcn-style docs (sidebar rail, Preview/Code tabs, API
tables). It is the Svelte counterpart to `src/` (the Vue site):
same dark, monospace, pixel/dither identity and one-statement/one-action/one-visual
restraint, re-expressed with the Svelte kit.

## Ownership

- Owns the entry (`src/main.ts`), the hash router (`src/App.svelte`), the landing
  (`src/Landing.svelte`), the docs (`src/docs/` — `DocsPage.svelte` + `DemoCard`,
  `PropsTable`, `CodeBlock`), the design-token stylesheet (`src/app.css`), and the
  Vite/Svelte/TS config.
- Does NOT own components — every visual comes from `dither-kit-svelte` via the
  `@dither-kit-svelte` alias (its `index.ts`). No component logic is duplicated here.

## Local Contracts

- Svelte 5 runes only, no legacy API (same rules as `dither-kit-svelte`).
- Import kit components from `@dither-kit-svelte` (alias → `../dither-kit-svelte/index.ts`,
  set in `vite.config.ts` + `tsconfig.json`). Deep engine imports are avoided;
  `cssColor`/`rgb`/`DitherColor` are surfaced on the kit barrel.
- `src/app.css` carries the shadcn-style design tokens the kit components read
  (`--background`, `--foreground`, `--muted-foreground`, `--border`, `--accent`,
  swatch vars) and the Tailwind v4 `@theme inline` mapping. It MUST keep
  `@source "../../dither-kit-svelte"` so Tailwind scans the kit and generates the
  utility classes the components render; `<html class="dark">` selects the dark theme.
- `public/faces.webp` is the portrait/emote band the landing blits (copied from
  the repo's `public/faces.webp`); keep them in sync.

## Work Guidance

- `App.svelte` is a hash router: `#/docs[...]` renders `DocsPage`, everything else
  the landing. Internal nav uses `#/` and `#/docs/<id>`; GitHub/studio link out.
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

- `npm run check` (svelte-check) and `npx vite build` must both be green;
  visual changes verified in `vite preview` + a screenshot.

## Child DOX Index

- none
