<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    speed?: number
    class?: string
  }

  let { text = "GLITCH", speed = 1, class: className }: Props = $props()

  const dur = $derived(`${Math.max(0.3, 2.5 / Math.max(0.01, speed))}s`)
</script>

<span
  class={cn("dither-glitch", className)}
  data-text={text}
  style:--dither-glitch-dur={dur}>{text}</span>

<style>
  .dither-glitch {
    position: relative;
    display: inline-block;
  }
  .dither-glitch::before,
  .dither-glitch::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    pointer-events: none;
    clip-path: inset(0 0 0 0);
  }
  .dither-glitch::before {
    color: #ff2f6a;
    animation: dither-glitch-a var(--dither-glitch-dur) steps(2, jump-none) infinite;
  }
  .dither-glitch::after {
    color: #2fd6ff;
    animation: dither-glitch-b var(--dither-glitch-dur) steps(2, jump-none) infinite;
  }
  @keyframes dither-glitch-a {
    0%, 100% { transform: translate(0); clip-path: inset(0 0 82% 0); }
    20% { transform: translate(-2px, 1px); clip-path: inset(20% 0 40% 0); }
    40% { transform: translate(2px, -1px); clip-path: inset(60% 0 8% 0); }
    60% { transform: translate(-1px, 0); clip-path: inset(35% 0 50% 0); }
    80% { transform: translate(2px, 1px); clip-path: inset(8% 0 70% 0); }
  }
  @keyframes dither-glitch-b {
    0%, 100% { transform: translate(0); clip-path: inset(70% 0 8% 0); }
    20% { transform: translate(2px, -1px); clip-path: inset(50% 0 30% 0); }
    40% { transform: translate(-2px, 1px); clip-path: inset(10% 0 60% 0); }
    60% { transform: translate(1px, 0); clip-path: inset(45% 0 40% 0); }
    80% { transform: translate(-2px, -1px); clip-path: inset(75% 0 5% 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-glitch::before,
    .dither-glitch::after {
      animation: none;
      display: none;
    }
  }
</style>
