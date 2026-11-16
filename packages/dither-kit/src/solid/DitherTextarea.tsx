import { createMemo, type JSX, mergeProps, splitProps } from "solid-js"
import { cssColor } from "../engine/palette"
import { CONTROL, CONTROL_INVALID } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { useField } from "./runtime/field"

type Own = {
  modelValue?: string
  placeholder?: string
  rows?: number
  /** @default "vertical" */
  resize?: "none" | "vertical" | "horizontal" | "both"
  disabled?: boolean
  /** @default false */
  readonly?: boolean
  /** @default false */
  invalid?: boolean
  class?: string
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
    // The caller's own listener still hears it.
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
      class={cn(
        CONTROL,
        invalid() && CONTROL_INVALID,
        "block w-full leading-relaxed read-only:cursor-default read-only:bg-card/40 read-only:text-muted-foreground",
        props.class,
      )}
      onInput={onInput}
    />
  )
}
