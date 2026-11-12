import { For, mergeProps } from "solid-js"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import DitherCheckbox from "./DitherCheckbox"
import type { Option } from "./DitherSelect"

export type DitherCheckboxGroupProps = {
  options: Option[]
  modelValue: string[]
  onUpdateModelValue?: (value: string[]) => void
  color?: PixelColor
  label?: string
  class?: string
}

export default function DitherCheckboxGroup(raw: DitherCheckboxGroupProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  function toggle(value: string, on: boolean) {
    props.onUpdateModelValue?.(on ? [...props.modelValue, value] : props.modelValue.filter((v) => v !== value))
  }

  return (
    <div role="group" aria-label={props.label} class={cn("grid gap-3", props.class)}>
      <For each={props.options}>
        {(o) => (
          <DitherCheckbox
            modelValue={props.modelValue.includes(o.value)}
            color={props.color}
            disabled={o.disabled}
            onUpdateModelValue={(on) => toggle(o.value, on)}
          >
            {o.label}
          </DitherCheckbox>
        )}
      </For>
    </div>
  )
}
