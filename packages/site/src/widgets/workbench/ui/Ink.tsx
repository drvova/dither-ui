// The annotation layer: arrows, ink (a filled outline that swells and
// thins) and marker strokes, the gesture being drawn, the selection's
// outlines, the capture region and the eraser's footprint.
import { createMemo, Index, Match, Show, Switch } from "solid-js"
import { boxFrom, type Box } from "@/shared/lib/inspect/geometry"
import { arrowPaths, centerline, inkOutline } from "@/widgets/workbench/model/ink"
import { swatch } from "@/widgets/workbench/model/settings"
import { useBench } from "../context"
import Keyed from "./Keyed"
import "./Ink.css"

export default function Ink() {
  const b = useBench()
  const arrows = createMemo(() => b.ws().arrows.map((a) => ({ ...a, ...arrowPaths(a.from, a.to, a.width) })))
  const strokes = createMemo(() =>
    b.ws().strokes.map((s) => ({ ...s, d: s.kind === "ink" ? inkOutline(s.points, s.width) : centerline(s.points) })),
  )
  const draftArrow = createMemo(() => {
    const d = b.draft()
    return d?.kind === "arrow" ? { ...arrowPaths(d.from, d.to, 2), color: swatch(b.settings.annotate) } : null
  })
  const draftStroke = createMemo(() => {
    const d = b.draft()
    if (d?.kind !== "stroke") return null
    const marker = b.settings.pen === "marker"
    return {
      marker,
      d: marker ? centerline(d.points) : inkOutline(d.points, b.settings.inkWidth),
      color: swatch(marker ? b.settings.markerSwatch : b.settings.inkSwatch),
      width: b.settings.markerWidth,
    }
  })
  const draftBox = createMemo(() => {
    const d = b.draft()
    return d?.kind === "region" || d?.kind === "marquee" ? { kind: d.kind, box: boxFrom(d.from, d.to) } : null
  })
  const outlines = createMemo(
    () => (
      b.revision(),
      b
        .selection()
        .map((item) => b.boundsOfItem(item))
        .filter((o): o is Box => !!o)
    ),
  )
  /** The transform box with its corner and rotate handles (Select). */
  const handles = createMemo(() => {
    void b.revision()
    void b.selection()
    if (b.tool() !== "select" || b.draft()?.kind === "marquee") return null
    const box = b.selectionBox()
    if (!box) return null
    return {
      box,
      corners: [
        [box.x, box.y],
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
        [box.x + box.w, box.y + box.h],
      ],
      rotate: { x: box.x + box.w / 2, y: box.y - 20 },
    }
  })
  const eraser = createMemo(() => (b.tool() === "eraser" && b.pointer() ? Math.max(8, b.settings.inkWidth * 2) : 0))
  const sized = createMemo(() => {
    const d = draftBox()
    return d && d.kind === "region" && d.box.w > 4 ? d.box : null
  })

  return (
    <>
      <svg class="wb-ink ink-scope" width={b.size().w} height={b.size().h} aria-hidden="true">
        <Keyed each={strokes()}>
          {(s) => (
            <g>
              <Show
                when={s().kind === "ink"}
                fallback={<path d={s().d} stroke={s().color} stroke-width={s().width} class="marker" />}
              >
                <path d={s().d} fill={s().color} />
              </Show>
            </g>
          )}
        </Keyed>
        <Keyed each={arrows()}>
          {(a) => (
            <g stroke={a().color} fill={a().color}>
              <path d={a().shaft} stroke-width={a().width} stroke-linecap="round" fill="none" />
              <path d={a().head} stroke-linejoin="round" stroke-width={1} />
            </g>
          )}
        </Keyed>
        <Switch>
          <Match when={draftArrow()}>
            {(a) => (
              <g stroke={a().color} fill={a().color}>
                <path d={a().shaft} stroke-width="2" stroke-linecap="round" fill="none" />
                <path d={a().head} stroke-linejoin="round" stroke-width="1" />
              </g>
            )}
          </Match>
          <Match when={draftStroke()}>
            {(s) => (
              <Show
                when={!s().marker}
                fallback={<path d={s().d} stroke={s().color} stroke-width={s().width} class="marker" />}
              >
                <path d={s().d} fill={s().color} />
              </Show>
            )}
          </Match>
          <Match when={draftBox()}>
            {(r) => (
              <rect x={r().box.x + 0.5} y={r().box.y + 0.5} width={r().box.w} height={r().box.h} class={r().kind} />
            )}
          </Match>
        </Switch>
        <Index each={outlines()}>
          {(o) => <rect x={o().x - 2.5} y={o().y - 2.5} width={o().w + 5} height={o().h + 5} class="selected" />}
        </Index>
        <Show when={handles()}>
          {(h) => (
            <g class="handles">
              <rect x={h().box.x + 0.5} y={h().box.y + 0.5} width={h().box.w} height={h().box.h} class="frame" />
              <line x1={h().rotate.x} y1={h().box.y} x2={h().rotate.x} y2={h().rotate.y + 4} class="stem" />
              <circle cx={h().rotate.x} cy={h().rotate.y} r="4" class="knob" />
              <Index each={h().corners}>
                {(c) => <rect x={c()[0] - 3.5} y={c()[1] - 3.5} width="7" height="7" class="knob" />}
              </Index>
            </g>
          )}
        </Show>
        <Show when={eraser() ? b.pointer() : null}>
          {(p) => <circle cx={p().x} cy={p().y} r={eraser()} class="eraser" />}
        </Show>
      </svg>
      <Show when={sized()}>
        {(box) => (
          <span
            class="wb-size"
            style={{ left: `${box().x + box().w}px`, top: `${box().y + box().h + 6}px` }}
            aria-hidden="true"
          >
            {box().w}×{box().h}
          </span>
        )}
      </Show>
    </>
  )
}
