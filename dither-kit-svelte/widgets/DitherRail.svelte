<script lang="ts">
  import type { Snippet } from "svelte"
  import { setSidebar } from "../overlays/DitherSidebar.svelte"
  import { cn } from "../runtime/lib"

  /** Permanent icon rail — the whole nav in 56px. Provides the sidebar's
   * collapsed context, so DitherSidebarItem children fold their labels
   * automatically; wrap items in DitherTooltip to carry the labels. */
  type Props = {
    label?: string
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    class?: string
    header?: Snippet
    footer?: Snippet
    children?: Snippet
  }

  let { label = "Rail", side = "left", class: className, header, footer, children }: Props = $props()

  setSidebar({ collapsed: true, compact: false })

  const edge = $derived(side === "right" ? "border-l" : "border-r")
</script>

<aside
  aria-label={label}
  class={cn("flex h-full w-14 shrink-0 flex-col p-2", edge, "border-border/60 bg-background/40", className)}
>
  {@render header?.()}
  <nav class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
    {@render children?.()}
  </nav>
  {@render footer?.()}
</aside>
