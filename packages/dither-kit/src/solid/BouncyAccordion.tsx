import { createEffect, createUniqueId, For, type JSX, mergeProps, on, onMount, Show } from "solid-js"
import { cssColor } from "../engine/palette"
import { pixelPrefersReducedMotion } from "../engine/pixel"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

/** Weighted spring shared by the layout integrator and the CSS content
 * reveal: mass 1.2, stiffness 240, damping 21 — ~8% overshoot, then calm. */
const MASS = 1.2
const STIFFNESS = 240
const DAMPING = 21

/** The same spring sampled into a CSS linear() easing for the content rise;
 * browsers without linear() fall back to the class timing function. */
const SPRING =
  "linear(0, 0.018, 0.0662, 0.1362, 0.221, 0.3143, 0.4111, 0.5073, 0.5997, 0.6858, 0.7642, 0.8336, 0.8938, 0.9445, 0.9862, 1.0193, 1.0445, 1.0627, 1.0748, 1.0816, 1.0842, 1.0832, 1.0796, 1.074, 1.0671, 1.0593, 1.0512, 1.0431, 1.0352, 1.0278, 1.0211, 1.0151, 1.0099, 1.0055, 1.0018, 0.9989, 0.9966, 0.995, 0.9939, 0.9932, 1)"

const anims = new WeakMap<HTMLElement, number>()

/** Animate height to a px target on the weighted spring (grid 0fr/1fr cannot
 * overshoot — flex factors clamp at content size — so the layout bounce runs
 * on real pixels). Rests at `auto` when open so content may keep growing. */
function springHeight(el: HTMLElement, to: number, openAtRest: boolean) {
  cancelAnimationFrame(anims.get(el) ?? 0)
  let x = el.offsetHeight
  let v = 0
  let last = performance.now()
  const step = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000)
    last = now
    const a = (-STIFFNESS * (x - to) - DAMPING * v) / MASS
    v += a * dt
    x += v * dt
    if (Math.abs(x - to) < 0.5 && Math.abs(v) < 5) {
      el.style.height = openAtRest ? "auto" : "0px"
      anims.delete(el)
      return
    }
    el.style.height = `${Math.max(0, x)}px`
    anims.set(el, requestAnimationFrame(step))
  }
  anims.set(el, requestAnimationFrame(step))
}

export type BouncyItem = {
  value: string
  label: string
  hint?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
  content?: string
}

export type BouncyAccordionProps = {
  items: BouncyItem[]
  modelValue?: string
  color?: PixelColor
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** A panel's content by its item's `value` (a slot per item);
   * an item without one shows its `content`. */
  slots?: Record<string, JSX.Element>
}

/** Single-open accordion with a weighted spring layout — panels overshoot and
 * settle on a damped spring, close briskly, and reveal content with a small
 * rise. Icon rows lead each header; reduced motion swaps every glide for an
 * instant reveal. */
export default function BouncyAccordion(raw: BouncyAccordionProps) {
  const props = mergeProps({ modelValue: "", color: "blue" as PixelColor }, raw)

  const id = `dk-bouncy-${createUniqueId()}`
  const panels: (HTMLElement | null)[] = []
  const isOpen = (v: string) => props.modelValue === v
  const toggle = (v: string) => props.onUpdateModelValue?.(isOpen(v) ? "" : v)

  onMount(() => {
    const still = pixelPrefersReducedMotion()
    function settle(el: HTMLElement | null, open: boolean) {
      if (!el) return
      if (still) {
        el.style.height = open ? "auto" : "0px"
        return
      }
      springHeight(el, open ? el.scrollHeight : 0, open)
    }
    props.items.forEach((item, i) => {
      const el = panels[i]
      if (el) el.style.height = isOpen(item.value) ? "auto" : "0px"
    })
    createEffect(
      on(
        () => props.modelValue,
        () => props.items.forEach((item, i) => settle(panels[i] ?? null, isOpen(item.value))),
        { defer: true },
      ),
    )
  })

  return (
    <div class={cn(props.class)}>
      <For each={props.items}>
        {(item, i) => (
          <div class="border-t border-border/40 first:border-t-0">
            <button
              type="button"
              aria-expanded={isOpen(item.value)}
              aria-controls={`${id}-${i()}`}
              class="flex w-full items-center gap-3 py-2 text-left text-[13px] text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => toggle(item.value)}
            >
              <span
                aria-hidden="true"
                class="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-card/60 text-[13px]"
                style={{ color: cssColor(item.color ?? props.color) }}
              >
                <Show
                  when={item.icon}
                  fallback={
                    <span class="size-2 rounded-[2px]" style={{ background: cssColor(item.color ?? props.color) }} />
                  }
                >
                  {item.icon}
                </Show>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate">{item.label}</span>
                <Show when={item.hint}>
                  <span class="block truncate text-[11px] text-muted-foreground">{item.hint}</span>
                </Show>
              </span>
              <span
                aria-hidden="true"
                class={cn(
                  "text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
                  isOpen(item.value) ? "rotate-90" : "",
                )}
              >
                ›
              </span>
            </button>
            <div
              id={`${id}-${i()}`}
              ref={(el) => (panels[i()] = el)}
              inert={!isOpen(item.value)}
              class="overflow-hidden"
            >
              <div
                class="pt-1 pb-3 pl-11 text-[13px] leading-relaxed text-muted-foreground transition-[opacity,transform] motion-reduce:transition-none"
                style={{
                  opacity: isOpen(item.value) ? 1 : 0,
                  transform: isOpen(item.value) ? "none" : "translateY(-6px)",
                  "transition-timing-function": isOpen(item.value) ? SPRING : "cubic-bezier(0.3, 0, 0.2, 1)",
                  "transition-duration": isOpen(item.value) ? "560ms" : "240ms",
                }}
              >
                {props.slots?.[item.value] ?? item.content}
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
