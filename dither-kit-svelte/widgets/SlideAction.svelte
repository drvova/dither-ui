<script lang="ts">
  import { project, rubberband, velocityFrom, type VelocitySample } from "../runtime/gesture"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Slide-to-confirm — drag the thumb to the end of the track (or flick it;
   * momentum projection counts) to fire, release early and it springs back.
   * Enter or Space confirms without the slide. */
  type Props = {
    label?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
    onconfirm?: () => void
  }
  let { label = "Slide to confirm", color = "green", disabled = false, class: className, onconfirm }: Props = $props()

  const still = pixelPrefersReducedMotion()

  let trackEl = $state<HTMLElement | null>(null)
  let thumbEl = $state<HTMLButtonElement | null>(null)
  let x = $state(0)
  let dragging = $state(false)
  let done = $state(false)
  let pid = -1
  let sx = 0
  let travel = $state(1)
  let samples: VelocitySample[] = []

  function measure() {
    if (trackEl && thumbEl) travel = Math.max(1, trackEl.clientWidth - thumbEl.offsetWidth - 8)
  }
  function finish() {
    measure()
    x = travel
    done = true
    onconfirm?.()
    setTimeout(() => {
      done = false
      x = 0
    }, 900)
  }
  function down(e: PointerEvent) {
    if (disabled || done) return
    measure()
    dragging = true
    pid = e.pointerId
    sx = e.clientX - x
    samples = [{ t: e.timeStamp, p: e.clientX }]
    thumbEl?.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging || e.pointerId !== pid) return
    const raw = e.clientX - sx
    x = raw < 0 ? -rubberband(-raw, 48) : Math.min(raw, travel)
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  function up(e: PointerEvent) {
    if (!dragging || e.pointerId !== pid) return
    dragging = false
    if (x >= travel - 2 || x + project(velocityFrom(samples)) >= travel) finish()
    else x = 0
  }
  /** Keyboard path: Enter or Space confirms without the slide. */
  function key(e: KeyboardEvent) {
    if (disabled || done) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      finish()
    }
  }
</script>

<div
  bind:this={trackEl}
  class={cn(
    "relative flex h-10 w-64 touch-none items-center rounded-full border border-border/60 bg-card/60 px-1 select-none",
    className
  )}
>
  <span
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-10 text-center font-mono text-[12px] text-muted-foreground"
    style:opacity={x ? String(Math.max(0, 1 - x / (travel * 0.6))) : "1"}
  >
    {label}
  </span>
  <button
    bind:this={thumbEl}
    type="button"
    {disabled}
    aria-label={label}
    class={cn(
      "grid size-8 shrink-0 place-items-center rounded-full text-[14px] text-background",
      CONTROL_BUTTON,
      dragging ? "cursor-grabbing" : "cursor-grab"
    )}
    style:background={cssColor(color)}
    style:transform={`translateX(${x}px)`}
    style:transition={dragging || still ? "none" : "transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)"}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
    onkeydown={key}
  >
    {done ? "✓" : "→"}
  </button>
  {#if done}
    <span class="sr-only" role="status">confirmed</span>
  {/if}
</div>
