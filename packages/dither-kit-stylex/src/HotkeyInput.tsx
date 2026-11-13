// Generated from @dither-ui/kit/solid/HotkeyInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { mergeProps, splitProps } from "solid-js"
import { type StyleProp } from "./lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: { cursor: "default" },
})

/** Shortcut capture: the field listens, modifiers hold until a non-modifier
 * arrives, Escape clears. Value shape: `Ctrl+Shift+K` (order Ctrl, Alt,
 * Shift, Meta + normalized key). Repeat keys are ignored so holding a combo
 * doesn't re-fire. */
type Own = {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "class",
  "xstyle",
  "onUpdateModelValue",
] as const satisfies readonly (keyof Own)[]

/** What it does not take itself reaches the input. */
export type HotkeyInputProps = Own & Omit<DitherInputProps, keyof Own>

const MODIFIERS = new Set(["Control", "Shift", "Alt", "Meta", "CapsLock", "OS"])

function normalizeKey(key: string): string {
  if (key === " ") return "Space"
  if (key.length === 1) return key.toUpperCase()
  return key
}

export default function HotkeyInput(raw: HotkeyInputProps) {
  const merged = mergeProps({ placeholder: "Press a shortcut…" }, raw)
  const [props, rest] = splitProps(merged, OWN)

  function onKeydown(e: KeyboardEvent) {
    if (props.disabled) return
    if (e.key === "Escape") {
      e.preventDefault()
      props.onUpdateModelValue?.("")
      return
    }
    if (MODIFIERS.has(e.key) || e.repeat) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push("Ctrl")
    if (e.altKey) parts.push("Alt")
    if (e.shiftKey) parts.push("Shift")
    if (e.metaKey) parts.push("Meta")
    parts.push(normalizeKey(e.key))
    props.onUpdateModelValue?.(parts.join("+"))
  }

  return (
    <DitherInput
      {...rest}
      readonly
      modelValue={props.modelValue ?? ""}
      placeholder={props.modelValue ? "" : props.placeholder}
      disabled={props.disabled}
      xstyle={[styles.input, props.xstyle, props.class]}
      on:keydown={onKeydown}
    />
  )
}
