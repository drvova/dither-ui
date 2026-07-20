<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  type Props = {
    color?: string
    thickness?: number
    class?: string
    children?: Snippet
  }

  let { color = "#7CFF67", thickness = 1, class: className, children }: Props = $props()

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
    class="pointer-events-none absolute inset-y-0"
    style:left={`${x}px`}
    style:width={`${thickness}px`}
    style:background={color}
    style:opacity={on ? 0.8 : 0}
    aria-hidden="true"
  ></div>
  <div
    class="pointer-events-none absolute inset-x-0"
    style:top={`${y}px`}
    style:height={`${thickness}px`}
    style:background={color}
    style:opacity={on ? 0.8 : 0}
    aria-hidden="true"
  ></div>
</div>
