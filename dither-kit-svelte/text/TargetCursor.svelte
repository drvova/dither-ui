<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    color?: string
    size?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", size = 36, class: className, children }: Props = $props()

  let area = $state<HTMLElement | null>(null)
  let x = $state(-99)
  let y = $state(-99)
  let on = $state(false)

  function onMove(e: PointerEvent) {
    const r = area?.getBoundingClientRect()
    if (!r) return
    x = e.clientX - r.left
    y = e.clientY - r.top
    on = true
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (pointer tracking is cosmetic, not a required interaction) -->
<div
  bind:this={area}
  class={cn("relative overflow-hidden", className)}
  onpointermove={onMove}
  onpointerleave={() => (on = false)}
>
  {@render children?.()}
  <div
    class="dither-target pointer-events-none absolute left-0 top-0"
    style:width={`${size}px`}
    style:height={`${size}px`}
    style:transform={`translate(${x}px, ${y}px) translate(-50%, -50%)`}
    style:opacity={on ? 1 : 0}
    style:color={color}
    aria-hidden="true"
  >
    <span class="corner tl"></span>
    <span class="corner tr"></span>
    <span class="corner bl"></span>
    <span class="corner br"></span>
  </div>
</div>

<style>
  .dither-target {
    animation: dither-target-spin 6s linear infinite;
  }
  .corner {
    position: absolute;
    width: 30%;
    height: 30%;
    border: 2px solid currentColor;
  }
  .tl {
    top: 0;
    left: 0;
    border-right: 0;
    border-bottom: 0;
  }
  .tr {
    top: 0;
    right: 0;
    border-left: 0;
    border-bottom: 0;
  }
  .bl {
    bottom: 0;
    left: 0;
    border-right: 0;
    border-top: 0;
  }
  .br {
    bottom: 0;
    right: 0;
    border-left: 0;
    border-top: 0;
  }
  @keyframes dither-target-spin {
    to {
      rotate: 360deg;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dither-target {
      animation: none;
    }
  }
</style>
