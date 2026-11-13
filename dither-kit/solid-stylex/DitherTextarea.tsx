// Generated from ../solid/DitherTextarea.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import { CONTROL } from "./control"
import { cn, type StyleProp } from "./lib"
import { useField } from "../solid/runtime/field"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  textarea: {
    display: "block",
    width: "100%",
    lineHeight: "1.625",
    cursor: { default: null, ":read-only": "default" },
    backgroundColor: { default: null, ":read-only": "color-mix(in oklab, var(--card) 40%, transparent)" },
    color: { default: null, ":read-only": "var(--muted-foreground)" },
  },
})

type Own = {
  modelValue?: string
  placeholder?: string
  rows?: number
  resize?: "none" | "vertical" | "horizontal" | "both"
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  class?: string
  xstyle?: StyleProp
  style?: JSX.CSSProperties
  onUpdateModelValue?: (value: string) => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "rows",
  "resize",
  "disabled",
  "readonly",
  "invalid",
  "class",
  "xstyle",
  "style",
  "onUpdateModelValue",
  "onInput",
] as const satisfies readonly (keyof Own | "onInput")[]

/** Everything a `<textarea>` takes (listeners, ARIA) reaches the textarea. */
export type DitherTextareaProps = Own & Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, keyof Own>

export default function DitherTextarea(raw: DitherTextareaProps) {
  const merged = mergeProps(
    { modelValue: "", rows: 4, resize: "vertical" as const, disabled: false, readonly: false, invalid: false },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)
  const field = useField()
  const invalid = createMemo(() => props.invalid || field?.invalid() || false)

  const onInput: JSX.InputEventHandler<HTMLTextAreaElement, InputEvent> = (e) => {
    props.onUpdateModelValue?.(e.currentTarget.value)
    // The caller's own listener still hears it, as a Vue fallthrough would.
    const theirs = props.onInput
    if (typeof theirs === "function") theirs(e)
    else if (theirs) theirs[0](theirs[1], e)
  }

  return (
    <textarea
      {...rest}
      id={rest.id ?? field?.controlId()}
      value={props.modelValue}
      placeholder={props.placeholder}
      rows={props.rows}
      disabled={props.disabled}
      readonly={props.readonly}
      aria-invalid={invalid() || undefined}
      aria-describedby={rest["aria-describedby"] ?? field?.describedBy()}
      style={{ ...props.style, resize: props.resize, ...(invalid() ? { "border-color": cssColor("red") } : {}) }}
      class={cn(CONTROL, styles.textarea, props.xstyle, props.class)}
      onInput={onInput}
    />
  )
}
