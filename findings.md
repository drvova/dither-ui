# findings.md — knowledge that survives sessions

## Taxonomy shape

- Paste = 44 numbered categories, 624 counted entries (some rows are demos/variants,
  e.g. "Sizes", "With icons", "Block types" — treat as sub-rows of the parent
  component, not standalone components).
- Mix of three kinds: (a) kit primitives, (b) compound UI, (c) whole-app patterns
  (Mail, Git, Agent…). (c) ships as components composed FROM the kit, not rewrites.

## Audit lessons

- Fuzzy coverage audits must normalize case on BOTH sides; first run read bare
  filename matches only (`Input` vs `DitherInput` scored 0).
- File inventory = recursive walk; `dither-kit-svelte` has no `src/` root.
- "Missing" ≠ absent: form gaps like PasswordInput/SearchInput/EmailInput are
  DitherInput configurations — build as composites/docs rows, not new engines.

## Existing surface (what W0 confirmed ships)

- Kit: ~190 .vue (forms, feedback, nav, overlays, charts, backgrounds, text anims,
  cursors, shells/sidebars, dither canvas family).
- App: `src/shared/ui` (CodeBlock, AdSlot, NumberField, Segmented, ColorField…),
  `src/widgets` (studio panels).
- Docs packs: components/examples/backgrounds/text/animations + hand-written
  sections in DocsPage; nav via `*-nav.ts` + `groups.ts` (single source for
  sidebar/deep-links/crawl files).

## Perf/engine constraints that bind every new component

- No unconditional infinite rAF: use `use-inview-loop.ts` (start on first IO hit,
  stop offscreen, idempotent start).
- Canvas surfaces: IO-gated start per kit AGENTS; `use-dither-background` runtime
  for generative backgrounds; document-visibility gate lives there.
- Docs demos mount through DemoCard's lazy slot (IO + latch); don't reintroduce
  mount-time measurement inside sections (ScrollReveal lesson).
- WebKit: no `requestIdleCallback` — gate with IntersectionObserver; docs sections
  opt out of content-visibility via `html.engine-webkit`.
