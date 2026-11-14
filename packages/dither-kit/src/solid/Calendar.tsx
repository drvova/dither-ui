import { createEffect, createMemo, createSignal, For, mergeProps, on, onMount } from "solid-js"
import { cn } from "../tailwind/lib"

/** Month grid calendar: real grid semantics (`role="grid"`, arrows move the
 * day, PageUp/PageDown change month, Home/End jump to week edges), ISO
 * YYYY-MM-DD model so timezone math never enters the picture. Today gets a
 * ring, the selected day gets the fill. */
export type CalendarProps = {
  /** @docs string (ISO date, with onUpdateModelValue) */
  modelValue?: string
  /** @docs string (ISO) */
  min?: string
  /** @docs string (ISO) */
  max?: string
  disabled?: boolean
  class?: string
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
    <div
      class={cn(
        "w-64 rounded-md border border-border bg-background/60 p-2",
        props.disabled && "pointer-events-none opacity-40",
        props.class,
      )}
    >
      <div class="mb-1 flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous month"
          class="min-w-6 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
          onClick={() => moveMonth(-1)}
        >
          ‹
        </button>
        <span class="text-[13px] font-medium">{MONTH_LABEL()}</span>
        <button
          type="button"
          aria-label="Next month"
          class="min-w-6 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
          onClick={() => moveMonth(1)}
        >
          ›
        </button>
      </div>
      <div role="grid" aria-label={MONTH_LABEL()} class="grid grid-cols-7 gap-0.5" onKeyDown={onKeydown}>
        <For each={WEEKDAYS}>
          {(wd) => (
            <span
              role="columnheader"
              class="py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground"
            >
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
                    "aspect-square rounded text-[12px] tabular-nums transition-colors motion-reduce:transition-none",
                    cell.iso === props.modelValue
                      ? "bg-accent/20 text-foreground ring-1 ring-accent/60"
                      : cell.iso === today
                        ? "text-foreground ring-1 ring-foreground/30"
                        : cell.inMonth
                          ? "text-foreground/90 hover:bg-accent/10"
                          : "text-muted-foreground hover:bg-accent/10",
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
