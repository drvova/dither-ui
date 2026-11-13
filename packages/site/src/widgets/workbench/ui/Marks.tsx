// The measuring layer: X-ray's outlines on a canvas, the inspected box with
// its padding, margin and gap bands, the pointed ghost, typography's lines
// and baselines, accessibility's tab order and flags, Alt distances, kept
// measurements and the distances from the inspected box to the guides.
// Decorative (aria-hidden): the readout under the stage says it in words.
import { createEffect, createMemo, Index, on, onCleanup, Show } from "solid-js"
import { parseColor, type RGBA } from "@/shared/lib/inspect/color"
import { bottom, distances, right, type Box, type Segment } from "@/shared/lib/inspect/geometry"
import { useBench } from "../context"
import Keyed from "./Keyed"
import "./Marks.css"

const at = (x: Box) => ({ left: `${x.x}px`, top: `${x.y}px`, width: `${x.w}px`, height: `${x.h}px` })
const sides = (v: number[]) => v.map((n) => `${n}px`).join(" ")
const mid = (s: Segment) => ({ left: `${(s.x1 + s.x2) / 2}px`, top: `${(s.y1 + s.y2) / 2}px` })
const chipBelow = (box: Box) => box.y < 34

export default function Marks() {
  const b = useBench()
  let canvas: HTMLCanvasElement | null = null

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

  const orderPath = createMemo(() =>
    b
      .order()
      .map((o, i) => `${i ? "L" : "M"}${o.x + Math.min(o.w, 10)} ${o.y + Math.min(o.h, 10)}`)
      .join(""),
  )
  const chipEnd = (box: Box) => box.x > b.size().w / 2
  const chip = (box: Box) => `chip${chipBelow(box) ? " below" : ""}${chipEnd(box) ? " end" : ""}`

  function paint() {
    const c = canvas
    if (!c) return
    const { w, h } = b.size()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = Math.max(1, Math.round(w * dpr))
    c.height = Math.max(1, Math.round(h * dpr))
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    // Custom properties compute with their var() chain resolved: the swatch
    // the settings picked, in the current theme.
    const css = getComputedStyle(c)
    const rgb = (name: string, fallback: RGBA) => parseColor(css.getPropertyValue(name)) ?? fallback
    const hl = rgb("--wb-hl", { r: 255, g: 150, b: 50, a: 1 })
    const guide = rgb("--wb-guide", { r: 150, g: 110, b: 255, a: 1 })
    for (const x of b.xray()) {
      const alpha = Math.max(0.22, 0.85 - x.depth * 0.09)
      const tone = x.layout ? guide : hl
      ctx.strokeStyle = `rgb(${tone.r} ${tone.g} ${tone.b} / ${alpha})`
      ctx.setLineDash(x.layout ? [3, 2] : [])
      ctx.strokeRect(x.box.x + 0.5, x.box.y + 0.5, Math.max(0, x.box.w - 1), Math.max(0, x.box.h - 1))
    }
  }
  createEffect(on([b.xray, b.size, () => b.settings.highlight, () => b.settings.guide], paint, { defer: true }))
  onCleanup(() => {
    canvas = null
  })

  return (
    <div class="wb-marks marks-scope" aria-hidden="true">
      <canvas ref={(el) => (canvas = el)} class="xray" style={{ display: b.tool() === "xray" ? undefined : "none" }} />
      {/* Accessibility: the Tab order and the flags. */}
      <Show when={b.tool() === "a11y"}>
        <svg class="svg" width={b.size().w} height={b.size().h}>
          <Show when={b.order().length > 1}>
            <path d={orderPath()} class="order-path" />
          </Show>
        </svg>
        <Index each={b.order()}>
          {(o, i) => (
            <span
              class="order"
              style={{ left: `${o().x + Math.min(o().w, 10) - 8}px`, top: `${o().y + Math.min(o().h, 10) - 8}px` }}
            >
              {i + 1}
            </span>
          )}
        </Index>
        <Index each={b.marks()}>
          {(m) => (
            <div class="flag" style={at(m().box)}>
              <b>!</b>
            </div>
          )}
        </Index>
      </Show>
      {/* Typography: each line's box and baseline. */}
      <Show when={b.typeReading()}>
        {(t) => (
          <>
            <Index each={t().lines}>{(l) => <div class="line" style={at(l())} />}</Index>
            <Index each={t().baselines}>
              {(y, i) => (
                <div
                  class="baseline"
                  style={{ top: `${y()}px`, left: `${t().lines[i]?.x}px`, width: `${t().lines[i]?.w}px` }}
                />
              )}
            </Index>
          </>
        )}
      </Show>
      {/* What a comment would attach to. */}
      <Show when={!b.draftThread() && b.aim()}>
        {(aim) => (
          <div class="ghost" style={at(aim().box)}>
            <span class={chip(aim().box)}>comment on {aim().label}</span>
          </div>
        )}
      </Show>
      {/* The pointed element while another is pinned. */}
      <Show when={b.ghost()}>{(g) => <div class="ghost" style={at(g())} />}</Show>
      {/* The target. */}
      <Show when={target()}>
        {(t) => (
          <div class="target" style={at(t().box)}>
            <Show when={bands()}>
              {(r) => (
                <>
                  <i
                    class="margin"
                    style={{
                      top: `-${r().outer[0]}px`,
                      right: `-${r().outer[1]}px`,
                      bottom: `-${r().outer[2]}px`,
                      left: `-${r().outer[3]}px`,
                      "border-width": sides(r().outer.map((n) => Math.max(0, n))),
                    }}
                  />
                  <i class="pad" style={{ inset: sides(r().edge), "border-width": sides(r().pad) }} />
                </>
              )}
            </Show>
            <b class="tl" />
            <b class="tr" />
            <b class="bl" />
            <b class="br" />
            <span class={chip(t().box)}>
              {t().label} {t().box.w}×{t().box.h}
            </span>
          </div>
        )}
      </Show>
      <Show when={bands()}>{(r) => <Index each={r().gaps}>{(g) => <i class="gapband" style={at(g())} />}</Index>}</Show>
      {/* Distances: Alt, kept measurements, guide links. */}
      <svg class="svg" width={b.size().w} height={b.size().h}>
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
      </svg>
      <Show when={b.altMeasure()}>
        {(m) => (
          <Index each={m().segments.filter((x) => !x.dashed)}>
            {(s) => (
              <span class="value" style={mid(s())}>
                {s().value}
              </span>
            )}
          </Index>
        )}
      </Show>
      <Keyed each={kept()}>
        {(m) => (
          <Index each={m().segments.filter((x) => !x.dashed)}>
            {(s) => (
              <span class="value" style={mid(s())}>
                {s().value}
              </span>
            )}
          </Index>
        )}
      </Keyed>
      <Index each={guideLinks()}>
        {(s) => (
          <span class="value" style={mid(s())}>
            {s().value}
          </span>
        )}
      </Index>
    </div>
  )
}
