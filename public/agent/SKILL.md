---
name: dither-ui-studio
description: Compose dither-ui screens, components and charts as Studio documents, offline or against a live Studio tab. Use when asked to build UI with dither-ui, dither-kit, or the dither-ui Studio.
---

# dither-ui Studio

dither-ui is a Vue 3 toolkit (plus a Svelte 5 port) rendered on one ordered-dither
canvas engine: charts, 55+ components, generative backgrounds, text and motion
effects, all seed-deterministic. The **Studio** at https://dither-ui.com/studio is
an infinite-canvas editor: every frame ("artboard") is a chart, a widget, one
registry component, or a **screen** composed of rows of registry components.
Studio exports every frame as a Vue single-file component.

You build for the Studio by producing **documents**. A document is JSON. Studio
validates everything it loads: unknown components are dropped, props are
clamped to their specs, enums fall back to defaults. You cannot break the
editor with a bad document, but you can waste a turn, so follow the registry.

## 1. Read the registry first

`https://dither-ui.com/agent/registry.json` lists every placeable component:

```json
{ "is": "DitherSlider", "label": "Slider", "group": "inputs",
  "frame": { "w": 280, "h": 90 },
  "props": [ { "key": "color", "kind": "color", "def": "blue" },
             { "key": "min", "kind": "number", "def": 0 },
             { "key": "max", "kind": "number", "def": 100 },
             { "key": "disabled", "kind": "boolean", "def": false } ],
  "slotText": null, "vmodel": { "default": 40 } }
```

Rules the validator enforces:

- `is` must be a registry name exactly (`DitherTabs`, not `Tabs`).
- Prop kinds: `text` (string), `boolean`, `number` (clamped to `min`/`max`),
  `select` (one of `options`), `color` (`green | blue | purple | pink | orange |
  red | grey` or `#rrggbb`), `list` (array of strings).
- `slotText` is the component's visible text where it has a slot (buttons,
  badges, checkboxes).
- Screens have ONE nesting level: rows of cells. No nested containers.

## 2. The document shape

```json
{
  "artboards": [
    {
      "name": "Sign in",
      "x": 0, "y": 0, "w": 380, "h": 420,
      "chart": { "type": "area" },
      "widget": {
        "kind": "screen", "gap": 16, "padding": 20,
        "rows": [
          { "cells": [ { "is": "DitherInput", "props": { "placeholder": "Email" }, "grow": true } ],
            "align": "center", "justify": "start", "gap": 12 },
          { "cells": [ { "is": "DitherBadge", "slotText": "Continue", "props": { "color": "blue" } } ],
            "justify": "end" }
        ]
      }
    },
    {
      "name": "Signups",
      "x": 440, "y": 0, "w": 520, "h": 360,
      "chart": {
        "type": "bar",
        "rows": [ { "month": "Q1", "web": 10, "app": 5 }, { "month": "Q2", "web": 20, "app": 9 } ],
        "series": [ { "key": "web", "label": "Web", "color": "blue" }, { "key": "app", "label": "App", "color": "pink" } ],
        "seed": 512, "bloom": "low", "stackType": "default", "cell": 2
      }
    }
  ]
}
```

- Every artboard carries a `chart` (a stub `{ "type": "area" }` is fine for
  widget frames) and optionally a `widget`.
- Widget kinds: `avatar`, `button`, `gradient`, `image` (bespoke models),
  `component` (`{ "kind": "component", "is", "props", "slotText" }`), `screen`.
- Chart rows use the family's label key: cartesian (`area`, `line`, `bar`)
  → `month`; `pie` → `{ "name", "value" }`; `radar` → `axis`. Series keys must
  match the row keys. `seed` is any integer; the same seed replays the same
  texture forever.
- Omit `id`; Studio assigns one. Omit anything else and defaults fill in.

## 3. Deliver it

**Offline (any harness, no browser access):** write the document to a
`.json` file. The user loads it in Studio through the project menu → *Open
file*, or by dropping the file onto the canvas. Save to file round-trips the
same shape, so you can read a user's project, edit it, and hand it back.

**Live through the ACP bridge (you are Claude Code, Codex, Gemini CLI, Qwen
Code, oh-my-pi, Goose, OpenCode, Auggie or any Agent Client Protocol
agent):** the user runs `node bridge/dither-bridge.mjs` from a dither-ui
checkout, picks you in the Studio's Agent panel and sends prompts from
there. Your session then
has an MCP server named `dither-studio` whose tools are the commands below
(`add_screen`, `add_component`, `add_chart`, `add_widget`, `update_artboard`,
`remove_artboard`, `evolve`, `select`, `get_registry`, `get_document`,
`get_code`, `list_artboards`), each applied to the live canvas and undoable.
Prefer them over writing files; the user is watching the canvas.

**Live (harness has a browser tool, e.g. the sitegeist bridge):** a Studio
tab speaks a DOM protocol that works from any script world. Dispatch on
`document`, always with a JSON **string** detail:

```js
const id = crypto.randomUUID()
document.addEventListener("dither-studio:result", (e) => {
  const r = JSON.parse(e.detail)   // { id, ok, data } or { id, ok: false, error }
  if (r.id === id) console.log(r)
}, { once: true })
document.dispatchEvent(new CustomEvent("dither-studio:command", {
  detail: JSON.stringify({ id, command: { type: "component.add", is: "DitherTabs",
    props: { tabs: ["One", "Two"], variant: "segmented" } } })
}))
```

The live document is also mirrored in
`document.getElementById("dither-studio-document").textContent` (JSON),
refreshed within half a second of any edit. Main-world code can call
`window.ditherStudio.run(command)` directly.

Commands (`type` and fields):

| type | fields |
| --- | --- |
| `document.get` | — |
| `document.set` | `document` (validated like a file import; undoable) |
| `artboard.list` | — |
| `artboard.select` | `id` or `ids` |
| `artboard.remove` | `id` |
| `artboard.update` | `id`, `patch` (name/x/y/w/h/hidden/locked, `chart` fields, `widget.props` or `widget.rows`) |
| `chart.add` | `chart`, `name?`, `data?: { labels, series: [{ key, label?, color?, values }] }`, `frame?` |
| `widget.add` | `widget` (avatar/button/gradient/image), `name?`, `props?` |
| `component.add` | `is`, `name?`, `props?`, `slotText?`, `frame?` |
| `screen.add` | `name?`, `rows`, `gap?`, `padding?`, `frame?` |
| `evolve` | `id?`, `count?` (1–12), `seed?`, `strength?` (0–1) — seeded variants placed as a row |
| `code.get` | `id` — the frame as a Vue SFC |
| `registry.get` | `is?` — the registry, or one component |
| `video.export` | `id?`, `seconds?` (1–600), `fps?` (24/30/60), `theme?` — the frame as a HyperFrames composition: `index` (HTML referencing `./player.js` + `./player.css`) and the `assets` URLs to fetch beside it |

## 4. Work like the Studio does

- One idea per frame. A screen is a mockup of one view; a chart is one dataset.
- Prefer `screen.add` for anything with more than one control; prefer
  `component.add` to show a single control's states.
- When the user wants options, add one good frame and call `evolve` on it.
  Variation belongs to the engine (seeds), structure belongs to you.
- Ask Studio for `registry.get` with `is` before guessing a prop name.
- You can write 3D and shaders directly: `DitherWorld` takes a model as
  `props.source` (VRML97 / VRML 1.0 `.wrl`, X3D XML, glTF JSON, OBJ, ASCII
  STL / PLY or OFF text — VRML `TimeSensor` + interpolator + `ROUTE`
  animations play on the clock) or a URL as `props.src` (also `.glb`), and
  `DitherShader` takes GLSL as `props.source` (Shadertoy-style `mainImage`
  with `iTime`/`iResolution`/`iMouse`/`iColor`, or a raw `main`). Both are
  ordinary `component.add` targets; `props.colors` gives either a palette
  ramp.
- Finish with `code.get` when the user wants code, and quote the SFC.

## 5. Render a frame to video (HyperFrames)

Every frame is also a video: the kit's animations are seek-deterministic, so
a frame exported as a [HyperFrames](https://github.com/heygen-com/hyperframes)
composition renders to an MP4 whose every pixel follows from the frame's seeds
and the requested time (Node 22 + FFmpeg: `npx hyperframes render`).

- Through the bridge: call the `export_video` tool (`id?`, `seconds?`,
  `fps?`, `theme?`). The Studio hands the bridge a self-contained composition
  and the bridge writes it as `video/<name>/index.html` under the project;
  render it with `npx hyperframes render video/<name> -o <name>.mp4`.
- Through the DOM protocol: `video.export` returns `index` plus two asset
  URLs; write `index.html`, `player.js` and `player.css` side by side and
  render the directory. The exported file carries the frame's document, the
  player and the root contract (`data-width/height`, `data-duration`,
  `data-fps`, `data-no-timeline`), so nothing is fetched at render time.
- Length and frame rate are the file's `data-duration` / `data-fps`; the
  frame's size is the video's size. For 1080p, make the frame 960×540 (or
  480×270) and render with `--resolution landscape`: HyperFrames captures at
  a higher device pixel ratio, the kit's canvases follow it, and the dither
  gets finer while the design stays the same.
- Simulation backgrounds (particles, fluids) advance frame by frame, so
  render those with `--workers 1`. `npx hyperframes lint` reports the inert
  free-running paths inside the bundled player (`requestAnimationFrame`,
  `Math.random`, wall clocks); they do not run while the renderer seeks.
- The composition is a plain HyperFrames file: the HyperFrames skills apply
  if the user wants it cut into a longer piece (sub-composition, captions,
  music).
