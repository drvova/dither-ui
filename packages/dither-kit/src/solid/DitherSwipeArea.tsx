import { mergeProps } from "solid-js"

export type DitherSwipeAreaProps = {
  /** Which edge the drawer slides in from. */
  side?: "right" | "left" | "bottom"
  /** Strip thickness in px. */
  size?: number
  /** Swipe distance in px that commits the open. */
  threshold?: number
  disabled?: boolean
  onOpen?: () => void
}

/** Invisible edge strip that opens a drawer on a directional swipe —
 * swipe inward from the edge the drawer lives on. */
export default function DitherSwipeArea(raw: DitherSwipeAreaProps) {
  const props = mergeProps({ side: "right" as const, size: 16, threshold: 24 }, raw)

  let fired = false
  let start = 0

  const pos = (e: PointerEvent) => (props.side === "bottom" ? e.clientY : e.clientX)
  // Inward direction: from the right edge a leftward swipe (-x) opens, etc.
  const inwardSign = () => (props.side === "left" ? 1 : -1)

  function onDown(e: PointerEvent & { currentTarget: HTMLDivElement }) {
    if (props.disabled) return
    fired = false
    start = pos(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onMove(e: PointerEvent) {
    if (props.disabled || fired) return
    if ((pos(e) - start) * inwardSign() > props.threshold) {
      fired = true
      props.onOpen?.()
    }
  }

  return (
    <div
      aria-hidden="true"
      class={`fixed z-40 touch-none ${
        props.side === "bottom"
          ? "inset-x-0 bottom-0"
          : props.side === "right"
            ? "inset-y-0 right-0"
            : "inset-y-0 left-0"
      }`}
      style={props.side === "bottom" ? { height: `${props.size}px` } : { width: `${props.size}px` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
    />
  )
}
