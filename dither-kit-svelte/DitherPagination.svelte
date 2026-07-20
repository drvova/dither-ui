<script lang="ts" module>
  /** Compact page list with ellipsis anchors — always shows first, last, the
   * current page and `siblings` on each side, collapsing the rest to "…". */
  export function pageList(page: number, total: number, siblings = 1): (number | "…")[] {
    const range = (s: number, e: number) => Array.from({ length: e - s + 1 }, (_, i) => s + i)
    const slots = siblings * 2 + 5
    if (total <= slots) return range(1, total)
    const left = Math.max(page - siblings, 1)
    const right = Math.min(page + siblings, total)
    const leftDots = left > 2
    const rightDots = right < total - 1
    if (!leftDots && rightDots) return [...range(1, 3 + siblings * 2), "…", total]
    if (leftDots && !rightDots) return [1, "…", ...range(total - (2 + siblings * 2), total)]
    return [1, "…", ...range(left, right), "…", total]
  }
</script>

<script lang="ts">
  import { cn } from "./lib"

  type Props = {
    page: number
    total: number
    siblings?: number
    class?: string
  }

  let { page = $bindable(), total, siblings = 1, class: className }: Props = $props()

  const pages = $derived(pageList(page, total, siblings))
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), total)
    if (next !== page) page = next
  }

  const cellBase =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] tabular-nums transition-colors"
</script>

<nav aria-label="Pagination" class={cn("flex items-center gap-1", className)}>
  <button
    type="button"
    class={cn(cellBase, "border-border text-muted-foreground hover:text-foreground disabled:opacity-40")}
    disabled={page <= 1}
    aria-label="Previous page"
    onclick={() => go(page - 1)}
  >
    ‹
  </button>
  {#each pages as p, i (i)}
    {#if p === "…"}
      <span
        aria-hidden="true"
        class="inline-flex h-8 min-w-8 items-center justify-center text-[12px] text-muted-foreground/50"
        >…</span
      >
    {:else}
      <button
        type="button"
        class={cn(
          cellBase,
          p === page
            ? "border-foreground/30 bg-card text-foreground"
            : "border-border text-muted-foreground hover:text-foreground"
        )}
        aria-current={p === page ? "page" : undefined}
        aria-label={`Page ${p}`}
        onclick={() => go(p as number)}
      >
        {p}
      </button>
    {/if}
  {/each}
  <button
    type="button"
    class={cn(cellBase, "border-border text-muted-foreground hover:text-foreground disabled:opacity-40")}
    disabled={page >= total}
    aria-label="Next page"
    onclick={() => go(page + 1)}
  >
    ›
  </button>
</nav>
