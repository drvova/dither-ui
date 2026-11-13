// Generated from ../solid/ScrubInput.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps, onCleanup, onMount, splitProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: { flex: "1", cursor: "ew-resize", textAlign: "right", fontVariantNumeric: "   tabular-nums " },
  button: {
    display: "grid",
    width: "1.75rem",
    flexShrink: "0",
    cursor: "ew-resize",
    touchAction: "none",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
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
  row: { display: "flex", alignItems: "stretch", gap: "0.25rem" },
})

/** Drag-to-scrub numeric field (the Figma-style gesture): the grip is a real
 * `role="slider"` — arrow keys, PageUp/Down and Home/End work without a
 * pointer, and the read-only input stays selectable for copying. Values snap
 * to `step`; float noise is trimmed by the step's own precision. */
type Own = {
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: number) => void
}
const OWN = [
  "modelValue",
  "min",
  "max",
  "step",
  "disabled",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type ScrubInputProps = Own & Omit<DitherInputProps, keyof Own>

export default function ScrubInput(raw: ScrubInputProps) {
  const merged = mergeProps({ modelValue: 0, min: 0, max: 100, step: 1, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const decimals = createMemo(() => {
    const s = String(props.step)
    return s.includes(".") ? s.split(".")[1].length : 0
  })
  const display = createMemo(() =>
    Number.isInteger(props.modelValue) ? String(props.modelValue) : props.modelValue.toFixed(decimals()),
  )
  const ariaValueText = createMemo(() => display())

  function clampSnap(next: number): number {
    const snapped = Math.round(next / props.step) * props.step
    const rounded = Number(snapped.toFixed(decimals()))
    return Math.min(props.max, Math.max(props.min, rounded))
  }

  let startX = 0
  let startVal = 0
  let dragging = false

  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    if (props.disabled || e.button !== 0) return
    dragging = true
    startX = e.clientX
    startVal = props.modelValue
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    props.onUpdateModelValue?.(clampSnap(startVal + (e.clientX - startX) * props.step))
  }
  function onPointerUp() {
    dragging = false
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", onPointerUp)
    window.removeEventListener("pointercancel", onPointerUp)
  }
  onMount(() => onCleanup(onPointerUp))

  function onKeydown(e: KeyboardEvent) {
    if (props.disabled) return
    const big = props.step * 10
    let next: number | null = null
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = props.modelValue - props.step
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") next = props.modelValue + props.step
    else if (e.key === "PageDown") next = props.modelValue - big
    else if (e.key === "PageUp") next = props.modelValue + big
    else if (e.key === "Home") next = props.min
    else if (e.key === "End") next = props.max
    if (next === null) return
    e.preventDefault()
    props.onUpdateModelValue?.(clampSnap(next))
  }

  return (
    <div class={cn(styles.row, props.xstyle, props.class)}>
      <DitherInput {...rest} readonly modelValue={display()} disabled={props.disabled} xstyle={styles.input} />
      <button
        type="button"
        role="slider"
        aria-label="Scrub value"
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        aria-valuenow={props.modelValue}
        aria-valuetext={ariaValueText()}
        aria-disabled={props.disabled}
        disabled={props.disabled}
        {...stylex.props(styles.button)}
        onPointerDown={onPointerDown}
        onKeyDown={onKeydown}
      >
        <Icon name="GripVertical" size={14} />
      </button>
    </div>
  )
}
