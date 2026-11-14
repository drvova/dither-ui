// Generated from @dither-ui/kit/solid/runtime/chart-layer.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
// Which of a chart root's layers a composed part renders in. Solid's children
// arrive already rendered (a root cannot read a part's component), so a part that is not front SVG chrome hands the
// root a token instead: its content, named for the layer it belongs in. The
// root sorts its children by it and stacks the layers: back chrome (grid)
// behind the dither canvas, the canvas, front chrome (axes, dots), then the
// DOM legend and tooltip on top.

import { children, type Component, createComponent, createMemo, type JSX, Show } from "solid-js"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { position: "absolute", inset: "0px", overflow: "visible" },
})

export type ChartLayer = "back" | "dom"

const LAYER = Symbol("dither-chart-layer")
type LayerToken = { [LAYER]: ChartLayer; node: JSX.Element }

const isToken = (v: unknown): v is LayerToken => typeof v === "object" && v !== null && LAYER in v

/** A part's content, routed to `layer` by the chart root it is composed in
 * (as a direct child, or through a fragment, `<For>` or `<Show>`). */
export function chartLayer(layer: ChartLayer, node: JSX.Element): JSX.Element {
  return { [LAYER]: layer, node } as unknown as JSX.Element
}

/**
 * The layers of a chart root, around its family's canvas. Back chrome sits
 * behind the dither canvas; the canvas paints the fill; front chrome and
 * the DOM legend/tooltip layer on top. Anything untagged is front SVG.
 */
export function ChartLayers(props: {
  width: number
  height: number
  /** The plot's offset inside the root: its margins. */
  transform: string
  ready: boolean
  canvas: Component
  /** Chrome the family always draws behind its canvas (the radar's frame). */
  backDecoration?: Component
  /** Keep the back layer even while nothing is composed into it (polar roots). */
  alwaysBack?: boolean
  children?: JSX.Element
}) {
  const resolved = children(() => props.children)
  const sorted = createMemo(() => {
    const back: JSX.Element[] = []
    const svg: JSX.Element[] = []
    const dom: JSX.Element[] = []
    for (const child of resolved.toArray()) {
      if (child === null || child === undefined || typeof child === "boolean") continue
      if (!isToken(child)) svg.push(child)
      else if (child[LAYER] === "back") back.push(child.node)
      else dom.push(child.node)
    }
    return { back, svg, dom }
  })
  const decoration = (): JSX.Element => {
    if (!props.backDecoration) return undefined
    const made: unknown = createComponent(props.backDecoration, {})
    return isToken(made) ? made.node : (made as JSX.Element)
  }

  return (
    <>
      <Show when={props.ready && (props.alwaysBack || sorted().back.length > 0)}>
        <svg
          width={props.width}
          height={props.height}
          {...stylex.props(styles.svg)}
          aria-hidden="true"
          role="presentation"
        >
          <g transform={props.transform}>
            {decoration()}
            {sorted().back}
          </g>
        </svg>
      </Show>
      {createComponent(props.canvas, {})}
      <Show when={props.ready}>
        <svg width={props.width} height={props.height} {...stylex.props(styles.svg)} role="img" aria-label="Chart">
          <g transform={props.transform}>{sorted().svg}</g>
        </svg>
      </Show>
      {sorted().dom}
    </>
  )
}
