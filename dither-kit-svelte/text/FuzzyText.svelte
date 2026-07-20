<script lang="ts">
  import { cn } from "../runtime/lib"

  type Props = {
    text?: string
    intensity?: number
    class?: string
  }

  let { text = "FUZZY", intensity = 4, class: className }: Props = $props()

  const uid = `dither-fuzz-${Math.floor(Math.random() * 1e9)}`
</script>

<span class={cn("dither-fuzzy relative inline-block", className)} aria-label={text}>
  <!-- SVG turbulence + displacement drives an analog fuzz; native, no canvas -->
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <defs>
      <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.4" numOctaves="2" seed="7" result="n">
          <animate
            attributeName="baseFrequency"
            dur="1.6s"
            values="0.012 0.4;0.02 0.55;0.012 0.4"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale={intensity} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
  <span aria-hidden="true" style:filter={`url(#${uid})`}>{text}</span>
</span>

<style>
  @media (prefers-reduced-motion: reduce) {
    .dither-fuzzy span[aria-hidden] {
      filter: none !important;
    }
  }
</style>
