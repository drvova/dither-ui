<script lang="ts">
export type ScheduleEvent = { start: number; end: number; label: string; color?: PixelColor }
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "./palette"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Day timeline — an hour rail with events placed proportionally, and an
 * optional now line. Hours are fractional (9.5 is half past nine). */
const props = withDefaults(
  defineProps<{
    events: ScheduleEvent[]
    /** Day window, fractional hours. */
    from?: number
    to?: number
    /** Draw the now line at this hour; omit to hide. */
    now?: number
    class?: string
  }>(),
  { from: 8, to: 18 }
)

const span = computed(() => Math.max(1, props.to - props.from))
const pct = (h: number) => `${((Math.min(Math.max(h, props.from), props.to) - props.from) / span.value) * 100}%`
const hours = computed(() =>
  Array.from({ length: Math.floor(props.to) - Math.ceil(props.from) + 1 }, (_, i) => Math.ceil(props.from) + i)
)
const fmt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`
</script>

<template>
  <div :class="cn('flex gap-2 font-mono', props.class)" role="group" aria-label="Day schedule">
    <div class="relative w-10 shrink-0 text-right" aria-hidden="true">
      <span
        v-for="h in hours"
        :key="h"
        class="absolute right-0 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground/60"
        :style="{ top: pct(h) }"
      >{{ String(h).padStart(2, "0") }}</span>
    </div>
    <div class="relative min-h-48 flex-1 overflow-hidden rounded-md border border-border/60 bg-background/40">
      <span
        v-for="h in hours"
        :key="h"
        aria-hidden="true"
        class="absolute inset-x-0 h-px bg-border/30"
        :style="{ top: pct(h) }"
      />
      <div
        v-for="(e, i) in props.events"
        :key="i"
        class="absolute inset-x-1.5 overflow-hidden rounded-[4px] border border-border/60 bg-card/80 px-2 py-1"
        :style="{ top: pct(e.start), height: `calc(${((Math.min(e.end, props.to) - Math.max(e.start, props.from)) / span) * 100}% - 2px)` }"
      >
        <span aria-hidden="true" class="absolute inset-y-0 left-0 w-[2px]" :style="{ background: cssColor(e.color ?? 'blue') }" />
        <p class="truncate pl-1.5 text-[10px] text-foreground">{{ e.label }}</p>
        <p class="truncate pl-1.5 text-[9px] tabular-nums text-muted-foreground/70">{{ fmt(e.start) }}–{{ fmt(e.end) }}</p>
      </div>
      <div
        v-if="props.now !== undefined && props.now >= props.from && props.now <= props.to"
        class="absolute inset-x-0 z-10"
        :style="{ top: pct(props.now) }"
        role="presentation"
      >
        <span class="absolute -top-[3px] left-0 size-[7px] rounded-full" :style="{ background: cssColor('red') }" aria-hidden="true" />
        <span class="block h-px w-full" :style="{ background: cssColor('red') }" aria-hidden="true" />
        <span class="sr-only">Current time {{ fmt(props.now) }}</span>
      </div>
    </div>
  </div>
</template>
