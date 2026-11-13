// Generated from dither-kit/solid/Dock.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, For, mergeProps, onMount } from "solid-js"
import { cssColor } from "dither-kit/engine/palette.ts"
import { pixelPrefersReducedMotion, type PixelColor } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "grid",
    width: "2.25rem",
    height: "2.25rem",
    transformOrigin: "bottom",
    placeItems: "center",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--card) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--card)" },
    },
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "150ms",
    willChange: "transform",
  },
  text: { width: "0.5rem", height: "0.5rem", borderRadius: "2px" },
  row: {
    display: "inline-flex",
    alignItems: "flex-end",
    gap: "0.375rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
  },
})

export type DockItem = { value: string; label: string; color?: PixelColor }

export type DockProps = {
  items: DockItem[]
  /** Peak scale over the pointer. */
  magnify?: number
  /** Falloff radius in px. */
  range?: number
  class?: string
  xstyle?: StyleProp
  onSelect?: (value: string) => void
}

/** Hover-magnifying dock — items swell on a gaussian falloff around the
 * pointer and settle when it leaves. Reduced motion keeps the row still and
 * marks hover by color alone. */
export default function Dock(raw: DockProps) {
  const props = mergeProps({ magnify: 1.7, range: 80 }, raw)

  const [px, setPx] = createSignal<number | null>(null)
  let bar: HTMLDivElement | undefined
  // Read once, at mount (a server render has no media to ask).
  let still = false
  onMount(() => {
    still = pixelPrefersReducedMotion()
  })

  function track(e: PointerEvent) {
    if (still) return
    const r = bar?.getBoundingClientRect()
    if (r) setPx(e.clientX - r.left)
  }

  const scaleOf = (i: number) => {
    const at = px()
    if (at === null || !bar) return 1
    const buttons = bar.querySelectorAll("button")
    const b = buttons[i] as HTMLElement | undefined
    if (!b) return 1
    const center = b.offsetLeft + b.offsetWidth / 2
    const d = Math.abs(at - center)
    const g = Math.exp(-(d * d) / (2 * props.range * props.range))
    return 1 + (props.magnify - 1) * g
  }

  return (
    <div
      ref={(el) => (bar = el)}
      class={cn(styles.row, props.xstyle, props.class)}
      role="group"
      aria-label="Dock"
      onPointerMove={track}
      onPointerLeave={() => setPx(null)}
    >
      <For each={props.items}>
        {(it, i) => (
          <button
            type="button"
            aria-label={it.label}
            title={it.label}
            {...stylex.props(styles.button)}
            style={{ transform: `scale(${scaleOf(i())})` }}
            onClick={() => props.onSelect?.(it.value)}
          >
            <span
              aria-hidden="true"
              {...stylex.props(styles.text)}
              style={{ background: cssColor(it.color ?? "blue") }}
            />
          </button>
        )}
      </For>
    </div>
  )
}
