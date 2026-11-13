// Generated from ../solid/MultiSelect.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", flexWrap: "wrap", gap: "0.375rem" },
  row2: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "12px",
  },
  button: {
    borderRadius: "0.25rem",
    padding: "0.125rem",
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
  },
  input: { minHeight: "2rem", paddingBlock: "0.25rem" },
  ul: { display: "grid", maxHeight: "11rem", gap: "0.125rem", overflow: "auto" },
  li: {
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  input2: { width: "0.875rem", height: "0.875rem", accentColor: "currentColor" },
  grid: {
    display: "grid",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  label: {
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
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
})

/** Multi-select as chips + a filterable option list: native checkboxes carry
 * semantics (keyboard for free), the query narrows the pool, selected chips
 * stay visible and individually removable. `value` is the picked set. */
export type MultiSelectProps = {
  options?: string[]
  value?: string[]
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string[]) => void
  onSearch?: (query: string) => void
}

export default function MultiSelect(raw: MultiSelectProps) {
  const props = mergeProps({ placeholder: "Search…", disabled: false }, raw)

  const [query, setQuery] = createSignal("")

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    const pool = props.options ?? []
    return q === "" ? pool : pool.filter((o) => o.toLowerCase().includes(q))
  })
  const selected = createMemo(() => props.value ?? [])

  function isChecked(option: string): boolean {
    return selected().includes(option)
  }

  function toggle(option: string, checked: boolean) {
    const next = checked ? [...selected(), option] : selected().filter((o) => o !== option)
    props.onUpdateModelValue?.(next)
  }

  function remove(option: string) {
    props.onUpdateModelValue?.(selected().filter((o) => o !== option))
  }

  return (
    <div class={cn(styles.grid, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}>
      <Show when={selected().length > 0}>
        <div {...stylex.props(styles.row)}>
          <For each={selected()}>
            {(option) => (
              <span {...stylex.props(styles.row2)}>
                {option}
                <button
                  type="button"
                  aria-label={`Remove ${option}`}
                  {...stylex.props(styles.button)}
                  onClick={() => remove(option)}
                >
                  <Icon name="Close" size={10} />
                </button>
              </span>
            )}
          </For>
        </div>
      </Show>

      <DitherInput
        modelValue={query()}
        type="search"
        placeholder={props.placeholder}
        disabled={props.disabled}
        xstyle={styles.input}
        onUpdateModelValue={(v) => {
          setQuery(v)
          props.onSearch?.(v)
        }}
      />

      <ul {...stylex.props(styles.ul)}>
        <Show when={filtered().length === 0}>
          <li {...stylex.props(styles.li)}>No matches</li>
        </Show>
        <For each={filtered()}>
          {(option) => (
            <li>
              <label class={cn(styles.label, isChecked(option) ? styles.textForeground : styles.textMutedForeground)}>
                <input
                  type="checkbox"
                  {...stylex.props(styles.input2)}
                  checked={isChecked(option)}
                  disabled={props.disabled}
                  onChange={(e) => toggle(option, e.currentTarget.checked)}
                />
                {option}
              </label>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
