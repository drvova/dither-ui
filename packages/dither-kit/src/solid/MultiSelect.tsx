import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import DitherInput from "./DitherInput"
import Icon from "./Icon"

/** Multi-select as chips + a filterable option list: native checkboxes carry
 * semantics (keyboard for free), the query narrows the pool, selected chips
 * stay visible and individually removable. `value` is the picked set. */
export type MultiSelectProps = {
  /** @default [] */
  options?: string[]
  /** @docs string[] (with onUpdateModelValue)
   * @default [] */
  value?: string[]
  placeholder?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string[]) => void
  /** @docs (query) as you type */
  onSearch?: (query: string) => void
}

export default function MultiSelect(raw: MultiSelectProps) {
  const props = mergeProps({ placeholder: "Search…", disabled: false }, raw)

  const [query, setQuery] = createSignal("")

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    const pool = props.options ?? []
    return q === "" ? pool : pool.filter((o) => o.toLowerCase().includes(q))
  })
  const selected = createMemo(() => props.value ?? [])

  function isChecked(option: string): boolean {
    return selected().includes(option)
  }

  function toggle(option: string, checked: boolean) {
    const next = checked ? [...selected(), option] : selected().filter((o) => o !== option)
    props.onUpdateModelValue?.(next)
  }

  function remove(option: string) {
    props.onUpdateModelValue?.(selected().filter((o) => o !== option))
  }

  return (
    <div
      class={cn(
        "grid gap-2 rounded-md border border-border bg-background/60 p-2",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
    >
      <Show when={selected().length > 0}>
        <div class="flex flex-wrap gap-1.5">
          <For each={selected()}>
            {(option) => (
              <span class="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-1.5 py-0.5 text-[12px]">
                {option}
                <button
                  type="button"
                  aria-label={`Remove ${option}`}
                  class="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
                  onClick={() => remove(option)}
                >
                  <Icon name="Close" size={10} />
                </button>
              </span>
            )}
          </For>
        </div>
      </Show>

      <DitherInput
        modelValue={query()}
        type="search"
        placeholder={props.placeholder}
        disabled={props.disabled}
        class="min-h-8 py-1"
        onUpdateModelValue={(v) => {
          setQuery(v)
          props.onSearch?.(v)
        }}
      />

      <ul class="grid max-h-44 gap-0.5 overflow-auto">
        <Show when={filtered().length === 0}>
          <li class="px-2 py-1.5 text-[12px] text-muted-foreground">No matches</li>
        </Show>
        <For each={filtered()}>
          {(option) => (
            <li>
              <label
                class={cn(
                  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/10 motion-reduce:transition-none",
                  isChecked(option) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <input
                  type="checkbox"
                  class="size-3.5 accent-[currentColor]"
                  checked={isChecked(option)}
                  disabled={props.disabled}
                  onChange={(e) => toggle(option, e.currentTarget.checked)}
                />
                {option}
              </label>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
