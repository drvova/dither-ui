// Which of a chart root's layers a composed part renders in, and the one SVG
// they stack in. Solid's children arrive already rendered (a root cannot
// read a part's component), so a part that is not front SVG chrome hands the
// root a token instead: its content, named for the layer it belongs in. The
// root sorts its children by it and stacks the layers in one `<svg>`: back
// chrome (grid) behind the family's print, the print, front chrome (axes,
// dots), then the DOM legend and tooltip on top of it.

import {
  children,
  type Component,
  createComponent,
  createMemo,
  createSignal,
  createUniqueId,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js"
import { cssEasing } from "../../engine/chart-svg"
import type { EasingInput } from "../../engine/dither-paint"
import { watchVisibility } from "../../engine/visibility"

export type ChartLayer = "back" | "dom"

const LAYER = Symbol("dither-chart-layer")
type LayerToken = { [LAYER]: ChartLayer; node: JSX.Element }

const isToken = (v: unknown): v is LayerToken => typeof v === "object" && v !== null && LAYER in v

/** A part's content, routed to `layer` by the chart root it is composed in
 * (as a direct child, or through a fragment, `<For>` or `<Show>`). */
export function chartLayer(layer: ChartLayer, node: JSX.Element): JSX.Element {
  return { [LAYER]: layer, node } as unknown as JSX.Element
}

/** What the root's `<svg>` carries for its print's motion and hover. */
export type ChartMotion = {
  /** An entrance plays (`animate`), timed by the rest. */
  enter: boolean
  duration: number
  delay: number
  easing: EasingInput
  /** Each mount of the print: a new one replays the entrance. */
  revision: number
  /** How much the pointer lifts the fill's alpha (0: not at all). */
  lift: number
  /** Held as if hovered. */
  hovered: boolean
  bloomOnHover: boolean
  /** A `<Tooltip>` is composed: it shows the values, the marks do not. */
  tooltip: boolean
}

/**
 * The layers of a chart root in one `<svg>` of the root's size: what a
 * server render prints before any measure (`width`/`height` are then the
 * family's default, scaled into the box), and the measured box after.
 * Anything untagged is front SVG.
 */
export function ChartLayers(props: {
  width: number
  height: number
  /** The plot's offset inside the root: its margins. */
  transform: string
  /** The chart and its series, as a reader hears it. */
  label: string
  motion: ChartMotion
  /** The family's print. */
  plot: Component
  /** Chrome the family always draws behind its print (the radar's frame). */
  backDecoration?: Component
  children?: JSX.Element
}) {
  const lift = createUniqueId()
  // The entrance waits for the chart to come on screen once (the
  // stylesheet holds it at its first frame until `data-in-view`); a
  // replay after that plays at once.
  let root: SVGSVGElement | undefined
  const [inView, setInView] = createSignal(false)
  onMount(() => {
    if (typeof IntersectionObserver === "undefined") return void setInView(true)
    const seen = watchVisibility(
      () => root,
      () => {
        setInView(true)
        seen.dispose()
      },
    )
    seen.mount()
    onCleanup(seen.dispose)
  })
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
  const style = (): JSX.CSSProperties => ({
    "--dk-chart-duration": `${Math.max(1, props.motion.duration)}ms`,
    "--dk-chart-delay": `${props.motion.delay}ms`,
    "--dk-chart-ease": cssEasing(props.motion.easing),
    "--dk-chart-lift": `url(#${lift})`,
  })

  return (
    <>
      <Show when={String(props.motion.revision)} keyed>
        {(_run) => (
          <svg
            ref={(el) => (root = el)}
            class="dk-chart absolute inset-0 h-full w-full"
            viewBox={`0 0 ${props.width} ${props.height}`}
            role="group"
            aria-label={props.label}
            data-enter={props.motion.enter ? "" : undefined}
            data-in-view={inView() ? "" : undefined}
            data-lift={props.motion.lift > 0 ? "" : undefined}
            data-hovered={props.motion.hovered ? "" : undefined}
            data-bloom-hover={props.motion.bloomOnHover ? "" : undefined}
            data-tooltip={props.motion.tooltip ? "" : undefined}
            style={style()}
          >
            <title>{props.label}</title>
            <defs>
              <filter id={lift} color-interpolation-filters="sRGB">
                <feComponentTransfer>
                  <feFuncA type="linear" slope={1 + props.motion.lift} />
                </feComponentTransfer>
              </filter>
            </defs>
            <g transform={props.transform}>
              {decoration()}
              {sorted().back}
            </g>
            {createComponent(props.plot, {})}
            <g transform={props.transform}>{sorted().svg}</g>
          </svg>
        )}
      </Show>
      {sorted().dom}
    </>
  )
}
