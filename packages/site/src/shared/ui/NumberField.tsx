import { type JSX, Show, splitProps } from "solid-js"
import { cn } from "dither-kit/tailwind/lib.ts"
import { breakable } from "@/shared/lib/words"

type Own = {
  label: string
  modelValue: number
  min?: number
  max?: number
  step?: number
  unit?: string
  class?: string
  onUpdateModelValue?: (value: number) => void
}
export type NumberFieldProps = Own & Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, keyof Own>

export default function NumberField(raw: NumberFieldProps) {
  const [props, rest] = splitProps(raw, [
    "label",
    "modelValue",
    "min",
    "max",
    "step",
    "unit",
    "class",
    "onUpdateModelValue",
  ])

  function onInput(e: InputEvent & { currentTarget: HTMLInputElement }) {
    const v = Number(e.currentTarget.value)
    let n = Number.isFinite(v) ? v : 0
    if (props.min != null) n = Math.max(props.min, n)
    if (props.max != null) n = Math.min(props.max, n)
    props.onUpdateModelValue?.(n)
  }

  return (
    <label {...rest} class={cn("flex items-center gap-2 text-[11px] text-muted-foreground", props.class)}>
      <span class="prop-name">{breakable(props.label)}</span>
      <span class="relative flex-1">
        <input
          type="number"
          name={props.label}
          autocomplete="off"
          value={props.modelValue}
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          class={cn(
            "w-full min-w-0 rounded-md border border-edge bg-background/60 px-2 py-1 text-xs tabular-nums text-foreground outline-none [appearance:textfield] focus:border-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            props.unit ? "pr-6" : "",
          )}
          onInput={onInput}
        />
        <Show when={props.unit}>
          <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
            {props.unit}
          </span>
        </Show>
      </span>
    </label>
  )
}
