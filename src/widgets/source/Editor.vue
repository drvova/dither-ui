<script setup lang="ts">
// The source editor: a plain textarea beside a line gutter — native undo,
// selection, spellcheck-off typing, IME and screen readers for free. Tab
// indents and Shift+Tab outdents the lines in the selection; Escape hands
// the next Tab back to the page, so the editor never traps the keyboard;
// Enter keeps the line's indent; ⌘/Ctrl+Enter runs.
import { computed, ref } from "vue"

defineProps<{ label: string; describedby?: string }>()
const text = defineModel<string>({ required: true })
const emit = defineEmits<{ run: [] }>()
const area = ref<HTMLTextAreaElement | null>(null)
const numbers = ref<HTMLElement | null>(null)
const lines = computed(() => text.value.split("\n").length)
// The textarea scrolls itself (a long file stops at ~26 lines); the gutter
// follows its scroll, so numbers and text never drift apart.
const rows = computed(() => Math.min(lines.value, 26))
const follow = () => numbers.value && area.value && (numbers.value.scrollTop = area.value.scrollTop)
const gutter = computed(() => Array.from({ length: lines.value }, (_, i) => i + 1).join("\n"))
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
    emit("run")
    return
  }
  if (e.key === "Escape") {
    released = true
    return
  }
  const leave = released
  released = false
  if (e.altKey || e.ctrlKey || e.metaKey) return
  if (e.key === "Tab" && !leave) {
    e.preventDefault()
    indent(el, e.shiftKey)
  } else if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    const line = el.value.slice(el.value.lastIndexOf("\n", el.selectionStart - 1) + 1, el.selectionStart)
    insert(el, `\n${/^\s*/.exec(line)![0]}`)
  }
}

defineExpose({
  /** Put the caret at a 1-based line and column and focus the editor. */
  reveal(line: number, column = 1) {
    const el = area.value
    if (!el) return
    const rows = el.value.split("\n")
    const at = rows.slice(0, line - 1).reduce((n, r) => n + r.length + 1, 0) + Math.max(0, column - 1)
    el.focus()
    el.setSelectionRange(at, at)
  },
})
</script>

<template>
  <div class="src-editor" :style="{ '--gutter': `${String(lines).length + 3}ch` }">
    <pre ref="numbers" class="src-gutter" aria-hidden="true">{{ gutter }}</pre>
    <textarea
      ref="area"
      v-model="text"
      class="src-area"
      :rows="rows"
      wrap="off"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      autocorrect="off"
      :aria-label="label"
      :aria-describedby="describedby"
      aria-keyshortcuts="Control+Enter Meta+Enter"
      @keydown="keydown"
      @scroll="follow"
    />
  </div>
</template>

<style scoped>
/* The textarea alone sets the height; the gutter is laid over its left
   padding and scrolled with it. */
.src-editor {
  position: relative;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.65;
}

/* iOS sets its fields at 16px at least (app/styles.css): the gutter, which
   inherits the editor's size, grows with the textarea it numbers. */
@supports (-webkit-touch-callout: none) {
  .src-editor {
    font-size: 16px;
  }
}

.src-gutter {
  position: absolute;
  inset: 2px auto 2px 2px;
  z-index: 1;
  width: var(--gutter);
  margin: 0;
  padding: 12px 10px 40px 0;
  overflow: hidden;
  text-align: right;
  color: color-mix(in oklab, var(--color-muted-foreground) 55%, transparent);
  background: var(--color-background);
  user-select: none;
  pointer-events: none;
  font: inherit;
}

/* The ring goes on the frame: the gutter sits over the textarea's edge. */
.src-editor:has(.src-area:focus-visible) {
  outline: 1px solid var(--ring);
  outline-offset: -2px;
}

.src-area:focus-visible {
  outline: none;
}

.src-area {
  display: block;
  width: 100%;
  max-height: 70dvh;
  padding: 14px 14px 14px calc(var(--gutter) + 8px);
  resize: none;
  overflow: auto;
  overscroll-behavior: contain;
  white-space: pre;
  tab-size: 2;
  color: var(--color-foreground);
  background: transparent;
  font: inherit;
  caret-color: var(--color-foreground);
}
</style>
