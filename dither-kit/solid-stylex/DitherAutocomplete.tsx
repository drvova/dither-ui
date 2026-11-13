// Generated from ../solid/DitherAutocomplete.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
    width: "100%",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  layer: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.25rem",
    width: "100%",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
  },
  frame: { position: "relative" },
  box: {
    cursor: "pointer",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
  },
  bgBackground: { backgroundColor: "var(--background)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})

export type DitherAutocompleteProps = {
  suggestions: string[]
  modelValue: string
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
}

export default function DitherAutocomplete(raw: DitherAutocompleteProps) {
  const props = mergeProps({ placeholder: "Search…", disabled: false }, raw)

  const [open, setOpen] = createSignal(false)
  const [highlighted, setHighlighted] = createSignal(-1)

  const filtered = createMemo(() => {
    const q = props.modelValue.trim().toLowerCase()
    if (!q) return props.suggestions
    return props.suggestions.filter((s) => s.toLowerCase().includes(q))
  })

  function onInput(e: InputEvent & { currentTarget: HTMLInputElement }) {
    props.onUpdateModelValue?.(e.currentTarget.value)
    setOpen(true)
    setHighlighted(0)
  }

  function pick(s: string) {
    props.onUpdateModelValue?.(s)
    setOpen(false)
  }

  function move(dir: number) {
    const n = filtered().length
    if (!n) return
    setHighlighted((highlighted() + dir + n) % n)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open()) {
        setOpen(true)
        setHighlighted(0)
      } else {
        move(e.key === "ArrowDown" ? 1 : -1)
      }
    } else if (e.key === "Enter") {
      if (!open()) return
      e.preventDefault()
      const s = filtered()[highlighted()]
      if (s !== undefined) pick(s)
    } else if (e.key === "Escape" && open()) {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div class={cn(styles.frame, props.xstyle, props.class)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open() && filtered().length > 0}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.modelValue}
        {...stylex.props(styles.input)}
        onInput={onInput}
        onClick={() => setOpen(true)}
        onKeyDown={onKeydown}
        onBlur={() => setOpen(false)}
      />
      <Show when={open() && filtered().length}>
        <div role="listbox" {...stylex.props(styles.layer)}>
          <For each={filtered()}>
            {(s, i) => (
              <div
                role="option"
                aria-selected={s === props.modelValue}
                class={cn(styles.box, i() === highlighted() ? styles.bgBackground : styles.textMutedForeground)}
                onPointerEnter={() => setHighlighted(i())}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                {s}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
