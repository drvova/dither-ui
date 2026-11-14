// Generated from @dither-ui/kit/solid/DatePicker.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, mergeProps, Show } from "solid-js"
import { cn, type StyleProp } from "./lib"
import Calendar from "./Calendar"
import ClickOutside from "./ClickOutside"
import Icon from "./Icon"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  button: {
    display: "flex",
    minHeight: "2.5rem",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    textAlign: "left",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  icon: { flexShrink: "0", color: "var(--muted-foreground)" },
  layer: {
    position: "absolute",
    top: "100%",
    left: "0px",
    zIndex: "30",
    marginTop: "0.25rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  frame: { position: "relative" },
  text: { flex: "1" },
  textMutedForeground: { color: "var(--muted-foreground)" },
})

/** Date field + calendar popover: the input shows the ISO value in a human
 * format, the calendar opens on a click (Enter or Space from the keyboard;
 * focus alone opens nothing) with focus on its day, select closes, Escape
 * and outside-click dismiss (ClickOutside, capture-phase); a pick or Escape
 * hands focus back to the field. The model stays ISO YYYY-MM-DD. */
export type DatePickerProps = {
  modelValue?: string
  placeholder?: string
  min?: string
  max?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  onSelect?: (value: string) => void
}

export default function DatePicker(raw: DatePickerProps) {
  const props = mergeProps({ placeholder: "YYYY-MM-DD", disabled: false }, raw)

  const [open, setOpen] = createSignal(false)
  let trigger: HTMLButtonElement | undefined
  let panel: HTMLDivElement | undefined
  /** Open, and focus the calendar's day (the picked one, else today). */
  function show() {
    setOpen(true)
    queueMicrotask(() =>
      (panel?.querySelector<HTMLElement>('[tabindex="0"]') ?? panel?.querySelector("button"))?.focus(),
    )
  }
  /** Close; from the keyboard's Escape or a pick, focus goes back to the field. */
  function close(back: boolean) {
    setOpen(false)
    if (back) trigger?.focus()
  }

  const human = createMemo(() => {
    if (!props.modelValue) return ""
    if (!/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) return props.modelValue
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(`${props.modelValue}T00:00:00`),
    )
  })

  function onSelect(value: string) {
    props.onSelect?.(value)
    close(true)
  }

  return (
    <ClickOutside enabled={open()} onOutside={() => close(false)}>
      <div
        class={cn(styles.frame, props.xstyle, props.class)}
        on:keydown={(e) => {
          if (e.key !== "Escape") return
          e.stopPropagation()
          close(open())
        }}
      >
        <button
          ref={(el) => (trigger = el)}
          type="button"
          disabled={props.disabled}
          aria-haspopup="dialog"
          aria-expanded={open()}
          {...stylex.props(styles.button)}
          onClick={() => (open() ? close(false) : show())}
        >
          <span class={cn(styles.text, !props.modelValue && styles.textMutedForeground)}>
            {human() || props.placeholder}
          </span>
          <Icon name="Calendar" size={14} xstyle={styles.icon} />
        </button>
        <Show when={open()}>
          <div ref={(el) => (panel = el)} role="dialog" aria-label="Pick a date" {...stylex.props(styles.layer)}>
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
