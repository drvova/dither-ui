<script lang="ts" module>
  import { getContext, setContext } from "svelte"

  export type DrawerSide = "right" | "left" | "bottom"

  /** Nested-drawer channel: a child drawer tells its parent (or an app-level
   * DitherDrawerIndent) to push back while it is open. */
  export type DrawerChannel = { notify: (delta: number) => void }
  const DRAWER_KEY = Symbol("dither-drawer")
  export function setDrawerChannel(ch: DrawerChannel): void {
    setContext(DRAWER_KEY, ch)
  }
  export function useDrawerChannel(): DrawerChannel | null {
    return getContext<DrawerChannel>(DRAWER_KEY) ?? null
  }

  /** Snap points: 0..1 = fraction of viewport height, >1 = px. */
  const resolveSnap = (s: number) => (s <= 1 ? s * window.innerHeight : s)
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { fade } from "svelte/transition"
  import { project, rubberband, velocityFrom, type VelocitySample } from "./gesture"
  import { pixelPrefersReducedMotion } from "./pixel"
  import { cn } from "./lib"
  import { portal } from "./portal"

  type Props = {
    open: boolean
    side?: DrawerSide
    title?: string
    /** Swipe-to-dismiss gesture on the panel. */
    swipe?: boolean
    /** Bottom sheets only: preset visible heights (0..1 viewport fraction, >1 px). */
    snapPoints?: number[]
    /** Active snap point (bindable). Defaults to the first. */
    snapPoint?: number
    /** false renders no backdrop and leaves the page interactive. */
    modal?: boolean
    /** false keeps the drawer open on backdrop clicks (Escape still closes). */
    dismissible?: boolean
    onclose?: () => void
    children?: Snippet
  }

  let {
    open,
    side = "right",
    title,
    swipe = true,
    snapPoints,
    snapPoint = $bindable(),
    modal = true,
    dismissible = true,
    onclose,
    children,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()

  let closeEl = $state<HTMLButtonElement | null>(null)
  let panelEl = $state<HTMLElement | null>(null)

  // --- nesting: push this drawer back while a child drawer is open ------------
  const parent = useDrawerChannel()
  let childOpen = $state(0)
  setDrawerChannel({ notify: (d) => (childOpen += d) })

  // --- snap points (bottom sheets) ---------------------------------------------
  const hasSnaps = $derived(side === "bottom" && !!snapPoints && snapPoints.length > 0)
  const activeSnap = $derived(snapPoint ?? snapPoints?.[0] ?? 1)
  const maxSnapPx = $derived(hasSnaps ? Math.max(...snapPoints!.map(resolveSnap)) : 0)
  const activeSnapPx = $derived(hasSnaps ? resolveSnap(activeSnap) : 0)
  /** Resting translate for the current snap: hide everything below it. */
  const snapBase = $derived(hasSnaps ? maxSnapPx - activeSnapPx : 0)

  function setSnap(s: number) {
    snapPoint = s
  }

  // --- swipe: 1:1 tracking, rubber-band, momentum projection -------------------
  const axis = $derived<"x" | "y">(side === "bottom" ? "y" : "x")
  const dismissSign = $derived(side === "left" ? -1 : 1)
  let dragging = $state(false)
  let offset = $state(0) // px toward dismissal (negative = upward / rubber-banded)
  let settleMs = $state(200)
  let start = 0
  let size = 320
  let samples: VelocitySample[] = []

  const posOf = (e: PointerEvent) => (axis === "y" ? e.clientY : e.clientX)

  function onDown(e: PointerEvent) {
    if (!swipe || childOpen > 0) return
    const t = e.target as HTMLElement
    if (t.closest("button, a, input, textarea, select, [data-no-swipe]")) return
    const panel = panelEl
    if (!panel) return
    dragging = true
    start = posOf(e)
    size = axis === "y" ? panel.offsetHeight : panel.offsetWidth
    samples = [{ t: e.timeStamp, p: posOf(e) }]
    panel.setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (!dragging) return
    samples.push({ t: e.timeStamp, p: posOf(e) })
    if (samples.length > 6) samples.shift()
    const d = (posOf(e) - start) * dismissSign
    if (hasSnaps) {
      // Upward headroom until the largest snap, rubber-band past it.
      const headroom = snapBase
      offset = d >= -headroom ? d : -headroom - rubberband(-d - headroom, size)
    } else {
      offset = d >= 0 ? d : -rubberband(-d, size)
    }
  }
  function onUp() {
    if (!dragging) return
    dragging = false
    const v = velocityFrom(samples) * dismissSign
    // A hard flick settles faster — scale the release duration by swipe strength.
    settleMs = Math.round(200 * Math.min(1, Math.max(0.3, 1 - Math.abs(v) / 3000)))
    const projected = offset + project(v)

    if (hasSnaps) {
      // Projected visible height picks the snap; below half the smallest = dismiss.
      const projectedVisible = activeSnapPx - projected
      const snaps = snapPoints!
      const smallest = Math.min(...snaps.map(resolveSnap))
      if (projectedVisible < smallest * 0.5) {
        dismiss()
        return
      }
      const nearest = snaps.reduce((a, b) =>
        Math.abs(resolveSnap(b) - projectedVisible) < Math.abs(resolveSnap(a) - projectedVisible)
          ? b
          : a
      )
      setSnap(nearest)
      offset = 0
      return
    }

    // Velocity sign decides on a flick; projection decides on a slow drag.
    if (offset > 0 && (v > 500 || (projected > size * 0.5 && v > -100))) {
      dismiss()
    } else {
      offset = 0
    }
  }
  function dismiss() {
    if (rm) {
      offset = 0
      onclose?.()
      return
    }
    offset = size * 1.05
    window.setTimeout(() => {
      onclose?.()
      offset = 0
    }, settleMs)
  }

  /** 0..1 how far the drawer has been swiped toward dismissal. */
  const progress = $derived.by(() => {
    const travelled = snapBase + offset
    const total = hasSnaps ? maxSnapPx : size
    return Math.min(1, Math.max(0, travelled / total))
  })

  // Dynamic panel styling. The swipe/snap offset rides the CSS `translate` and
  // `scale` properties so it composes with the enter/leave `transform` slide
  // instead of fighting it.
  const dyn = $derived.by(() => {
    if (childOpen > 0) {
      const translate = side === "bottom" ? "0 10px" : `${12 * dismissSign}px 0`
      return {
        translate,
        scale: "0.97",
        filter: "brightness(0.75)",
        height: undefined as string | undefined,
        duration: undefined as string | undefined,
      }
    }
    const delta = snapBase + offset
    let translate: string | undefined
    if (delta !== 0) translate = axis === "y" ? `0 ${delta}px` : `${offset * dismissSign}px 0`
    return {
      translate,
      scale: undefined as string | undefined,
      filter: undefined as string | undefined,
      height: hasSnaps ? `${maxSnapPx}px` : undefined,
      duration: `${settleMs}ms`,
    }
  })

  function slideDrawer(_node: HTMLElement, opts: { side: DrawerSide }) {
    const axisT = opts.side === "bottom" ? "Y" : "X"
    const sign = opts.side === "left" ? -1 : 1
    return {
      duration: rm ? 0 : 200,
      css: (_t: number, u: number) => `transform: translate${axisT}(${sign * u * 100}%)`,
    }
  }

  // Panel mount = open, destroy = close. Replaces Vue's focus + parent-notify
  // watches: focus the close button on open (modal only), and balance the parent
  // push channel across open/close/unmount.
  function drawerPanel(_node: HTMLElement) {
    if (modal) requestAnimationFrame(() => closeEl?.focus())
    parent?.notify(1)
    return {
      destroy() {
        parent?.notify(-1)
      },
    }
  }

  function onPanelKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      onclose?.()
    }
  }
</script>

<div use:portal>
  {#if open && modal}
    <div
      aria-hidden="true"
      class="fixed inset-0 z-50 bg-black/60"
      style:opacity={dragging || offset > 0 ? 1 - progress : undefined}
      transition:fade={{ duration: rm ? 0 : 200 }}
      onclick={() => dismissible && onclose?.()}
    ></div>
  {/if}
  {#if open}
    <div
      bind:this={panelEl}
      use:drawerPanel
      role="dialog"
      tabindex="-1"
      aria-modal={modal ? "true" : undefined}
      aria-label={title}
      class={cn(
        "fixed z-50 flex flex-col border-border bg-card p-4",
        side === "bottom" ? "inset-x-0 bottom-0 rounded-t-xl border-t" : "inset-y-0 w-80 max-w-[85vw]",
        side === "bottom" && !hasSnaps ? "max-h-[85vh]" : "",
        side === "right" ? "right-0 border-l" : side === "left" ? "left-0 border-r" : "",
        dragging ? "select-none" : "transition-[translate,scale,filter] motion-reduce:transition-none",
        swipe && side !== "bottom" ? "touch-pan-y" : ""
      )}
      style:translate={dyn.translate}
      style:scale={dyn.scale}
      style:filter={dyn.filter}
      style:height={dyn.height}
      style:transition-duration={dyn.duration}
      transition:slideDrawer={{ side }}
      onkeydown={onPanelKeydown}
      onpointerdown={onDown}
      onpointermove={onMove}
      onpointerup={onUp}
      onpointercancel={onUp}
    >
      {#if side === "bottom"}
        <div
          aria-hidden="true"
          class="mx-auto mb-3 h-1 w-10 shrink-0 touch-none rounded-full bg-border"
        ></div>
      {/if}
      <div class="flex touch-none items-center justify-between gap-2 pb-3">
        <span class="text-sm font-medium">{title}</span>
        <button
          bind:this={closeEl}
          type="button"
          class="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none"
          aria-label="Close"
          onclick={() => onclose?.()}
        >
          ×
        </button>
      </div>
      <div
        class="min-h-0 flex-1 overflow-y-auto"
        data-no-swipe={side === "bottom" ? true : undefined}
      >
        {@render children?.()}
      </div>
    </div>
  {/if}
</div>
