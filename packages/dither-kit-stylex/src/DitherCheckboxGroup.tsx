// Generated from dither-kit/solid/DitherCheckboxGroup.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { For, mergeProps } from "solid-js"
import type { PixelColor } from "dither-kit/engine/pixel.ts"
import { cn, type StyleProp } from "./lib"
import DitherCheckbox from "./DitherCheckbox"
import type { Option } from "./DitherSelect"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", gap: "0.75rem" },
})

export type DitherCheckboxGroupProps = {
  options: Option[]
  modelValue: string[]
  onUpdateModelValue?: (value: string[]) => void
  color?: PixelColor
  label?: string
  class?: string
  xstyle?: StyleProp
}

export default function DitherCheckboxGroup(raw: DitherCheckboxGroupProps) {
  const props = mergeProps({ color: "blue" as PixelColor }, raw)

  function toggle(value: string, on: boolean) {
    props.onUpdateModelValue?.(on ? [...props.modelValue, value] : props.modelValue.filter((v) => v !== value))
  }

  return (
    <div role="group" aria-label={props.label} class={cn(styles.grid, props.xstyle, props.class)}>
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
