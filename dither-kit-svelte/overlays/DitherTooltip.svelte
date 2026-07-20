<script lang="ts">
  import type { Snippet } from "svelte"
  import { onDestroy } from "svelte"
  import { fade } from "svelte/transition"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = { text: string; delay?: number; children?: Snippet }
  let { text, delay = 300, children }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  let shown = $state(false)
  let timer = 0

  function show() {
    clearTimeout(timer)
    timer = window.setTimeout(() => {
      shown = true
    }, delay)
  }
  function hide() {
    clearTimeout(timer)
    shown = false
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") hide()
  }
  onDestroy(() => clearTimeout(timer))
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (hover/focus wrapper for the trigger; tooltip content carries role="tooltip") -->
<span
  class="relative inline-block"
  onpointerenter={show}
  onpointerleave={hide}
  onfocusin={show}
  onfocusout={hide}
  onkeydown={onKeydown}
>
  {@render children?.()}
  {#if shown}
    <span
      role="tooltip"
      class="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 rounded border border-border bg-card px-2 py-1 text-[11px] whitespace-nowrap text-foreground"
      transition:fade={{ duration: rm ? 0 : 140 }}
    >
      {text}
    </span>
  {/if}
</span>
