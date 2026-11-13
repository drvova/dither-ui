// Generated from ../solid/GooeyMenu.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createUniqueId, For, mergeProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  svg: { position: "absolute", width: "0px", height: "0px" },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  frame: { position: "relative", display: "inline-block" },
  button: {
    position: "absolute",
    top: "0px",
    left: "0px",
    display: "grid",
    width: "2.75rem",
    height: "2.75rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    transitionProperty: { default: "transform, opacity", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  opacity100: { opacity: "100%" },
  pointerEventsNone: { pointerEvents: "none", opacity: "0%" },
  button2: {
    position: "relative",
    display: "grid",
    width: "2.75rem",
    height: "2.75rem",
    placeItems: "center",
    borderRadius: "calc(infinity * 1px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
  },
  text15px: {
    fontSize: "15px",
    lineHeight: "1",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "300ms",
  },
  rotate45: { rotate: "45deg" },
})

export type GooeyItem = { value: string; label: string; color?: PixelColor }

export type GooeyMenuProps = {
  items: GooeyItem[]
  /** Expanded state (with `onUpdateModelValue`, a model). */
  modelValue?: boolean
  onUpdateModelValue?: (open: boolean) => void
  onSelect?: (value: string) => void
  direction?: "up" | "down" | "left" | "right"
  /** Gap between item centers, px. */
  spacing?: number
  label?: string
  class?: string
  xstyle?: StyleProp
}

const VEC: Record<"up" | "down" | "left" | "right", [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/** The matrix's `mode`, carried as the Vue twin writes it (the element's own
 * attribute is `type`, whose default is the matrix). */
const MODE: object = { mode: "matrix" }

/** Action buttons that melt out of one trigger — the classic SVG goo filter
 * (blur + alpha contrast) fuses the circles while they travel. Reduced
 * motion drops the travel; items simply appear. */
export default function GooeyMenu(raw: GooeyMenuProps) {
  const props = mergeProps({ modelValue: false, direction: "up" as const, spacing: 52, label: "Actions" }, raw)

  // The filter's id, one a menu: the same on the server and in the page.
  const id = `dk-goo-${createUniqueId()}`
  const offset = (i: number) => {
    if (!props.modelValue) return "translate(0px, 0px)"
    const [vx, vy] = VEC[props.direction]
    const d = props.spacing * (i + 1)
    return `translate(${vx * d}px, ${vy * d}px)`
  }
  function pick(value: string) {
    props.onSelect?.(value)
    props.onUpdateModelValue?.(false)
  }

  return (
    <div
      class={cn(styles.frame, props.xstyle, props.class)}
      onKeyDown={(e) => {
        if (e.key === "Escape") props.onUpdateModelValue?.(false)
      }}
    >
      <svg {...stylex.props(styles.svg)} aria-hidden="true">
        <defs>
          <filter id={id}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" {...MODE} values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div style={{ filter: `url(#${id})` }}>
        <For each={props.items}>
          {(it, i) => (
            <button
              type="button"
              aria-label={it.label}
              title={it.label}
              tabindex={props.modelValue ? 0 : -1}
              class={cn(styles.button, CONTROL_BUTTON, props.modelValue ? styles.opacity100 : styles.pointerEventsNone)}
              style={{ transform: offset(i()), "transition-delay": props.modelValue ? `${i() * 40}ms` : "0ms" }}
              onClick={() => pick(it.value)}
            >
              <span
                aria-hidden="true"
                {...stylex.props(styles.text)}
                style={{ background: cssColor(it.color ?? "blue") }}
              />
            </button>
          )}
        </For>
        <button
          type="button"
          aria-label={props.label}
          aria-expanded={props.modelValue}
          class={cn(styles.button2, CONTROL_BUTTON)}
          onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
        >
          <span aria-hidden="true" class={cn([styles.text15px, props.modelValue ? styles.rotate45 : null])}>
            +
          </span>
        </button>
      </div>
    </div>
  )
}
