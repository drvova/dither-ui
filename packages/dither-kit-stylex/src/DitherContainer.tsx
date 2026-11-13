// Generated from dither-kit/solid/DitherContainer.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { Dynamic } from "solid-js/web"
import { CONTAINER_SCALE, quantize, resolveCq, type CqScale, type CqState } from "dither-kit/engine/containers.ts"
import { cn, type StyleProp } from "./lib"
import "dither-kit/solid/DitherContainer.css"

/** What children receive: the resolution plus the measured content box.
 * Each member reads the container as it is now, so a child that reads one
 * follows it. */
export type ContainerScope = CqState & { width: number; height: number }

export type DitherContainerProps = {
  /** Bucket scale in container px — declaration order irrelevant. */
  scale?: CqScale
  /** Quantize `--cq-w` / `--cq-h` to this many px (0 = continuous). */
  step?: number
  /** Native `container-name` for `@container` rules in children's styles. */
  name?: string
  as?: string
  class?: string
  xstyle?: StyleProp
  children?: JSX.Element | ((scope: ContainerScope) => JSX.Element)
}

export default function DitherContainer(raw: DitherContainerProps) {
  const props = mergeProps({ scale: CONTAINER_SCALE, step: 0, name: "dither", as: "div" }, raw)

  let root: HTMLElement | undefined
  /** 0 until the first observation — the honest pre-measure size. */
  const [width, setWidth] = createSignal(0)
  const [height, setHeight] = createSignal(0)

  function update(w: number, h: number): void {
    const nw = Math.max(0, Math.round(w))
    const nh = Math.max(0, Math.round(h))
    if (width() !== nw) setWidth(nw)
    if (height() !== nh) setHeight(nh)
  }

  const state = createMemo(() => resolveCq(width(), props.scale))
  /** What children receive: the resolution plus the measured content box. */
  const slotState: ContainerScope = {
    get size() {
      return state().size
    },
    get index() {
      return state().index
    },
    get matches() {
      return state().matches
    },
    get width() {
      return width()
    },
    get height() {
      return height()
    },
  }
  /** container-type/name make the node a native query container too — children
   * can use stylesheet `@container <name>` without any of this JS. */
  const boxStyle = createMemo<JSX.CSSProperties>(() => ({
    "container-type": "inline-size",
    "container-name": props.name,
    "--cq-w": String(props.step > 0 ? quantize(width(), props.step) : width()),
    "--cq-h": String(props.step > 0 ? quantize(height(), props.step) : height()),
    "--cq-i": String(state().index),
  }))

  onMount(() => {
    const node = root
    if (!node) return
    let ro: ResizeObserver | null = null
    // contentRect = the content box, i.e. exactly what `@container` measures,
    // and transform-proof (use-chart-dimensions precedent). Without a
    // ResizeObserver the state simply stays at the 0-size bucket.
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        const entry = entries[0]
        update(entry ? entry.contentRect.width : node.clientWidth, entry ? entry.contentRect.height : node.clientHeight)
      })
      ro.observe(node)
    }
    // First-paint guard: if nothing reported (silent observer), read the box
    // once — but never overwrite a real observation with the zero read.
    const fallback = window.setTimeout(() => {
      if (!width()) update(node.clientWidth, node.clientHeight)
    }, 0)
    onCleanup(() => {
      if (fallback) clearTimeout(fallback)
      ro?.disconnect()
      ro = null
    })
  })

  return (
    <Dynamic
      component={props.as}
      ref={(el: HTMLElement) => (root = el)}
      class={cn("dither-container", props.xstyle, props.class)}
      data-cq={state().size ?? undefined}
      style={boxStyle()}
    >
      {(() => {
        const c = props.children
        return typeof c === "function" ? c(slotState) : c
      })()}
    </Dynamic>
  )
}
