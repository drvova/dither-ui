<script lang="ts" module>
  let counter = 0
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import { useSidebar } from "./DitherSidebar.svelte"
  import { cn } from "./lib"

  /** Collapsible sub-menu: a parent row plus indented children behind a rail.
   * On the icon rail only the parent icon remains (children need the width). */
  type Props = {
    label: string
    /** Open state (bindable). */
    open?: boolean
    icon?: Snippet
    children?: Snippet
  }
  let { label, open = $bindable(false), icon, children }: Props = $props()

  const sidebar = useSidebar()
  const id = `dk-sidebar-sub-${counter++}`
</script>

<div>
  <button
    type="button"
    aria-expanded={open}
    aria-controls={id}
    title={sidebar.collapsed ? label : undefined}
    class={cn(
      "flex w-full items-center rounded-md text-left font-mono text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground",
      sidebar.compact ? "h-7 gap-2 px-2 text-[11px]" : "h-8 gap-2.5 px-2.5 text-[12px]"
    )}
    onclick={() => (open = !open)}
  >
    <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
      {#if icon}{@render icon()}{:else}<span class="size-1.5 rounded-[1px] bg-current opacity-70"></span>{/if}
    </span>
    {#if !sidebar.collapsed}<span class="min-w-0 flex-1 truncate">{label}</span>{/if}
    {#if !sidebar.collapsed}
      <span
        aria-hidden="true"
        class={cn(
          "text-[11px] transition-transform duration-200 motion-reduce:transition-none",
          open ? "rotate-90" : ""
        )}>›</span
      >
    {/if}
  </button>
  {#if !sidebar.collapsed}
    <div
      {id}
      class={cn(
        "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div class="overflow-hidden" inert={!open}>
        <div class="ml-4.5 grid gap-0.5 border-l border-border/60 py-0.5 pl-1.5">
          {@render children?.()}
        </div>
      </div>
    </div>
  {/if}
</div>
