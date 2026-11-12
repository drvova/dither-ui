import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { copyText } from "../engine/copy-text"

/** Click-to-copy around any trigger content. The scoped slot gets
 * `{ copied, copy }` so the trigger can render its own feedback, and a polite
 * aria-live region announces the result for screen readers. The default slot
 * content should be a real control (button/link) — this wrapper adds the
 * clipboard behavior and the announcement, not the semantics. */
export type ClipboardScope = { readonly copied: boolean; copy: () => Promise<void> }
export type ClipboardProps = {
  value: string
  disabled?: boolean
  onCopied?: (value: string) => void
  children?: (scope: ClipboardScope) => JSX.Element
}

export default function Clipboard(raw: ClipboardProps) {
  const props = mergeProps({ disabled: false }, raw)
  const [copied, setCopied] = createSignal(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy() {
    if (props.disabled) return
    if (!(await copyText(props.value))) {
      setCopied(false)
      return
    }
    setCopied(true)
    props.onCopied?.(props.value)
    clearTimeout(timer)
    timer = setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  onMount(() => onCleanup(() => clearTimeout(timer)))

  // Read through a getter, so what the trigger renders from it follows it.
  const scope: ClipboardScope = {
    get copied() {
      return copied()
    },
    copy,
  }

  return (
    <div class="contents" onClick={copy}>
      {props.children?.(scope)}
      <span class="sr-only" role="status" aria-live="polite">
        {copied() ? "Copied to clipboard" : ""}
      </span>
    </div>
  )
}
