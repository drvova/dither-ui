<script lang="ts">
  import DitherProgress from "../controls/DitherProgress.svelte"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Reading progress — a dithered bar riding the viewport edge (or the top of
   * a positioned parent), fed by rAF-throttled scroll. It composes
   * DitherProgress: one progress painter, everywhere. */
  type Props = {
    /** viewport pins to the window edge; parent tracks the nearest scrollable ancestor. */
    attach?: "viewport" | "parent"
    edge?: "top" | "bottom"
    color?: PixelColor
    class?: string
  }

  let { attach = "viewport", edge = "top", color = "green", class: className }: Props = $props()

  let value = $state(0)

  /** Scroll wiring lives in an action — mount finds the scroller, destroy detaches. */
  function trackScroll(node: HTMLElement) {
    let raf = 0
    let scroller: HTMLElement | Window = window
    if (attach === "parent") {
      let p = node.parentElement
      while (p) {
        const o = getComputedStyle(p).overflowY
        if (o === "auto" || o === "scroll") break
        p = p.parentElement
      }
      if (p) scroller = p
    }
    const measure = () => {
      raf = 0
      if (scroller instanceof Window) {
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        value = max > 0 ? Math.round((doc.scrollTop / max) * 100) : 0
      } else {
        const max = scroller.scrollHeight - scroller.clientHeight
        value = max > 0 ? Math.round((scroller.scrollTop / max) * 100) : 0
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    scroller.addEventListener("scroll", onScroll, { passive: true })
    measure()
    return {
      destroy() {
        scroller.removeEventListener("scroll", onScroll)
        if (raf) cancelAnimationFrame(raf)
      },
    }
  }
</script>

<div
  use:trackScroll
  role="presentation"
  class={cn(
    attach === "viewport" ? "fixed inset-x-0 z-50" : "sticky z-10 -mb-1",
    edge === "bottom" ? "bottom-0" : "top-0",
    className
  )}
>
  <DitherProgress {value} {color} class="h-1 w-full" />
</div>
