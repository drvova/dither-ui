import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { ICONS } from "../engine/icons"
import { cn } from "../tailwind/lib"
import Icon from "./Icon"

/** Icon picker over the kit's own glyph set: a filter field over the names
 * and a radio grid (native radio semantics — arrow keys navigate the whole
 * grid, one tab stop). Value = the icon name. */
export type IconPickerProps = {
  modelValue?: string
  placeholder?: string
  size?: number
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
}

const names = Object.keys(ICONS) as Array<keyof typeof ICONS> // Object.keys widens to string

export default function IconPicker(raw: IconPickerProps) {
  const props = mergeProps({ placeholder: "Filter icons…", size: 16, disabled: false }, raw)

  const [query, setQuery] = createSignal("")

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    return q === "" ? names : names.filter((n) => n.toLowerCase().includes(q))
  })

  return (
    <div
      class={cn(
        "grid gap-2 rounded-md border border-border bg-background/60 p-2",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
    >
      <input
        value={query()}
        type="search"
        placeholder={props.placeholder}
        disabled={props.disabled}
        class="min-h-8 w-full rounded border border-border/70 bg-transparent px-2 py-1 text-[12.5px] text-foreground outline-none placeholder:text-placeholder focus-visible:border-ring motion-reduce:transition-none"
        onInput={(e) => setQuery(e.currentTarget.value)}
      />
      <div class="grid max-h-48 grid-cols-6 gap-1 overflow-auto sm:grid-cols-8">
        <For each={filtered()}>
          {(name) => (
            <label
              title={name}
              class={cn(
                "grid aspect-square cursor-pointer place-items-center rounded border transition-colors motion-reduce:transition-none",
                props.modelValue === name
                  ? "border-accent/70 bg-accent/15 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <input
                class="sr-only"
                type="radio"
                name="dk-icon-picker"
                aria-label={name}
                value={name}
                checked={props.modelValue === name}
                disabled={props.disabled}
                onChange={() => props.onUpdateModelValue?.(name)}
              />
              <Icon name={name} size={props.size} />
            </label>
          )}
        </For>
        <Show when={filtered().length === 0}>
          <p class="col-span-full px-1 py-2 text-[12px] text-muted-foreground">No icons match “{query()}”</p>
        </Show>
      </div>
    </div>
  )
}
