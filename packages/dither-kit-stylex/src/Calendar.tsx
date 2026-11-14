// Generated from @dither-ui/kit/solid/Calendar.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, For, mergeProps, on, onMount } from "solid-js"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: {
    marginBottom: "0.25rem",
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
  text: { fontSize: "13px", fontWeight: "500" },
  grid: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.125rem" },
  text2: {
    paddingBlock: "0.25rem",
    textAlign: "center",
    fontSize: "10px",
    letterSpacing: "0.025em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  box: {
    width: "16rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    padding: "0.5rem",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  button2: {
    aspectRatio: "1 / 1",
    borderRadius: "0.25rem",
    fontSize: "12px",
    fontVariantNumeric: "   tabular-nums ",
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
  },
  textForeground90: {
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
  textMutedForeground: {
    color: "var(--muted-foreground)",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--accent) 10%, transparent)",
      },
    },
  },
})

/** Month grid calendar: real grid semantics (`role="grid"`, arrows move the
 * day, PageUp/PageDown change month, Home/End jump to week edges), ISO
 * YYYY-MM-DD model so timezone math never enters the picture. Today gets a
 * ring, the selected day gets the fill. */
export type CalendarProps = {
  modelValue?: string
  min?: string
  max?: string
  disabled?: boolean
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  onSelect?: (value: string) => void
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function parseISO(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}
function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export default function Calendar(raw: CalendarProps) {
  const props = mergeProps({ modelValue: "", disabled: false }, raw)

  function clampISO(iso: string): string {
    if (props.min && iso < props.min) return props.min
    if (props.max && iso > props.max) return props.max
    return iso
  }

  const [cursor, setCursor] = createSignal(parseISO(props.modelValue) ?? new Date())
  // The month in view, as two numbers: the grid is rebuilt when the month
  // turns, not each time the day moves inside it.
  const year = createMemo(() => cursor().getFullYear())
  const month = createMemo(() => cursor().getMonth())

  const MONTH_LABEL = createMemo(() =>
    new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(cursor()),
  )

  const today = toISO(new Date())

  const weeks = createMemo(() => {
    const first = new Date(year(), month(), 1)
    const offset = (first.getDay() + 6) % 7 // Monday-first
    const start = new Date(first)
    start.setDate(first.getDate() - offset)
    const rows: Array<Array<{ iso: string; day: number; inMonth: boolean }>> = []
    const cur = new Date(start)
    for (let w = 0; w < 6; w++) {
      const row: Array<{ iso: string; day: number; inMonth: boolean }> = []
      for (let d = 0; d < 7; d++) {
        row.push({
          iso: toISO(cur),
          day: cur.getDate(),
          inMonth: cur.getMonth() === month(),
        })
        cur.setDate(cur.getDate() + 1)
      }
      rows.push(row)
    }
    return rows
  })

  function isDisabled(iso: string): boolean {
    return (props.min && iso < props.min) || (props.max && iso > props.max) || props.disabled ? true : false
  }

  function moveMonth(delta: number) {
    setCursor(new Date(year(), month() + delta, 1))
  }

  function pick(iso: string) {
    if (isDisabled(iso)) return
    props.onUpdateModelValue?.(iso)
    props.onSelect?.(iso)
  }

  function onKeydown(e: KeyboardEvent) {
    const base = parseISO(props.modelValue) ?? cursor()
    const d = new Date(base)
    if (e.key === "ArrowLeft") d.setDate(d.getDate() - 1)
    else if (e.key === "ArrowRight") d.setDate(d.getDate() + 1)
    else if (e.key === "ArrowUp") d.setDate(d.getDate() - 7)
    else if (e.key === "ArrowDown") d.setDate(d.getDate() + 7)
    else if (e.key === "PageUp") d.setMonth(d.getMonth() - 1)
    else if (e.key === "PageDown") d.setMonth(d.getMonth() + 1)
    else if (e.key === "Home") d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    else if (e.key === "End") d.setDate(d.getDate() + (6 - ((d.getDay() + 6) % 7)))
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pick(clampISO(toISO(base)))
      return
    } else return
    e.preventDefault()
    const next = clampISO(toISO(d))
    setCursor((was) => parseISO(next) ?? was)
    if (!isDisabled(next) && next !== props.modelValue) props.onUpdateModelValue?.(next)
  }

  // a model that moves outside the visible month re-centers the grid
  onMount(() => {
    createEffect(
      on(
        () => props.modelValue,
        (v) => {
          const d = parseISO(v)
          if (!d) return
          if (d.getFullYear() !== cursor().getFullYear() || d.getMonth() !== cursor().getMonth()) {
            setCursor(d)
          }
        },
        { defer: true },
      ),
    )
  })

  return (
    <div class={cn(styles.box, props.disabled && styles.pointerEventsNone, props.xstyle, props.class)}>
      <div {...stylex.props(styles.row)}>
        <button
          type="button"
          aria-label="Previous month"
          {...stylex.props(styles.button)}
          onClick={() => moveMonth(-1)}
        >
          ‹
        </button>
        <span {...stylex.props(styles.text)}>{MONTH_LABEL()}</span>
        <button type="button" aria-label="Next month" {...stylex.props(styles.button)} onClick={() => moveMonth(1)}>
          ›
        </button>
      </div>
      <div role="grid" aria-label={MONTH_LABEL()} {...stylex.props(styles.grid)} onKeyDown={onKeydown}>
        <For each={WEEKDAYS}>
          {(wd) => (
            <span role="columnheader" {...stylex.props(styles.text2)}>
              {wd}
            </span>
          )}
        </For>
        <For each={weeks()}>
          {(row) => (
            <For each={row}>
              {(cell) => (
                <button
                  id={`dk-cal-${cell.iso}`}
                  type="button"
                  role="gridcell"
                  tabindex={cell.iso === (props.modelValue || today) ? 0 : -1}
                  aria-selected={cell.iso === props.modelValue}
                  aria-current={cell.iso === today ? "date" : undefined}
                  disabled={isDisabled(cell.iso)}
                  class={cn(
                    styles.button2,
                    cell.iso === props.modelValue
                      ? styles.bgAccent20
                      : cell.iso === today
                        ? styles.textForeground
                        : cell.inMonth
                          ? styles.textForeground90
                          : styles.textMutedForeground,
                  )}
                  onClick={() => pick(cell.iso)}
                >
                  {cell.day}
                </button>
              )}
            </For>
          )}
        </For>
      </div>
    </div>
  )
}
