// Generated from @dither-ui/kit/solid/MonthPicker.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createSignal, For, mergeProps } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    marginBottom: "0.375rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: "0.25rem",
  },
  button: {
    minWidth: "1.5rem",
    borderRadius: "0.25rem",
    padding: "0.375rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text: { fontSize: "13px", fontWeight: "500", fontVariantNumeric: "   tabular-nums " },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.25rem" },
  box: {
    width: "14rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  rounded: {
    borderRadius: "0.25rem",
    paddingInline: "0.25rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgAccent20: {
    backgroundColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
    color: "var(--foreground)",
    boxShadow: "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--accent) 60%, transparent)",
  },
  textForeground: {
    color: "var(--foreground)",
    boxShadow: "0 0 0 calc(1px + 0px) color-mix(in oklab, var(--foreground) 30%, transparent)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
})

export type MonthPickerProps = {
  modelValue?: string
  onUpdateModelValue?: (value: string) => void
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function parse(v: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(v)
  const now = new Date()
  return m ? { year: Number(m[1]), month: Number(m[2]) - 1 } : { year: now.getFullYear(), month: now.getMonth() }
}

/** Year + twelve-month grid: model is `YYYY-MM`, arrows roam the grid,
 * PageUp/PageDown shift the year, the current month gets a ring. */
export default function MonthPicker(raw: MonthPickerProps) {
  const props = mergeProps({ modelValue: "", disabled: false }, raw)

  const parsed = createMemo(() => parse(props.modelValue))
  const [year, setYear] = createSignal(parsed().year)
  const [active, setActive] = createSignal(parsed().month)
  const now = new Date()

  function iso(month: number, y = year()): string {
    return `${y}-${String(month + 1).padStart(2, "0")}`
  }

  function shiftYear(delta: number) {
    setYear((y) => y + delta)
  }

  function choose(month: number) {
    setActive(month)
    props.onUpdateModelValue?.(iso(month))
  }

  function onKeydown(e: KeyboardEvent) {
    let next: number
    if (e.key === "ArrowLeft") next = (active() + 11) % 12
    else if (e.key === "ArrowRight") next = (active() + 1) % 12
    else if (e.key === "ArrowUp")
      next = (active() + 9) % 12 // three columns
    else if (e.key === "ArrowDown") next = (active() + 3) % 12
    else if (e.key === "PageUp") {
      e.preventDefault()
      shiftYear(-1)
      return
    } else if (e.key === "PageDown") {
      e.preventDefault()
      shiftYear(1)
      return
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      choose(active())
      return
    } else return
    e.preventDefault()
    setActive(next)
    props.onUpdateModelValue?.(iso(next))
  }

  return (
    <div class={cn(styles.box, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}>
      <div {...stylex.props(styles.row)}>
        <button type="button" aria-label="Previous year" {...stylex.props(styles.button)} onClick={() => shiftYear(-1)}>
          ‹
        </button>
        <span {...stylex.props(styles.text)}>{year()}</span>
        <button type="button" aria-label="Next year" {...stylex.props(styles.button)} onClick={() => shiftYear(1)}>
          ›
        </button>
      </div>
      <div role="group" aria-label={`Months of ${year()}`} {...stylex.props(styles.grid)} onKeyDown={onKeydown}>
        <For each={MONTHS}>
          {(label, m) => (
            <button
              type="button"
              tabindex={m() === active() ? 0 : -1}
              aria-pressed={iso(m()) === props.modelValue}
              class={cn([
                styles.rounded,
                iso(m()) === props.modelValue
                  ? styles.bgAccent20
                  : m() === now.getMonth() && year() === now.getFullYear()
                    ? styles.textForeground
                    : styles.textMutedForeground,
              ])}
              onClick={() => choose(m())}
            >
              {label}
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
