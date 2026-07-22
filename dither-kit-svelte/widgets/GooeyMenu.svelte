<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"
  export type GooeyItem = { value: string; label: string; color?: PixelColor }
  let gooeyCount = 0
</script>

<script lang="ts">
  import { cssColor } from "../engine/palette"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"

  /** Action buttons that melt out of one trigger — the classic SVG goo filter
   * (blur + alpha contrast) fuses the circles while they travel. Reduced
   * motion drops the travel; items simply appear. */
  type Props = {
    items: GooeyItem[]
    /** Expanded state (bindable). */
    open?: boolean
    direction?: "up" | "down" | "left" | "right"
    /** Gap between item centers, px. */
    spacing?: number
    label?: string
    class?: string
    onselect?: (value: string) => void
  }

  let {
    items,
    open = $bindable(false),
    direction = "up",
    spacing = 52,
    label = "Actions",
    class: className,
    onselect,
  }: Props = $props()

  const id = `dk-goo-${gooeyCount++}`
  const VEC: Record<"up" | "down" | "left" | "right", [number, number]> = {
    up: [0, -1],
    down: [0, 1],
    left: [-1, 0],
    right: [1, 0],
  }
  const offset = (i: number) => {
    if (!open) return "translate(0px, 0px)"
    const [vx, vy] = VEC[direction]
    const d = spacing * (i + 1)
    return `translate(${vx * d}px, ${vy * d}px)`
  }
  function pick(value: string) {
    onselect?.(value)
    open = false
  }
</script>

<div
  class={cn("relative inline-block", className)}
  role="presentation"
  onkeydown={(e) => {
    if (e.key === "Escape") open = false
  }}
>
  <svg class="absolute size-0" aria-hidden="true">
    <defs>
      <filter {id}>
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
  <div style:filter={`url(#${id})`}>
    {#each items as it, i (it.value)}
      <button
        type="button"
        aria-label={it.label}
        title={it.label}
        tabindex={open ? 0 : -1}
        class={cn(
          "absolute top-0 left-0 grid size-11 place-items-center rounded-full border border-border/60 bg-card transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
          CONTROL_BUTTON,
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        style:transform={offset(i)}
        style:transition-delay={open ? `${i * 40}ms` : "0ms"}
        onclick={() => pick(it.value)}
      >
        <span aria-hidden="true" class="size-2 rounded-[2px]" style:background={cssColor(it.color ?? "blue")}></span>
      </button>
    {/each}
    <button
      type="button"
      aria-label={label}
      aria-expanded={open}
      class={cn("relative grid size-11 place-items-center rounded-full border border-border/60 bg-card text-foreground", CONTROL_BUTTON)}
      onclick={() => (open = !open)}
    >
      <span
        aria-hidden="true"
        class={cn("text-[15px] leading-none transition-transform duration-300 motion-reduce:transition-none", open && "rotate-45")}
      >+</span>
    </button>
  </div>
</div>
