// Generated from @dither-ui/kit/solid/ScrollProgress.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import DitherProgress from "./DitherProgress"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  progress: { height: "0.25rem", width: "100%" },
  fixed: { position: "fixed", insetInline: "0px", zIndex: "50" },
  sticky: { position: "sticky", zIndex: "10", marginBottom: "-0.25rem" },
  bottom0: { bottom: "0px" },
  top0: { top: "0px" },
})

/** Reading progress — a dithered bar riding the viewport edge (or the top of
 * a positioned parent), fed by rAF-throttled scroll. It composes
 * DitherProgress: one progress painter, everywhere. */
export type ScrollProgressProps = {
  /** viewport pins to the window edge; parent tracks the nearest scrollable ancestor. */
  attach?: "viewport" | "parent"
  edge?: "top" | "bottom"
  color?: PixelColor
  class?: string
  xstyle?: StyleProp
}

export default function ScrollProgress(raw: ScrollProgressProps) {
  const props = mergeProps({ attach: "viewport" as const, edge: "top" as const, color: "green" as PixelColor }, raw)

  const [value, setValue] = createSignal(0)
  let host: HTMLDivElement | undefined

  onMount(() => {
    let raf = 0
    let scroller: HTMLElement | Window = window

    function measure() {
      raf = 0
      if (scroller instanceof Window) {
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        setValue(max > 0 ? Math.round((doc.scrollTop / max) * 100) : 0)
      } else {
        const max = scroller.scrollHeight - scroller.clientHeight
        setValue(max > 0 ? Math.round((scroller.scrollTop / max) * 100) : 0)
      }
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(measure)
    }

    if (props.attach === "parent") {
      let p = host?.parentElement ?? null
      while (p) {
        const o = getComputedStyle(p).overflowY
        if (o === "auto" || o === "scroll") break
        p = p.parentElement
      }
      if (p) scroller = p
    }
    scroller.addEventListener("scroll", onScroll, { passive: true })
    measure()
    onCleanup(() => {
      scroller.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    })
  })

  return (
    <div
      ref={(el) => (host = el)}
      role="presentation"
      class={cn(
        props.attach === "viewport" ? styles.fixed : styles.sticky,
        props.edge === "bottom" ? styles.bottom0 : styles.top0,
        props.xstyle,
        props.class,
      )}
    >
      <DitherProgress value={value()} color={props.color} xstyle={styles.progress} />
    </div>
  )
}
