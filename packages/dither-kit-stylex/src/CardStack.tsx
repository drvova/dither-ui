// Generated from dither-kit/solid/CardStack.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, type JSX, mergeProps } from "solid-js"
import { project, rubberband, velocityFrom, type VelocitySample } from "dither-kit/engine/gesture.ts"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
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
  items: T[]
  /** Visible under-cards. */
  depth?: number
  class?: string
  xstyle?: StyleProp
  onAdvance?: (index: number) => void
  /** One card: the item, its index, and whether it is the top one. */
  children?: (scope: { item: T; index: number; top: boolean }) => JSX.Element
}

/** Swipe deck — the top card tracks the pointer 1:1, rubber-bands, and a
 * flick or a far drag sends it flying; the stack rises beneath. Cycles
 * forever. Reduced motion swaps instantly. */
export default function CardStack<T>(raw: CardStackProps<T>) {
  const props = mergeProps({ depth: 2 }, raw)

  const [index, setIndex] = createSignal(0)
  const [dx, setDx] = createSignal(0)
  const [flying, setFlying] = createSignal(false)
  const [dragging, setDragging] = createSignal(false)
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
    setDragging(true)
    pointerId = e.pointerId
    startX = e.clientX
    samples = [{ t: e.timeStamp, p: e.clientX }]
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return
    const raw = e.clientX - startX
    const w = el?.offsetWidth ?? 300
    setDx(Math.abs(raw) > w ? Math.sign(raw) * (w + rubberband(Math.abs(raw) - w, w)) : raw)
    samples.push({ t: e.timeStamp, p: e.clientX })
    if (samples.length > 6) samples.shift()
  }
  function up(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return
    setDragging(false)
    const w = el?.offsetWidth ?? 300
    const v = velocityFrom(samples)
    const destination = dx() + project(v)
    if (Math.abs(destination) > w * 0.5) {
      if (pixelPrefersReducedMotion()) {
        advance()
        return
      }
      setFlying(true)
      setDx(Math.sign(destination) * w * 1.4)
      window.setTimeout(advance, 200)
    } else {
      setDx(0)
    }
  }
  function advance() {
    setIndex((index() + 1) % props.items.length)
    setFlying(false)
    setDx(0)
    props.onAdvance?.(index())
  }

  const cardStyle = (d: number): JSX.CSSProperties => {
    if (d === 0)
      return {
        transform: `translateX(${dx()}px) rotate(${dx() / 24}deg)`,
        transition: dragging() ? "none" : undefined,
        "z-index": 10,
      }
    return {
      transform: `translateY(${d * 9}px) scale(${1 - d * 0.05})`,
      "z-index": 10 - d,
      opacity: 1 - d * 0.25,
    }
  }

  return (
    <div ref={(node) => (el = node)} class={cn(styles.frame, props.xstyle, props.class)}>
      <For each={order()}>
        {(itemIndex, d) => {
          // Only the top card answers the pointer.
          const top = () => d() === 0
          return (
            <div
              class={cn(styles.layer, top() ? styles.cursorGrab : styles.pointerEventsNone)}
              style={cardStyle(d())}
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
