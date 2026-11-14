// Generated from @dither-ui/kit/solid/TagInput.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, Index, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "var(--card)",
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "12px",
  },
  button: {
    margin: "-5px",
    borderRadius: "0.25rem",
    padding: "7px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  input: {
    minWidth: "5rem",
    flex: "1",
    backgroundColor: "transparent",
    fontSize: "13px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
  },
  row2: {
    display: "flex",
    minHeight: "2.5rem",
    width: "100%",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: { default: "var(--border)", ":focus-within": "var(--ring)" },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
})

/** Tags as chips in one field: Enter or comma commits, Backspace on an empty
 * input pulls the last chip back in, per-chip × removes. Trimmed, case-
 * deduped, `max`-capped (the oldest chip stays put when full). */
export type TagInputProps = {
  modelValue?: string[]
  placeholder?: string
  max?: number
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string[]) => void
}

export default function TagInput(raw: TagInputProps) {
  const props = mergeProps({ placeholder: "Add tag…", max: Infinity, disabled: false }, raw)

  const [draft, setDraft] = createSignal("")

  function add(text: string) {
    const tag = text.trim()
    if (!tag || props.disabled) return
    const current = props.modelValue ?? []
    if (current.length >= props.max) return
    if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("")
      return
    }
    props.onUpdateModelValue?.([...current, tag])
    setDraft("")
  }

  function remove(index: number) {
    const next = (props.modelValue ?? []).filter((_, i) => i !== index)
    props.onUpdateModelValue?.(next)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      add(draft())
    } else if (e.key === "Backspace" && draft() === "") {
      const current = props.modelValue ?? []
      if (current.length > 0) remove(current.length - 1)
    }
  }

  return (
    <div class={cn(styles.row2, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}>
      <Index each={props.modelValue ?? []}>
        {(tag, i) => (
          <span {...stylex.props(styles.row)}>
            {tag()}
            <button
              type="button"
              aria-label={`Remove ${tag()}`}
              {...stylex.props(styles.button)}
              onClick={() => remove(i)}
            >
              <Icon name="Close" size={10} />
            </button>
          </span>
        )}
      </Index>
      <Show when={!props.disabled}>
        <input
          value={draft()}
          placeholder={(props.modelValue ?? []).length === 0 ? props.placeholder : ""}
          aria-label={props.placeholder || "Add a tag"}
          {...stylex.props(styles.input)}
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={onKeydown}
          onBlur={() => add(draft())}
        />
      </Show>
    </div>
  )
}
