import { createMemo, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

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

export type DitherPaginationProps = {
  /** @docs number (with onUpdatePage) */
  page: number
  onUpdatePage?: (page: number) => void
  /** @docs number (page count) */
  total: number
  /** @docs number (pages either side) */
  siblings?: number
  class?: string
}

const cellBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[12px] tabular-nums transition-colors"

export default function DitherPagination(raw: DitherPaginationProps) {
  const props = mergeProps({ siblings: 1 }, raw)

  const pages = createMemo(() => pageList(props.page, props.total, props.siblings))
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), props.total)
    if (next !== props.page) props.onUpdatePage?.(next)
  }

  return (
    <nav aria-label="Pagination" class={cn("flex items-center gap-1", props.class)}>
      <button
        type="button"
        class={cn(cellBase, "border-border text-muted-foreground hover:text-foreground disabled:opacity-40")}
        disabled={props.page <= 1}
        aria-label="Previous page"
        onClick={() => go(props.page - 1)}
      >
        ‹
      </button>
      <For each={pages()}>
        {(p) => (
          <Show
            when={p !== "…" && p}
            fallback={
              <span
                aria-hidden="true"
                class="inline-flex h-8 min-w-8 items-center justify-center text-[12px] text-muted-foreground"
              >
                …
              </span>
            }
          >
            {(n) => (
              <button
                type="button"
                class={cn(
                  cellBase,
                  n() === props.page
                    ? "border-foreground/30 bg-card text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                aria-current={n() === props.page ? "page" : undefined}
                aria-label={`Page ${n()}`}
                onClick={() => go(n())}
              >
                {n()}
              </button>
            )}
          </Show>
        )}
      </For>
      <button
        type="button"
        class={cn(cellBase, "border-border text-muted-foreground hover:text-foreground disabled:opacity-40")}
        disabled={props.page >= props.total}
        aria-label="Next page"
        onClick={() => go(props.page + 1)}
      >
        ›
      </button>
    </nav>
  )
}
