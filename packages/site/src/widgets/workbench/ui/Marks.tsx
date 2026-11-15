// The measuring layer, drawn in the overlay's SVG layer: X-ray's outlines
// (one path per tone and depth), the inspected box with its padding, margin
// and gap bands, the pointed ghost, typography's lines and baselines,
// accessibility's tab order and flags, Alt distances, kept measurements and
// the distances from the inspected box to the guides. Decorative: the
// readout under the stage says it in words.
import { createMemo, For, Index, Show } from "solid-js"
import { bottom, distances, right, type Box, type Segment } from "@/shared/lib/inspect/geometry"
import { useBench } from "../context"
import Keyed from "./Keyed"
import Label from "./Label"
import "./Marks.css"

/** A 1px outline drawn just outside `x` (CSS `outline: 1px`). */
const outside = (x: Box) => ({ x: x.x - 0.5, y: x.y - 0.5, width: x.w + 1, height: x.h + 1 })
/** A 1px outline drawn just inside `x` (a canvas `strokeRect` at +0.5). */
const inside = (x: Box) =>
  `M${x.x + 0.5} ${x.y + 0.5}h${Math.max(0, x.w - 1)}v${Math.max(0, x.h - 1)}h${-Math.max(0, x.w - 1)}z`
/** The ring between `outer` and `inner`, filled even-odd. */
const ring = (outer: Box, inner: Box) =>
  `M${outer.x} ${outer.y}h${outer.w}v${outer.h}h${-outer.w}zM${inner.x} ${inner.y}h${inner.w}v${inner.h}h${-inner.w}z`
/** `box` grown by `[top, right, bottom, left]` (shrunk where negative). */
const grow = (box: Box, [t, r, b, l]: number[]): Box => ({
  x: box.x - l,
  y: box.y - t,
  w: box.w + l + r,
  h: box.h + t + b,
})
const shrink = (box: Box, s: number[]) =>
  grow(
    box,
    s.map((n) => -n),
  )
const mid = (s: Segment) => ({ x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2 })

export default function Marks(props: { hatch: string }) {
  const b = useBench()

  /** The box every measuring tool lights: inspect, x-ray, type or a11y. */
  const target = createMemo(() => {
    const r = b.reading()
    if (r) return { box: r.box, label: r.label, reading: r }
    const t = b.typeReading()
    if (t) return { box: t.box, label: t.label, reading: null }
    const a = b.a11y()
    if (a) return { box: a.box, label: `${a.role}${a.name ? ` “${a.name.slice(0, 24)}”` : ""}`, reading: null }
    return null
  })
  /** The target's reading while the layout bands show. */
  const bands = createMemo(() => (b.settings.layout ? (target()?.reading ?? null) : null))

  /** Distances from the inspected box to the nearest guide on each side. */
  const guideLinks = createMemo<Segment[]>(() => {
    const t = target()
    if (!t || b.tool() !== "inspect") return []
    const box = t.box
    const out: Segment[] = []
    const xs = b
      .ws()
      .guides.filter((g) => g.axis === "x")
      .map((g) => g.at)
    const ys = b
      .ws()
      .guides.filter((g) => g.axis === "y")
      .map((g) => g.at)
    const cy = box.y + box.h / 2
    const cx = box.x + box.w / 2
    const left = Math.max(...xs.filter((x) => x <= box.x), -Infinity)
    const rightG = Math.min(...xs.filter((x) => x >= right(box)), Infinity)
    const top = Math.max(...ys.filter((y) => y <= box.y), -Infinity)
    const bottomG = Math.min(...ys.filter((y) => y >= bottom(box)), Infinity)
    if (Number.isFinite(left) && box.x - left > 0)
      out.push({ x1: left, y1: cy, x2: box.x, y2: cy, value: box.x - left })
    if (Number.isFinite(rightG) && rightG - right(box) > 0)
      out.push({ x1: right(box), y1: cy, x2: rightG, y2: cy, value: rightG - right(box) })
    if (Number.isFinite(top) && box.y - top > 0) out.push({ x1: cx, y1: top, x2: cx, y2: box.y, value: box.y - top })
    if (Number.isFinite(bottomG) && bottomG - bottom(box) > 0)
      out.push({ x1: cx, y1: bottom(box), x2: cx, y2: bottomG, value: bottomG - bottom(box) })
    return out
  })

  const kept = createMemo(() =>
    b.ws().measures.map((m) => ({
      ...m,
      segments: distances(m.from.box, m.to.box),
      on: b.isSelected({ kind: "measures", id: m.id }),
    })),
  )
  /** Every distance's value, labelled at its middle (dashed ones are not). */
  const values = createMemo(() =>
    [...(b.altMeasure()?.segments ?? []), ...kept().flatMap((m) => m.segments), ...guideLinks()].filter(
      (s) => !s.dashed,
    ),
  )

  /** X-ray: one path per tone and depth step (deeper is fainter). */
  const xray = createMemo(() => {
    if (b.tool() !== "xray") return []
    const groups = new Map<string, { layout: boolean; alpha: number; d: string }>()
    for (const x of b.xray()) {
      const alpha = Math.round(Math.max(0.22, 0.85 - x.depth * 0.09) * 100) / 100
      const key = `${x.layout}:${alpha}`
      const g = groups.get(key) ?? { layout: x.layout, alpha, d: "" }
      g.d += inside(x.box)
      groups.set(key, g)
    }
    return [...groups.values()]
  })

  const orderPath = createMemo(() =>
    b
      .order()
      .map((o, i) => `${i ? "L" : "M"}${o.x + Math.min(o.w, 10)} ${o.y + Math.min(o.h, 10)}`)
      .join(""),
  )
  /** A chip naming a box: above it (below near the top), from its start
   * (from its end past the stage's middle). */
  const Chip = (p: { box: Box; text: string }) => {
    const below = () => p.box.y < 34
    const end = () => p.box.x > b.size().w / 2
    return (
      <Label
        x={end() ? p.box.x + p.box.w + 1 : p.box.x - 1}
        y={below() ? p.box.y + p.box.h + 5 : p.box.y - 5}
        align={end() ? "end" : "start"}
        valign={below() ? "top" : "bottom"}
        text={p.text}
        tone="hl"
        size={10}
        pad={[2, 5]}
      />
    )
  }

  return (
    <g class="wb-marks marks-scope">
      <For each={xray()}>
        {(x) => <path class={x.layout ? "xray layout" : "xray"} d={x.d} stroke-opacity={x.alpha} />}
      </For>
      {/* Accessibility: the Tab order and the flags. */}
      <Show when={b.tool() === "a11y"}>
        <Show when={b.order().length > 1}>
          <path d={orderPath()} class="order-path" />
        </Show>
        <Index each={b.marks()}>
          {(m) => (
            <g class="flag">
              <rect {...outside(m().box)} />
              <circle cx={m().box.x + m().box.w + 0.5} cy={m().box.y - 0.5} r={6.5} />
              <text
                x={m().box.x + m().box.w + 0.5}
                y={m().box.y - 0.5}
                text-anchor="middle"
                dominant-baseline="central"
              >
                !
              </text>
            </g>
          )}
        </Index>
        <Index each={b.order()}>
          {(o, i) => (
            <Label
              x={o().x + Math.min(o().w, 10)}
              y={o().y + Math.min(o().h, 10)}
              align="middle"
              valign="middle"
              text={i + 1}
              tone="guide"
              pad={[2, 4]}
              radius={8}
            />
          )}
        </Index>
      </Show>
      {/* Typography: each line's box and baseline. */}
      <Show when={b.typeReading()}>
        {(t) => (
          <>
            <Index each={t().lines}>{(l) => <rect class="type-line" {...outside(l())} />}</Index>
            <path
              class="baseline"
              d={t()
                .baselines.map((y, i) => `M${t().lines[i]?.x ?? 0} ${y + 0.5}h${t().lines[i]?.w ?? 0}`)
                .join("")}
            />
          </>
        )}
      </Show>
      {/* What a comment would attach to. */}
      <Show when={!b.draftThread() && b.aim()}>
        {(aim) => (
          <g class="aim">
            <rect class="ghost" {...outside(aim().box)} />
            <Chip box={aim().box} text={`comment on ${aim().label}`} />
          </g>
        )}
      </Show>
      {/* The pointed element while another is pinned. */}
      <Show when={b.ghost()}>{(g) => <rect class="ghost" {...outside(g())} />}</Show>
      {/* The target. */}
      <Show when={target()}>
        {(t) => (
          <g class="target">
            <Show when={bands()}>
              {(r) => (
                <>
                  <path class="margin" d={ring(grow(t().box, r().outer), t().box)} />
                  <path class="pad" d={ring(shrink(t().box, r().edge), shrink(shrink(t().box, r().edge), r().pad))} />
                  <Index each={r().gaps}>
                    {(g) => (
                      <rect
                        class="gapband"
                        x={g().x}
                        y={g().y}
                        width={g().w}
                        height={g().h}
                        fill={`url(#${props.hatch})`}
                      />
                    )}
                  </Index>
                </>
              )}
            </Show>
            <rect class="box" {...outside(t().box)} />
            <path
              class="corners"
              d={[
                [t().box.x - 3, t().box.y - 3],
                [t().box.x + t().box.w - 2, t().box.y - 3],
                [t().box.x - 3, t().box.y + t().box.h - 2],
                [t().box.x + t().box.w - 2, t().box.y + t().box.h - 2],
              ]
                .map(([x, y]) => `M${x} ${y}h5v5h-5z`)
                .join("")}
            />
            <Chip box={t().box} text={`${t().label} ${t().box.w}×${t().box.h}`} />
          </g>
        )}
      </Show>
      {/* Distances: Alt, kept measurements, guide links. */}
      <Show when={b.altMeasure()}>
        {(m) => (
          <>
            <Index each={[m().from, m().to]}>
              {(x) => (
                <rect
                  x={x().x + 0.5}
                  y={x().y + 0.5}
                  width={Math.max(0, x().w - 1)}
                  height={Math.max(0, x().h - 1)}
                  class="dist-box"
                />
              )}
            </Index>
            <Index each={m().segments}>
              {(s) => (
                <line x1={s().x1} y1={s().y1} x2={s().x2} y2={s().y2} class={s().dashed ? "dist dashed" : "dist"} />
              )}
            </Index>
          </>
        )}
      </Show>
      <Keyed each={kept()}>
        {(m) => (
          <Index each={m().segments}>
            {(s) => (
              <line
                x1={s().x1}
                y1={s().y1}
                x2={s().x2}
                y2={s().y2}
                class={`${s().dashed ? "dist dashed" : "dist"}${m().on ? " on" : ""}`}
              />
            )}
          </Index>
        )}
      </Keyed>
      <Index each={guideLinks()}>
        {(s) => <line x1={s().x1} y1={s().y1} x2={s().x2} y2={s().y2} class="dist dashed" />}
      </Index>
      <Index each={values()}>
        {(s) => <Label x={mid(s()).x} y={mid(s()).y} align="middle" valign="middle" text={s().value} tone="guide" />}
      </Index>
    </g>
  )
}
