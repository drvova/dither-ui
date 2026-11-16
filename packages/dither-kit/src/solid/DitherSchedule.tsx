import { createMemo, For, mergeProps, Show } from "solid-js"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { cn } from "../tailwind/lib"

export type ScheduleEvent = { start: number; end: number; label: string; color?: PixelColor }

/** Day timeline — an hour rail with events placed proportionally, and an
 * optional now line. Hours are fractional (9.5 is half past nine). */
export type DitherScheduleProps = {
  /** @docs { start, end, label, color? }[]: fractional hours
   * @default required */
  events: ScheduleEvent[]
  /** Day window, fractional hours.
   * @docs number: day window */
  from?: number
  /** @docs number: day window */
  to?: number
  /** Draw the now line at this hour; omit to hide.
   * @docs number: draws the now line; omit to hide
   * @default undefined */
  now?: number
  class?: string
}

export default function DitherSchedule(raw: DitherScheduleProps) {
  const props = mergeProps({ from: 8, to: 18 }, raw)

  const span = createMemo(() => Math.max(1, props.to - props.from))
  const pct = (h: number) => `${((Math.min(Math.max(h, props.from), props.to) - props.from) / span()) * 100}%`
  const hours = createMemo(() =>
    Array.from({ length: Math.floor(props.to) - Math.ceil(props.from) + 1 }, (_, i) => Math.ceil(props.from) + i),
  )
  const fmt = (h: number) =>
    `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
  const now = () =>
    props.now !== undefined && props.now >= props.from && props.now <= props.to ? props.now : undefined

  return (
    <div class={cn("flex gap-2 font-mono", props.class)} role="group" aria-label="Day schedule">
      <div class="relative w-10 shrink-0 text-right" aria-hidden="true">
        <For each={hours()}>
          {(h) => (
            <span
              class="absolute right-0 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground"
              style={{ top: pct(h) }}
            >
              {String(h).padStart(2, "0")}
            </span>
          )}
        </For>
      </div>
      <div class="relative min-h-48 flex-1 overflow-hidden rounded-md border border-border/60 bg-background/40">
        <For each={hours()}>
          {(h) => <span aria-hidden="true" class="absolute inset-x-0 h-px bg-border/30" style={{ top: pct(h) }} />}
        </For>
        <For each={props.events}>
          {(e) => (
            <div
              class="absolute inset-x-1.5 overflow-hidden rounded-[4px] border border-border/60 bg-card/80 px-2 py-1"
              style={{
                top: pct(e.start),
                height: `calc(${((Math.min(e.end, props.to) - Math.max(e.start, props.from)) / span()) * 100}% - 2px)`,
              }}
            >
              <span
                aria-hidden="true"
                class="absolute inset-y-0 left-0 w-[2px]"
                style={{ background: cssColor(e.color ?? "blue") }}
              />
              <p class="truncate pl-1.5 text-[10px] text-foreground">{e.label}</p>
              <p class="truncate pl-1.5 text-[9px] tabular-nums text-muted-foreground">
                {fmt(e.start)}–{fmt(e.end)}
              </p>
            </div>
          )}
        </For>
        <Show when={now() !== undefined}>
          <div class="absolute inset-x-0 z-10" style={{ top: pct(now()!) }} role="presentation">
            <span
              class="absolute -top-[3px] left-0 size-[7px] rounded-full"
              style={{ background: cssColor("red") }}
              aria-hidden="true"
            />
            <span class="block h-px w-full" style={{ background: cssColor("red") }} aria-hidden="true" />
            <span class="sr-only">Current time {fmt(now()!)}</span>
          </div>
        </Show>
      </div>
    </div>
  )
}
