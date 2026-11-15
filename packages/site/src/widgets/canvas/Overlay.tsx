// The canvas's one SVG layer, in screen px over the frames: the selection's
// outlines, the resize handles as drawn, the snap guides and the marquee.
// Lines keep their width on the screen at any zoom (the layer is never
// scaled; `vector-effect` holds it where something scales it). It takes no
// press: each frame's handles are pressed through its own keys
// (`Artboard.tsx`, their reach in `Artboard.css`).
import { createMemo, For, Show } from "solid-js"
import { editor } from "@/entities/editor"
import { handoff } from "@/features/agent"
import { HANDLES } from "./Artboard"

/** The drawn handle, a side on the screen. */
const KNOB = 8
/** Where each handle stands on its frame's box, 0..1 on each axis. */
const AT: Record<(typeof HANDLES)[number]["dir"], [number, number]> = {
  nw: [0, 0],
  n: [0.5, 0],
  ne: [1, 0],
  e: [1, 0.5],
  se: [1, 1],
  s: [0.5, 1],
  sw: [0, 1],
  w: [0, 0.5],
}

export type Marquee = { x1: number; y1: number; x2: number; y2: number }

export default function Overlay(props: { marquee: Marquee | null }) {
  /** The selected frames on the screen, with whether they take a resize. */
  const selected = createMemo(() => {
    const v = editor.viewport
    return editor.artboards
      .filter((a) => !a.hidden && editor.selectedIds.includes(a.id))
      .map((a) => ({
        id: a.id,
        x: a.x * v.zoom + v.x,
        y: a.y * v.zoom + v.y,
        w: a.w * v.zoom,
        h: a.h * v.zoom,
        r: 8 * v.zoom,
        handles: !a.locked && !handoff.picking,
      }))
  })
  const knobs = createMemo(() =>
    selected()
      .filter((s) => s.handles)
      .flatMap((s) => HANDLES.map(({ dir }) => [s.x + AT[dir][0] * s.w, s.y + AT[dir][1] * s.h])),
  )

  return (
    <svg class="canvas-overlay" width={editor.stage.w} height={editor.stage.h} aria-hidden="true">
      <For each={selected()}>
        {(s) => <rect class="sel" x={s.x - 1} y={s.y - 1} width={s.w + 2} height={s.h + 2} rx={s.r + 1} />}
      </For>
      <Show when={knobs().length}>
        <path
          class="knob"
          d={knobs()
            .map(
              ([x, y]) =>
                `M${Math.round(x - KNOB / 2) + 0.5} ${Math.round(y - KNOB / 2) + 0.5}h${KNOB}v${KNOB}h-${KNOB}z`,
            )
            .join("")}
        />
      </Show>
      <Show when={editor.guides.v != null}>
        <line
          class="guide"
          x1={(editor.guides.v ?? 0) * editor.viewport.zoom + editor.viewport.x + 0.5}
          x2={(editor.guides.v ?? 0) * editor.viewport.zoom + editor.viewport.x + 0.5}
          y1={0}
          y2={editor.stage.h}
        />
      </Show>
      <Show when={editor.guides.h != null}>
        <line
          class="guide"
          x1={0}
          x2={editor.stage.w}
          y1={(editor.guides.h ?? 0) * editor.viewport.zoom + editor.viewport.y + 0.5}
          y2={(editor.guides.h ?? 0) * editor.viewport.zoom + editor.viewport.y + 0.5}
        />
      </Show>
      <Show when={props.marquee}>
        {(m) => (
          <rect
            class="marquee"
            x={Math.min(m().x1, m().x2) + 0.5}
            y={Math.min(m().y1, m().y2) + 0.5}
            width={Math.max(0, Math.abs(m().x2 - m().x1) - 1)}
            height={Math.max(0, Math.abs(m().y2 - m().y1) - 1)}
          />
        )}
      </Show>
    </svg>
  )
}
