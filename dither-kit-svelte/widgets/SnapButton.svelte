<script lang="ts">
  import type { Snippet } from "svelte"
  import { rubberband } from "../runtime/gesture"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Pull-to-confirm — drag the button past the threshold and let go to fire;
   * short pulls spring home. 1:1 tracking, rubber-band past the line, and the
   * border arms with the accent when the release would count. */
  type Props = {
    /** Displacement that arms the snap, px. */
    threshold?: number
    axis?: "x" | "y" | "both"
    color?: PixelColor
    disabled?: boolean
    class?: string
    onsnap?: () => void
    children?: Snippet
  }

  let { threshold = 64, axis = "x", color = "green", disabled = false, class: className, onsnap, children }: Props = $props()

  let dx = $state(0)
  let dy = $state(0)
  let dragging = $state(false)
  let pointerId = -1
  let sx = 0
  let sy = 0

  const armed = $derived(Math.hypot(dx, dy) >= threshold)
  const still = pixelPrefersReducedMotion()

  function clampAxis(x: number, y: number): [number, number] {
    if (axis === "x") return [x, 0]
    if (axis === "y") return [0, y]
    return [x, y]
  }
  function soft(v: number) {
    const limit = threshold * 1.5
    return Math.abs(v) > limit ? Math.sign(v) * (limit + rubberband(Math.abs(v) - limit, limit)) : v
  }
  function down(e: PointerEvent) {
    if (disabled) return
    dragging = true
    pointerId = e.pointerId
    sx = e.clientX
    sy = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    const [x, y] = clampAxis(e.clientX - sx, e.clientY - sy)
    dx = soft(x)
    dy = soft(y)
  }
  function up(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    dragging = false
    if (armed) onsnap?.()
    dx = 0
    dy = 0
  }
  /** Keyboard path: Enter or Space fires without the pull. */
  function key(e: KeyboardEvent) {
    if (disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onsnap?.()
    }
  }
</script>

<button
  type="button"
  {disabled}
  class={cn(
    "inline-flex touch-none items-center gap-2 rounded-md border px-3.5 py-2 font-mono text-[12px] select-none",
    CONTROL_BUTTON,
    dragging ? "cursor-grabbing" : "cursor-grab",
    armed ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    "bg-card/60",
    className
  )}
  style:transform={`translate(${dx}px, ${dy}px)`}
  style:transition={dragging || still ? "none" : "transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)"}
  style:border-color={armed ? cssColor(color) : "var(--border)"}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  onkeydown={key}
>
  <span
    aria-hidden="true"
    class="size-1.5 shrink-0 rounded-[1px] transition-colors"
    style:background={armed ? cssColor(color) : "var(--border)"}
  ></span>
  {#if children}{@render children()}{:else}Pull to confirm{/if}
  {#if armed}<span class="sr-only">armed, release to confirm</span>{/if}
</button>
