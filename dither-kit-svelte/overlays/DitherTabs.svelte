<script lang="ts" module>
  import { getContext, setContext } from "svelte"
  import { rgb } from "../engine/palette"
  import { BAYER4, fillOf, pixelMatrixFromSeed, type PixelColor } from "../engine/pixel"

  export type TabsVariant = "underline" | "segmented" | "washed"
  export type TabItem = {
    value: string
    label?: string
    badge?: string | number
    disabled?: boolean
  }

  // Svelte 5 reactive context: a live `active` getter replaces Vue's `Ref<string>`.
  export type TabsContext = { readonly active: string; idBase: string }
  const TABS_KEY = Symbol("dither-tabs")
  export function setTabs(ctx: TabsContext): void {
    setContext(TABS_KEY, ctx)
  }
  export function useTabs(): TabsContext | null {
    return getContext<TabsContext>(TABS_KEY) ?? null
  }

  let counter = 0
  const CELL = 2

  /** Underline: a dither ramp along the run (same recipe as the gradient fade). */
  function paintUnderline(
    canvas: HTMLCanvasElement,
    length: number,
    color: PixelColor,
    vertical: boolean,
    matrix: number[][]
  ) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || length <= 0) return
    const cells = Math.max(4, Math.round(length / CELL))
    canvas.width = vertical ? 1 : cells
    canvas.height = vertical ? cells : 1
    const fill = fillOf(color)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < cells; i++) {
      const density = (i + 0.5) / cells
      const lit = density > matrix[0][i & 3]
      const alpha = lit ? 0.35 + 0.65 * density : 0.12 * density
      if (alpha <= 0.004) continue
      ctx.fillStyle = rgb(fill, 1, alpha)
      if (vertical) ctx.fillRect(0, i, 1, 1)
      else ctx.fillRect(i, 0, 1, 1)
    }
  }

  /** Washed: a quiet rest-intensity fill behind the active tab. */
  function paintWash(
    canvas: HTMLCanvasElement,
    w: number,
    h: number,
    color: PixelColor,
    matrix: number[][]
  ) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx || w <= 0 || h <= 0) return
    const cols = Math.max(4, Math.round(w / CELL))
    const rows = Math.max(4, Math.round(h / CELL))
    canvas.width = cols
    canvas.height = rows
    const fill = fillOf(color)
    ctx.clearRect(0, 0, cols, rows)
    for (let y = 0; y < rows; y++) {
      const density = 0.2 + 0.5 * ((y + 0.5) / rows)
      for (let x = 0; x < cols; x++) {
        const lit = density > matrix[y & 3][x & 3]
        ctx.fillStyle = rgb(fill, 1, lit ? 0.32 : 0.08)
        ctx.fillRect(x, y, 1, 1)
      }
    }
    ctx.fillStyle = rgb(fill, 1, 0.5)
    ctx.fillRect(0, rows - 1, cols, 1)
  }
</script>

<script lang="ts">
  import { cn } from "../runtime/lib"
  import { kitFromSeed } from "../engine/dither-paint"

  type Props = {
    /** Plain strings or { value, label, badge, disabled } items. */
    tabs: (string | TabItem)[]
    value: string
    color?: PixelColor
    /** underline: moving dither strip · segmented: boxed chips · washed: dither fill. */
    variant?: TabsVariant
    orientation?: "horizontal" | "vertical"
    seed?: number
    class?: string
    children?: import("svelte").Snippet
  }

  let {
    tabs,
    value = $bindable(),
    color,
    variant = "underline",
    orientation = "horizontal",
    seed,
    class: className,
    children,
  }: Props = $props()

  const s = $derived(seed !== undefined ? kitFromSeed(seed) : null)
  const effColor = $derived<PixelColor>(color ?? s?.hue ?? "blue")
  const matrix = $derived(seed !== undefined ? pixelMatrixFromSeed(seed) : BAYER4)

  const idBase = `dk-tabs-${counter++}`
  setTabs({
    get active() {
      return value
    },
    idBase,
  })

  const items = $derived<TabItem[]>(
    tabs.map((t) => (typeof t === "string" ? { value: t } : t))
  )
  const vertical = $derived(orientation === "vertical")

  let listEl = $state<HTMLDivElement | null>(null)
  let canvasEl = $state<HTMLCanvasElement | null>(null)
  let marker = $state({ left: 0, top: 0, width: 0, height: 0 })

  function tabButtons(): HTMLButtonElement[] {
    return listEl ? [...listEl.querySelectorAll<HTMLButtonElement>('[role="tab"]')] : []
  }

  function measure() {
    if (variant === "segmented") return
    const i = items.findIndex((t) => t.value === value)
    const btn = tabButtons()[i]
    const canvas = canvasEl
    if (!btn || !canvas) return
    marker = {
      left: btn.offsetLeft,
      top: btn.offsetTop,
      width: btn.offsetWidth,
      height: btn.offsetHeight,
    }
    if (variant === "washed") paintWash(canvas, btn.offsetWidth, btn.offsetHeight, effColor, matrix)
    else
      paintUnderline(
        canvas,
        vertical ? btn.offsetHeight : btn.offsetWidth,
        effColor,
        vertical,
        matrix
      )
  }

  function select(v: string) {
    value = v
  }

  function onKeydown(e: KeyboardEvent) {
    const fwd = vertical ? "ArrowDown" : "ArrowRight"
    const back = vertical ? "ArrowUp" : "ArrowLeft"
    let next = -1
    const enabled = items.map((t, i) => ({ t, i })).filter(({ t }) => !t.disabled)
    const pos = enabled.findIndex(({ t }) => t.value === value)
    if (e.key === fwd) next = (pos + 1) % enabled.length
    else if (e.key === back) next = (pos - 1 + enabled.length) % enabled.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = enabled.length - 1
    else return
    e.preventDefault()
    const target = enabled[next]
    select(target.t.value)
    requestAnimationFrame(() => tabButtons()[target.i]?.focus())
  }

  const markerStyle = $derived.by(() => {
    const px = (n: number) => `${n}px`
    if (variant === "washed")
      return `left:${px(marker.left)};top:${px(marker.top)};width:${px(marker.width)};height:${px(marker.height)};image-rendering:pixelated`
    return vertical
      ? `left:0px;top:${px(marker.top)};width:2px;height:${px(marker.height)};image-rendering:pixelated`
      : `left:${px(marker.left)};bottom:0px;width:${px(marker.width)};height:2px;image-rendering:pixelated`
  })

  // Re-measure on the same signals Vue watched; the action owns the ResizeObserver.
  const markerKey = $derived(
    JSON.stringify([value, items.map((t) => t.value), effColor, variant, orientation])
  )
  function tabsMarker(list: HTMLElement, _key: string) {
    let ro: ResizeObserver | null = null
    const run = () => requestAnimationFrame(measure)
    run()
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure)
      ro.observe(list)
    }
    return {
      update() {
        run()
      },
      destroy() {
        ro?.disconnect()
      },
    }
  }

  const listClass = $derived(
    cn(
      vertical ? "flex flex-col" : "flex",
      variant === "segmented"
        ? "gap-1 rounded-md border border-border/60 p-1" + (vertical ? "" : " items-center")
        : variant === "underline"
          ? vertical
            ? "gap-1 pl-3"
            : "gap-4"
          : "gap-1"
    )
  )

  function tabClass(t: TabItem): string {
    return cn(
      "relative z-10 flex items-center gap-1.5 text-[12px] transition-colors focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
      variant === "underline"
        ? vertical
          ? "rounded-md px-2 py-1.5 text-left"
          : "pb-2"
        : "rounded px-2.5 py-1 text-left",
      t.value === value
        ? variant === "segmented"
          ? "bg-card text-foreground"
          : "text-foreground"
        : "text-muted-foreground hover:text-foreground"
    )
  }
</script>

<div class={cn("relative", vertical ? "flex gap-4" : "", className)}>
  <!-- svelte-ignore a11y_interactive_supports_focus (tabs use roving tabindex on the tabs, per APG) -->
  <div
    bind:this={listEl}
    use:tabsMarker={markerKey}
    role="tablist"
    aria-orientation={orientation}
    class={listClass}
    onkeydown={onKeydown}
  >
    {#each items as t (t.value)}
      <button
        id={`${idBase}-tab-${t.value}`}
        type="button"
        role="tab"
        aria-selected={t.value === value}
        aria-controls={`${idBase}-panel-${t.value}`}
        tabindex={t.value === value ? 0 : -1}
        disabled={t.disabled}
        class={tabClass(t)}
        onclick={() => select(t.value)}
      >
        {t.label ?? t.value}
        {#if t.badge !== undefined}
          <span
            class="rounded border border-border/60 px-1 text-[10px] text-muted-foreground tabular-nums"
            >{t.badge}</span
          >
        {/if}
      </button>
    {/each}
  </div>
  {#if variant !== "segmented"}
    <canvas
      bind:this={canvasEl}
      aria-hidden="true"
      class={cn(
        "absolute transition-[left,top,width,height] duration-200 motion-reduce:transition-none",
        variant === "washed" ? "rounded" : ""
      )}
      style={markerStyle}
    ></canvas>
  {/if}
  <!-- Panels: put DitherTabPanel children here so they inherit the context. -->
  {@render children?.()}
</div>
