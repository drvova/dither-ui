import { createSignal, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import Icon from "./Icon"

/** Password field with a reveal toggle: type flips text/password, the button
 * carries the accessible name and never submits (type=button). */
type Own = {
  /** @docs string (with onUpdateModelValue)
   * @default "" */
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  /** @default false */
  invalid?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "invalid",
  "class",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type PasswordInputProps = Own & Omit<DitherInputProps, keyof Own>

export default function PasswordInput(raw: PasswordInputProps) {
  const [props, rest] = splitProps(raw, OWN)

  const [shown, setShown] = createSignal(false)

  return (
    <div class="relative">
      <DitherInput
        {...rest}
        modelValue={props.modelValue ?? ""}
        type={shown() ? "text" : "password"}
        placeholder={props.placeholder}
        disabled={props.disabled}
        invalid={props.invalid}
        class={cn("pr-9", props.class)}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
      />
      <button
        type="button"
        aria-label={shown() ? "Hide password" : "Show password"}
        aria-pressed={shown()}
        class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setShown(!shown())}
      >
        <Icon name={shown() ? "EyeOff" : "Eye"} size={14} />
      </button>
    </div>
  )
}
