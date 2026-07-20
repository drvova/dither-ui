<script lang="ts">
  import { onMount } from "svelte"
  import { cn } from "./lib"
  import { pixelPrefersReducedMotion } from "./pixel"

  type Props = {
    text?: string
    interval?: number
    blur?: number
    class?: string
  }

  let { text = "True focus mode", interval = 1400, blur = 5, class: className }: Props = $props()

  const words = $derived(text.split(/\s+/).filter(Boolean))
  let active = $state(0)

  onMount(() => {
    if (pixelPrefersReducedMotion() || words.length < 2) return
    const timer = window.setInterval(() => {
      active = (active + 1) % words.length
    }, Math.max(300, interval))
    return () => clearInterval(timer)
  })
</script>

<span class={cn("inline-flex flex-wrap gap-x-[0.35em] gap-y-1", className)} aria-label={text}>
  {#each words as w, i (i)}
    <span
      aria-hidden="true"
      class="dither-focus-word inline-block transition-[filter,opacity] duration-500"
      style:filter={i === active ? "blur(0)" : `blur(${blur}px)`}
      style:opacity={i === active ? 1 : 0.5}>{w}</span>
  {/each}
</span>
