// Generated from @dither-ui/kit/solid/SignaturePad.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherButton from "./DitherButton"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: { justifySelf: "flex-start" },
  grid: { display: "grid", gap: "0.5rem" },
  canvas: {
    width: "100%",
    cursor: "crosshair",
    touchAction: "none",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    outlineStyle: "none",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

/** Signature pad: pointer drawing on a canvas, `change` fires the dataURL
 * after every stroke (and on clear). Canvas is sized in markup; the drawing
 * context is checked once at mount — a context-less environment (jsdom) keeps
 * the control honest by refusing strokes instead of throwing. */
export type SignaturePadProps = {
  width?: number
  height?: number
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  onChange?: (value: string) => void
}

/** The button's `size` attribute, as the pad has always rendered it. */
const SIZE = { "attr:size": "sm" }

export default function SignaturePad(raw: SignaturePadProps) {
  const props = mergeProps({ width: 420, height: 160, placeholder: "Sign here", disabled: false }, raw)

  let canvasEl: HTMLCanvasElement | undefined
  let drawing = false
  let hasContext = false

  function emit(value: string) {
    props.onUpdateModelValue?.(value)
    props.onChange?.(value)
  }

  function context(): CanvasRenderingContext2D | null {
    const el = canvasEl
    if (!el) return null
    if (!hasContext) {
      hasContext = el.getContext("2d") !== null
      if (!hasContext) return null
    }
    return el.getContext("2d")
  }

  function localPoint(e: PointerEvent): [number, number] {
    const el = canvasEl
    if (!el) return [0, 0]
    const rect = el.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  function strokeEnd() {
    if (!drawing) return
    drawing = false
    const el = canvasEl
    emit(el ? el.toDataURL("image/png") : "")
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    if (props.disabled || e.button !== 0) return
    const ctx = context()
    if (!ctx) return
    drawing = true
    const [x, y] = localPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 0.01, y) // a dot for a single-tap stroke
    ctx.strokeStyle = "currentColor"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing) return
    const ctx = context()
    if (!ctx) return
    const [x, y] = localPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function clear() {
    const el = canvasEl
    const ctx = context()
    if (el && ctx) ctx.clearRect(0, 0, el.width, el.height)
    emit("")
  }

  return (
    <div class={cn(styles.grid, props.xstyle, props.class)}>
      <canvas
        ref={(el) => (canvasEl = el)}
        width={props.width}
        height={props.height}
        aria-label={props.placeholder}
        role="img"
        class={cn([styles.canvas, props.disabled && styles.pointerEventsNone])}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={strokeEnd}
        onPointerLeave={strokeEnd}
        onPointerCancel={strokeEnd}
      />
      <DitherButton variant="solid" {...SIZE} xstyle={styles.button} disabled={props.disabled} onClick={clear}>
        Clear
      </DitherButton>
    </div>
  )
}
