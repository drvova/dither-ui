// Generated from @dither-ui/kit/solid/SnapButton.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, type JSX, mergeProps, onMount, Show, splitProps } from "solid-js"
import { rubberband } from "@dither-ui/kit/engine/gesture.ts"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  text: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "1px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text2: {
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
  button: {
    display: "inline-flex",
    touchAction: "none",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.875rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  cursorGrabbing: { cursor: "grabbing" },
  cursorGrab: { cursor: "grab" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
  },
  button2: { backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)" },
})

type Own = {
  /** Displacement that arms the snap, px.
   * @docs number (px): displacement that arms the snap */
  threshold?: number
  axis?: "x" | "y" | "both"
  /** @docs PixelColor: armed accent */
  color?: PixelColor
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  /** @docs () on an armed release, or Enter/Space */
  onSnap?: () => void
  /** @docs label content
   * @default "Pull to confirm" */
  children?: JSX.Element
}
const OWN = [
  "threshold",
  "axis",
  "color",
  "disabled",
  "class",
  "xstyle",
  "onSnap",
  "children",
] as const satisfies readonly (keyof Own | "children")[]
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
        styles.button,
        CONTROL_BUTTON,
        dragging() ? styles.cursorGrabbing : styles.cursorGrab,
        armed() ? styles.textForeground : styles.textMutedForeground,
        styles.button2,
        props.xstyle,
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
        {...stylex.props(styles.text)}
        style={{ background: armed() ? cssColor(props.color) : "var(--border)" }}
      />
      {props.children ?? "Pull to confirm"}
      <Show when={armed()}>
        <span {...stylex.props(styles.text2)}>armed, release to confirm</span>
      </Show>
    </button>
  )
}
