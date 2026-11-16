import { createEffect, createMemo, createSignal, For, mergeProps, on, Show } from "solid-js"
import { cn } from "../tailwind/lib"

/** Dependent cascade pickers: a path of native selects where each level's
 * options come from the tree under the current path. Changing a parent
 * truncates the deeper segments (the classic cascade rule). The model is the
 * chosen path — one string per level, deeper entries cleared on change. */
interface CascadeNode {
  value: string
  children?: CascadeNode[]
}

export type CascadeSelectProps = {
  /** @docs { value, children? }[] */
  tree?: CascadeNode[]
  /** @docs string[] path (with onUpdateModelValue)
   * @default [] */
  value?: string[]
  /** @docs string[] per level
   * @default Level n */
  placeholders?: string[]
  disabled?: boolean
  class?: string
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
    const extra = cn(props.class)
    return extra ? `flex flex-wrap items-center gap-2 ${extra}` : "flex flex-wrap items-center gap-2"
  }

  return (
    <div class={rootClass()}>
      <For each={depths()}>
        {(depth) => (
          <>
            <select
              value={path()[depth - 1] ?? ""}
              disabled={props.disabled}
              aria-label={props.placeholders[depth - 1] ?? `Level ${depth}`}
              class="min-h-10 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-placeholder hover:border-foreground/25 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
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
              <span aria-hidden="true" class="text-muted-foreground">
                /
              </span>
            </Show>
          </>
        )}
      </For>
    </div>
  )
}
