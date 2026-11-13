// Guides and the layout grid: columns, rows and a pixel grid in the guide
// colour; each guide a hairline with its position, the gap to the next
// guide on its axis labelled between them; the preview of the guide the
// Guides tool would place.
import { createMemo, Index, Show } from "solid-js"
import { useBench } from "../context"
import Keyed from "./Keyed"
import "./Guides.css"

/** Column (or row) bands for `n` tracks across `len` with margins and gutters. */
function tracks(len: number, n: number, gutter: number, margin: number) {
  const size = (len - margin * 2 - gutter * (n - 1)) / n
  return size > 0 ? Array.from({ length: n }, (_, i) => ({ at: margin + i * (size + gutter), size })) : []
}

export default function Guides() {
  const b = useBench()
  const grid = createMemo(() => b.ws().grid)

  const columns = createMemo(() =>
    grid().show.columns ? tracks(b.size().w, grid().columns, grid().gutter, grid().margin) : [],
  )
  const rows = createMemo(() =>
    grid().show.rows ? tracks(b.size().h, grid().rows, grid().rowGutter, grid().margin) : [],
  )

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
    <div class="wb-guides guides-scope" aria-hidden="true">
      <Show when={grid().show.pixel}>
        <div class="pixel" style={{ "background-size": `${grid().pixel}px ${grid().pixel}px` }} />
      </Show>
      <Index each={columns()}>
        {(c) => <i class="band" style={{ left: `${c().at}px`, width: `${c().size}px`, top: 0, bottom: 0 }} />}
      </Index>
      <Index each={rows()}>
        {(r) => <i class="band" style={{ top: `${r().at}px`, height: `${r().size}px`, left: 0, right: 0 }} />}
      </Index>
      <Keyed each={lines()}>
        {(g) => (
          <>
            <div
              class={`line ${g().axis}${selected(g().id) ? " on" : ""}`}
              style={g().axis === "x" ? { left: `${g().at}px` } : { top: `${g().at}px` }}
            >
              <span class="pos">{Math.round(g().at)}</span>
            </div>
            <Show when={g().gap}>
              {(gap) => (
                <span
                  class="gap"
                  style={
                    g().axis === "x"
                      ? { left: `${g().at + gap() / 2}px`, top: "22px" }
                      : { top: `${g().at + gap() / 2}px`, left: "22px" }
                  }
                >
                  {gap()}
                </span>
              )}
            </Show>
          </>
        )}
      </Keyed>
      <Show when={b.tool() === "guides" && b.guideHover() !== null && !b.draft()}>
        <div
          class={`line preview ${b.guideAxis()}`}
          style={b.guideAxis() === "x" ? { left: `${b.guideHover()}px` } : { top: `${b.guideHover()}px` }}
        >
          <span class="pos">{b.guideHover()}</span>
        </div>
      </Show>
    </div>
  )
}
