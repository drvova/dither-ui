import { mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherButton from "./DitherButton"

/** Signature pad: pointer drawing on a canvas, `change` fires the dataURL
 * after every stroke (and on clear). Canvas is sized in markup; the drawing
 * context is checked once at mount — a context-less environment (jsdom) keeps
 * the control honest by refusing strokes instead of throwing. */
export type SignaturePadProps = {
  /** @docs number (canvas) */
  width?: number
  /** @docs number (canvas) */
  height?: number
  placeholder?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** @docs (dataURL) per stroke */
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
    <div class={cn("grid gap-2", props.class)}>
      <canvas
        ref={(el) => (canvasEl = el)}
        width={props.width}
        height={props.height}
        aria-label={props.placeholder}
        role="img"
        class={[
          "w-full cursor-crosshair touch-none rounded-md border border-border bg-background/60 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          props.disabled && "pointer-events-none opacity-40",
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={strokeEnd}
        onPointerLeave={strokeEnd}
        onPointerCancel={strokeEnd}
      />
      <DitherButton variant="solid" {...SIZE} class="justify-self-start" disabled={props.disabled} onClick={clear}>
        Clear
      </DitherButton>
    </div>
  )
}
