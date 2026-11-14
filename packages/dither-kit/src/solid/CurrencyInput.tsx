import { createMemo, createSignal, mergeProps, Show, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"

/** Money entry: the model stays a plain decimal string ("1234.56"), the
 * DISPLAY groups thousands while blurred and shows raw digits while focused
 * so the caret and typing stay predictable. One dot, digits only. */
type Own = {
  /** @docs string (with onUpdateModelValue, digits[.digits])
   * @default "" */
  modelValue?: string
  placeholder?: string
  prefix?: string
  locale?: string
  disabled?: boolean
  invalid?: boolean
  class?: string
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
    <div class="relative">
      <Show when={props.prefix}>
        <span
          class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground"
          aria-hidden="true"
        >
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
        class={cn("text-right tabular-nums", props.prefix && "pl-7", props.class)}
        on:focus={() => setFocused(true)}
        on:blur={() => setFocused(false)}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(sanitize(v))}
      />
    </div>
  )
}
