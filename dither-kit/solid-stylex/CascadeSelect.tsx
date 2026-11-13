// Generated from ../solid/CascadeSelect.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, For, mergeProps, on, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  select: {
    minHeight: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  text: { color: "var(--muted-foreground)" },
  flex: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
})

/** Dependent cascade pickers: a path of native selects where each level's
 * options come from the tree under the current path. Changing a parent
 * truncates the deeper segments (the classic cascade rule). The model is the
 * chosen path — one string per level, deeper entries cleared on change. */
interface CascadeNode {
  value: string
  children?: CascadeNode[]
}

export type CascadeSelectProps = {
  tree?: CascadeNode[]
  value?: string[]
  placeholders?: string[]
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string[]) => void
}

export default function CascadeSelect(raw: CascadeSelectProps) {
  const props = mergeProps({ tree: [] as CascadeNode[], placeholders: [] as string[], disabled: false }, raw)

  const [path, setPath] = createSignal<string[]>([...(props.value ?? [])])

  createEffect(
    on(
      () => props.value,
      (v) => {
        setPath([...(v ?? [])])
      },
      { defer: true },
    ),
  )

  function nodesAt(depth: number): CascadeNode[] {
    let level = props.tree
    for (let d = 0; d < depth; d++) {
      const chosen = path()[d]
      const node = level.find((n) => n.value === chosen)
      if (!node?.children) return []
      level = node.children
    }
    return level
  }

  const activeDepth = createMemo(() => {
    let depth = 0
    while (nodesAt(depth).length > 0 && depth < 12) depth++
    return depth
  })
  /** The levels on show, counted from one as the labels count them. */
  const depths = createMemo(() => Array.from({ length: activeDepth() }, (_, i) => i + 1))

  function onChange(depth: number, chosen: string) {
    const next = path().slice(0, depth)
    next[depth] = chosen
    setPath(next)
    props.onUpdateModelValue?.(next)
  }

  const rootClass = () => {
    const extra = cn(props.xstyle, props.class)
    return extra ? [styles.flex, extra] : styles.flex
  }

  return (
    <div class={cn(rootClass())}>
      <For each={depths()}>
        {(depth) => (
          <>
            <select
              value={path()[depth - 1] ?? ""}
              disabled={props.disabled}
              aria-label={props.placeholders[depth - 1] ?? `Level ${depth}`}
              {...stylex.props(styles.select)}
              onChange={(e) => onChange(depth - 1, e.currentTarget.value)}
            >
              <option value="" disabled selected={(path()[depth - 1] ?? "") === ""}>
                {props.placeholders[depth - 1] ?? `Level ${depth}`}
              </option>
              <For each={nodesAt(depth - 1)}>
                {(node) => (
                  <option value={node.value} selected={path()[depth - 1] === node.value}>
                    {node.value}
                  </option>
                )}
              </For>
            </select>
            <Show when={depth < activeDepth()}>
              <span aria-hidden="true" {...stylex.props(styles.text)}>
                /
              </span>
            </Show>
          </>
        )}
      </For>
    </div>
  )
}
