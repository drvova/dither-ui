// Generated from @dither-ui/kit/solid/InlineEdit.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createSignal, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import DitherInput from "./DitherInput"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: { paddingBlock: "0.25rem" },
  row: { display: "inline-flex", width: "100%", minWidth: "0px" },
  button: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    borderRadius: "0.25rem",
    paddingInline: "0.375rem",
    paddingBlock: "0.25rem",
    textAlign: "left",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(2px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  textMutedForeground: { color: "var(--muted-foreground)" },
  button2: { fontFamily: "var(--font-mono)", fontSize: "13px" },
})

/** Click-to-edit text: view mode is a button (keyboard reachable), edit mode
 * is a focus-selected input. Enter or blur commits (only when the value
 * actually changed), Escape reverts — the revert flag suppresses the blur
 * commit that would otherwise fire as the input unmounts. */
export type InlineEditProps = {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  onSave?: (value: string) => void
  onCancel?: () => void
}

export default function InlineEdit(raw: InlineEditProps) {
  const props = mergeProps({ placeholder: "—", disabled: false }, raw)

  const [editing, setEditing] = createSignal(false)
  const [draft, setDraft] = createSignal("")
  let canceled = false
  let rootEl: HTMLInputElement | undefined

  function enterEdit() {
    if (props.disabled) return
    setDraft(props.modelValue ?? "")
    canceled = false
    setEditing(true)
    queueMicrotask(() => {
      rootEl?.focus()
      rootEl?.select()
    })
  }

  function commit() {
    if (canceled) {
      canceled = false
      return
    }
    // The input leaves the page as editing ends, and blurs as it goes: that
    // blur finds the commit already made.
    if (!editing()) return
    setEditing(false)
    const value = draft()
    if (value !== (props.modelValue ?? "")) {
      props.onUpdateModelValue?.(value)
      props.onSave?.(value)
    }
  }

  function cancel() {
    canceled = true
    setDraft(props.modelValue ?? "")
    setEditing(false)
    props.onCancel?.()
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      commit()
    } else if (e.key === "Escape") {
      e.stopPropagation()
      e.preventDefault()
      cancel()
    }
  }

  return (
    <span class={cn(styles.row, props.xstyle, props.class)}>
      <Show
        when={editing()}
        fallback={
          <button
            type="button"
            disabled={props.disabled}
            class={cn(styles.button, !props.modelValue && styles.textMutedForeground, styles.button2)}
            onClick={enterEdit}
          >
            {props.modelValue || props.placeholder}
          </button>
        }
      >
        <DitherInput
          ref={(el) => (rootEl = el)}
          modelValue={draft()}
          placeholder={props.placeholder}
          xstyle={styles.input}
          onUpdateModelValue={setDraft}
          on:keydown={onKeydown}
          on:blur={commit}
        />
      </Show>
    </span>
  )
}
