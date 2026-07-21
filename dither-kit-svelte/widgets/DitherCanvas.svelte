<script lang="ts">
  import type { Snippet } from "svelte"
  import { cn } from "../runtime/lib"

  /** Work-surface backdrop — the dotted or ruled field a dashboard sits on.
   * Pure CSS: the pattern inks with the border token and stays behind content. */
  type Props = {
    pattern?: "dots" | "grid" | "plain"
    /** Pattern pitch in CSS pixels. */
    cell?: number
    class?: string
    children?: Snippet
  }

  let { pattern = "dots", cell = 16, class: className, children }: Props = $props()

  const layer = $derived.by(() => {
    const c = `${cell}px ${cell}px`
    if (pattern === "dots")
      return `background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: ${c};`
    if (pattern === "grid")
      return `background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: ${c};`
    return ""
  })
</script>

<div class={cn("relative min-h-0 overflow-auto bg-background/40", className)}>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 opacity-40" style={layer}></div>
  <div class="relative">
    {@render children?.()}
  </div>
</div>
