import { createSignal, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput from "./DitherInput"
import { useField } from "./runtime/field"

/** Click-to-edit text: view mode is a button (keyboard reachable; in a
 * DitherField it is what the label points at, named by the label and its
 * value), edit mode is a focus-selected input. Enter or blur commits (only when the value
 * actually changed), Escape reverts — the revert flag suppresses the blur
 * commit that would otherwise fire as the input unmounts. */
export type InlineEditProps = {
  /** @docs string (with onUpdateModelValue)
   * @default "" */
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  /** @docs (value) */
  onSave?: (value: string) => void
  /** @docs () */
  onCancel?: () => void
}

export default function InlineEdit(raw: InlineEditProps) {
  const props = mergeProps({ placeholder: "—", disabled: false }, raw)
  const field = useField()
  const named = () => {
    const label = field?.labelId?.()
    return label && field ? `${label} ${field.controlId()}-value` : undefined
  }

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
    <span class={cn("inline-flex w-full min-w-0", props.class)}>
      <Show
        when={editing()}
        fallback={
          <button
            type="button"
            id={field?.controlId()}
            aria-labelledby={named()}
            aria-describedby={field?.describedBy()}
            disabled={props.disabled}
            class={cn(
              "max-w-full truncate rounded px-1.5 py-1 text-left transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
              !props.modelValue && "text-muted-foreground",
              "font-mono text-[13px]",
            )}
            onClick={enterEdit}
          >
            <span id={field ? `${field.controlId()}-value` : undefined}>{props.modelValue || props.placeholder}</span>
          </button>
        }
      >
        <DitherInput
          ref={(el) => (rootEl = el)}
          modelValue={draft()}
          placeholder={props.placeholder}
          class="py-1"
          onUpdateModelValue={setDraft}
          on:keydown={onKeydown}
          on:blur={commit}
        />
      </Show>
    </span>
  )
}
