import { createSignal, type JSX, mergeProps, onCleanup, Show, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import "./HoldAction.css"

/** Hold-to-complete — press and hold while a liquid fill with a dotted crest
 * rises (or slides) toward full; release early and it drains back. Works with
 * pointer or a held Enter/Space; completion fires exactly once per fill. The
 * fill is a CSS transition over `duration` (`HoldAction.css`): its end is
 * the completion, so the hold is timed by what the reader sees. */
type Own = {
  /** Hold time to complete, ms.
   * @docs number (ms): hold time to complete */
  duration?: number
  /** @docs "vertical" | "horizontal": fill axis */
  direction?: "vertical" | "horizontal"
  /** @docs PixelColor: fill and crest accent */
  color?: PixelColor
  disabled?: boolean
  class?: string
  /** @docs () when the fill reaches full, once per hold */
  onComplete?: () => void
}
const OWN = [
  "duration",
  "direction",
  "color",
  "disabled",
  "class",
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

  const [holding, setHolding] = createSignal(false)
  const [done, setDone] = createSignal(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  function start() {
    if (props.disabled || done() || holding()) return
    setHolding(true)
  }
  function release() {
    setHolding(false)
  }
  /** The fill reached full while held: complete, once. */
  function filled(e: TransitionEvent) {
    if (!holding() || e.target !== e.currentTarget || !/^(height|width)$/.test(e.propertyName)) return
    setHolding(false)
    setDone(true)
    props.onComplete?.()
    resetTimer = setTimeout(() => setDone(false), 900)
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
  onCleanup(() => clearTimeout(resetTimer))

  const vertical = () => props.direction === "vertical"

  return (
    <button
      {...rest}
      type="button"
      disabled={props.disabled}
      class={cn(
        "relative touch-none overflow-hidden rounded-md border border-border/60 bg-card/60 px-4 py-2.5 font-mono text-[12px] text-muted-foreground transition-colors select-none hover:text-foreground",
        CONTROL_BUTTON,
        (holding() || done()) && "text-foreground",
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
        class={`dk-hold-fill absolute ${vertical() ? "inset-x-0 bottom-0" : "inset-y-0 left-0"}`}
        data-axis={vertical() ? "y" : "x"}
        data-hold={done() ? "done" : holding() ? "hold" : undefined}
        style={{ "--dk-hold-ms": `${Math.max(1, props.duration)}ms` }}
        on:transitionend={filled}
      >
        <span class="absolute inset-0 opacity-20" style={{ background: cssColor(props.color) }} />
        <span
          class={`absolute ${vertical() ? "inset-x-0 top-0 h-[3px]" : "inset-y-0 left-full w-[3px] -translate-x-full"}`}
          style={{
            "background-image": `radial-gradient(circle, ${cssColor(props.color)} 1.2px, transparent 1.2px)`,
            "background-size": vertical() ? "5px 3px" : "3px 5px",
          }}
        />
      </span>
      <span class="relative">
        {props.children ?? "Hold to confirm"}
        <Show when={done()}> ✓</Show>
      </span>
      <Show when={done()}>
        <span class="sr-only" role="status">
          completed
        </span>
      </Show>
    </button>
  )
}
