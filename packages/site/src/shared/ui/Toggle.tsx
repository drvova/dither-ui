import { type JSX, splitProps } from "solid-js"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { breakable } from "@/shared/lib/words"

type Own = { modelValue: boolean; label: string; class?: string; onUpdateModelValue?: (value: boolean) => void }
type ToggleProps = Own & Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, keyof Own>

export default function Toggle(raw: ToggleProps) {
  const [props, rest] = splitProps(raw, ["modelValue", "label", "class", "onUpdateModelValue"])
  return (
    <label
      {...rest}
      class={cn("flex min-h-6 cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground", props.class)}
    >
      <input
        type="checkbox"
        name={props.label}
        checked={props.modelValue}
        class="accent-foreground"
        onChange={(e) => props.onUpdateModelValue?.(e.currentTarget.checked)}
      />
      {breakable(props.label)}
    </label>
  )
}
