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
- Footer signature: cropped giant wordmark at `text-foreground/[0.045]`.

### docs/

- Sidebar IA (after Base UI): Overview · Handbook (Styling, Composition,
  Animation, Accessibility — prose + CodeBlock, no DemoCard) · Examples ·
  Components · Backgrounds · Utils. Section ids are permanent deep links — relabel freely
  (`motion` → "Animation") but never rename an id.
- Component section anatomy: `<section id>` → heading row (h2 + optional
  "open in studio →") → muted description → `DemoCard` (Preview/Code tabs) →
  optional picker gallery (micro-label + grid) → `PropsTable`.
- Galleries and chip rows are PICKERS, not decoration: `aria-pressed`
  buttons drive the main preview's props; chart previews also bump a
  replay token so the kit's dither entrance is the transition. Code tabs
  are computed from the picked state — what you see is what you copy.
- `SNIPPETS`/computed code must match what the demo renders; API tables
  mirror actual kit prop defaults — update both when the kit API changes.
  Core form controls share Field-generated IDs, help/error relationships, and
  unified focus/invalid/disabled states; docs examples should show that path.
- Wayfinding: scroll-spy (IntersectionObserver, rootMargin -56px top) sets
  `activeId` + `aria-current`; clean `/docs/<id>` and legacy `#/docs/<id>`
  deep links both restore and remain shareable.
- Chrome: `.chrome` translucent header (scroll-edge fade, no hard border);
  honors `prefers-reduced-transparency`.
- Chart sections link to `/studio#new/<type>` — keep in sync with `CHART_TYPES`;
  Studio also accepts legacy `#/studio/new/<type>` links.
- Section packs live in subfolders as self-contained components (sections +
  snippets + local state) with a sibling `*-nav.ts` exporting nav items;
  DocsPage imports both and spreads the nav into the right group.
  `docs/examples/` = Examples packs, `docs/components/` = component-doc
  packs (form/feedback/structure), `docs/backgrounds/` = the full-bleed
  generative canvas surfaces (aurora, faulty-terminal, ferrofluid, ...). New
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
