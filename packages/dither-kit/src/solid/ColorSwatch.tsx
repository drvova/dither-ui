import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

type Own = {
  /** @docs string (css color) */
  color?: string
  /** @docs string (aria name)
   * @default the color */
  label?: string
  /** @docs boolean (ring)
   * @default false */
  selected?: boolean
  /** @docs number (px) */
  size?: number
  disabled?: boolean
  class?: string
  onSelect?: (color: string) => void
}
const OWN = [
  "color",
  "label",
  "selected",
  "size",
  "disabled",
  "class",
  "onSelect",
] as const satisfies readonly (keyof Own)[]

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type ColorSwatchProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

/** One color as a pickable chip: a real button with the color in its
 * accessible name, selected state ring, keyboard focus ring. Pure display
 * when no `select` listener is wired. */
export default function ColorSwatch(raw: ColorSwatchProps) {
  const merged = mergeProps({ color: "#5227FF", size: 24, disabled: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const name = createMemo(() => props.label ?? props.color)
  return (
    <button
      {...rest}
      type="button"
      aria-label={`Select ${name()}`}
      aria-pressed={props.selected}
      disabled={props.disabled}
      style={{ background: props.color, width: `${props.size}px`, height: `${props.size}px` }}
      class={cn(
        "rounded-md border border-border/60 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none motion-reduce:hover:scale-100",
        props.selected && "ring-2 ring-accent/70 ring-offset-2 ring-offset-background",
        props.class,
      )}
      // Its own listener, beside any `onClick` handed in with the rest.
      on:click={() => props.onSelect?.(props.color)}
    />
  )
}
