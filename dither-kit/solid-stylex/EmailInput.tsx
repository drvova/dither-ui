// Generated from ../solid/EmailInput.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { mergeProps, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"

/** Email field with the mobile keyboard and autofill contract baked in:
 * type=email, inputmode=email, autocomplete=email — the three things a bare
 * text input gets wrong. */
type Own = {
  modelValue?: string
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "autocomplete",
  "disabled",
  "invalid",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type EmailInputProps = Own & Omit<DitherInputProps, keyof Own>

export default function EmailInput(raw: EmailInputProps) {
  const merged = mergeProps({ placeholder: "you@example.com", autocomplete: "email" }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <DitherInput
      {...rest}
      type="email"
      inputmode="email"
      modelValue={props.modelValue ?? ""}
      placeholder={props.placeholder}
      autocomplete={props.autocomplete}
      disabled={props.disabled}
      invalid={props.invalid}
      xstyle={[props.xstyle, props.class]}
      onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
    />
  )
}
