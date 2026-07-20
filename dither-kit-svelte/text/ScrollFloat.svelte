<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "../runtime/lib"
  import { pixelPrefersReducedMotion } from "../engine/pixel"

  type Props = {
    text?: string
    amount?: number
    class?: string
  }

  let { text = "Scroll float", amount = 1, class: className }: Props = $props()

  const chars = $derived([...text])
  const rm = pixelPrefersReducedMotion()
  let el = $state<HTMLElement | null>(null)
  let progress = $state(rm ? 1 : 0)

  function update() {
    if (rm || !el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    progress = Math.max(0, Math.min(1, 1 - (r.top - vh * 0.2) / (vh * 0.55)))
  }

  onMount(update)
</script>

<svelte:window onscroll={update} onresize={update} />

<span bind:this={el} class={cn("inline-block", className)} aria-label={text}>
  {#each chars as ch, i (i)}
    {@const t = Math.max(0, Math.min(1, progress * chars.length - i * 0.5))}
    <span
      aria-hidden="true"
      class="dither-float-char"
      style:opacity={0.15 + 0.85 * t}
      style:transform="translateY({(1 - t) * 0.7 * amount}em)">{ch === " " ? "\u00a0" : ch}</span>
  {/each}
</span>

<style>
  .dither-float-char {
    display: inline-block;
    white-space: pre;
    transition: opacity 120ms linear, transform 120ms linear;
  }
</style>
