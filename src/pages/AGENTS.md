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
- Sprite sheet (`public/sprites.png`) crops are MEASURED constants
  (`FACES`, emote boxes, `FACE_Y/FACE_H`); if the sheet changes, re-measure
  programmatically in the browser (density-scan pattern) — never eyeball.
- Sheet background chroma-key: rgb(5,5,7), threshold 48.
- Emote hover reactions are CSS-only (`.emote` + `.group:hover`); no JS timers
  on the landing.
- Footer signature: cropped giant wordmark at `text-foreground/[0.045]`.

### docs/

- Section anatomy: `<section id>` → heading row (h2 + optional
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
- Composed example blocks beyond the core three live in `docs/examples/`
  as self-contained components (sections + snippets + local state) with a
  sibling `*-nav.ts` exporting their nav items; DocsPage imports both and
  spreads the nav into the Examples group. New example packs follow this
  shape instead of growing DocsPage.

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
