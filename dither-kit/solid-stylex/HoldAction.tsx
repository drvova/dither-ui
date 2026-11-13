// Generated from ../solid/HoldAction.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup, Show, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  layer: { position: "absolute", inset: "0px", opacity: "20%" },
  frame: { position: "relative" },
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
  button: {
    position: "relative",
    touchAction: "none",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "0.625rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  textForeground: { color: "var(--foreground)" },
  absolute: { position: "absolute" },
  insetX0: { insetInline: "0px", bottom: "0px" },
  insetY0: { insetBlock: "0px", left: "0px" },
  insetX02: { insetInline: "0px", top: "0px", height: "3px" },
  insetY02: { insetBlock: "0px", left: "100%", width: "3px", translate: "-100% 0" },
})

/** Hold-to-complete — press and hold while a liquid fill with a dotted crest
 * rises (or slides) toward full; release early and it drains back. Works with
 * pointer or a held Enter/Space; completion fires exactly once per fill. */
type Own = {
  /** Hold time to complete, ms. */
  duration?: number
  direction?: "vertical" | "horizontal"
  color?: PixelColor
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onComplete?: () => void
}
const OWN = [
  "duration",
  "direction",
  "color",
  "disabled",
  "class",
  "xstyle",
  "onComplete",
  "children",
] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type HoldActionProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function HoldAction(raw: HoldActionProps) {
  const merged = mergeProps(
    { duration: 1200, direction: "vertical" as const, color: "orange" as PixelColor, disabled: false },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)

  const [progress, setProgress] = createSignal(0)
  const [holding, setHolding] = createSignal(false)
  const [done, setDone] = createSignal(false)
  let raf = 0
  let dir = 0
  let last = 0
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const rate = dir > 0 ? 1000 / props.duration : -1000 / (props.duration * 0.35)
    setProgress(Math.max(0, Math.min(1, progress() + rate * dt)))
    if (dir > 0 && progress() >= 1) {
      setHolding(false)
      setDone(true)
      props.onComplete?.()
      resetTimer = setTimeout(() => {
        setDone(false)
        setProgress(0)
      }, 900)
      return
    }
    if (dir < 0 && progress() <= 0) return
    raf = requestAnimationFrame(tick)
  }
  function start() {
    if (props.disabled || done() || holding()) return
    setHolding(true)
    dir = 1
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  function release() {
    if (!holding()) return
    setHolding(false)
    dir = -1
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  function keydown(e: KeyboardEvent) {
    if (e.repeat) return
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      start()
    }
  }
  function keyup(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") release()
  }
  onCleanup(() => {
    cancelAnimationFrame(raf)
    clearTimeout(resetTimer)
  })

  const vertical = () => props.direction === "vertical"

  return (
    <button
      {...rest}
      type="button"
      disabled={props.disabled}
      class={cn(
        styles.button,
        CONTROL_BUTTON,
        (holding() || done()) && styles.textForeground,
        props.xstyle,
        props.class,
      )}
      onPointerDown={(e) => {
        e.preventDefault()
        start()
      }}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onKeyDown={keydown}
      onKeyUp={keyup}
    >
      <span
        aria-hidden="true"
        class={cn([styles.absolute, vertical() ? styles.insetX0 : styles.insetY0])}
        style={vertical() ? { height: `${progress() * 100}%` } : { width: `${progress() * 100}%` }}
      >
        <span {...stylex.props(styles.layer)} style={{ background: cssColor(props.color) }} />
        <span
          class={cn([styles.absolute, vertical() ? styles.insetX02 : styles.insetY02])}
          style={{
            "background-image": `radial-gradient(circle, ${cssColor(props.color)} 1.2px, transparent 1.2px)`,
            "background-size": vertical() ? "5px 3px" : "3px 5px",
          }}
        />
      </span>
      <span {...stylex.props(styles.frame)}>
        {props.children ?? "Hold to confirm"}
        <Show when={done()}> ✓</Show>
      </span>
      <Show when={done()}>
        <span {...stylex.props(styles.text)} role="status">
          completed
        </span>
      </Show>
    </button>
  )
}
