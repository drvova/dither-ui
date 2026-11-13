// Generated from dither-kit/solid/ChoiceChips.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createUniqueId, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    flexBasis: "100%",
    fontSize: "12px",
    fontWeight: "500",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
  input: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  row: { display: "flex", flexWrap: "wrap", gap: "0.375rem" },
  label: {
    cursor: "pointer",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.75rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  borderAccent70: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 15%, transparent)",
    color: "var(--foreground)",
  },
  borderBorder70: {
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 30%, transparent)",
      },
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

export type ChoiceChipsProps = {
  label?: string
  options?: string[]
  /** The choice; `value` is the older name, still read. */
  modelValue?: string | string[]
  value?: string | string[]
  multiple?: boolean
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string | string[]) => void
}

/** Chip-style choice group: the chip is the LABEL of a real radio (or
 * checkbox when `multiple`), so native keyboard semantics and focus come for
 * free — no roving tabindex to get wrong; the radios share one name, so the
 * arrows move between them and the group is one Tab stop. `value` is a
 * string for single and a string array for multiple. `label` names the
 * group: shown on its own line over the chips and tied to it. */
export default function ChoiceChips(raw: ChoiceChipsProps) {
  const props = mergeProps({ options: [] as string[], disabled: false }, raw)
  const base = `dk-chips-${createUniqueId()}`

  const current = createMemo(() => props.modelValue ?? props.value)
  const selected = createMemo(() => {
    const c = current()
    return props.multiple ? (Array.isArray(c) ? c : []) : typeof c === "string" ? c : ""
  })

  function isChecked(option: string): boolean {
    const s = selected()
    return Array.isArray(s) ? s.includes(option) : s === option
  }

  function onChange(option: string, checked: boolean) {
    const s = selected()
    if (Array.isArray(s)) {
      const set = new Set(s)
      if (checked) set.add(option)
      else set.delete(option)
      props.onUpdateModelValue?.([...set])
    } else {
      props.onUpdateModelValue?.(option)
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={props.label ? `${base}-label` : undefined}
      class={cn(styles.row, props.xstyle, props.class)}
      aria-disabled={props.disabled || undefined}
    >
      <Show when={props.label}>
        <span id={`${base}-label`} {...stylex.props(styles.text)}>
          {props.label}
        </span>
      </Show>
      <For each={props.options}>
        {(option) => (
          <label
            class={cn(
              styles.label,
              isChecked(option) ? styles.borderAccent70 : styles.borderBorder70,
              props.disabled && styles.pointerEventsNone,
            )}
          >
            <input
              {...stylex.props(styles.input)}
              type={props.multiple ? "checkbox" : "radio"}
              name={`${base}-choice`}
              value={option}
              checked={isChecked(option)}
              disabled={props.disabled}
              onChange={(e) => onChange(option, e.currentTarget.checked)}
            />
            {option}
          </label>
        )}
      </For>
    </div>
  )
}
