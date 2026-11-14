import { mergeProps, splitProps } from "solid-js"
import { isTab } from "../engine/keys"
import { cn } from "../tailwind/lib"
import DitherInput, { type DitherInputProps } from "./DitherInput"

/** Shortcut capture: the field listens, modifiers hold until a non-modifier
 * arrives, Escape clears, Tab and Shift+Tab move focus on as anywhere (a
 * bare Tab is never a shortcut: taking it would trap the keyboard). Value shape: `Ctrl+Shift+K` (order Ctrl, Alt,
 * Shift, Meta + normalized key). Repeat keys are ignored so holding a combo
 * doesn't re-fire. */
type Own = {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "disabled",
  "class",
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
    if (isTab(e) && !e.ctrlKey && !e.altKey && !e.metaKey) return
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
      class={cn("cursor-default", props.class)}
      on:keydown={onKeydown}
    />
  )
}
