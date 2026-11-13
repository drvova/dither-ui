// Generated from dither-kit/solid/BouncyAccordion.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createUniqueId, For, type JSX, mergeProps, on, onMount, Show } from "solid-js"
import { cssColor } from "dither-kit/engine/palette.ts"
import { pixelPrefersReducedMotion } from "dither-kit/engine/pixel.ts"
import type { PixelColor } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: {
    borderTopStyle: { default: "solid", ":first-child": "solid" },
    borderTopWidth: { default: "1px", ":first-child": "0px" },
    borderColor: "color-mix(in oklab, var(--border) 40%, transparent)",
  },
  button: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
  },
  grid: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 60%, transparent)",
    fontSize: "13px",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  text2: { minWidth: "0px", flex: "1" },
  text3: { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text4: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "11px",
    color: "var(--muted-foreground)",
  },
  box2: { overflow: "hidden" },
  box3: {
    paddingTop: "0.25rem",
    paddingBottom: "0.75rem",
    paddingLeft: "2.75rem",
    fontSize: "13px",
    lineHeight: "1.625",
    color: "var(--muted-foreground)",
    transitionProperty: { default: "opacity, transform", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text5: {
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  rotate90: { rotate: "90deg" },
})

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
  xstyle?: StyleProp
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
    <div class={cn(props.xstyle, props.class)}>
      <For each={props.items}>
        {(item, i) => (
          <div {...stylex.props(styles.box)}>
            <button
              type="button"
              aria-expanded={isOpen(item.value)}
              aria-controls={`${id}-${i()}`}
              {...stylex.props(styles.button)}
              onClick={() => toggle(item.value)}
            >
              <span
                aria-hidden="true"
                {...stylex.props(styles.grid)}
                style={{ color: cssColor(item.color ?? props.color) }}
              >
                <Show
                  when={item.icon}
                  fallback={
                    <span {...stylex.props(styles.text)} style={{ background: cssColor(item.color ?? props.color) }} />
                  }
                >
                  {item.icon}
                </Show>
              </span>
              <span {...stylex.props(styles.text2)}>
                <span {...stylex.props(styles.text3)}>{item.label}</span>
                <Show when={item.hint}>
                  <span {...stylex.props(styles.text4)}>{item.hint}</span>
                </Show>
              </span>
              <span aria-hidden="true" class={cn(styles.text5, isOpen(item.value) ? styles.rotate90 : null)}>
                ›
              </span>
            </button>
            <div
              id={`${id}-${i()}`}
              ref={(el) => (panels[i()] = el)}
              inert={!isOpen(item.value)}
              {...stylex.props(styles.box2)}
            >
              <div
                {...stylex.props(styles.box3)}
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
