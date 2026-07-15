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
  Components · Utils. Section ids are permanent deep links — relabel freely
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
- Wayfinding: scroll-spy (IntersectionObserver, rootMargin -56px top) sets
  `activeId` + `aria-current`; hash mirrors section via
  `history.replaceState("#/docs/<id>")`. Deep links restore on mount.
- Chrome: `.chrome` translucent header (scroll-edge fade, no hard border);
  honors `prefers-reduced-transparency`.
- Chart sections link to `#/studio/new/<type>` — keep in sync with
  `CHART_TYPES`.
- Section packs live in subfolders as self-contained components (sections +
  snippets + local state) with a sibling `*-nav.ts` exporting nav items;
  DocsPage imports both and spreads the nav into the right group.
  `docs/examples/` = Examples packs, `docs/components/` = component-doc
  packs (form/feedback/structure). New packs follow this shape instead of
  growing DocsPage.

### studio/

- Boot order in `StudioPage.vue` matters: `hydrate()` → `startAutosave()` →
  `startHistory()` → deep-link handling (`#/studio/new/<type>`), so deep-link
  artboards are part of the restored doc and undoable; hash is cleaned via
  `replaceState` to prevent refresh duplication.
- `ShortcutsHelp` (?) and `ExportDialog` mount here; keep them on the page,
  not inside widgets.

## Verification

- Browser walk after changes: landing reveal + emote hover, docs deep link
  reload (`#/docs/avatar`), studio deep link (`#/studio/new/pie`) creates and
  selects exactly one artboard.

## Child DOX Index

- none
