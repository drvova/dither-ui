// Generated from dither-kit/solid/Clipboard.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, type JSX, mergeProps, onCleanup, onMount } from "solid-js"
import { copyText } from "dither-kit/engine/copy-text.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  box: { display: "contents" },
  text: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
})

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
    <div {...stylex.props(styles.box)} onClick={copy}>
      {props.children?.(scope)}
      <span {...stylex.props(styles.text)} role="status" aria-live="polite">
        {copied() ? "Copied to clipboard" : ""}
      </span>
    </div>
  )
}
