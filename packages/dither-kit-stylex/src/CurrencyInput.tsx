// Generated from dither-kit/solid/CurrencyInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, Show, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "0.625rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    fontSize: "13px",
    color: "var(--muted-foreground)",
  },
  input: { textAlign: "right", fontVariantNumeric: "   tabular-nums " },
  pl7: { paddingLeft: "1.75rem" },
})

/** Money entry: the model stays a plain decimal string ("1234.56"), the
 * DISPLAY groups thousands while blurred and shows raw digits while focused
 * so the caret and typing stay predictable. One dot, digits only. */
type Own = {
  modelValue?: string
  placeholder?: string
  prefix?: string
  locale?: string
  disabled?: boolean
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "prefix",
  "locale",
  "disabled",
  "invalid",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type CurrencyInputProps = Own & Omit<DitherInputProps, keyof Own>

function sanitize(raw: string): string {
  const oneDot = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
  const [whole = "", ...rest] = oneDot.split(".")
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole
}

export default function CurrencyInput(raw: CurrencyInputProps) {
  const merged = mergeProps({ placeholder: "0.00", prefix: "$", locale: "en-US" }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const [focused, setFocused] = createSignal(false)

  const display = createMemo(() => {
    if (focused()) return props.modelValue ?? ""
    const value = props.modelValue ?? ""
    if (value === "") return ""
    const n = Number(value)
    if (Number.isNaN(n)) return value
    return new Intl.NumberFormat(props.locale, {
      minimumFractionDigits: value.includes(".") ? Math.min(value.split(".")[1].length, 2) : 0,
      maximumFractionDigits: 2,
    }).format(n)
  })

  return (
    <div {...stylex.props(styles.frame)}>
      <Show when={props.prefix}>
        <span {...stylex.props(styles.layer)} aria-hidden="true">
          {props.prefix}
        </span>
      </Show>
      <DitherInput
        {...rest}
        inputmode="decimal"
        modelValue={display()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        invalid={props.invalid}
        xstyle={[styles.input, props.prefix && styles.pl7, props.xstyle, props.class]}
        on:focus={() => setFocused(true)}
        on:blur={() => setFocused(false)}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(sanitize(v))}
      />
    </div>
  )
}
