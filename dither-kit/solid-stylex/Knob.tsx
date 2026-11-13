// Generated from ../solid/Knob.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, mergeProps, onCleanup } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "calc(1 / 2 * 100%)",
    display: "block",
    height: "calc(50% - 4px)",
    width: "0.125rem",
    transformOrigin: "bottom",
    translate: "calc(calc(1 / 2 * 100%) * -1) 0",
    borderRadius: "calc(infinity * 1px)",
    backgroundColor: "var(--accent)",
  },
  layer2: {
    position: "absolute",
    inset: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
  },
  text: { fontSize: "11px", color: "var(--muted-foreground)", fontVariantNumeric: "   tabular-nums " },
  grid: { display: "grid", justifyItems: "center", gap: "0.375rem" },
  frame: {
    position: "relative",
    cursor: "ns-resize",
    touchAction: "none",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    outlineStyle: "none",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
    pointerEvents: { default: null, ":disabled": "none" },
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

export type KnobProps = {
  modelValue?: number
  onUpdateModelValue?: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: number
  disabled?: boolean
  /** What it sets: its accessible name. */
  label?: string
  class?: string
  xstyle?: StyleProp
}

/** Rotary knob: drag VERTICALLY to change the value (the reliable gesture —
 * angle-following wraps badly at the detent), keyboard arrows/PageUp-Down/
 * Home-End, `role="slider"` semantics. Indicator line rotates across a 270°
 * sweep from -135°. */
export default function Knob(raw: KnobProps) {
  const props = mergeProps({ modelValue: 50, min: 0, max: 100, step: 1, size: 72, disabled: false, label: "Knob" }, raw)

  function clampSnap(next: number): number {
    const snapped = Math.round(next / props.step) * props.step
    return Math.min(props.max, Math.max(props.min, snapped))
  }

  const ratio = createMemo(() => {
    const span = props.max - props.min
    return span === 0 ? 0 : (props.modelValue - props.min) / span
  })
  const angle = createMemo(() => -135 + ratio() * 270)

  let startY = 0
  let startVal = 0
  let dragging = false

  function onPointerDown(e: PointerEvent) {
    if (props.disabled || e.button !== 0) return
    dragging = true
    startY = e.clientY
    startVal = props.modelValue
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", stopDrag)
    window.addEventListener("pointercancel", stopDrag)
  }
  function onPointerMove(e: PointerEvent) {
    if (!dragging) return
    const span = props.max - props.min
    const perPx = span / 160 // full sweep ≈ 160px of drag
    props.onUpdateModelValue?.(clampSnap(startVal + (startY - e.clientY) * perPx))
  }
  function stopDrag() {
    // Nothing to let go of unless a drag began (a server render has no window).
    if (!dragging) return
    dragging = false
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerup", stopDrag)
    window.removeEventListener("pointercancel", stopDrag)
  }
  onCleanup(stopDrag)

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
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      <div
        role="slider"
        tabindex="0"
        aria-label={props.label}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        aria-valuenow={props.modelValue}
        aria-disabled={props.disabled || undefined}
        style={{ width: `${props.size}px`, height: `${props.size}px` }}
        class={cn(styles.frame, props.disabled && styles.pointerEventsNone)}
        onPointerDown={(e) => {
          e.preventDefault()
          onPointerDown(e)
        }}
        onKeyDown={onKeydown}
      >
        {/* track arc marker */}
        <span
          {...stylex.props(styles.layer)}
          style={{ transform: `translate(-50%, -100%) rotate(${angle()}deg)`, "transform-origin": "bottom center" }}
        />
        <span {...stylex.props(styles.layer2)} />
      </div>
      <span {...stylex.props(styles.text)}>{props.modelValue}</span>
    </div>
  )
}
