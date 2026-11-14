import { type JSX, mergeProps, splitProps } from "solid-js"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"

/** A native `button` (type=button so it never submits a form by accident)
 * with the house press affordance, a short scale-down under the
 * finger/Enter key, that looks like a button out of the box: `solid` (ink
 * on the page, the default), `outline`, `ghost`, or `plain`, the bare base
 * with no look of its own for a caller that draws every pixel. Focus wears
 * the theme's ring; `disabled` behaves natively. For the dithered,
 * blooming, canvas-filled version see DitherButton. */
export type PressableVariant = "solid" | "outline" | "ghost" | "plain"

type Own = {
  variant?: PressableVariant
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  class?: string
}

/** Everything a `<button>` takes (listeners, ARIA) reaches the button. */
export type PressableProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

/** Every look but plain: a 40px key of mono type, its words centred. */
const KEY =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 font-mono text-xs font-medium transition-[background-color,border-color,color,scale] active:scale-[0.97] motion-reduce:transition-none"
const LOOK: Record<Exclude<PressableVariant, "plain">, string> = {
  solid: "bg-foreground text-background hover:bg-foreground/85",
  outline: "border border-border bg-background/60 text-foreground hover:border-foreground/25 hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
}

export default function Pressable(raw: PressableProps) {
  const merged = mergeProps({ type: "button" as const, variant: "solid" as PressableVariant, disabled: false }, raw)
  const [props, rest] = splitProps(merged, ["type", "variant", "disabled", "class", "children"])
  return (
    <button
      {...rest}
      type={props.type}
      disabled={props.disabled}
      class={cn(
        props.variant === "plain"
          ? "transition-transform active:scale-[0.97]"
          : [CONTROL_BUTTON, KEY, LOOK[props.variant]],
        props.class,
      )}
    >
      {props.children}
    </button>
  )
}
