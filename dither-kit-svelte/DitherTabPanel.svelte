<script lang="ts">
  import type { Snippet } from "svelte"
  import { useTabs } from "./DitherTabs.svelte"
  import { cn } from "./lib"

  /** The panel half of the tabs pattern — id-linked to its tab, kept mounted
   * (display toggle) so canvas-heavy content does not repaint on every switch. */
  type Props = { value: string; class?: string; children?: Snippet }
  let { value, class: className, children }: Props = $props()

  const ctx = useTabs()
  const active = $derived(ctx?.active === value)
</script>

<div
  style:display={active ? undefined : "none"}
  id={ctx ? `${ctx.idBase}-panel-${value}` : undefined}
  role="tabpanel"
  aria-labelledby={ctx ? `${ctx.idBase}-tab-${value}` : undefined}
  class={cn(className)}
>
  {@render children?.()}
</div>
