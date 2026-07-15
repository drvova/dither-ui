# src — site + studio app

## Purpose

The dither-ui.com site (landing, docs) and the studio editor, built on the kit
in `../dither-kit`. Feature-Sliced Design (FSD) layering.

## Ownership

- `app/` — entry, global styles/tokens, hash router (App.vue).
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

## Local Contracts

- Layer imports flow downward only: pages → widgets → features → entities →
  shared. `@dither-kit` may be imported from any layer; nothing imports back
  into it.
- Routing is hash-based in `app/App.vue`: `#/` landing, `#/docs[/section]`,
  `#/studio[/new/<type>]`. Add vue-router only when route params outgrow this.
- `entities/editor` is the sole mutation path for document state. History
  (`features/history`) snapshots `{artboards, groups}` — excludes viewport and
  selection deliberately; new document-shaped state must be added to both the
  snapshot and `features/persistence`.
- Editor mutations must stay undoable: route them through the editor store so
  the deep watcher records them; never mutate artboards from a component.
- Keyboard map lives in `features/keyboard/useShortcuts.ts`; every new
  shortcut also gets a row in `ShortcutsHelp.vue`.
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

## Verification

- `npx vue-tsc --noEmit` and `npx vite build` green before commit.
- Interactive checks in a real browser (agent-browser + screenshots) for
  anything visual or stateful (undo/redo walks, dialog focus, deep links).

## Child DOX Index

- `pages/AGENTS.md` — landing, docs, studio page contracts
