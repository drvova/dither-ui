import { type JSX, mergeProps, splitProps } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherTextarea, { type DitherTextareaProps } from "./DitherTextarea"

type Own = {
  modelValue?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  onSubmit?: () => void
}
const OWN = [
  "modelValue",
  "placeholder",
  "rows",
  "disabled",
  "class",
  "onUpdateModelValue",
  "onSubmit",
  "onKeyDown",
] as const satisfies readonly (keyof Own | "onKeyDown")[]

/** Everything else the textarea takes (listeners, ARIA) reaches it. */
export type CodeInputProps = Own & Omit<DitherTextareaProps, keyof Own>

const TAB = "  "

/** Code entry: monospace textarea where Tab indents (two spaces) and
 * Shift+Tab dedents the selected lines — the default browser tab trap is
 * the enemy of code fields, so it's handled here once. */
export default function CodeInput(raw: CodeInputProps) {
  const merged = mergeProps({ rows: 6, placeholder: "// paste or type…" }, raw)
  const [props, rest] = splitProps(merged, OWN)

  const onKeyDown: JSX.EventHandler<HTMLTextAreaElement, KeyboardEvent> = (e) => {
    // The caller's own listener still hears it, as a Vue fallthrough would.
    const theirs = props.onKeyDown
    if (typeof theirs === "function") theirs(e)
    else if (theirs) theirs[0](theirs[1], e)
    if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      const el = e.currentTarget
      const { value, selectionStart, selectionEnd } = el
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
        const hadTab = value.startsWith(TAB, lineStart)
        const removed = hadTab ? TAB.length : 0
        const next = value.slice(0, lineStart) + (hadTab ? value.slice(lineStart + removed) : value.slice(lineStart))
        props.onUpdateModelValue?.(next)
        requestAnimationFrame(() => {
          el.selectionStart = Math.max(lineStart, selectionStart - removed)
          el.selectionEnd = Math.max(lineStart, selectionEnd - removed)
        })
        return
      }
      const next = value.slice(0, selectionStart) + TAB + value.slice(selectionEnd)
      props.onUpdateModelValue?.(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + TAB.length
      })
      return
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      props.onSubmit?.()
    }
  }

  return (
    <DitherTextarea
      {...rest}
      modelValue={props.modelValue ?? ""}
      placeholder={props.placeholder}
      rows={props.rows}
      disabled={props.disabled}
      class={cn("font-mono text-[12.5px] leading-relaxed", props.class)}
      onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
      onKeyDown={onKeyDown}
    />
  )
}
