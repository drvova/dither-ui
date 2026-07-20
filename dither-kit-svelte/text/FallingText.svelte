<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
  }

  let { text = "Falling text", stagger = 45, duration = 700, replayToken, class: className }: Props = $props()

  const chars = $derived([...text])
  const runKey = $derived(`${text}-${replayToken ?? 0}`)
</script>

{#key runKey}
  <span class={cn("inline-block", className)} aria-label={text}>
    {#each chars as ch, i (i)}
      <span
        aria-hidden="true"
        class="dither-fall-char"
        style:animation-delay={`${i * stagger}ms`}
        style:animation-duration={`${duration}ms`}
      >{ch === " " ? "\u00a0" : ch}</span>
    {/each}
  </span>
{/key}

<style>
  .dither-fall-char {
    display: inline-block;
    white-space: pre;
    animation: dither-fall cubic-bezier(0.3, 1.4, 0.5, 1) both;
    will-change: transform, opacity;
  }
  @keyframes dither-fall {
    0% {
      opacity: 0;
      transform: translateY(-0.9em) rotate(-9deg);
    }
    60% {
      opacity: 1;
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-fall-char {
      animation: none;
    }
  }
</style>
