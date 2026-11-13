import { createMemo, createSignal, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"
import Calendar from "./Calendar"
import ClickOutside from "./ClickOutside"
import Icon from "./Icon"

/** Date field + calendar popover: the input shows the ISO value in a human
 * format, the calendar opens on click/focus, select closes, Escape and
 * outside-click dismiss (ClickOutside, capture-phase). The model stays ISO
 * YYYY-MM-DD. */
export type DatePickerProps = {
  modelValue?: string
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  class?: string
  onUpdateModelValue?: (value: string) => void
  onSelect?: (value: string) => void
}

export default function DatePicker(raw: DatePickerProps) {
  const props = mergeProps({ placeholder: "YYYY-MM-DD", disabled: false }, raw)

  const [open, setOpen] = createSignal(false)

  const human = createMemo(() => {
    if (!props.modelValue) return ""
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) return props.modelValue
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(`${props.modelValue}T00:00:00`),
    )
  })

  function onSelect(value: string) {
    props.onSelect?.(value)
    setOpen(false)
  }

  return (
    <ClickOutside enabled={open()} onOutside={() => setOpen(false)}>
      <div
        class={cn("relative", props.class)}
        on:keydown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          setOpen(false)
        }}
      >
        <button
          type="button"
          disabled={props.disabled}
          aria-haspopup="dialog"
          aria-expanded={open()}
          class="flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-left font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-placeholder hover:border-foreground/25 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
          onClick={() => setOpen(!open())}
          onFocus={() => setOpen(true)}
        >
          <span class={cn("flex-1", !props.modelValue && "text-muted-foreground")}>{human() || props.placeholder}</span>
          <Icon name="Calendar" size={14} class="shrink-0 text-muted-foreground" />
        </button>
        <Show when={open()}>
          <div role="dialog" aria-label="Pick a date" class="absolute left-0 top-full z-30 mt-1 shadow-lg">
            <Calendar
              modelValue={props.modelValue}
              min={props.min}
              max={props.max}
              onUpdateModelValue={(v) => props.onUpdateModelValue?.(v)}
              onSelect={onSelect}
            />
          </div>
        </Show>
      </div>
    </ClickOutside>
  )
}
