// Generated from @dither-ui/kit/solid/DitherInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import { CONTROL, CONTROL_INVALID } from "./control"
import { cn, type StyleProp } from "./lib"
import { useField } from "@dither-ui/kit/solid/runtime/field.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
    width: "100%",
    cursor: { default: null, ":read-only": "default" },
    backgroundColor: { default: null, ":read-only": "color-mix(in oklab, var(--card) 40%, transparent)" },
    color: { default: null, ":read-only": "var(--muted-foreground)" },
  },
})

type Own = {
  modelValue?: string
  /** @default "text" */
  type?: string
  placeholder?: string
  disabled?: boolean
  /** @default false */
  readonly?: boolean
  /** @default false */
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
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
  "xstyle",
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
      class={cn(CONTROL, invalid() && CONTROL_INVALID, styles.input, props.xstyle, props.class)}
      on:input={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
    />
  )
}
