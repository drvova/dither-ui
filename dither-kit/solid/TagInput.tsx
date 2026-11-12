import { createSignal, Index, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import Icon from "./Icon"

/** Tags as chips in one field: Enter or comma commits, Backspace on an empty
 * input pulls the last chip back in, per-chip × removes. Trimmed, case-
 * deduped, `max`-capped (the oldest chip stays put when full). */
export type TagInputProps = {
  modelValue?: string[]
  placeholder?: string
  max?: number
  disabled?: boolean
  class?: string
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
    <div
      class={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-border bg-background/60 px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-ring motion-reduce:transition-none",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
    >
      <Index each={props.modelValue ?? []}>
        {(tag, i) => (
          <span class="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-1.5 py-0.5 text-[12px]">
            {tag()}
            <button
              type="button"
              aria-label={`Remove ${tag()}`}
              class="-m-[5px] rounded p-[7px] text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
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
          class="min-w-20 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-placeholder"
          onInput={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={onKeydown}
          onBlur={() => add(draft())}
        />
      </Show>
    </div>
  )
}
