# svelte-site — the Svelte showcase

## Purpose

A minimal Vite + Svelte 5 app that showcases `dither-kit-svelte`, mirroring the
Vue `src/` landing page. It is the Svelte counterpart to `src/` (the Vue site):
same dark, monospace, pixel/dither identity and one-statement/one-action/one-visual
restraint, re-expressed with the Svelte kit.

## Ownership

- Owns the Svelte landing (`src/App.svelte`), its entry (`src/main.ts`), the
  design-token stylesheet (`src/app.css`), and the Vite/Svelte/TS config.
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

- Prefer editing existing files; the landing is one component by design.
- Nav links point at the live site / GitHub (there is no Svelte docs/studio yet).

## Verification

- `npm run check` (svelte-check) and `npx vite build` must both be green;
  visual changes verified in `vite preview` + a screenshot.

## Child DOX Index

- none
