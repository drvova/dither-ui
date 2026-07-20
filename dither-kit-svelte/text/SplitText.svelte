<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
  }

  let { text = "Split text", stagger = 40, duration = 600, replayToken, class: className }: Props =
    $props()

  const chars = $derived([...text])
  // A key that changes on replay so the enter animation runs again.
  const runKey = $derived(`${text}-${replayToken ?? 0}`)
</script>

{#key runKey}
  <span class={cn("inline-block", className)} aria-label={text}>
    {#each chars as ch, i (i)}
      <span
        aria-hidden="true"
        class="dither-split-char"
        style:animation-delay="{i * stagger}ms"
        style:animation-duration="{duration}ms">{ch === " " ? "\u00a0" : ch}</span>
    {/each}
  </span>
{/key}

<style>
  .dither-split-char {
    display: inline-block;
    animation: dither-split-in cubic-bezier(0.2, 0, 0, 1) both;
    will-change: transform, opacity;
  }
  @keyframes dither-split-in {
    from {
      opacity: 0;
      transform: translateY(0.55em) rotate(6deg);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-split-char {
      animation: none;
    }
  }
</style>
