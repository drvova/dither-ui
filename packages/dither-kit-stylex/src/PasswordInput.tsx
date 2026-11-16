// Generated from @dither-ui/kit/solid/PasswordInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  button: {
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.375rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  input: { paddingRight: "2.25rem" },
})

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
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "invalid",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type PasswordInputProps = Own & Omit<DitherInputProps, keyof Own>

export default function PasswordInput(raw: PasswordInputProps) {
  const [props, rest] = splitProps(raw, OWN)

  const [shown, setShown] = createSignal(false)

  return (
    <div {...stylex.props(styles.frame)}>
      <DitherInput
        {...rest}
        modelValue={props.modelValue ?? ""}
        type={shown() ? "text" : "password"}
        placeholder={props.placeholder}
        disabled={props.disabled}
        invalid={props.invalid}
        xstyle={[styles.input, props.xstyle, props.class]}
        onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
      />
      <button
        type="button"
        aria-label={shown() ? "Hide password" : "Show password"}
        aria-pressed={shown()}
        {...stylex.props(styles.button)}
        onClick={() => setShown(!shown())}
      >
        <Icon name={shown() ? "EyeOff" : "Eye"} size={14} />
      </button>
    </div>
  )
}
