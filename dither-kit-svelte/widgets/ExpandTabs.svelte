<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"
  export type ExpandTab = { value: string; label: string; color?: PixelColor }
</script>

<script lang="ts">
  import { cssColor } from "../engine/palette"
  import { cn } from "../runtime/lib"

  /** Icon bar where only the active tab unfolds its label — the rest stay
   * square glyphs. The label slides through a 0fr -> 1fr column, the house
   * grid trick, stilled under reduced motion. */
  type Props = {
    tabs: ExpandTab[]
    /** Active tab value (bindable). */
    value: string
    color?: PixelColor
    class?: string
  }

  let { tabs, value = $bindable(), color = "blue", class: className }: Props = $props()
</script>

<div class={cn("inline-flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1", className)} role="tablist">
  {#each tabs as t (t.value)}
    <button
      type="button"
      role="tab"
      aria-selected={value === t.value}
      class={cn(
        "flex h-8 items-center gap-0 rounded-md px-2.5 font-mono text-[12px] transition-colors",
        value === t.value ? "bg-card text-foreground" : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
      )}
      onclick={() => (value = t.value)}
    >
      <span
        aria-hidden="true"
        class="size-1.5 shrink-0 rounded-[1px]"
        style:background={value === t.value ? cssColor(t.color ?? color) : "currentColor"}
        style:opacity={value === t.value ? "1" : "0.7"}
      ></span>
      <span
        class="grid transition-[grid-template-columns] duration-200 motion-reduce:transition-none"
        style:grid-template-columns={value === t.value ? "1fr" : "0fr"}
      >
        <span class={cn("min-w-0 overflow-hidden whitespace-nowrap", value === t.value && "pl-2")}>{t.label}</span>
      </span>
    </button>
  {/each}
</div>
