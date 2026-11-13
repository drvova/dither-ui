// Generated from ../solid/DitherPagination.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    height: "2rem",
    minWidth: "2rem",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  nav: { display: "flex", alignItems: "center", gap: "0.25rem" },
  button: {
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    opacity: { default: null, ":disabled": "40%" },
  },
  borderForeground30: {
    borderColor: "color-mix(in oklab, var(--foreground) 30%, transparent)",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
  },
  borderBorder: {
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  cellBase: {
    display: "inline-flex",
    height: "2rem",
    minWidth: "2rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.5rem",
    fontSize: "12px",
    fontVariantNumeric: "   tabular-nums ",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

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
  page: number
  onUpdatePage?: (page: number) => void
  total: number
  siblings?: number
  class?: string
  xstyle?: StyleProp
}

const cellBase = styles.cellBase

export default function DitherPagination(raw: DitherPaginationProps) {
  const props = mergeProps({ siblings: 1 }, raw)

  const pages = createMemo(() => pageList(props.page, props.total, props.siblings))
  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), props.total)
    if (next !== props.page) props.onUpdatePage?.(next)
  }

  return (
    <nav aria-label="Pagination" class={cn(styles.nav, props.xstyle, props.class)}>
      <button
        type="button"
        class={cn(cellBase, styles.button)}
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
              <span aria-hidden="true" {...stylex.props(styles.row)}>
                …
              </span>
            }
          >
            {(n) => (
              <button
                type="button"
                class={cn(cellBase, n() === props.page ? styles.borderForeground30 : styles.borderBorder)}
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
        class={cn(cellBase, styles.button)}
        disabled={props.page >= props.total}
        aria-label="Next page"
        onClick={() => go(props.page + 1)}
      >
        ›
      </button>
    </nav>
  )
}
