<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    duration?: number
    size?: number
    class?: string
  }

  let { text = "DITHER \u00b7 UI \u00b7 TOOLKIT \u00b7 ", duration = 12, size = 170, class: className }: Props =
    $props()

  const uid = `dither-circle-${Math.floor(Math.random() * 1e9)}`
  const R = 40
  // Full circle as two arcs, drawn clockwise from the left point.
  const d = `M 50 50 m -${R} 0 a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 -${R * 2} 0`
</script>

<div
  class={cn("inline-grid place-items-center", className)}
  style:width="{size}px"
  style:height="{size}px"
  aria-label={text}
>
  <svg
    viewBox="0 0 100 100"
    class="dither-circular-svg h-full w-full"
    style:animation-duration="{duration}s"
    aria-hidden="true"
  >
    <defs>
      <path id={uid} {d} fill="none" />
    </defs>
    <text class="dither-circular-text">
      <textPath href="#{uid}" startOffset="0">{text}</textPath>
    </text>
  </svg>
</div>

<style>
  .dither-circular-svg {
    animation: dither-spin linear infinite;
    transform-origin: center;
  }
  @keyframes dither-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .dither-circular-text {
    fill: currentColor;
    font-size: 7px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-circular-svg {
      animation: none;
    }
  }
</style>
