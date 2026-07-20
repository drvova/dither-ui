<script lang="ts">
  import type { Snippet } from "svelte"
  import { fly } from "svelte/transition"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    open: boolean
    align?: "start" | "center" | "end"
    onclose?: () => void
    trigger?: Snippet
    children?: Snippet
  }
  let { open, align = "start", onclose, trigger, children }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  const ALIGN: Record<string, string> = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }
  let rootEl = $state<HTMLDivElement | null>(null)

  // Always-mounted guards: the opening pointerdown lands while `open` is still
  // false (the trigger flips it on click), so opening never self-closes.
  function onOutside(e: PointerEvent) {
    if (!open) return
    if (rootEl?.contains(e.target as Node)) return
    onclose?.()
  }
  function onKey(e: KeyboardEvent) {
    if (!open) return
    if (e.key === "Escape") onclose?.()
  }

  const flyIn = { y: 2, duration: rm ? 0 : 140 }
</script>

<svelte:window onpointerdown={onOutside} onkeydown={onKey} />

<div bind:this={rootEl} class="relative inline-block">
  {@render trigger?.()}
  {#if open}
    <div
      class={cn(
        "absolute top-full z-30 mt-1.5 min-w-[180px] rounded-lg border border-border bg-card p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]",
        ALIGN[align]
      )}
      transition:fly={flyIn}
    >
      {@render children?.()}
    </div>
  {/if}
</div>
