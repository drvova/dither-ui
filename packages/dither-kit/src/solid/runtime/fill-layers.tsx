// A labelled fill printed by the stylesheet (badge, toggle, toggle group,
// button): its layers as tone classes and custom properties, rendered on the
// server, with no canvas and no paint. The engine's `labelPaint` says what
// each layer prints; a fill with states (the button's hover and press) hands
// one paint a state, and `fill-layers.css` moves between them on `:hover` and
// `:active`, a tile and an ink at a time.

import { createMemo, createSignal, For, type JSX, onCleanup, onMount } from "solid-js"
import { cn } from "../../tailwind/lib"
import { labelRows, type LabelLayer, type LabelPaint } from "../../engine/label-fill"
import { watchSize } from "../../engine/size-watch"
import "../../engine/tones.css"
import "./fill-layers.css"

/** A layer's custom properties in state `n` (0 at rest): its ink, shift and
 * tile, or its image. */
function layerVars(layer: LabelLayer, n: number): Record<string, string> {
  const at = (name: string) => (n ? `--dk-${name}-${n}` : `--dk-${name}`)
  if (layer.kind === "image") return { [at("img")]: `url("${layer.src}")` }
  const vars: Record<string, string> = { [at("ink")]: layer.ink }
  // At rest a tile a class holds needs no property; a state names its own.
  if (n || !layer.tone) vars[at("tile")] = layer.tile
  if (n || layer.tone?.x) vars[at("x")] = String(layer.tone?.x ?? 0)
  if (n || layer.tone?.y) vars[at("y")] = String(layer.tone?.y ?? 0)
  return vars
}

export type LabelFillProps = {
  /** The fill at `rows` cells tall: at rest, then (a key's) hovered and
   * pressed. */
  paint: (rows: number) => LabelPaint[]
  /** The box's height at rest in CSS px: its rows until the box reports. */
  height: number
  /** CSS px a cell. */
  cell?: number
  style?: JSX.CSSProperties
}

export function LabelFill(props: LabelFillProps) {
  const cell = () => props.cell ?? 2
  // A gradient's density runs down its rows, so it is printed for the rows
  // the box holds, square cells from the top: the rows its height at rest
  // gives, then the rows its observer reports (no layout read, no paint),
  // whatever it prints now: a variant changed in place prints as fresh.
  const [height, setHeight] = createSignal<number>()
  const rows = createMemo(() => labelRows(height() ?? props.height, cell()))
  const states = createMemo(() => props.paint(rows()))
  const rest = () => states()[0]!
  let el: HTMLSpanElement | undefined
  onMount(() => {
    const watch = watchSize(el!, (entry) => {
      const size = entry?.borderBoxSize?.[0]?.blockSize
      if (size) setHeight(size)
    })
    onCleanup(watch.stop)
  })
  const style = (): JSX.CSSProperties => {
    const vars: Record<string, string> = { "--dk-rows": String(rows()) }
    states().forEach((paint, n) => (vars[n ? `--dk-edge-${n}` : "--dk-edge"] = paint.edge))
    if (props.cell !== undefined) vars["--dk-cell"] = `${props.cell}px`
    return { ...vars, ...props.style }
  }
  return (
    <span
      ref={(node) => (el = node)}
      aria-hidden="true"
      class="dk-label-fill"
      data-edge={rest().over ? "over" : "replace"}
      data-states={states().length > 1 ? "" : undefined}
      style={style()}
    >
      <For each={rest().layers}>
        {(layer, i) => (
          <span
            class={cn("dk-label-layer", layer.names)}
            style={Object.assign({}, ...states().map((paint, n) => layerVars(paint.layers[i()]!, n)))}
          />
        )}
      </For>
      <span class="dk-label-edge" />
    </span>
  )
}
