<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  /** Dashboard grid — auto-fit card columns by minimum width, or a fixed
   * column count. Children span with plain col-span utilities. */
  type Props = {
    /** Minimum card width; columns auto-fit. Ignored when cols is set. */
    min?: number
    /** Fixed column count — for deliberate layouts. */
    cols?: number
    /** Grid gap, any CSS length. */
    gap?: string
    class?: string
    children?: Snippet
  }

  let { min = 240, cols, gap = "0.75rem", class: className, children }: Props = $props()

  const columns = $derived(
    cols ? `repeat(${cols}, minmax(0, 1fr))` : `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`
  )
</script>

<div class={cn("grid", className)} style:grid-template-columns={columns} style:gap={gap}>
  {@render children?.()}
</div>
