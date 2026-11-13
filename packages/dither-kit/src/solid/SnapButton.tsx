import { createMemo, createSignal, type JSX, mergeProps, onMount, Show, splitProps } from "solid-js"
import { rubberband } from "../engine/gesture"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

type Own = {
  /** Displacement that arms the snap, px. */
  threshold?: number
  axis?: "x" | "y" | "both"
  color?: PixelColor
  disabled?: boolean
  class?: string
  onSnap?: () => void
}
const OWN = ["threshold", "axis", "color", "disabled", "class", "onSnap", "children"] as const satisfies readonly (
  keyof Own | "children"
)[]
/** The listeners the pull itself holds. */
type Held = "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel" | "onKeyDown" | "type" | "style"

/** Everything else a `<button>` takes (listeners, ARIA) reaches the button. */
export type SnapButtonProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own | Held>

/** Pull-to-confirm — drag the button past the threshold and let go to fire;
 * short pulls spring home. 1:1 tracking, rubber-band past the line, and the
 * border arms with the accent when the release would count. */
export default function SnapButton(raw: SnapButtonProps) {
  const merged = mergeProps({ threshold: 64, axis: "x" as const, color: "green" as PixelColor, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const [dx, setDx] = createSignal(0)
  const [dy, setDy] = createSignal(0)
  const [dragging, setDragging] = createSignal(false)
  let pointerId = -1
  let sx = 0
  let sy = 0

  const dist = createMemo(() => Math.hypot(dx(), dy()))
  const armed = createMemo(() => dist() >= props.threshold)

  function clampAxis(x: number, y: number): [number, number] {
    if (props.axis === "x") return [x, 0]
    if (props.axis === "y") return [0, y]
    return [x, y]
  }
  function soft(v: number) {
    const limit = props.threshold * 1.5
    return Math.abs(v) > limit ? Math.sign(v) * (limit + rubberband(Math.abs(v) - limit, limit)) : v
  }
  function down(e: PointerEvent & { currentTarget: HTMLButtonElement }) {
    if (props.disabled) return
    setDragging(true)
    pointerId = e.pointerId
    sx = e.clientX
    sy = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return
    const [x, y] = clampAxis(e.clientX - sx, e.clientY - sy)
    setDx(soft(x))
    setDy(soft(y))
  }
  function up(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return
    setDragging(false)
    if (armed()) props.onSnap?.()
    setDx(0)
    setDy(0)
  }
  /** Keyboard path: Enter or Space fires without the pull. */
  function key(e: KeyboardEvent) {
    if (props.disabled) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      props.onSnap?.()
    }
  }
  // Read in the page (a server has no preference to ask): it only matters
  // once a pull lets go.
  const [still, setStill] = createSignal(false)
  onMount(() => setStill(pixelPrefersReducedMotion()))

  return (
    <button
      {...rest}
      type="button"
      disabled={props.disabled}
      class={cn(
        "inline-flex touch-none items-center gap-2 rounded-md border px-3.5 py-2 font-mono text-[12px] select-none",
        CONTROL_BUTTON,
        dragging() ? "cursor-grabbing" : "cursor-grab",
        armed() ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        "bg-card/60",
        props.class,
      )}
      style={{
        transform: `translate(${dx()}px, ${dy()}px)`,
        transition: dragging() || still() ? "none" : "transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)",
        "border-color": armed() ? cssColor(props.color) : "var(--border)",
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      <span
        aria-hidden="true"
        class="size-1.5 shrink-0 rounded-[1px] transition-colors"
        style={{ background: armed() ? cssColor(props.color) : "var(--border)" }}
      />
      {props.children ?? "Pull to confirm"}
      <Show when={armed()}>
        <span class="sr-only">armed, release to confirm</span>
      </Show>
    </button>
  )
}
