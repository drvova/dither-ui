<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"

  type Props = { class?: string; children?: Snippet }

  let { class: className, children }: Props = $props()
</script>

<kbd
  class={cn(
    "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground",
    className
  )}
  style="border-bottom-width: 2px"
>
  {@render children?.()}
</kbd>
