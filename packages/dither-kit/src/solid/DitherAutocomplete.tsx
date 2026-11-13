import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

export type DitherAutocompleteProps = {
  suggestions: string[]
  modelValue: string
  placeholder?: string
  disabled?: boolean
  class?: string
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
    <div class={cn("relative", props.class)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open() && filtered().length > 0}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.modelValue}
        class="w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-placeholder focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        onInput={onInput}
        onClick={() => setOpen(true)}
        onKeyDown={onKeydown}
        onBlur={() => setOpen(false)}
      />
      <Show when={open() && filtered().length}>
        <div role="listbox" class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1">
          <For each={filtered()}>
            {(s, i) => (
              <div
                role="option"
                aria-selected={s === props.modelValue}
                class={cn(
                  "cursor-pointer rounded-md px-2 py-1.5 text-[12px]",
                  i() === highlighted()
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
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
