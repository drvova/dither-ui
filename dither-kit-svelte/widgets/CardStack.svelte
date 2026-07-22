<script lang="ts" generics="T">
  import type { Snippet } from "svelte"
  import { project, rubberband, velocityFrom, type VelocitySample } from "../runtime/gesture"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { cn } from "../runtime/lib"

  /** Swipe deck — the top card tracks the pointer 1:1, rubber-bands, and a
   * flick or a far drag sends it flying; the stack rises beneath. Cycles
   * forever. Reduced motion swaps instantly. */
  type Props = {
    items: T[]
    /** Visible under-cards. */
    depth?: number
    class?: string
    onadvance?: (index: number) => void
    children?: Snippet<[{ item: T; index: number; top: boolean }]>
  }

  let { items, depth = 2, class: className, onadvance, children }: Props = $props()

  let index = $state(0)
  let dx = $state(0)
  let flying = $state(false)
  let dragging = $state(false)
  let pointerId = -1
  let startX = 0
  let samples: VelocitySample[] = []
  let el = $state<HTMLDivElement | null>(null)

  const order = $derived.by(() => {
    const n = items.length
    if (!n) return []
    return Array.from({ length: Math.min(depth + 1, n) }, (_, d) => (index + d) % n)
  })

  function down(e: PointerEvent) {
    if (flying || items.length < 2) return
    dragging = true
    pointerId = e.pointerId
    startX = e.clientX
    samples = [{ t: e.timeStamp, p: e.clientX }]
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    const raw = e.clientX - startX
    const w = el?.offsetWidth ?? 300
    dx = Math.abs(raw) > w ? Math.sign(raw) * (w + rubberband(Math.abs(raw) - w, w)) : raw
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  function up(e: PointerEvent) {
    if (!dragging || e.pointerId !== pointerId) return
    dragging = false
    const w = el?.offsetWidth ?? 300
    const v = velocityFrom(samples)
    const destination = dx + project(v)
    if (Math.abs(destination) > w * 0.5) {
      if (pixelPrefersReducedMotion()) {
        advance()
        return
      }
      flying = true
      dx = Math.sign(destination) * w * 1.4
      window.setTimeout(advance, 200)
    } else {
      dx = 0
    }
  }
  function advance() {
    index = (index + 1) % items.length
    flying = false
    dx = 0
    onadvance?.(index)
  }

  function styleOf(d: number): string {
    if (d === 0)
      return `transform: translateX(${dx}px) rotate(${dx / 24}deg); transition: ${dragging ? "none" : "transform 200ms ease"}; z-index: 10;`
    return `transform: translateY(${d * 9}px) scale(${1 - d * 0.05}); transition: transform 200ms ease; z-index: ${10 - d}; opacity: ${1 - d * 0.25};`
  }
</script>

<div bind:this={el} class={cn("relative isolate select-none", className)}>
  {#each order as itemIndex, d (itemIndex)}
    {#if d === 0}
      <div
        class="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing motion-reduce:!transition-none"
        style={styleOf(d)}
        role="group"
        aria-roledescription="swipeable card"
        aria-label={`Card ${itemIndex + 1} of ${items.length}`}
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
      >
        {#if children}{@render children({ item: items[itemIndex], index: itemIndex, top: true })}{:else}
          <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card/80 font-mono text-[13px] text-foreground">
            {String(items[itemIndex])}
          </div>
        {/if}
      </div>
    {:else}
      <div class="pointer-events-none absolute inset-0 motion-reduce:!transition-none" style={styleOf(d)} aria-hidden="true">
        {#if children}{@render children({ item: items[itemIndex], index: itemIndex, top: false })}{:else}
          <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card/80 font-mono text-[13px] text-foreground">
            {String(items[itemIndex])}
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</div>
