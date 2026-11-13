// Generated from dither-kit/solid/SlideAction.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, mergeProps, onMount, Show } from "solid-js"
import { project, rubberband, velocityFrom, type VelocitySample } from "dither-kit/engine/gesture.ts"
import { cssColor } from "dither-kit/engine/palette.ts"
import { pixelPrefersReducedMotion, type PixelColor } from "dither-kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: {
    pointerEvents: "none",
    position: "absolute",
    insetInline: "2.5rem",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  text: {
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
  row: {
    position: "relative",
    display: "flex",
    height: "2.5rem",
    width: "16rem",
    touchAction: "none",
    alignItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "0.25rem",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  button: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    fontSize: "14px",
    color: "var(--background)",
  },
  cursorGrabbing: { cursor: "grabbing" },
  cursorGrab: { cursor: "grab" },
})

export type SlideActionProps = {
  label?: string
  color?: PixelColor
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onConfirm?: () => void
}

/** Slide-to-confirm — drag the thumb to the end of the track (or flick it;
 * momentum projection counts) to fire, release early and it springs back.
 * Enter or Space confirms without the slide. */
export default function SlideAction(raw: SlideActionProps) {
  const props = mergeProps({ label: "Slide to confirm", color: "green" as PixelColor, disabled: false }, raw)

  let track: HTMLDivElement | undefined
  let thumb: HTMLButtonElement | undefined
  const [x, setX] = createSignal(0)
  const [travel, setTravel] = createSignal(1)
  const [dragging, setDragging] = createSignal(false)
  const [done, setDone] = createSignal(false)
  // Asked of the browser, so once mounted: a server render has none to ask.
  const [still, setStill] = createSignal(false)
  onMount(() => setStill(pixelPrefersReducedMotion()))
  let pid = -1
  let sx = 0
  let samples: VelocitySample[] = []

  function measure() {
    if (track && thumb) setTravel(Math.max(1, track.clientWidth - thumb.offsetWidth - 8))
  }
  function finish() {
    measure()
    setX(travel())
    setDone(true)
    props.onConfirm?.()
    setTimeout(() => {
      setDone(false)
      setX(0)
    }, 900)
  }
  function down(e: PointerEvent) {
    if (props.disabled || done()) return
    measure()
    setDragging(true)
    pid = e.pointerId
    sx = e.clientX - x()
    samples = [{ t: e.timeStamp, p: e.clientX }]
    thumb?.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pid) return
    const raw = e.clientX - sx
    setX(raw < 0 ? -rubberband(-raw, 48) : Math.min(raw, travel()))
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  function up(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pid) return
    setDragging(false)
    if (x() >= travel() - 2 || x() + project(velocityFrom(samples)) >= travel()) finish()
    else setX(0)
  }
  /** Keyboard path: Enter or Space confirms without the slide. */
  function key(e: KeyboardEvent) {
    if (props.disabled || done()) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      finish()
    }
  }

  return (
    <div ref={(el) => (track = el)} class={cn(styles.row, props.xstyle, props.class)}>
      <span
        aria-hidden="true"
        {...stylex.props(styles.layer)}
        style={{ opacity: x() ? Math.max(0, 1 - x() / (travel() * 0.6)) : 1 }}
      >
        {props.label}
      </span>
      <button
        ref={(el) => (thumb = el)}
        type="button"
        disabled={props.disabled}
        aria-label={props.label}
        class={cn(styles.button, CONTROL_BUTTON, dragging() ? styles.cursorGrabbing : styles.cursorGrab)}
        style={{
          background: cssColor(props.color),
          transform: `translateX(${x()}px)`,
          transition: dragging() || still() ? "none" : "transform 300ms cubic-bezier(0.2, 1.4, 0.4, 1)",
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
      >
        {done() ? "✓" : "→"}
      </button>
      <Show when={done()}>
        <span {...stylex.props(styles.text)} role="status">
          confirmed
        </span>
      </Show>
    </div>
  )
}
