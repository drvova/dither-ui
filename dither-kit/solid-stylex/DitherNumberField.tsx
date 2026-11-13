// Generated from ../solid/DitherNumberField.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, mergeProps, on, onMount } from "solid-js"
import { CONTROL, CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  button: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--card)" } },
  },
  input: { width: "5rem", textAlign: "center", fontVariantNumeric: "   tabular-nums " },
})

export type DitherNumberFieldProps = {
  modelValue: number
  onUpdateModelValue?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  /** The input's accessible name. */
  label?: string
}

export default function DitherNumberField(raw: DitherNumberFieldProps) {
  const props = mergeProps({ step: 1, disabled: false }, raw)

  const [text, setText] = createSignal(String(props.modelValue))
  onMount(() => {
    createEffect(
      on(
        () => props.modelValue,
        (v) => setText(String(v)),
        { defer: true },
      ),
    )
  })

  const atMin = createMemo(() => props.min !== undefined && props.modelValue <= props.min)
  const atMax = createMemo(() => props.max !== undefined && props.modelValue >= props.max)

  function clampStep(raw: number): number {
    const base = props.min ?? 0
    let v = base + Math.round((raw - base) / props.step) * props.step
    if (props.min !== undefined) v = Math.max(props.min, v)
    if (props.max !== undefined) v = Math.min(props.max, v)
    return v
  }

  function set(raw: number) {
    const next = clampStep(raw)
    props.onUpdateModelValue?.(next)
    setText(String(next))
  }

  function onBlur() {
    const parsed = Number.parseFloat(text())
    if (Number.isNaN(parsed)) {
      setText(String(props.modelValue))
      return
    }
    set(parsed)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "ArrowUp") {
      event.preventDefault()
      set(props.modelValue + props.step)
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      set(props.modelValue - props.step)
    }
  }

  return (
    <div {...stylex.props(styles.row)}>
      <button
        type="button"
        aria-label="Decrease"
        disabled={props.disabled || atMin()}
        class={cn(CONTROL_BUTTON, styles.button)}
        onClick={() => set(props.modelValue - props.step)}
      >
        -
      </button>
      <input
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
        type="text"
        inputmode="numeric"
        role="spinbutton"
        aria-label={props.label}
        aria-valuenow={props.modelValue}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        disabled={props.disabled}
        class={cn(CONTROL, styles.input)}
        onBlur={onBlur}
        onKeyDown={onKeydown}
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={props.disabled || atMax()}
        class={cn(CONTROL_BUTTON, styles.button)}
        onClick={() => set(props.modelValue + props.step)}
      >
        +
      </button>
    </div>
  )
}
