import { type JSX, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherCheckbox from "./DitherCheckbox"
import "./CheckboxCard.css"

export type CheckboxCardProps = {
  label?: string
  description?: string
  modelValue?: boolean
  onUpdateModelValue?: (value: boolean) => void
  disabled?: boolean
  class?: string
  children?: JSX.Element
}

/** The whole card is the checkbox's label — title and description ride
 * along, one click anywhere toggles, the peer focus ring shows keyboard
 * focus. Checkbox stays the source of truth (native semantics preserved). */
export default function CheckboxCard(raw: CheckboxCardProps) {
  const props = mergeProps({ label: "", disabled: false }, raw)
  return (
    <label
      class={cn(
        "dk-check-card flex cursor-pointer items-start gap-3 rounded-md border border-border/70 bg-card/40 p-3 transition-colors hover:border-foreground/30 motion-reduce:transition-none",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
    >
      <DitherCheckbox
        modelValue={props.modelValue ?? false}
        disabled={props.disabled}
        class="mt-0.5"
        onUpdateModelValue={(value) => props.onUpdateModelValue?.(value)}
      />
      <span class="grid gap-1">
        <Show when={props.label}>
          <span class="text-[13px] font-medium leading-none text-foreground">{props.label}</span>
        </Show>
        <Show when={props.description}>
          <span class="text-[12px] leading-snug text-muted-foreground">{props.description}</span>
        </Show>
        <span class="text-[12px] leading-snug text-muted-foreground">{props.children}</span>
      </span>
    </label>
  )
}
