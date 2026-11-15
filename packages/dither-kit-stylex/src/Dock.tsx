// Generated from @dither-ui/kit/solid/Dock.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, mergeProps } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import "@dither-ui/kit/solid/Dock.css"
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
  /** @docs { value, label, color? }[]
   * @default required */
  items: DockItem[]
  /** Peak scale over the pointer.
   * @docs number: peak scale over the pointer */
  magnify?: number
  /** Falloff radius in px.
   * @docs number (px): gaussian falloff radius */
  range?: number
  class?: string
  xstyle?: StyleProp
  /** @docs (value) */
  onSelect?: (value: string) => void
}

/** The pitch between neighbouring items' centres, px (a 36px key, a 6px gap). */
const PITCH = 42

/** Hover-magnifying dock — the item under the pointer (or the focus) swells
 * and its neighbours on either side swell less, by a gaussian falloff of
 * `range` sampled at their places, and all settle when it leaves: CSS
 * `:hover` and `:has()` over the scales worked out here (`Dock.css`).
 * Reduced motion keeps the row still and marks hover by color alone. */
export default function Dock(raw: DockProps) {
  const props = mergeProps({ magnify: 1.7, range: 80 }, raw)

  /** The swell `places` pitches from the pointer's item. */
  const scale = (places: number) => {
    const d = places * PITCH
    return String(1 + (props.magnify - 1) * Math.exp(-(d * d) / (2 * props.range * props.range)))
  }

  return (
    <div
      class={cn(styles.row, props.xstyle, props.class)}
      style={{ "--dk-dock-0": scale(0), "--dk-dock-1": scale(1), "--dk-dock-2": scale(2) }}
      role="group"
      aria-label="Dock"
    >
      <For each={props.items}>
        {(it) => (
          <button
            type="button"
            aria-label={it.label}
            title={it.label}
            class={cn(styles.button, "dk-dock-item")}
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
