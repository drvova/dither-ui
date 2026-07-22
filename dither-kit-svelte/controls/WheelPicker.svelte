<script lang="ts" module>
  export type WheelOption = string | { value: string; label: string }
</script>

<script lang="ts">
  import { project, velocityFrom, type VelocitySample } from "../runtime/gesture"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import type { PixelColor } from "../engine/pixel"
  import { cn } from "../runtime/lib"

  const ITEM = 28

  /** iOS-style picker wheel — a 3D drum on native momentum scroll that snaps to
   * the nearest notch. Wheel, drag (mouse via gesture projection, touch native)
   * and spinbutton keys all steer it; wheels compose side by side for date and
   * time pickers. Reduced motion flattens the drum and stills the glides. */
  type Props = {
    options: WheelOption[]
    /** Selected option value (bindable). */
    value?: string
    /** Visible rows (odd). */
    rows?: number
    /** Accessible name for the wheel. */
    label?: string
    color?: PixelColor
    class?: string
  }
  let {
    options,
    value = $bindable(),
    rows = 5,
    label = "Wheel picker",
    color = "blue",
    class: className,
  }: Props = $props()

  const still = pixelPrefersReducedMotion()

  let scroller = $state<HTMLElement | null>(null)
  let st = $state(0)
  let settle: ReturnType<typeof setTimeout> | undefined
  let samples: VelocitySample[] = []
  let dragging = false
  let moved = false

  const opts = $derived(options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)))
  const rowCount = $derived(Math.max(3, rows | 1))
  const clampIndex = (i: number) => Math.max(0, Math.min(opts.length - 1, i))
  const index = $derived(clampIndex(Math.round(st / ITEM)))

  function styleOf(i: number): string {
    const d = (i * ITEM - st) / ITEM
    const opacity = `opacity:${Math.max(0.15, 1 - Math.abs(d) * 0.22)}`
    if (still) return opacity
    const a = Math.max(-64, Math.min(64, d * -16))
    return `${opacity};transform:perspective(560px) rotateX(${a}deg)`
  }

  function commit() {
    const el = scroller
    if (!el || dragging) return
    const i = clampIndex(Math.round(el.scrollTop / ITEM))
    if (Math.abs(el.scrollTop - i * ITEM) > 1) el.scrollTo({ top: i * ITEM, behavior: still ? "auto" : "smooth" })
    el.style.scrollSnapType = ""
    const v = opts[i]?.value
    if (v !== undefined && v !== value) value = v
  }
  function onScroll() {
    const el = scroller
    if (!el) return
    st = el.scrollTop
    clearTimeout(settle)
    settle = setTimeout(commit, 120)
  }
  function go(i: number) {
    const el = scroller
    if (!el) return
    const j = clampIndex(i)
    el.scrollTo({ top: j * ITEM, behavior: still ? "auto" : "smooth" })
    const v = opts[j]?.value
    if (v !== undefined && v !== value) value = v
  }
  function onKeydown(e: KeyboardEvent) {
    const step = ({ ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 } as Record<string, number>)[e.key]
    if (step !== undefined) {
      e.preventDefault()
      go(index + step)
      return
    }
    if (e.key === "Home") {
      e.preventDefault()
      go(0)
    } else if (e.key === "End") {
      e.preventDefault()
      go(opts.length - 1)
    }
  }
  function onPointerdown(e: PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0) return
    const el = scroller
    if (!el) return
    e.preventDefault()
    el.focus()
    el.setPointerCapture(e.pointerId)
    el.style.scrollSnapType = "none"
    dragging = true
    moved = false
    samples = [{ t: e.timeStamp, p: e.clientY }]
  }
  function onPointermove(e: PointerEvent) {
    if (!dragging) return
    const el = scroller
    const prev = samples[samples.length - 1]
    if (!el || !prev) return
    if (Math.abs(e.clientY - samples[0].p) > 4) moved = true
    el.scrollTop -= e.clientY - prev.p
    samples.push({ t: e.timeStamp, p: e.clientY })
    if (samples.length > 6) samples.shift()
  }
  function onPointerup(e: PointerEvent) {
    if (!dragging || e.pointerType !== "mouse") return
    dragging = false
    const el = scroller
    if (!el) return
    const dest = el.scrollTop - project(still ? 0 : velocityFrom(samples))
    go(Math.round(dest / ITEM))
    clearTimeout(settle)
    settle = setTimeout(commit, 120)
  }

  const indexOfValue = (v: string | undefined) => opts.findIndex((o) => o.value === v)

  // Mount = position the drum on the initial value; update = follow external
  // value changes through the action's reactive-param seam.
  function syncValue(node: HTMLElement, params: { value?: string }) {
    node.scrollTop = Math.max(0, indexOfValue(params.value)) * ITEM
    st = node.scrollTop
    return {
      update(next: { value?: string }) {
        const i = indexOfValue(next.value)
        if (i >= 0 && i !== index && !dragging) node.scrollTo({ top: i * ITEM, behavior: still ? "auto" : "smooth" })
      },
    }
  }
</script>

<div class={cn("relative inline-block", className)}>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-7 -translate-y-1/2 rounded-md border-y border-border/70 bg-foreground/[0.04]"
  ></div>
  <div
    bind:this={scroller}
    use:syncValue={{ value }}
    role="spinbutton"
    tabindex="0"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={opts.length - 1}
    aria-valuenow={index}
    aria-valuetext={opts[index]?.label}
    class="snap-y snap-mandatory select-none overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    style:height={`${rowCount * ITEM}px`}
    style:padding-block={`${((rowCount - 1) / 2) * ITEM}px`}
    onscroll={onScroll}
    onkeydown={onKeydown}
    onpointerdown={onPointerdown}
    onpointermove={onPointermove}
    onpointerup={onPointerup}
    onpointercancel={onPointerup}
  >
    {#each opts as o, i (o.value)}
      <!-- svelte-ignore a11y_click_events_have_key_events (drum rows are pointer sugar; the spinbutton scroller owns keys) -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        aria-hidden="true"
        class={cn(
          "flex h-7 snap-center items-center justify-center px-3 text-[13px] tabular-nums",
          i === index ? "font-medium" : "text-muted-foreground/80"
        )}
        style={i === index ? `${styleOf(i)};color:${cssColor(color)}` : styleOf(i)}
        onclick={() => !moved && go(i)}
      >
        {o.label}
      </div>
    {/each}
  </div>
</div>
