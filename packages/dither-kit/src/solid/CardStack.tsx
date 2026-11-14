import { createMemo, createSignal, For, type JSX, mergeProps } from "solid-js"
import { project, rubberband, velocityFrom, type VelocitySample } from "../engine/gesture"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import { cn } from "../tailwind/lib"

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
    <div ref={(node) => (el = node)} class={cn("relative isolate select-none", props.class)}>
      <For each={order()}>
        {(itemIndex, d) => {
          // Only the top card answers the pointer.
          const top = () => d() === 0
          return (
            <div
              class={cn(
                "absolute inset-0 transition-transform duration-200 ease-[ease] motion-reduce:transition-none",
                top() ? "cursor-grab touch-pan-y active:cursor-grabbing" : "pointer-events-none",
              )}
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
