<script lang="ts">
  import type { Snippet } from "svelte"
  import { onDestroy } from "svelte"
  import { cssColor } from "../engine/palette"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  /** Hold-to-complete — press and hold while a liquid fill with a dotted crest
   * rises (or slides) toward full; release early and it drains back. Works with
   * pointer or a held Enter/Space; completion fires exactly once per fill. */
  type Props = {
    /** Hold time to complete, ms. */
    duration?: number
    direction?: "vertical" | "horizontal"
    color?: PixelColor
    disabled?: boolean
    class?: string
    oncomplete?: () => void
    children?: Snippet
  }
  let {
    duration = 1200,
    direction = "vertical",
    color = "orange",
    disabled = false,
    class: className,
    oncomplete,
    children,
  }: Props = $props()

  let progress = $state(0)
  let holding = $state(false)
  let done = $state(false)
  let raf = 0
  let dir = 0
  let last = 0
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const rate = dir > 0 ? 1000 / duration : -1000 / (duration * 0.35)
    progress = Math.max(0, Math.min(1, progress + rate * dt))
    if (dir > 0 && progress >= 1) {
      holding = false
      done = true
      oncomplete?.()
      resetTimer = setTimeout(() => {
        done = false
        progress = 0
      }, 900)
      return
    }
    if (dir < 0 && progress <= 0) return
    raf = requestAnimationFrame(tick)
  }
  function start() {
    if (disabled || done || holding) return
    holding = true
    dir = 1
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  function release() {
    if (!holding) return
    holding = false
    dir = -1
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  function keydown(e: KeyboardEvent) {
    if (e.repeat) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      start()
    }
  }
  function keyup(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") release()
  }
  onDestroy(() => {
    cancelAnimationFrame(raf)
    clearTimeout(resetTimer)
  })
</script>

<button
  type="button"
  {disabled}
  class={cn(
    "relative touch-none overflow-hidden rounded-md border border-border/60 bg-card/60 px-4 py-2.5 font-mono text-[12px] text-muted-foreground transition-colors select-none hover:text-foreground",
    CONTROL_BUTTON,
    (holding || done) && "text-foreground",
    className
  )}
  onpointerdown={(e) => {
    e.preventDefault()
    start()
  }}
  onpointerup={release}
  onpointerleave={release}
  onpointercancel={release}
  onkeydown={keydown}
  onkeyup={keyup}
>
  <span
    aria-hidden="true"
    class="absolute {direction === 'vertical' ? 'inset-x-0 bottom-0' : 'inset-y-0 left-0'}"
    style:height={direction === "vertical" ? `${progress * 100}%` : undefined}
    style:width={direction === "horizontal" ? `${progress * 100}%` : undefined}
  >
    <span class="absolute inset-0 opacity-20" style:background={cssColor(color)}></span>
    <span
      class="absolute {direction === 'vertical'
        ? 'inset-x-0 top-0 h-[3px]'
        : 'inset-y-0 left-full w-[3px] -translate-x-full'}"
      style:background-image={`radial-gradient(circle, ${cssColor(color)} 1.2px, transparent 1.2px)`}
      style:background-size={direction === "vertical" ? "5px 3px" : "3px 5px"}
    ></span>
  </span>
  <span class="relative">
    {#if children}
      {@render children()}
    {:else}
      Hold to confirm
    {/if}
    {#if done}{" ✓"}{/if}
  </span>
  {#if done}
    <span class="sr-only" role="status">completed</span>
  {/if}
</button>
