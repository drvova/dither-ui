<script lang="ts">
  import { onDestroy, untrack } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    to: number
    from?: number
    duration?: number
    decimals?: number
    class?: string
  }

  let { to, from = 0, duration = 1500, decimals = 0, class: className }: Props = $props()

  let value = $state(untrack(() => from))
  let raf = 0
  let started = false

  function run() {
    if (started) return
    started = true
    if (pixelPrefersReducedMotion()) {
      value = to
      return
    }
    const t0 = performance.now()
    const d = Math.max(1, duration)
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / d)
      const e = 1 - Math.pow(1 - p, 3)
      value = from + (to - from) * e
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  // Local reveal observer: unlike `inView`, it does not short-circuit on
  // reduced-motion — the count still waits for view, then `run` jumps instantly.
  function observe(node: HTMLElement) {
    if (typeof IntersectionObserver === "undefined") {
      run()
      return {}
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) run()
    })
    io.observe(node)
    return {
      destroy() {
        io.disconnect()
      },
    }
  }

  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  const display = $derived(
    value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
</script>

<span use:observe class={cn("tabular-nums", className)}>{display}</span>
