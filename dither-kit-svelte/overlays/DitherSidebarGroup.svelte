<script lang="ts">
  import type { Snippet } from "svelte"
  import { useSidebar } from "./DitherSidebar.svelte"

  /** Labelled cluster of sidebar items. On the icon rail the label folds into
   * a hairline separator so the grouping survives the collapse. */
  type Props = { label?: string; children?: Snippet }
  let { label, children }: Props = $props()

  const sidebar = useSidebar()
</script>

<div class="mt-4 first:mt-0" role="group" aria-label={label}>
  {#if label && !sidebar.collapsed}
    <div class="px-2.5 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
      {label}
    </div>
  {:else if label && sidebar.collapsed}
    <div aria-hidden="true" class="mx-2.5 mb-1.5 h-px bg-border/60"></div>
  {/if}
  <div class="grid gap-0.5">
    {@render children?.()}
  </div>
</div>
