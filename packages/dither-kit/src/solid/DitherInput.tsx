import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import { CONTROL } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { useField } from "./runtime/field"

type Own = {
  modelValue?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  class?: string
  style?: JSX.CSSProperties
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "type",
  "placeholder",
  "disabled",
  "readonly",
  "invalid",
  "class",
  "style",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** Everything an `<input>` takes (listeners, ARIA, an id) reaches the input. */
export type DitherInputProps = Own & Omit<JSX.InputHTMLAttributes<HTMLInputElement>, keyof Own>

export default function DitherInput(raw: DitherInputProps) {
  const merged = mergeProps({ modelValue: "", type: "text", disabled: false, invalid: false }, raw)
  const [props, rest] = splitProps(merged, OWN)
  const field = useField()
  const invalid = createMemo(() => props.invalid || field?.invalid() || false)
  const invalidStyle = createMemo(() => (invalid() ? { "border-color": cssColor("red") } : undefined))

  // The model listens beside the caller's own `onInput`, never in its place.
  return (
    <input
      {...rest}
      type={props.type}
      value={props.modelValue}
      placeholder={props.placeholder}
      id={rest.id ?? field?.controlId()}
      disabled={props.disabled}
      readonly={props.readonly}
      aria-invalid={invalid() || undefined}
      aria-describedby={rest["aria-describedby"] ?? field?.describedBy()}
      style={{ ...props.style, ...invalidStyle() }}
      class={cn(
        CONTROL,
        "w-full read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground",
        props.class,
      )}
      on:input={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
    />
  )
}
