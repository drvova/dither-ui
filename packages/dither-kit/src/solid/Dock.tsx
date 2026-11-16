import { For, mergeProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import "./Dock.css"

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
      class={cn(
        "inline-flex items-end gap-1.5 rounded-xl border border-border/60 bg-background/60 px-2 py-1.5",
        props.class,
      )}
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
            class="dk-dock-item grid size-9 origin-bottom place-items-center rounded-lg border border-border/60 bg-card/60 hover:bg-card"
            onClick={() => props.onSelect?.(it.value)}
          >
            <span
              aria-hidden="true"
              class="size-2 rounded-[2px]"
              style={{ background: cssColor(it.color ?? "blue") }}
            />
          </button>
        )}
      </For>
    </div>
  )
}
