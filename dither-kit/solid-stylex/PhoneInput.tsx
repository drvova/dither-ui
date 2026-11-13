// Generated from ../solid/PhoneInput.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { mergeProps, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"

/** Phone field: digits normalized into the (415) 555-2671 shape as you type
 * (10-digit NANP input), tel keyboard on mobile. The model is always the
 * formatted string; caret editing is end-anchored by design. */
type Own = {
  modelValue?: string
  placeholder?: string
  autocomplete?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "autocomplete",
  "disabled",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type PhoneInputProps = Own & Omit<DitherInputProps, keyof Own>

function format(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

export default function PhoneInput(raw: PhoneInputProps) {
  const merged = mergeProps({ placeholder: "(555) 123-4567", autocomplete: "tel" }, raw)
  const [props, rest] = splitProps(merged, OWN)
  return (
    <DitherInput
      {...rest}
      type="tel"
      inputmode="tel"
      modelValue={props.modelValue ?? ""}
      placeholder={props.placeholder}
      autocomplete={props.autocomplete}
      disabled={props.disabled}
      xstyle={[props.xstyle, props.class]}
      onUpdateModelValue={(v) => props.onUpdateModelValue?.(format(v))}
    />
  )
}
