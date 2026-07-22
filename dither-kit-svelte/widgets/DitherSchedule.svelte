<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"
  export type ScheduleEvent = { start: number; end: number; label: string; color?: PixelColor }
</script>

<script lang="ts">
  import { cssColor } from "../engine/palette"
  import { cn } from "../runtime/lib"

  /** Day timeline — an hour rail with events placed proportionally, and an
   * optional now line. Hours are fractional (9.5 is half past nine). */
  type Props = {
    events: ScheduleEvent[]
    /** Day window, fractional hours. */
    from?: number
    to?: number
    /** Draw the now line at this hour; omit to hide. */
    now?: number
    class?: string
  }

  let { events, from = 8, to = 18, now, class: className }: Props = $props()

  const span = $derived(Math.max(1, to - from))
  const pct = (h: number) => `${((Math.min(Math.max(h, from), to) - from) / span) * 100}%`
  const hours = $derived(Array.from({ length: Math.floor(to) - Math.ceil(from) + 1 }, (_, i) => Math.ceil(from) + i))
  const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
</script>

<div class={cn("flex gap-2 font-mono", className)} role="group" aria-label="Day schedule">
  <div class="relative w-10 shrink-0 text-right" aria-hidden="true">
    {#each hours as h (h)}
      <span class="absolute right-0 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground/60" style:top={pct(h)}>
        {String(h).padStart(2, "0")}
      </span>
    {/each}
  </div>
  <div class="relative min-h-48 flex-1 overflow-hidden rounded-md border border-border/60 bg-background/40">
    {#each hours as h (h)}
      <span aria-hidden="true" class="absolute inset-x-0 h-px bg-border/30" style:top={pct(h)}></span>
    {/each}
    {#each events as e, i (i)}
      <div
        class="absolute inset-x-1.5 overflow-hidden rounded-[4px] border border-border/60 bg-card/80 px-2 py-1"
        style:top={pct(e.start)}
        style:height={`calc(${((Math.min(e.end, to) - Math.max(e.start, from)) / span) * 100}% - 2px)`}
      >
        <span aria-hidden="true" class="absolute inset-y-0 left-0 w-[2px]" style:background={cssColor(e.color ?? "blue")}></span>
        <p class="truncate pl-1.5 text-[10px] text-foreground">{e.label}</p>
        <p class="truncate pl-1.5 text-[9px] tabular-nums text-muted-foreground/70">{fmt(e.start)}–{fmt(e.end)}</p>
      </div>
    {/each}
    {#if now !== undefined && now >= from && now <= to}
      <div class="absolute inset-x-0 z-10" style:top={pct(now)} role="presentation">
        <span class="absolute -top-[3px] left-0 size-[7px] rounded-full" style:background={cssColor("red")} aria-hidden="true"></span>
        <span class="block h-px w-full" style:background={cssColor("red")} aria-hidden="true"></span>
        <span class="sr-only">Current time {fmt(now)}</span>
      </div>
    {/if}
  </div>
</div>
