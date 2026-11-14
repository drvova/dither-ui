// The source editor: a plain textarea beside a line gutter — native undo,
// selection, spellcheck-off typing, IME and screen readers for free. Tab
// indents and Shift+Tab outdents the lines in the selection; Escape hands
// the next Tab back to the page, so the editor never traps the keyboard;
// Enter keeps the line's indent; ⌘/Ctrl+Enter runs.
import { createMemo } from "solid-js"
import { isTab } from "@dither-ui/kit/engine"
import "./Editor.css"

type EditorProps = {
  label: string
  describedby?: string
  modelValue: string
  onUpdateModelValue?: (text: string) => void
  onRun?: () => void
  ref?: (api: EditorApi) => void
}

export type EditorApi = {
  /** Put the caret at a 1-based line and column and focus the editor. */
  reveal(line: number, column?: number): void
}

export default function Editor(props: EditorProps) {
  let area: HTMLTextAreaElement | undefined
  let numbers: HTMLElement | undefined
  const lines = createMemo(() => props.modelValue.split("\n").length)
  // The textarea scrolls itself (a long file stops at ~26 lines); the gutter
  // follows its scroll, so numbers and text never drift apart.
  const rows = createMemo(() => Math.min(lines(), 26))
  const follow = () => numbers && area && (numbers.scrollTop = area.scrollTop)
  const gutter = createMemo(() => Array.from({ length: lines() }, (_, i) => i + 1).join("\n"))
  let released = false

  /** Replace the selection, keeping the browser's own undo stack. */
  function insert(el: HTMLTextAreaElement, s: string) {
    if (!document.execCommand?.("insertText", false, s)) {
      el.setRangeText(s, el.selectionStart, el.selectionEnd, "end")
      el.dispatchEvent(new Event("input", { bubbles: true }))
    }
  }

  function indent(el: HTMLTextAreaElement, out: boolean) {
    const { selectionStart: a, selectionEnd: b, value } = el
    if (a === b && !out) return insert(el, "  ")
    const start = value.lastIndexOf("\n", a - 1) + 1
    const end = b > a && value[b - 1] === "\n" ? b - 1 : b
    const block = value.slice(start, end)
    const next = block
      .split("\n")
      .map((l) => (out ? l.replace(/^ {1,2}/, "") : `  ${l}`))
      .join("\n")
    if (next === block) return
    el.setSelectionRange(start, end)
    insert(el, next)
    el.setSelectionRange(a === b ? Math.max(start, a + (next.length - block.length)) : start, start + next.length)
  }

  function keydown(e: KeyboardEvent) {
    const el = e.target as HTMLTextAreaElement
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      props.onRun?.()
      return
    }
    if (e.key === "Escape") {
      released = true
      return
    }
    // Shift on its way to Shift+Tab keeps the release
    if (e.key === "Shift") return
    const leave = released
    released = false
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (isTab(e) && !leave) {
      e.preventDefault()
      indent(el, e.shiftKey)
    } else if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault()
      const line = el.value.slice(el.value.lastIndexOf("\n", el.selectionStart - 1) + 1, el.selectionStart)
      insert(el, `\n${/^\s*/.exec(line)![0]}`)
    }
  }

  props.ref?.({
    reveal(line, column = 1) {
      const el = area
      if (!el) return
      const rows = el.value.split("\n")
      const at = rows.slice(0, line - 1).reduce((n, r) => n + r.length + 1, 0) + Math.max(0, column - 1)
      el.focus()
      el.setSelectionRange(at, at)
    },
  })

  return (
    <div class="editor-scope src-editor" style={{ "--gutter": `${String(lines()).length + 3}ch` }}>
      <pre ref={(el) => (numbers = el)} class="src-gutter" aria-hidden="true">
        {gutter()}
      </pre>
      <textarea
        ref={(el) => (area = el)}
        value={props.modelValue}
        class="src-area"
        rows={rows()}
        wrap="off"
        spellcheck={false}
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        aria-label={props.label}
        aria-describedby={props.describedby}
        aria-keyshortcuts="Control+Enter Meta+Enter"
        onInput={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
        onKeyDown={keydown}
        onScroll={follow}
      />
    </div>
  )
}
