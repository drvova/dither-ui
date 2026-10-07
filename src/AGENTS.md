# src — site + studio app

## Purpose

The dither-ui.com site (landing, docs) and the studio editor, built on the kit
in `../dither-kit`. Feature-Sliced Design (FSD) layering.

## Ownership

- `app/` — entry, global styles/tokens, canonical-path + legacy-hash router (App.vue).
- `pages/` — landing, docs, studio (see `pages/AGENTS.md`).
- `widgets/` — studio panels: toolbar, layer-tree, inspector, canvas,
  chart-renderer, widget-renderer, data-editor.
- `features/` — user actions: history (undo/redo), keyboard (shortcuts +
  ShortcutsHelp overlay), persistence (localStorage hydrate/autosave),
  export-code, pan-zoom, artboard-transform.
- `entities/` — domain stores: editor (selection/artboards, single source of
  truth), chart, widget, artboard.
- `shared/` — ui primitives (Segmented, NumberField, ColorField, CodeBlock,
  ContextMenu, ...), config (CHART_TYPES), lib (theme).
- `entities/widget/model/registry.ts` is the single source for Studio's searchable
  component library, inspector controls, untrusted-prop sanitization, functional
  demo composition, and code export. Every public `Dither*` export is covered
  there or by a bespoke widget kind.

## Local Contracts

- Layer imports flow downward only: pages → widgets → features → entities →
  shared. `@dither-kit` may be imported from any layer; nothing imports back
  into it.
- Canonical routes are `/`, `/docs[/section]`, and `/studio`; legacy
  `#/docs[/section]` and `#/studio[/new/<type>]` links remain supported. Route
  entry HTML files own static crawler-visible metadata; docs sections refine
  it at runtime per `/docs/<id>` (see `pages/AGENTS.md`). `app/App.vue`
  resolves both path styles. Internal app links and public asset URLs use
  `routePath()` /
  `assetPath()` from `shared/lib/routes.ts` so the same build works at `/` and
  at the GitHub Pages project base. Add vue-router only when route params
  outgrow this.
- `entities/editor` is the sole mutation path for document state. History
  (`features/history`) snapshots `{artboards, groups}` — excludes viewport and
  selection deliberately; new document-shaped state must be added to both the
  snapshot and `features/persistence`.
- Editor mutations must stay undoable: route them through the editor store so
  the deep watcher records them; never mutate artboards from a component.
- New artboards route through `placeArtboard` after their final size is known; it
  centers every insert exactly in the current viewport. Do not restore cascading,
  origin, or right-edge spawn logic.
- Keyboard map lives in `features/keyboard/useShortcuts.ts`; every new
  shortcut also gets a row in `ShortcutsHelp.vue`.
- Pointer transforms use `features/artboard-transform/startDrag`; it filters by
  pointer id and owns pointer-up/cancel/unmount cleanup. Artboard surfaces drag
  only from non-interactive regions so live controls retain pointer ownership.
- Move, nudge, duplicate, delete, lock, and group commands act on the complete
  selection; locked members remain stationary.
- Toolbar hierarchy is contextual: project/insertion/global view controls persist;
  edit, data, and export actions appear in the selection toolbar only while an
  artboard is selected. Project file import/export stays in the project menu.
- Studio lifecycle watchers are singletons while the route is mounted:
  `startAutosave`/`startHistory` replace prior handles and StudioPage stops them
  on unmount. Route revisits must not accumulate deep watchers.
- A11y floor: icon-only buttons carry `aria-label` (+ `aria-pressed` for
  toggles); dialogs use `role="dialog" aria-modal`, close on Escape, focus on
  open; global `:focus-visible` ring is in `app/styles.css` — do not suppress.
- Layer tree is a `listbox`: every row type is a focusable `role="option"`
  with `aria-selected`, Enter/Space select (`.self`-guarded so rename inputs
  don't retrigger), ↑/↓ move focus and MUST stopPropagation — the same keys
  nudge artboards at window level. New row kinds follow this shape.
- Design tokens: shadcn-style CSS vars in `app/styles.css`; components use
  token utilities (bg-background, text-muted-foreground, border-border), never
  raw hex.
- Entry (`app/main.ts`) is `createApp` — client render, deliberately NOT
  hydration: the route prerender (`scripts/prerender.mjs`) is a crawler
  surface, and hydrating it corrupts DOM because kit components gate on
  measured state (chart `ctx.ready`, mount flags), so first-render vnodes
  never match the settled snapshot. Don't retry hydration without first
  making first render equal settled state.
- Docs sections are DIRECT children of `.docs-flow` and carry
  `content-visibility: auto` + `contain-intrinsic-size: auto 700px` — below-
  fold sections skip layout/paint until they approach the viewport (the page
  is 220 sections / ~180k px; first layout of everything cost seconds). New
  section wrappers must stay inside `.docs-flow` to keep the rule applying.

## Verification

- `npx vue-tsc --noEmit` and `npx vite build` green before commit.
- Interactive checks in a real browser (agent-browser + screenshots) for
  anything visual or stateful (undo/redo walks, dialog focus, deep links).
- Perf probes MUST use trailing-slash URLs (`/docs/`, `/studio/`): `vite
  preview` falls back to the landing HTML for slashless paths, which silently
  measures the wrong page.

## Child DOX Index

- `pages/AGENTS.md` — landing, docs, studio page contracts
