import { createMemo, mergeProps, onCleanup } from "solid-js"
import { cn } from "../tailwind/lib"
import { sliderKeys } from "../engine/keys"

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
    const next = sliderKeys(e, { value: props.modelValue, step: props.step, min: props.min, max: props.max })
    if (next !== null) props.onUpdateModelValue?.(clampSnap(next))
  }

  return (
    <div class={cn("grid justify-items-center gap-1.5", props.class)}>
      <div
        role="slider"
        tabindex="0"
        aria-label={props.label}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        aria-valuenow={props.modelValue}
        aria-disabled={props.disabled || undefined}
        style={{ width: `${props.size}px`, height: `${props.size}px` }}
        class={cn(
          "relative cursor-ns-resize touch-none rounded-full border border-border bg-card/80 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
          props.disabled && "pointer-events-none opacity-40",
        )}
        onPointerDown={(e) => {
          e.preventDefault()
          onPointerDown(e)
        }}
        onKeyDown={onKeydown}
      >
        {/* track arc marker */}
        <span
          class="absolute left-1/2 top-1/2 block h-[calc(50%-4px)] w-0.5 origin-bottom -translate-x-1/2 rounded-full bg-accent"
          style={{ transform: `translate(-50%, -100%) rotate(${angle()}deg)`, "transform-origin": "bottom center" }}
        />
        <span class="absolute inset-1.5 rounded-full border border-border/60 bg-background/60" />
      </div>
      <span class="text-[11px] tabular-nums text-muted-foreground">{props.modelValue}</span>
    </div>
  )
}
