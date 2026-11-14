import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { isTab } from "../engine/keys"
import { cn } from "../tailwind/lib"

/** @-mention autocomplete over a textarea: detection is a regex on the text
 * before the caret (`/@(\w*)$/`), the list anchors to the field (not the
 * caret — no mirror div), Arrow keys pick, Enter/Tab inserts, Escape closes.
 * Selection replaces the @query and leaves the caret after a space. A key
 * that moves no caret (Tab coming in, Escape) opens nothing, so Tab always
 * leaves: once to insert, then on. */
export type MentionInputProps = {
  /** @docs string (with onUpdateModelValue)
   * @default "" */
  modelValue?: string
  options?: string[]
  placeholder?: string
  rows?: number
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** @docs (handle) on insert */
  onMention?: (value: string) => void
}

/** Keys that move no caret: their keyup never opens the list. */
const STILL_KEYS = new Set(["Escape", "Shift", "Control", "Alt", "Meta", "Enter"])

export default function MentionInput(raw: MentionInputProps) {
  const props = mergeProps(
    { options: [] as string[], placeholder: "Write… use @ to mention", rows: 3, disabled: false },
    raw,
  )

  let el: HTMLTextAreaElement | undefined
  const [open, setOpen] = createSignal(false)
  const [query, setQuery] = createSignal("")
  let start = 0 // caret index where the @ begins
  const [active, setActive] = createSignal(0)

  const matches = createMemo(() => {
    const q = query().toLowerCase()
    return props.options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8)
  })

  function syncOpen() {
    const node = el
    if (!node) return
    const caret = node.selectionStart ?? node.value.length
    const m = node.value.slice(0, caret).match(/@([\w-]*)$/)
    if (m) {
      setQuery(m[1])
      start = caret - m[1].length - 1
      setActive(0)
      setOpen(matches().length > 0)
    } else {
      setOpen(false)
    }
  }

  function choose(option: string) {
    const text = props.modelValue ?? ""
    const node = el
    const caret = node?.selectionStart ?? text.length
    const next = `${text.slice(0, start)}@${option} ${text.slice(caret)}`
    props.onUpdateModelValue?.(next)
    props.onMention?.(option)
    setOpen(false)
    requestAnimationFrame(() => {
      if (!node) return
      const pos = start + option.length + 2
      node.focus()
      node.setSelectionRange(pos, pos)
    })
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open()) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((active() + 1) % matches().length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((active() - 1 + matches().length) % matches().length)
    } else if (e.key === "Enter" || isTab(e)) {
      const pick = matches()[active()]
      if (pick) {
        e.preventDefault()
        choose(pick)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div class="relative">
      <textarea
        ref={(node) => (el = node)}
        value={props.modelValue ?? ""}
        placeholder={props.placeholder}
        rows={props.rows}
        disabled={props.disabled}
        class={cn(
          "min-h-20 w-full resize-y rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-placeholder hover:border-foreground/25 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none",
          props.class,
        )}
        onInput={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
        onKeyUp={(e) => isTab(e) || STILL_KEYS.has(e.key) || syncOpen()}
        onClick={syncOpen}
        onKeyDown={onKeydown}
      />
      <Show when={open() && matches().length > 0}>
        <ul
          role="listbox"
          aria-label="Mention suggestions"
          class="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          <For each={matches()}>
            {(option, i) => (
              <li
                role="option"
                aria-selected={i() === active()}
                class={cn(
                  "cursor-pointer rounded px-2 py-1.5 text-[12.5px] transition-colors",
                  i() === active() ? "bg-accent/20 text-foreground" : "text-muted-foreground",
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(option)
                }}
                onMouseMove={() => setActive(i())}
              >
                {option}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
