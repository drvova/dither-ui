// Guides and the layout grid, drawn in the overlay's SVG layer: columns,
// rows and a pixel grid in the guide colour; each guide a hairline with its
// position, the gap to the next guide on its axis labelled between them;
// the preview of the guide the Guides tool would place.
import { createMemo, Index, Show } from "solid-js"
import { useBench } from "../context"
import Keyed from "./Keyed"
import Label from "./Label"
import "./Guides.css"

/** Column (or row) bands for `n` tracks across `len` with margins and gutters. */
function tracks(len: number, n: number, gutter: number, margin: number) {
  const size = (len - margin * 2 - gutter * (n - 1)) / n
  return size > 0 ? Array.from({ length: n }, (_, i) => ({ at: margin + i * (size + gutter), size })) : []
}

/** A hairline across the stage at `at` on `axis` (`x` is a vertical line). */
const across = (axis: "x" | "y", at: number, w: number, h: number) =>
  axis === "x" ? `M${at + 0.5} 0V${h}` : `M0 ${at + 0.5}H${w}`

export default function Guides() {
  const b = useBench()
  const grid = createMemo(() => b.ws().grid)

  const columns = createMemo(() =>
    grid().show.columns ? tracks(b.size().w, grid().columns, grid().gutter, grid().margin) : [],
  )
  const rows = createMemo(() =>
    grid().show.rows ? tracks(b.size().h, grid().rows, grid().rowGutter, grid().margin) : [],
  )
  /** The pixel grid: one path, a hairline at the start of every cell. */
  const pixel = createMemo(() => {
    if (!grid().show.pixel) return ""
    const { w, h } = b.size()
    const step = Math.max(2, grid().pixel)
    let d = ""
    for (let x = 0; x < w; x += step) d += across("x", x, w, h)
    for (let y = 0; y < h; y += step) d += across("y", y, w, h)
    return d
  })

  /** Each guide with the gap to its next neighbour on the same axis. */
  const lines = createMemo(() =>
    (["x", "y"] as const).flatMap((axis) => {
      const list = b
        .ws()
        .guides.filter((g) => g.axis === axis)
        .sort((p, q) => p.at - q.at)
      return list.map((g, i) => ({ ...g, gap: list[i + 1] ? Math.round((list[i + 1].at - g.at) * 10) / 10 : null }))
    }),
  )
  const selected = (id: string) => b.isSelected({ kind: "guides", id })

  return (
    <g class="wb-guides guides-scope">
      <Show when={pixel()}>
        <path class="pixel" d={pixel()} />
      </Show>
      <Index each={columns()}>
        {(c) => (
          <rect class="band" x={c().at + 0.5} y={0.5} width={Math.max(0, c().size - 1)} height={b.size().h - 1} />
        )}
      </Index>
      <Index each={rows()}>
        {(r) => (
          <rect class="band" x={0.5} y={r().at + 0.5} width={b.size().w - 1} height={Math.max(0, r().size - 1)} />
        )}
      </Index>
      <Keyed each={lines()}>
        {(g) => (
          <g class={selected(g().id) ? "guide on" : "guide"}>
            <Show when={selected(g().id)}>
              <path class="halo" d={across(g().axis, g().at, b.size().w, b.size().h)} />
            </Show>
            <path class="line" d={across(g().axis, g().at, b.size().w, b.size().h)} />
            <Label
              x={g().axis === "x" ? g().at + 3 : 16}
              y={g().axis === "x" ? 16 : g().at + 3}
              text={Math.round(g().at)}
              tone="guide"
            />
            <Show when={g().gap}>
              {(gap) => (
                <Label
                  x={g().axis === "x" ? g().at + gap() / 2 : 22}
                  y={g().axis === "x" ? 22 : g().at + gap() / 2}
                  text={gap()}
                  tone="ring"
                  align="middle"
                  valign="middle"
                />
              )}
            </Show>
          </g>
        )}
      </Keyed>
      <Show when={b.tool() === "guides" && b.guideHover() !== null && !b.draft()}>
        <g class="guide preview">
          <path class="line" d={across(b.guideAxis(), b.guideHover()!, b.size().w, b.size().h)} />
          <Label
            x={b.guideAxis() === "x" ? b.guideHover()! + 3 : 16}
            y={b.guideAxis() === "x" ? 16 : b.guideHover()! + 3}
            text={b.guideHover()!}
            tone="guide"
          />
        </g>
      </Show>
    </g>
  )
}
