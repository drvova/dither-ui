import { createMemo, createUniqueId, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

export type ChoiceChipsProps = {
  /** @docs string (names the group, shown over the chips)
   * @default "" */
  label?: string
  options?: string[]
  /** The choice; `value` is the older name, still read.
   * @docs string | string[] (with onUpdateModelValue; `value` still read)
   * @default "" / [] */
  modelValue?: string | string[]
  value?: string | string[]
  /** @docs boolean (checkbox mode)
   * @default false */
  multiple?: boolean
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string | string[]) => void
}

/** Chip-style choice group: the chip is the LABEL of a real radio (or
 * checkbox when `multiple`), so native keyboard semantics and focus come for
 * free — no roving tabindex to get wrong; the radios share one name, so the
 * arrows move between them and the group is one Tab stop. `value` is a
 * string for single and a string array for multiple. `label` names the
 * group: shown on its own line over the chips and tied to it. */
export default function ChoiceChips(raw: ChoiceChipsProps) {
  const props = mergeProps({ options: [] as string[], disabled: false }, raw)
  const base = `dk-chips-${createUniqueId()}`

  const current = createMemo(() => props.modelValue ?? props.value)
  const selected = createMemo(() => {
    const c = current()
    return props.multiple ? (Array.isArray(c) ? c : []) : typeof c === "string" ? c : ""
  })

  function isChecked(option: string): boolean {
    const s = selected()
    return Array.isArray(s) ? s.includes(option) : s === option
  }

  function onChange(option: string, checked: boolean) {
    const s = selected()
    if (Array.isArray(s)) {
      const set = new Set(s)
      if (checked) set.add(option)
      else set.delete(option)
      props.onUpdateModelValue?.([...set])
    } else {
      props.onUpdateModelValue?.(option)
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={props.label ? `${base}-label` : undefined}
      class={cn("flex flex-wrap gap-1.5", props.class)}
      aria-disabled={props.disabled || undefined}
    >
      <Show when={props.label}>
        <span id={`${base}-label`} class="basis-full text-[12px] font-medium text-foreground/90">
          {props.label}
        </span>
      </Show>
      <For each={props.options}>
        {(option) => (
          <label
            class={cn(
              "cursor-pointer select-none rounded-full border px-3 py-1.5 text-[12px] transition-colors motion-reduce:transition-none",
              isChecked(option)
                ? "border-accent/70 bg-accent/15 text-foreground"
                : "border-border/70 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              props.disabled && "pointer-events-none opacity-40",
            )}
          >
            <input
              class="sr-only"
              type={props.multiple ? "checkbox" : "radio"}
              name={`${base}-choice`}
              value={option}
              checked={isChecked(option)}
              disabled={props.disabled}
              onChange={(e) => onChange(option, e.currentTarget.checked)}
            />
            {option}
          </label>
        )}
      </For>
    </div>
  )
}
