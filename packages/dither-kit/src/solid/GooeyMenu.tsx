import { createUniqueId, For, mergeProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

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
}

const VEC: Record<"up" | "down" | "left" | "right", [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

/** The matrix's `mode`, carried beside it (the element's own
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
      class={cn("relative inline-block", props.class)}
      onKeyDown={(e) => {
        if (e.key === "Escape") props.onUpdateModelValue?.(false)
      }}
    >
      <svg class="absolute size-0" aria-hidden="true">
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
              class={cn(
                "absolute top-0 left-0 grid size-11 place-items-center rounded-full border border-border/60 bg-card transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
                CONTROL_BUTTON,
                props.modelValue ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              style={{ transform: offset(i()), "transition-delay": props.modelValue ? `${i() * 40}ms` : "0ms" }}
              onClick={() => pick(it.value)}
            >
              <span
                aria-hidden="true"
                class="size-2 rounded-[2px]"
                style={{ background: cssColor(it.color ?? "blue") }}
              />
            </button>
          )}
        </For>
        <button
          type="button"
          aria-label={props.label}
          aria-expanded={props.modelValue}
          class={cn(
            "relative grid size-11 place-items-center rounded-full border border-border/60 bg-card text-foreground",
            CONTROL_BUTTON,
          )}
          onClick={() => props.onUpdateModelValue?.(!props.modelValue)}
        >
          <span
            aria-hidden="true"
            class={`text-[15px] leading-none transition-transform duration-300 motion-reduce:transition-none ${
              props.modelValue ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>
      </div>
    </div>
  )
}
