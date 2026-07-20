<script lang="ts">
  import { cn } from "./lib"

  type Props = {
    text?: string
    stagger?: number
    duration?: number
    replayToken?: number
    class?: string
  }

  let { text = "Shuffle in", stagger = 55, duration = 650, replayToken, class: className }: Props = $props()

  // Deterministic per-character random offset so the shuffle is stable per render.
  function seeded(i: number, salt: number) {
    const s = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
    return s - Math.floor(s)
  }
  const chars = $derived(
    [...text].map((ch, i) => ({
      ch: ch === " " ? "\u00a0" : ch,
      dx: (seeded(i, 1) - 0.5) * 2, // -1..1 em
      dy: (seeded(i, 2) - 0.5) * 1.4,
      rot: (seeded(i, 3) - 0.5) * 40,
    }))
  )
  const runKey = $derived(`${text}-${replayToken ?? 0}`)
</script>

{#key runKey}
  <span class={cn("inline-block", className)} aria-label={text}>
    {#each chars as c, i (i)}
      <span
        aria-hidden="true"
        class="dither-shuffle-char"
        style:animation-delay={`${i * stagger}ms`}
        style:animation-duration={`${duration}ms`}
        style:--dx={`${c.dx}em`}
        style:--dy={`${c.dy}em`}
        style:--rot={`${c.rot}deg`}
      >{c.ch}</span>
    {/each}
  </span>
{/key}

<style>
  .dither-shuffle-char {
    display: inline-block;
    white-space: pre;
    animation: dither-shuffle-in cubic-bezier(0.2, 0.8, 0.2, 1) both;
    will-change: transform, opacity;
  }
  @keyframes dither-shuffle-in {
    from {
      opacity: 0;
      transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-shuffle-char {
      animation: none;
    }
  }
</style>
