import { createEffect, createMemo, createSignal, For, mergeProps, on, onMount, Show } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"
import type { Option } from "./DitherSelect"
import { nextEnabled } from "../engine/keys"

export type DitherComboboxProps = {
  options: Option[]
  modelValue: string
  onUpdateModelValue?: (value: string) => void
  placeholder?: string
  color?: PixelColor
  disabled?: boolean
  class?: string
}

export default function DitherCombobox(raw: DitherComboboxProps) {
  const props = mergeProps({ placeholder: "Select…", color: "blue" as PixelColor, disabled: false }, raw)

  const [open, setOpen] = createSignal(false)
  const [highlighted, setHighlighted] = createSignal(-1)

  const selected = createMemo(() => props.options.find((o) => o.value === props.modelValue) ?? null)
  const marker = createMemo(() => cssColor(props.color))

  const [query, setQuery] = createSignal(selected()?.label ?? "")
  onMount(() => {
    createEffect(
      on(
        () => props.modelValue,
        () => setQuery(selected()?.label ?? ""),
        { defer: true },
      ),
    )
  })

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    if (!q) return props.options
    return props.options.filter((o) => o.label.toLowerCase().includes(q))
  })

  function openPanel() {
    setOpen(true)
    const i = filtered().findIndex((o) => o.value === props.modelValue && !o.disabled)
    setHighlighted(i >= 0 ? i : filtered().findIndex((o) => !o.disabled))
  }

  function onInput(e: InputEvent & { currentTarget: HTMLInputElement }) {
    setQuery(e.currentTarget.value)
    setOpen(true)
    setHighlighted(filtered().findIndex((o) => !o.disabled))
  }

  function pick(o: Option) {
    if (o.disabled) return
    props.onUpdateModelValue?.(o.value)
    setQuery(o.label)
    setOpen(false)
  }

  /** Blur / Escape — snap the text back to the last valid value. */
  function revert() {
    setOpen(false)
    setQuery(selected()?.label ?? "")
  }

  function move(dir: number) {
    const i = nextEnabled(filtered(), highlighted(), dir)
    if (i >= 0) setHighlighted(i)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      if (!open()) openPanel()
      else move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Enter") {
      if (!open()) return
      e.preventDefault()
      const o = filtered()[highlighted()]
      if (o) pick(o)
    } else if (e.key === "Escape" && open()) {
      e.preventDefault()
      revert()
    }
  }

  return (
    <div class={cn("relative", props.class)}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open()}
        aria-autocomplete="list"
        aria-haspopup="listbox"
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={query()}
        class="w-full rounded-md border border-border bg-background/60 px-3 py-2 pr-8 font-mono text-[13px] text-foreground placeholder:text-placeholder focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        onInput={onInput}
        onClick={() => open() || openPanel()}
        onKeyDown={onKeydown}
        onBlur={revert}
      />
      <span
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
      >
        ▾
      </span>
      <Show when={open()}>
        <div role="listbox" class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1">
          <Show when={!filtered().length}>
            <div class="px-2 py-1.5 text-[12px] text-muted-foreground italic">no matches</div>
          </Show>
          <For each={filtered()}>
            {(o, i) => (
              <div
                role="option"
                aria-selected={o.value === props.modelValue}
                aria-disabled={o.disabled || undefined}
                class={cn(
                  "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-[12px]",
                  i() === highlighted() && !o.disabled ? "bg-background" : "",
                  o.disabled
                    ? "cursor-default opacity-40"
                    : o.value === props.modelValue || i() === highlighted()
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
                onPointerEnter={() => !o.disabled && setHighlighted(i())}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
              >
                <span>{o.label}</span>
                <Show when={o.value === props.modelValue}>
                  <span
                    aria-hidden="true"
                    class="size-2 shrink-0"
                    style={{ "background-color": marker(), "image-rendering": "pixelated" }}
                  />
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
