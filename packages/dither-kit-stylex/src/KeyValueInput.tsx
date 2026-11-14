// Generated from @dither-ui/kit/solid/KeyValueInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { Index, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: { width: "calc(1 / 3 * 100%)", fontFamily: "var(--font-mono)", fontSize: "12.5px" },
  input2: { flex: "1" },
  button: {
    borderRadius: "0.25rem",
    padding: "0.375rem",
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
  },
  button2: {
    justifySelf: "flex-start",
    borderRadius: "0.25rem",
    borderStyle: "dashed",
    borderWidth: "1px",
    borderColor: {
      default: "color-mix(in oklab, var(--border) 70%, transparent)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 40%, transparent)",
      },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.25rem",
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
  grid: { display: "grid", gap: "0.5rem" },
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  opacity40: { opacity: "40%" },
})

/** Repeatable key/value rows — headers, metadata, query params. Every edit
 * emits the whole array (the parent owns the source of truth); empty rows
 * are the caller's to keep or prune. */
export interface KeyValueRow {
  key: string
  value: string
}

export type KeyValueInputProps = {
  modelValue?: KeyValueRow[]
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: KeyValueRow[]) => void
}

export default function KeyValueInput(raw: KeyValueInputProps) {
  const props = mergeProps({ disabled: false }, raw)

  function clone(): KeyValueRow[] {
    return (props.modelValue ?? []).map((r) => ({ ...r }))
  }

  function updateRow(index: number, field: keyof KeyValueRow, text: string) {
    const next = clone()
    if (!next[index]) return
    next[index][field] = text
    props.onUpdateModelValue?.(next)
  }

  function addRow() {
    props.onUpdateModelValue?.([...clone(), { key: "", value: "" }])
  }

  function removeRow(index: number) {
    props.onUpdateModelValue?.(clone().filter((_, i) => i !== index))
  }

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      {/* By position, as the rows are keyed: a row's fields stay in the page
          (and keep their focus) while its text changes. */}
      <Index each={props.modelValue ?? []}>
        {(row, i) => (
          <div class={cn(styles.row, props.disabled && styles.opacity40)}>
            <DitherInput
              modelValue={row().key}
              placeholder="key"
              disabled={props.disabled}
              xstyle={styles.input}
              onUpdateModelValue={(v) => updateRow(i, "key", v)}
            />
            <DitherInput
              modelValue={row().value}
              placeholder="value"
              disabled={props.disabled}
              xstyle={styles.input2}
              onUpdateModelValue={(v) => updateRow(i, "value", v)}
            />
            <button
              type="button"
              aria-label={`Remove row ${i + 1}`}
              disabled={props.disabled}
              {...stylex.props(styles.button)}
              onClick={() => removeRow(i)}
            >
              <Icon name="Close" size={13} />
            </button>
          </div>
        )}
      </Index>
      <button type="button" disabled={props.disabled} {...stylex.props(styles.button2)} onClick={addRow}>
        + Add row
      </button>
    </div>
  )
}
