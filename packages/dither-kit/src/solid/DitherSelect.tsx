import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from "solid-js"
import { isTab, nextEnabled } from "../engine/keys"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL, CONTROL_INVALID, POPOVER } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { useField } from "./runtime/field"
import { Presence } from "./runtime/presence"
import "./DitherSelect.css"

export type Option = { value: string; label: string; disabled?: boolean }

type Own = {
  options: Option[]
  modelValue: string
  onUpdateModelValue?: (value: string) => void
  placeholder?: string
  color?: PixelColor
  disabled?: boolean
  invalid?: boolean
  class?: string
}
const OWN = [
  "options",
  "modelValue",
  "onUpdateModelValue",
  "placeholder",
  "color",
  "disabled",
  "invalid",
  "class",
] as const satisfies readonly (keyof Own)[]

/** `class` sits on the root; everything else a `<button>` takes (listeners,
 * ARIA) reaches the trigger. */
export type DitherSelectProps = Own & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, keyof Own>

export default function DitherSelect(raw: DitherSelectProps) {
  const merged = mergeProps(
    { placeholder: "Select…", color: "blue" as PixelColor, disabled: false, invalid: false },
    raw,
  )
  const [props, rest] = splitProps(merged, OWN)
  const field = useField()
  let root: HTMLDivElement | undefined
  let trigger: HTMLButtonElement | undefined
  const [open, setOpen] = createSignal(false)
  const [highlighted, setHighlighted] = createSignal(-1)
  const idBase = `dk-select-${createUniqueId()}`
  const listId = `${idBase}-listbox`
  const selected = createMemo(() => props.options.find((o) => o.value === props.modelValue) ?? null)
  const marker = createMemo(() => cssColor(props.color))
  const invalid = createMemo(() => props.invalid || field?.invalid() || false)
  const optionId = (i: number) => `${idBase}-option-${i}`

  function openPanel() {
    if (props.disabled) return
    setOpen(true)
    const selectedIndex = props.options.findIndex((o) => o.value === props.modelValue && !o.disabled)
    setHighlighted(selectedIndex >= 0 ? selectedIndex : props.options.findIndex((o) => !o.disabled))
  }
  function close() {
    setOpen(false)
  }
  function pick(o: Option) {
    if (o.disabled) return
    props.onUpdateModelValue?.(o.value)
    close()
    queueMicrotask(() => trigger?.focus())
  }
  function move(dir: number) {
    const i = nextEnabled(props.options, highlighted(), dir)
    if (i >= 0) setHighlighted(i)
  }
  function edge(toEnd: boolean) {
    const enabled = props.options.map((o, i) => ({ o, i })).filter(({ o }) => !o.disabled)
    setHighlighted(enabled[toEnd ? enabled.length - 1 : 0]?.i ?? -1)
  }
  function onKeydown(e: KeyboardEvent) {
    if (!open()) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault()
        openPanel()
        if (e.key === "ArrowUp") edge(true)
      }
      return
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      move(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault()
      edge(e.key === "End")
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const option = props.options[highlighted()]
      if (option) pick(option)
    } else if (e.key === "Escape" || isTab(e)) close()
  }
  function onOutside(e: PointerEvent) {
    if (open() && root && !root.contains(e.target as Node)) close()
  }
  onMount(() => {
    document.addEventListener("pointerdown", onOutside)
    onCleanup(() => document.removeEventListener("pointerdown", onOutside))
  })

  return (
    <div ref={(el) => (root = el)} class={cn("relative", props.class)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={listId}
        aria-activedescendant={open() && highlighted() >= 0 ? optionId(highlighted()) : undefined}
        aria-invalid={invalid() || undefined}
        aria-describedby={field?.describedBy()}
        id={field?.controlId()}
        disabled={props.disabled}
        style={invalid() ? { "border-color": cssColor("red") } : undefined}
        class={cn(CONTROL, invalid() && CONTROL_INVALID, "flex w-full items-center justify-between gap-3 text-left")}
        {...rest}
        ref={(el) => (trigger = el)}
        // Its own listeners, beside any handed in with the rest.
        on:click={() => (open() ? close() : openPanel())}
        on:keydown={onKeydown}
      >
        <span class={cn("truncate", selected() ? "text-foreground" : "text-muted-foreground")}>
          {selected()?.label ?? props.placeholder}
        </span>
        <span
          aria-hidden="true"
          class={cn(
            "text-muted-foreground transition-transform motion-reduce:transition-none",
            open() ? "rotate-180" : "",
          )}
        >
          ⌄
        </span>
      </button>
      <Presence when={open()} name="dk-popover">
        <div
          id={listId}
          role="listbox"
          class={cn(POPOVER, "absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto p-1")}
        >
          <For each={props.options}>
            {(o, i) => (
              <div
                id={optionId(i())}
                role="option"
                aria-selected={o.value === props.modelValue}
                aria-disabled={o.disabled || undefined}
                class={cn(
                  "flex min-h-9 items-center justify-between rounded-md px-2.5 py-1.5 text-[12px]",
                  i() === highlighted() && !o.disabled ? "bg-background text-foreground" : "",
                  o.disabled
                    ? "cursor-default opacity-40"
                    : "cursor-pointer text-muted-foreground hover:bg-background hover:text-foreground",
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
      </Presence>
    </div>
  )
}
