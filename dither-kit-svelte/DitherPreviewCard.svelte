<script lang="ts">
  import type { Snippet } from "svelte"
  import { onDestroy } from "svelte"
  import { fly } from "svelte/transition"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = { delay?: number; trigger?: Snippet; children?: Snippet }
  let { delay = 400, trigger, children }: Props = $props()

  const rm = pixelPrefersReducedMotion()
  let shown = $state(false)
  let openTimer = 0
  let closeTimer = 0

  function show() {
    clearTimeout(closeTimer)
    clearTimeout(openTimer)
    openTimer = window.setTimeout(() => {
      shown = true
    }, delay)
  }
  function hide() {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
    // small close-delay so moving the pointer into the card keeps it open
    closeTimer = window.setTimeout(() => {
      shown = false
    }, 100)
  }
  function keepOpen() {
    clearTimeout(closeTimer)
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      clearTimeout(openTimer)
      clearTimeout(closeTimer)
      shown = false
    }
  }
  onDestroy(() => {
    clearTimeout(openTimer)
    clearTimeout(closeTimer)
  })
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (keyboard/hover wrapper; the trigger and card content carry the semantics) -->
<span class="relative inline-block" onkeydown={onKeydown}>
  <!-- svelte-ignore a11y_no_static_element_interactions (hover/focus wrapper around the trigger snippet) -->
  <span
    class="inline-block"
    onpointerenter={show}
    onpointerleave={hide}
    onfocusin={show}
    onfocusout={hide}
  >
    {@render trigger?.()}
  </span>
  {#if shown}
    <!-- svelte-ignore a11y_no_static_element_interactions (pointer keep-open region for the hover card) -->
    <div
      class="absolute bottom-full left-1/2 z-30 mb-1.5 w-64 -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      transition:fly={{ y: 2, duration: rm ? 0 : 140 }}
      onpointerenter={keepOpen}
      onpointerleave={hide}
    >
      {@render children?.()}
    </div>
  {/if}
</span>
