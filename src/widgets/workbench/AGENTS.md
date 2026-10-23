# widgets/workbench — the docs previews' inspector and annotator

## Purpose

Kobra's component workbench (its Inspect switch and Mesurer tool tray) for
every docs preview, plus what the kit needs beyond it: inspect, measure,
annotate, comment, capture and hand the result to a coding agent, on the
live preview — a real tool, never a mock.

## Ownership

- `Workbench.vue` — the root: creates the controller, provides it
  (`context.ts` → `useBench()`), teleports the overlay into the preview
  frame (`host`) and renders the readout and panels under it.
- `bench.ts` — the controller: tool state, the undoable workspace, the
  per-frame measuring loop, every pointer gesture, the keyboard, captures,
  the agent hand-off. Components render from it and call into it.
- `model/` — pure logic, unit-tested: `color.ts` (parse every computed
  form, print hex/rgb/hsl/oklch, WCAG contrast), `geometry.ts` (boxes,
  distance segments, snap, dock), `ink.ts` (streamlined ink outlines,
  marker lines, erase, arrows, hit tests), `measure.ts` (DOM readings:
  box/box model/gaps, CSS block, selectors and child paths, type lines and
  baselines, rendered font, background behind, role/name/states, Tab
  order, audit), `workspace.ts` (the annotation model, sanitizing,
  snapshot history, persistence, agent Markdown), `settings.ts`,
  `capture.ts` (DOM render, tab grab, region recording, trim, frames for
  a GIF), `gif.ts` (GIF89a: one median-cut palette over all frames,
  ordered-dithered by the kit's Bayer matrix, LZW), `tools.ts`.
- `ui/` — one component per layer or panel: `Tray`, `Rulers`, `Guides`,
  `Marks`, `Ink`, `Notes`, `Comments`, `Loupe`, `Readout`, `Motion`,
  `Responsive`, `Settings`, `Icon`.

## Local Contracts

- Mounted by `pages/docs/DemoCard.vue` through `defineAsyncComponent` when
  its Inspect chip is pressed (one lazy chunk; ~300 cards cost nothing
  until used) with the frame (`host`), the slot wrapper (`content`), the
  card, `benchKey` `<section>:<n>`, the section id, a title, the canonical
  URL and the slot itself (`render`, for Responsive). Emits `exit`.
- Coordinates are STAGE px: the overlay root `.wb` covers the frame's
  padding box; every reading, guide, stroke, note and anchor is relative to
  it. Captures add the frame's border (`toHost`).
- Tools (group 1 inspect, group 2 annotate; one key each): Inspect `I`,
  X-ray `X`, Guides `G` (`H`/`V` turn it), Typography `A`, Sample color
  `P` (the EyeDropper where it exists, the stage sampler always), Pixel
  loupe `Z`, Accessibility `Y` · Select `S`, Arrow `D`, Pen `N`, Eraser
  `E`, Text `T`, Comment `M`, Screenshot `C`, Record video `V`. Toggles:
  Rulers `R`, Responsive `B`, Motion `O`. `1`/`2` switch groups, `K` copies
  the feedback for an agent, `,` opens settings, `⌘Z`/`⇧⌘Z` undo/redo,
  `⌘A` selects all (Select), Delete removes, arrows walk the tree (target
  tools) or nudge (Select), Alt shows distances and Alt+S keeps one.
  Select's box has corner handles (scale from the opposite corner; Shift
  keeps the proportion; notes scale their text) and a rotate handle
  (Shift snaps to 15°); transforms map the gesture's ORIGIN snapshot, so
  they never drift, and land as one undo step. A thread's Move button
  re-anchors it to the next element clicked.
  Escape steps back one level: draft → recording → thread → selection →
  pin → panel → tool → closes the workbench (focus returns to the chip).
  New tools are rows in `TOOLS` with a key no other row uses.
- Keys belong to ONE preview: the last one pointed at or focused, and only
  while the pointer is over it or focus is inside its card; typing in an
  input never triggers a tool.
- Any tool in hand puts a pointer SURFACE over the preview (the preview
  never receives the press); with no tool the preview is live and the
  rulers and annotations stay. Elements are found under the surface with
  `document.elementsFromPoint`, skipping the overlay. Comments anchor to
  the nearest control (`controlOf`), by child path (re-found after
  re-renders) with the selector and box kept for the agent.
- Overlay layers are decorative (`aria-hidden`): the readout says the same
  in words and every measurement, colour and audit result is reachable
  there; guides can be placed by number; the tray is a `toolbar` with
  roving arrows; pressed state is the ringed `aria-pressed`; a polite
  status line announces pins, copies and captures. Forced colours map the
  highlight to Highlight.
- The workspace (guides, layout grid, arrows, strokes, notes, kept
  measurements, threads) is plain data: changes go through `change()`
  (one snapshot per gesture; a gesture that changed nothing drops its
  step), saved per preview to `localStorage` `dither-workbench:<key>`
  (debounced; off by setting) and SANITIZED on load (`normalizeWorkspace`
  — storage is untrusted: ids, colours, sizes and lengths are bounded).
  Settings are one set for all previews (`dither-workbench-settings`),
  colours as theme swatch tokens.
- Captures: stills render the DOM by default (html-to-image; no prompt)
  or grab the screen's exact pixels; recordings share the tab and crop it
  to the region by Region Capture (a transparent target laid over the
  region; the track is recorded as it comes), else cut each frame out of
  the viewport on a canvas; the overlay is hidden while capturing; 60 s
  cap; trims re-record the cut, scaling frames that change size; export
  as WebM/MP4 (as recorded) or a GIF (12 fps, ≤ 480 px, ≤ 240 frames,
  dithered by the kit — a GIF of the dither stays crisp).
- The tray docks to the stage's bottom (default) or top (`settings.tray`);
  the workbench sets `data-tray` on the frame and DemoCard keeps that
  edge's lane free (`data-[tray=…]` padding).
- The measuring loop runs only while the workbench is mounted and writes a
  reactive value only when it changed; X-ray and the audit refresh every
  300 ms; the loupe redraws at 20 fps while visible.
- The kit clock control (Motion) is page-wide and says so; unmounting a
  workbench releases a clock it held.

## Verification

- `tests/workbench.spec.ts`: the GIF encoder (LZW round-trips through a
  decoder, table resets included; median cut; Bayer dithering; the
  GIF89a frame), colour parsing/printing/contrast, geometry,
  ink, workspace sanitizing/history/Markdown, settings, the DOM readings
  (names, roles, states, Tab order, paths, selectors, controlOf), and the
  workbench mounted on a `DemoCard` driven by keys, the tray and Escape.
- Browser walk (`rs dev`): every tool on `/docs/button` (hover, pin, Alt
  distances and Alt+S, X-ray, Typography's contrast, Accessibility's Tab
  order, guides placed / dragged off, the loupe over a dithered canvas,
  arrows, ink and eraser, notes, a comment thread, Select marquee →
  Delete → undo, a screenshot, K's Markdown), a recording on
  `/docs/spinner` (Chromium flags `--auto-accept-this-tab-capture
  --use-fake-ui-for-media-stream`) trimmed and saved as WebM and GIF
  (`ffprobe` the files), Select's scale / rotate / undo, a thread moved,
  the tray docked top,
  Motion on `/docs/shiny-text`, Responsive, Settings, persistence across a
  reload, keyboard-only use, light theme, a 390px phone with touch.

## Child DOX Index

- none
