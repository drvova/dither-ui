import { type JSX, mergeProps, Show, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"

type Own = { required?: boolean; class?: string }

/** Everything a `<label>` takes (`for` first of all) reaches the label. */
export type LabelProps = Own & Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, keyof Own>

/** A real `<label>` — pairs with controls through the `for` attr (or by
 * nesting), which is the whole point over a styled span. */
export default function Label(raw: LabelProps) {
  const merged = mergeProps({ required: false }, raw)
  const [props, rest] = splitProps(merged, ["required", "class", "children"])
  return (
    <label {...rest} class={cn("inline-flex items-center gap-1 text-[12px] text-foreground", props.class)}>
      {props.children}
      <Show when={props.required}>
        <span class="text-muted-foreground" aria-hidden="true">
          *
        </span>
      </Show>
    </label>
  )
}
