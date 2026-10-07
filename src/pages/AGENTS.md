# pages — landing, docs, studio

## Purpose

The three routes of dither-ui.com. Each page is a thin composition over
widgets/features; page-specific conventions live here.

## Local Contracts

### landing/

- Direction: Japanese minimal (Ma/Kanso) — one statement, one action, one
  visual. Additions must remove something or justify their presence.
- Load choreography: `.reveal` stagger (0/90/180/300ms), disabled under
  `prefers-reduced-motion`.
- Sprite crops (`public/faces.webp` band + `public/sprites.webp`) use MEASURED constants
  (`FACES`, emote boxes, `FACE_Y/FACE_H`); if a sheet changes, re-measure
  programmatically in the browser (density-scan pattern) — never eyeball.
- `public/faces.webp` has transparency baked in; do not reintroduce runtime
  `getImageData` chroma-keying on the landing.
- Emote hover reactions are CSS-only (`.emote` + `.group:hover`); no JS timers
  on the landing.
- Footer signature: engraved wordmark (`EngravedWordmark.vue`) — glyph paths
  baked from Consolas Bold via `.scratch/engrave/bake.js` into
  `public/engraved-{rim,letters,lit}.svg`, a scale-accurate port of ghost.ai's
  footer recipe (their assets under `gitignored ghostai-ref/`, k = H/524.804):
  rim = glyph-masked inside-stroke `#D6EAFF` @0.7 blurred 1.49; letters =
  their ddii filter — two white under-glows + `#00050A` fill at feFuncA
  slope 0.1 + two black inner shadows from above; hover light = TWO
  pool-masked layers in ghost's stacking — `engraved-lit-bloom.svg` (ramp
  glyphs, blur 12·k → halation past the edges) under `engraved-lit.svg`
  (sharper ramp core + fine grain), both `plus-lighter`, NO glyph clip — the
  light layer's own letterforms shape it, only the cursor pool bounds it
  (pool focus sits up-left of the cursor; the ramp is diagonal — light enters
  from the upper-left, halo offset down-right — pale mint-white bodies, ice
  `#9EF0FF`→`#59D2FF` collecting at the letter bottoms). Depth
  registration: rim ×1.0096 centered, letters ×1.0332 at -1.66%/-3.47% — the
  clip mask compensates with the letters' transform. Regenerate with the bake
  script if the wordmark text ever changes. `max-w-none` on EVERY layer img
  is load-bearing: the preflight img cap silently clamps percentage bleeds.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Text · Animations · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 + optional
  "open in studio →") → muted description → `DemoCard` (Preview/Code tabs) →
  optional picker gallery (micro-label + grid) → `PropsTable`.
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
- `SNIPPETS`/computed code must match what the demo renders; API tables
  mirror actual kit prop defaults — update both when the kit API changes.
  Core form controls share Field-generated IDs, help/error relationships, and
  unified focus/invalid/disabled states; docs examples should show that path.
- Wayfinding: scroll-spy (IntersectionObserver, rootMargin -56px top) sets
  `activeId` + `aria-current`; clean `/docs/<id>` and legacy `#/docs/<id>`
  deep links both restore and remain shareable.
- Section IA lives in `docs/groups.ts` — the single source for the sidebar,
  the `/docs/<id>` deep links, and the build-time crawl files
  (`crawler-files.ts` generates `dist/sitemap.xml`, `dist/robots.txt`, and
  `dist/llms.txt` via the vite `crawlFiles` plugin; no hand-maintained
  public copies). New sections are added to a `*-nav.ts` pack and spread
  into a group there — never to the sitemap or llms.txt.
- Search metadata: `docs/seo.ts` derives per-section title, canonical,
  description, and BreadcrumbList JSON-LD from `GROUPS`. `DocsPage` applies
  them to the DOM as `activeId` changes (scroll-spy, deep links, search), so
  Google's renderer sees unique metadata per `/docs/<id>` page. Unknown or
  empty ids fall back to the generic `/docs` metadata; keep ids unique.
- Chrome: `.chrome` translucent header (scroll-edge fade, no hard border);
  honors `prefers-reduced-transparency`.
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
  packs follow this shape instead of growing DocsPage.

### studio/

- Boot order in `StudioPage.vue` matters: `hydrate()` → `startAutosave()` →
  `startHistory()` → deep-link handling (`/studio#new/<type>` or legacy
  `#/studio/new/<type>`), so deep-link artboards are part of the restored doc
  and undoable; the URL is cleaned via `replaceState` to prevent duplication.
- Studio is canvas-first: Toolbar floats over the full-bleed canvas; Layers and
  Inspector are dismissible overlay panels; the searchable Library is the single
  insertion surface for charts, bespoke widgets, every public kit component,
  screens, and presets.
- Child-only kit exports render as the smallest valid parent composition; do not
  add broken isolated previews merely to satisfy registry coverage.
- `ShortcutsHelp` and lazy `ExportDialog` mount here; keep them on the page, not
  inside widgets.

## Verification

- Browser walk after changes: landing reveal + emote hover, canonical and legacy
  docs deep links (`/docs/avatar`, `#/docs/avatar`), and Studio deep links
  (`/studio#new/pie`, `#/studio/new/pie`) each create/select exactly one artboard.

## Child DOX Index

- none
