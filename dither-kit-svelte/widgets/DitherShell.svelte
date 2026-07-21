<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  /** App frame: topbar over an aside + content pair, optional statusbar under.
   * Regions render only when their snippet is filled — the grid adapts. */
  type Props = {
    /** true draws the embedded card chrome — border, rounding, clip. */
    frame?: boolean
    class?: string
    topbar?: Snippet
    aside?: Snippet
    statusbar?: Snippet
    children?: Snippet
  }

  let { frame = false, class: className, topbar, aside, statusbar, children }: Props = $props()
</script>

<div
  class={cn(
    "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-background text-foreground",
    frame && "overflow-hidden rounded-lg border border-border/60",
    className
  )}
>
  {#if topbar}
    <header class="flex items-center border-b border-border/60">
      {@render topbar()}
    </header>
  {:else}
    <div aria-hidden="true"></div>
  {/if}
  <div class="grid min-h-0 grid-cols-[auto_minmax(0,1fr)]">
    {@render aside?.()}
    <main class={cn("min-h-0 min-w-0", !aside && "col-span-2")}>
      {@render children?.()}
    </main>
  </div>
  {#if statusbar}
    <footer class="flex items-center border-t border-border/60">
      {@render statusbar()}
    </footer>
  {:else}
    <div aria-hidden="true"></div>
  {/if}
</div>
