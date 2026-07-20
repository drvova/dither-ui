<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    text?: string
    class?: string
  }

  let { text = "Words reveal as you scroll into view", class: className }: Props = $props()

  const words = $derived(text.split(/(\s+)/))
  const rm = pixelPrefersReducedMotion()
  let el = $state<HTMLElement | null>(null)
  let progress = $state(rm ? 1 : 0)

  function update() {
    if (rm || !el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // 0 when the block sits near the bottom of the viewport, 1 once it has risen
    // through the middle band.
    progress = Math.max(0, Math.min(1, 1 - (r.top - vh * 0.2) / (vh * 0.55)))
  }

  onMount(update)
</script>

<svelte:window onscroll={update} onresize={update} />

<span bind:this={el} class={cn("inline-block", className)} aria-label={text}>
  {#each words as w, i (i)}
    {@const r = Math.max(0.06, Math.min(1, progress * words.length - i))}
    <span
      aria-hidden="true"
      class="dither-reveal-word"
      style:opacity={r}
      style:filter="blur({(1 - r) * 4}px)"
      style:transform="translateY({(1 - r) * 0.3}em)">{w.trim() === "" ? "\u00a0" : w}</span>
  {/each}
</span>

<style>
  .dither-reveal-word {
    display: inline-block;
    white-space: pre;
    transition: opacity 120ms linear, filter 120ms linear, transform 120ms linear;
  }
</style>
