<script lang="ts" module>
  import { rgb, type Rgb } from "./palette"
  import { BAYER4, clamp01 } from "./pixel"

  const CELL = 2

  /** Paint one radio — a 1px pixel ring when unchecked, the ring in the accent
   * plus a dithered inner dot (distance check against the Bayer matrix) when
   * checked. */
  function paintDot(
    ctx: CanvasRenderingContext2D,
    n: number,
    fill: Rgb,
    muted: Rgb,
    checked: boolean,
    matrix: number[][] = BAYER4
  ): void {
    ctx.clearRect(0, 0, n, n)
    const c = (n - 1) / 2
    const edge = n / 2
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - c, y - c)
        if (d > edge) continue
        if (d > edge - 1.2) {
          ctx.fillStyle = rgb(checked ? fill : muted, 1, 0.6)
          ctx.fillRect(x, y, 1, 1)
        } else if (checked && d <= edge - 2.4) {
          const density = 0.8
          const lit = density > matrix[y & 3][x & 3]
          const k = 0.3 + density * 0.7
          ctx.fillStyle = rgb(fill, 1, clamp01(lit ? k : k * 0.4))
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
  }
</script>

<script lang="ts">
  import { tick } from "svelte"
  import type { Option } from "./DitherSelect.svelte"
  import { cn } from "./lib"
  import { fillOf, type PixelColor } from "./pixel"
  import { paintOnResize, type CanvasPaint } from "./canvas-mount"

  type Props = {
    options: Option[]
    value?: string
    color?: PixelColor
    label?: string
    class?: string
  }

  let {
    options,
    value = $bindable(""),
    color = "blue",
    label,
    class: className,
  }: Props = $props()

  const activeIndex = $derived.by(() => {
    const i = options.findIndex((o) => o.value === value)
    return i >= 0 ? i : 0
  })

  let btnEls = $state<(HTMLButtonElement | null)[]>([])

  // Reading `value`/`color` here (not inside the returned closure) lets Svelte
  // track them, so a change re-invokes the action's `update` and repaints.
  function makePaint(o: Option): CanvasPaint {
    const checked = o.value === value
    const fill = fillOf(color)
    const muted = fillOf("grey")
    return (canvas) => {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return
      const n = Math.max(4, Math.round(canvas.getBoundingClientRect().width / CELL))
      canvas.width = n
      canvas.height = n
      paintDot(ctx, n, fill, muted, checked)
    }
  }

  function onKeydown(e: KeyboardEvent) {
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    const n = options.length
    let i = activeIndex
    for (let step = 0; step < n; step++) {
      i = (i + dir + n) % n
      if (!options[i].disabled) {
        value = options[i].value
        const target = i
        tick().then(() => btnEls[target]?.focus())
        return
      }
    }
  }
</script>

<!-- svelte-ignore a11y_interactive_supports_focus (roving tabindex: focus lives on the radios, keydown bubbles up) -->
<div
  role="radiogroup"
  aria-label={label}
  class={cn("grid gap-3", className)}
  onkeydown={onKeydown}
>
  {#each options as o, i (o.value)}
    <button
      bind:this={btnEls[i]}
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={i === activeIndex ? 0 : -1}
      disabled={o.disabled}
      class="inline-flex items-center gap-2 text-left focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      onclick={() => (value = o.value)}
    >
      <span class="relative size-4 shrink-0">
        <canvas
          use:paintOnResize={makePaint(o)}
          aria-hidden="true"
          class="absolute inset-0 h-full w-full"
          style="image-rendering: pixelated"
        ></canvas>
      </span>
      <span class="text-[13px] text-foreground">{o.label}</span>
    </button>
  {/each}
</div>
