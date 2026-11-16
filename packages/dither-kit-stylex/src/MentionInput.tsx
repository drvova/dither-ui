// Generated from @dither-ui/kit/solid/MentionInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { isTab } from "@dither-ui/kit/engine/keys.ts"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  ul: {
    position: "absolute",
    top: "100%",
    right: "0px",
    left: "0px",
    zIndex: "20",
    marginTop: "0.25rem",
    maxHeight: "12rem",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--popover)",
    padding: "0.25rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  textarea: {
    minHeight: "5rem",
    width: "100%",
    resize: "vertical",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  li: {
    cursor: "pointer",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12.5px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgAccent20: {
    backgroundColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
    color: "var(--foreground)",
  },
  textMutedForeground: { color: "var(--muted-foreground)" },
})

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
  xstyle?: StyleProp
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
    <div {...stylex.props(styles.frame)}>
      <textarea
        ref={(node) => (el = node)}
        value={props.modelValue ?? ""}
        placeholder={props.placeholder}
        rows={props.rows}
        disabled={props.disabled}
        class={cn(styles.textarea, props.xstyle, props.class)}
        onInput={(e) => props.onUpdateModelValue?.(e.currentTarget.value)}
        onKeyUp={(e) => isTab(e) || STILL_KEYS.has(e.key) || syncOpen()}
        onClick={syncOpen}
        onKeyDown={onKeydown}
      />
      <Show when={open() && matches().length > 0}>
        <ul role="listbox" aria-label="Mention suggestions" {...stylex.props(styles.ul)}>
          <For each={matches()}>
            {(option, i) => (
              <li
                role="option"
                aria-selected={i() === active()}
                class={cn(styles.li, i() === active() ? styles.bgAccent20 : styles.textMutedForeground)}
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
