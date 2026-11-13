import { createSignal, mergeProps, onCleanup, onMount } from "solid-js"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import DitherProgress from "./DitherProgress"

/** Reading progress — a dithered bar riding the viewport edge (or the top of
 * a positioned parent), fed by rAF-throttled scroll. It composes
 * DitherProgress: one progress painter, everywhere. */
export type ScrollProgressProps = {
  /** viewport pins to the window edge; parent tracks the nearest scrollable ancestor. */
  attach?: "viewport" | "parent"
  edge?: "top" | "bottom"
  color?: PixelColor
  class?: string
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
        props.attach === "viewport" ? "fixed inset-x-0 z-50" : "sticky z-10 -mb-1",
        props.edge === "bottom" ? "bottom-0" : "top-0",
        props.class,
      )}
    >
      <DitherProgress value={value()} color={props.color} class="h-1 w-full" />
    </div>
  )
}
