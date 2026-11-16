# widgets/workbench — the docs previews' and the Studio canvas's inspector and annotator

## Purpose

Kobra's component workbench (its Inspect switch and Mesurer tool tray) for
every docs preview and the Studio's canvas, plus what the kit needs
beyond it: inspect, measure, annotate, comment, capture and hand the
result to a coding agent, on the live preview — a real tool, never a mock.

## Ownership

The components and the controller live in this folder; `model/` beside
them holds the framework-free model (see `../../AGENTS.md`) and the
controller's Solid-bound parts (below).

- `Workbench.tsx` — the root: creates the controller, provides it
  (`context.ts` → `useBench()`), portals the overlay into the preview
  frame (`host`) and renders the readout and panels under it.
- `bench.ts` — the controller: tool state, the undoable workspace, the
  per-frame measuring loop, every pointer gesture, the keyboard, captures,
  the agent hand-off (the feedback as Markdown: copied for an agent, or,
  where the host passes `send` as the Studio does, sent to its agent
  panel with the selection; `feedbackVerb` names which on K's key and the
  readout's; the feedback cases of
  `tests/site/workbench.spec.tsx`). Components render from it
  and call into it. It is composed from its Solid-bound parts in
  `model/`, each a `create*(state, deps)` over the one state: `state.ts`
  (the options, settings, the tool in hand, the undoable workspace and its
  saving, every overlay signal, and which preview holds the keys:
  `ownKeys`/`hasKeys`/`dropKeys`), `measuring.ts` (the per-frame loop),
  `selection.ts` (hit tests, the selection box, move / scale / rotate),
  `notes.ts` (notes and comment threads), `pixels.ts` (the snapshot, the
  loupe's and the sampler's pixels), `recorder.ts` (stills, recordings,
  video and GIF export; `GIF`), `gestures.ts` (every pointer gesture) and
  `keys.ts` (the keyboard and its listeners); a part names what it takes
  from another by that part's type (`Pick<Selection, …>`), never by an
  import of `bench.ts`. `bench.ts` keeps the tool switch, the agent
  hand-off, the preview as SVG (`copyAsSvg`, `downloadSvg`, below) and
  start / stop, and returns the same surface.
- The DOM readings live a layer down, in `shared/lib/inspect/` (the
  agent's `inspect` reads with them too): `color.ts` (parse every computed
  form, print hex/rgb/hsl/oklch, WCAG contrast), `geometry.ts` (boxes,
  distance segments, snap, dock), `measure.ts` (below).
- `model/` — pure logic, unit-tested: `ink.ts` (streamlined ink outlines,
  marker lines, erase, arrows, hit tests), `shared/lib/inspect/measure.ts` (DOM readings:
  box/box model/gaps, CSS block, selectors and child paths, type lines and
  baselines, rendered font, background behind, role/name/states, Tab
  order, audit: a field named only by its placeholder is flagged
  (`label`; the name goes once someone types), a control is an interactive role or a Tab stop (a
  negative tabindex alone makes none); a target is pressed through its
  `<label>`, passes at 24×24 or when a 24px circle on it meets no other
  target (WCAG 2.5.8), and disabled or visually hidden controls are not
  targets; grid cells and rows take their name from content), `workspace.ts` (the annotation model, sanitizing,
  snapshot history, persistence, agent Markdown), `settings.ts`,
  `capture.ts` (DOM render, tab grab, region recording, trim, frames for
  a GIF; encoded by `shared/lib/gif.ts` with the kit's `BAYER8`: one
  palette over all frames, ordered-dithered, only the changed box after
  the first frame), `tools.ts`, `svg.ts` (the SVG layer's text: a label's
  width in the mono face, measured once, a note's lines wrapped as its
  field wraps them, and `serializeSvg`, a group as a standalone file with
  its computed paint written on each element).
- `ui/` — one component per layer or panel: `Overlay` (the one SVG
  layer: `Guides`, `Marks`, the annotations group of `Ink`'s `Drawings`,
  `Notes`' `NoteShapes` and `Comments`' `Pins`, `Ink`'s drafts and
  selection chrome, `Rulers`; `Label` is its filled text box), `Tray`,
  `Notes` (the field a note is written in), `Comments` (the pins' keys
  and the thread), `Loupe`, `Readout`, `Motion`, `Responsive`,
  `Settings`, `Icon`; `Keyed` is the list they share, its rows living as
  long as their id (the workspace is replaced whole on every change).

## Local Contracts

- Mounted by `pages/docs/DemoCard.tsx` through `lazy` when
  its Inspect chip is pressed (one lazy chunk; ~300 cards cost nothing
  until used) with the frame (`host`), the demo's wrapper (`content`), the
  card, `benchKey` `<section>:<n>`, the section id, a title, the canonical
  URL and the demo itself (`render`, for Responsive). Calls `onExit`.
  The Studio mounts it the same way (`pages/studio/StudioPage.tsx`, while
  `editor.inspecting`): the canvas as the frame, its world layer as the
  content, the canvas shell as the card, `studio:<projectId>`, no
  `render`; its readout and panels fill the right column.
- Coordinates are STAGE px: the overlay root `.wb` covers the frame's
  padding box; every reading, guide, stroke, note and anchor is relative to
  it. Captures add the frame's border (`toHost`).
- Tools (group 1 inspect, group 2 annotate; one key each): Inspect `I`,
  X-ray `X`, Guides `G` (`H`/`V` turn it), Typography `A`, Sample color
  `P` (the EyeDropper where it exists, the stage sampler always), Pixel
  loupe `Z`, Accessibility `Y` · Select `S`, Arrow `D`, Pen `N`, Eraser
  `E`, Text `T`, Comment `M`, Screenshot `C`, Record video `V`. Toggles:
  Rulers `R`, Responsive `B`, Motion `O`. `1`/`2` switch groups, `K` copies
  (or sends) the feedback for an agent, `,` opens settings, `⌘Z`/`⇧⌘Z` undo/redo,
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
- Everything the overlay draws is ONE SVG (`ui/Overlay.tsx`, z 4 over
  the pointer surface): guides and grid, X-ray (one path per tone and
  depth), the box model, type lines, the Tab order, distances, labels,
  arrows, strokes, notes, comment pins, drafts, the selection and the
  rulers; every stroke `vector-effect: non-scaling-stroke`, hairlines on
  the half pixel. Only the rulers' grounds take a press there. What is
  operable stays HTML over it: the note being written (its field), each
  pin's key (a transparent `<button>` the pin's size, named, ringed), the
  thread, the loupe and the tray. The annotations are the layer's
  `ANNOTATIONS` group; "Copy annotations as SVG" (the readout's Select
  and Comment rows) copies it through `serializeSvg`, stage-sized.
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
- SVG: the tray's Copy as SVG and Download SVG keys (beside K's; no key
  of their own) turn the stage as it stands, its live state, into one
  layered SVG for a design tool, read and written by the Studio's own
  reader (`entities/artboard`: `elementSvg` over the stage, the overlay
  left out; `../../AGENTS.md`, SVG, says what the file holds), copied by
  its `copySvg` (`image/svg+xml` with `text/plain` in Chromium, the text
  alone in Safari and Firefox, which design tools paste as vectors too)
  and saved by its `saveSvg` as `<section>-<n>.svg`; the status line says
  which (`SVG_COPY_SAID`). The SVG is made in the press, so the copy
  keeps the gesture Safari asks for.
- The tray docks to the stage's bottom (default) or top (`settings.tray`);
  the workbench sets `data-tray` on the frame and DemoCard keeps that
  edge's lane free (`data-[tray=…]` padding).
- The measuring loop runs only while the workbench is mounted and writes a
  signal only when it changed; X-ray and the audit refresh every
  300 ms; the loupe redraws at 20 fps while visible.
- The kit clock control (Motion) is page-wide and says so; unmounting a
  workbench releases a clock it held.
- Sounds (`shared/lib/sound.ts`, Kobra's cues): a tool or group switch and
  undo/redo tap, toggles sound on/off, copies (colours, CSS, selectors,
  the image, the agent feedback, the SVG) chime, settings and the minimized tray
  fold/unfold; Settings carries the site's interface-sounds switch.

## Verification

- `tests/workbench.spec.ts` (root, `rs test`): the GIF encoder (LZW round-trips through a
  decoder, table resets included; median cut; Bayer dithering; the
  GIF89a frame; delta frames decoded back exactly; kept colours exact), colour parsing/printing/contrast, geometry,
  ink, workspace sanitizing/history/Markdown, settings, the SVG layer's
  label widths, note wrapping and serialisation, the DOM readings
  (names, roles, states, Tab order, paths, selectors, controlOf, the
  audit's targets: labels, spacing, disabled, hidden).
- `tests/site/workbench.spec.tsx` (Vitest): the workbench
  mounted on a preview, the controller's undoable workspace, its keys and
  its Escape ladder, the measuring loop, every layer of the overlay (one
  SVG) and panel under the frame, the feedback sent or copied, the
  annotations copied as SVG, the preview copied as SVG (both types, the
  overlay left out) and downloaded, and what unmounting gives back.
- Browser walk (`npm run dev`): every tool on `/docs/button` (hover, pin, Alt
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
