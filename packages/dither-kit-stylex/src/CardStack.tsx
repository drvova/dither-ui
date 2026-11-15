// Generated from @dither-ui/kit/solid/CardStack.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, type JSX, mergeProps } from "solid-js"
import { project, velocityFrom, type VelocitySample } from "@dither-ui/kit/engine/gesture.ts"
import { pixelPrefersReducedMotion } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/CardStack.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    display: "grid",
    height: "100%",
    width: "100%",
    placeItems: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
  },
  frame: { position: "relative", isolation: "isolate", WebkitUserSelect: "none", userSelect: "none" },
  layer: {
    position: "absolute",
    inset: "0px",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "ease",
    transitionDuration: "200ms",
  },
  cursorGrab: { cursor: { default: "grab", ":active": "grabbing" }, touchAction: " pan-y " },
  pointerEventsNone: { pointerEvents: "none" },
})

export type CardStackProps<T> = {
  /** @docs T[]: cycled forever
   * @default required */
  items: T[]
  /** Visible under-cards.
   * @docs number: visible under-cards */
  depth?: number
  class?: string
  xstyle?: StyleProp
  /** One card: the item, its index, and whether it is the top one.
   * @docs ({ item, index, top }) => JSX.Element
   * @default card face fallback */
  children?: (scope: { item: T; index: number; top: boolean }) => JSX.Element
  /** @docs (index) after a card flies out */
  onAdvance?: (index: number) => void
}

/** Swipe deck — a flick or a far swipe of the top card sends it flying the
 * way it went and the stack rises beneath, both CSS transitions
 * (`CardStack.css`); the card never follows the finger. Cycles forever.
 * Reduced motion swaps instantly. */
export default function CardStack<T>(raw: CardStackProps<T>) {
  const props = mergeProps({ depth: 2 }, raw)

  const [index, setIndex] = createSignal(0)
  /** The way the top card flies, while it does. */
  const [flying, setFlying] = createSignal<"left" | "right" | null>(null)
  let pointerId = -1
  let startX = 0
  let samples: VelocitySample[] = []
  let el: HTMLDivElement | undefined

  const order = createMemo(() => {
    const n = props.items.length
    if (!n) return []
    return Array.from({ length: Math.min(props.depth + 1, n) }, (_, d) => (index() + d) % n)
  })

  function down(e: PointerEvent & { currentTarget: HTMLElement }) {
    if (flying() || props.items.length < 2) return
    pointerId = e.pointerId
    startX = e.clientX
    samples = [{ t: e.timeStamp, p: e.clientX }]
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  /** Let go: where the swipe would carry the card decides whether it flies. */
  function up(e: PointerEvent) {
    if (e.pointerId !== pointerId) return
    pointerId = -1
    const w = el?.offsetWidth ?? 300
    const destination = e.clientX - startX + project(velocityFrom(samples))
    if (Math.abs(destination) <= w * 0.5) return
    if (pixelPrefersReducedMotion()) return advance()
    setFlying(destination < 0 ? "left" : "right")
  }
  function advance() {
    setIndex((index() + 1) % props.items.length)
    setFlying(null)
    props.onAdvance?.(index())
  }
  /** The flight ends where the card is gone: the next one is on top. */
  function landed(e: TransitionEvent) {
    if (flying() && e.target === e.currentTarget && e.propertyName === "transform") advance()
  }

  const cardStyle = (d: number): JSX.CSSProperties =>
    d === 0
      ? { "z-index": 10 }
      : { transform: `translateY(${d * 9}px) scale(${1 - d * 0.05})`, "z-index": 10 - d, opacity: 1 - d * 0.25 }

  return (
    <div ref={(node) => (el = node)} class={cn(styles.frame, props.xstyle, props.class)}>
      <For each={order()}>
        {(itemIndex, d) => {
          // Only the top card answers the pointer.
          const top = () => d() === 0
          return (
            <div
              class={cn([styles.layer, "dk-card"], top() ? styles.cursorGrab : styles.pointerEventsNone)}
              style={cardStyle(d())}
              data-fly={top() ? (flying() ?? undefined) : undefined}
              on:transitionend={landed}
              aria-hidden={!top()}
              role={top() ? "group" : undefined}
              aria-roledescription={top() ? "swipeable card" : undefined}
              aria-label={top() ? `Card ${itemIndex + 1} of ${props.items.length}` : undefined}
              onPointerDown={(e) => top() && down(e)}
              onPointerMove={(e) => top() && move(e)}
              onPointerUp={(e) => top() && up(e)}
              onPointerCancel={(e) => top() && up(e)}
            >
              {props.children ? (
                props.children({
                  get item() {
                    return props.items[itemIndex]
                  },
                  index: itemIndex,
                  get top() {
                    return top()
                  },
                })
              ) : (
                <div {...stylex.props(styles.grid)}>{String(props.items[itemIndex])}</div>
              )}
            </div>
          )
        }}
      </For>
    </div>
  )
}
