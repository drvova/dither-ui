// The rows and keys every inspector panel is built of: a named text field, a
// named slider, the keys' looks, and a widget colour as the colour field takes it.
import type { JSX } from "solid-js"
import { colorToHex } from "@dither-ui/kit"

export const ROW = "flex items-center gap-2 text-[11px] text-muted-foreground"
export const FIELD =
  "w-full rounded-md border border-edge bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
export const KEY =
  "rounded border border-border min-h-6 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
export const DELETE_KEY =
  "ml-auto rounded border border-border min-h-6 px-2 py-0.5 text-[11px] text-destructive transition-colors hover:bg-red-500/10"
export const REPLAY_KEY =
  "flex items-center gap-1 rounded border border-border min-h-6 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"

/** PixelColor may be a legacy hue number — coerce for the ColorField. */
export const asFieldColor = (c: unknown) =>
  (typeof c === "number" ? colorToHex(c) : c) as Parameters<typeof colorToHex>[0] & string

/** A named text field of the panel: the name in the column, the model
 * written as it is typed. */
export function Text(props: {
  label: string
  name: string
  value: string
  set: (value: string) => void
  placeholder?: string
  onChange?: () => void
}) {
  return (
    <label class={ROW}>
      <span class="prop-name">{props.label}</span>
      <input
        value={props.value}
        type="text"
        name={props.name}
        autocomplete="off"
        placeholder={props.placeholder}
        class={FIELD}
        onInput={(e) => props.set(e.currentTarget.value)}
        onChange={() => props.onChange?.()}
      />
    </label>
  )
}

/** A named slider of the panel: the name in the column, the model written
 * as a number as it moves, its reading (the children) beside it. */
export function Range(props: {
  label: string
  name: string
  min: number
  max: number
  step: number
  value: number
  set: (value: number) => void
  onInput?: () => void
  children: JSX.Element
}) {
  return (
    <label class={ROW}>
      <span class="prop-name">{props.label}</span>
      <input
        type="range"
        name={props.name}
        min={props.min}
        max={props.max}
        step={props.step}
        // after its range: a value set first is held to the default 0..100 by 1
        value={props.value}
        class="h-6 flex-1 accent-foreground"
        onInput={(e) => {
          const n = parseFloat(e.currentTarget.value)
          if (!Number.isNaN(n)) props.set(n)
          props.onInput?.()
        }}
      />
      <span class="w-8 tabular-nums text-foreground">{props.children}</span>
    </label>
  )
}
