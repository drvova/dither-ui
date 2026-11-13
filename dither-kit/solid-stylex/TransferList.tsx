// Generated from ../solid/TransferList.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  p: {
    marginBottom: "0.25rem",
    fontSize: "11px",
    letterSpacing: "0.05em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  li: {
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  input: { width: "0.875rem", height: "0.875rem", accentColor: "currentColor" },
  row: {
    display: "flex",
    flexDirection: { default: "row", "@media (width >= 40rem)": "column" },
    justifyContent: { default: "center", "@media (width >= 40rem)": "center" },
    gap: "0.375rem",
  },
  grid: {
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: { default: null, "@media (width >= 40rem)": "1fr auto 1fr" },
  },
  panelClass: {
    display: "grid",
    minHeight: "8rem",
    alignContent: "flex-start",
    gap: "0.125rem",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.25rem",
  },
  rowClass: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "13px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  btnClass: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 40%, transparent)",
      },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
})

export type TransferListProps = {
  source?: string[]
  value?: string[]
  onUpdateModelValue?: (value: string[]) => void
  disabled?: boolean
  sourceLabel?: string
  targetLabel?: string
  class?: string
  xstyle?: StyleProp
}

const panelClass = styles.panelClass
const rowClass = styles.rowClass
const btnClass = styles.btnClass

/** Two-panel transfer shuttle: the source pool stays put, the destination IS
 * the model. Native checkboxes select in both directions, Add/Remove move the
 * selection, Add all/Remove all flush. Everything keyboard-reachable. */
export default function TransferList(raw: TransferListProps) {
  const props = mergeProps(
    { source: [] as string[], sourceLabel: "Available", targetLabel: "Selected", disabled: false },
    raw,
  )

  const [sourceSel, setSourceSel] = createSignal<Set<string>>(new Set())
  const [targetSel, setTargetSel] = createSignal<Set<string>>(new Set())

  const target = createMemo(() => props.value ?? [])
  const available = createMemo(() => props.source.filter((s) => !target().includes(s)))

  function toggle(side: "source" | "target", item: string, checked: boolean) {
    const [held, setHeld] = side === "source" ? [sourceSel, setSourceSel] : [targetSel, setTargetSel]
    const next = new Set(held())
    if (checked) next.add(item)
    else next.delete(item)
    setHeld(next)
  }

  function add() {
    props.onUpdateModelValue?.([...target(), ...sourceSel()])
    setSourceSel(new Set<string>())
  }
  function remove() {
    props.onUpdateModelValue?.(target().filter((t) => !targetSel().has(t)))
    setTargetSel(new Set<string>())
  }
  function addAll() {
    props.onUpdateModelValue?.([...target(), ...available()])
    setSourceSel(new Set<string>())
  }
  function removeAll() {
    props.onUpdateModelValue?.([])
    setTargetSel(new Set<string>())
  }

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      <div>
        <p {...stylex.props(styles.p)}>{props.sourceLabel}</p>
        <ul class={cn(panelClass)} aria-disabled={props.disabled || undefined}>
          <Show when={available().length === 0}>
            <li {...stylex.props(styles.li)}>Nothing left</li>
          </Show>
          <For each={available()}>
            {(item) => (
              <li>
                <label class={cn(rowClass)}>
                  <input
                    type="checkbox"
                    {...stylex.props(styles.input)}
                    checked={sourceSel().has(item)}
                    disabled={props.disabled}
                    onChange={(e) => toggle("source", item, e.currentTarget.checked)}
                  />
                  {item}
                </label>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div {...stylex.props(styles.row)}>
        <button type="button" class={cn(btnClass)} disabled={props.disabled || sourceSel().size === 0} onClick={add}>
          Add →
        </button>
        <button type="button" class={cn(btnClass)} disabled={props.disabled || targetSel().size === 0} onClick={remove}>
          ← Remove
        </button>
        <button
          type="button"
          class={cn(btnClass)}
          disabled={props.disabled || available().length === 0}
          onClick={addAll}
        >
          Add all
        </button>
        <button
          type="button"
          class={cn(btnClass)}
          disabled={props.disabled || target().length === 0}
          onClick={removeAll}
        >
          Remove all
        </button>
      </div>

      <div>
        <p {...stylex.props(styles.p)}>{props.targetLabel}</p>
        <ul class={cn(panelClass)} aria-disabled={props.disabled || undefined}>
          <Show when={target().length === 0}>
            <li {...stylex.props(styles.li)}>Empty</li>
          </Show>
          <For each={target()}>
            {(item) => (
              <li>
                <label class={cn(rowClass)}>
                  <input
                    type="checkbox"
                    {...stylex.props(styles.input)}
                    checked={targetSel().has(item)}
                    disabled={props.disabled}
                    onChange={(e) => toggle("target", item, e.currentTarget.checked)}
                  />
                  {item}
                </label>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  )
}
