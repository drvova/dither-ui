<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "./lib"

  type Props = {
    class?: string
    children?: Snippet
  }

  let { class: className, children }: Props = $props()
</script>

<div class={cn("dk-scroll overflow-auto", className)}>
  {@render children?.()}
</div>

<style>
  /* Honest scrollbars — no canvas, just the house tokens. */
  .dk-scroll {
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .dk-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .dk-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .dk-scroll::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 9999px;
  }
  .dk-scroll::-webkit-scrollbar-thumb:hover {
    background: var(--muted-foreground);
  }
</style>
