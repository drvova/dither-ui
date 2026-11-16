import { createMemo, createSignal, For, type JSX, mergeProps } from "solid-js"
import { project, velocityFrom, type VelocitySample } from "../engine/gesture"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./CardStack.css"

export type CardStackProps<T> = {
  /** @docs T[]: cycled forever
   * @default required */
  items: T[]
  /** Visible under-cards.
   * @docs number: visible under-cards */
  depth?: number
  class?: string
  /** One card: the item, its index, and whether it is the top one.
   * @docs ({ item, index, top }) => JSX.Element
   * @default card face fallback */
  children?: (scope: { item: T; index: number; top: boolean }) => JSX.Element
  /** @docs (index) after a card flies out */
  onAdvance?: (index: number) => void
}

/** Swipe deck — a flick or a far swipe of the top card sends it flying the
 * way it went and the stack rises beneath, both CSS transitions
 * (`CardStack.css`) on the reorder role (`--ease-reorder`, the cards
 * changing places); the card never follows the finger. Cycles forever.
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
    <div ref={(node) => (el = node)} class={cn("relative isolate select-none", props.class)}>
      <For each={order()}>
        {(itemIndex, d) => {
          // Only the top card answers the pointer.
          const top = () => d() === 0
          return (
            <div
              class={cn(
                "dk-card absolute inset-0 transition-transform ease-[var(--ease-reorder)] duration-[var(--duration-reorder)] motion-reduce:transition-none",
                top() ? "cursor-grab touch-pan-y active:cursor-grabbing" : "pointer-events-none",
              )}
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
                <div class="grid h-full w-full place-items-center rounded-lg border border-border/60 bg-card/80 font-mono text-[13px] text-foreground">
                  {String(props.items[itemIndex])}
                </div>
              )}
            </div>
          )
        }}
      </For>
    </div>
  )
}
