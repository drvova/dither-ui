import { type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import "./ExpandingArrow.css"

/** An accent tile that expands into a dotted-arrow trail on hover or focus —
 * the trail is stamped by a repeating radial gradient in the accent hue and
 * the head tile nudges forward. Reduced motion reveals the trail instantly. */
type Own = {
  /** @docs PixelColor: tile and trail accent */
  color?: PixelColor
  disabled?: boolean
  class?: string
  /** @docs label content
   * @default "Explore the kit" */
  children?: JSX.Element
}
const OWN = ["color", "disabled", "class", "children"] as const satisfies readonly (keyof Own | "children")[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type ExpandingArrowProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function ExpandingArrow(raw: ExpandingArrowProps) {
  const merged = mergeProps({ color: "blue" as PixelColor, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <button
      type="button"
      {...rest}
      disabled={props.disabled}
      class={cn(
        "dk-arrow inline-flex items-center gap-3 rounded-md border border-border/60 bg-card/60 py-1.5 pr-1.5 pl-3.5 font-mono text-[12px] text-muted-foreground transition-colors select-none hover:text-foreground focus-visible:text-foreground",
        CONTROL_BUTTON,
        props.class,
      )}
    >
      {props.children ?? "Explore the kit"}
      <span aria-hidden="true" class="flex items-center">
        <span
          class="dk-arrow-trail h-[3px] w-0 opacity-0 transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none"
          style={{
            "background-image": `radial-gradient(circle, ${cssColor(props.color)} 1.5px, transparent 1.5px)`,
            "background-size": "6px 3px",
            "background-position": "center",
          }}
        />
        <span
          class="dk-arrow-head grid size-8 shrink-0 place-items-center rounded-md text-[14px] text-background transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ background: cssColor(props.color) }}
        >
          →
        </span>
      </span>
    </button>
  )
}
