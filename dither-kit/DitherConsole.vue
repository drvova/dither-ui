<script lang="ts">
export type ConsoleLevel = "info" | "success" | "warn" | "error"
export type ConsoleLine = { text: string; level?: ConsoleLevel; at?: string }
</script>

<script setup lang="ts">
import { computed, nextTick, ref, useSlots, watch } from "vue"
import { cn } from "./lib"

/** Monospace log surface — level-tinted lines, an optional blinking caret,
 * and follow mode that keeps the newest line in view. */
const props = withDefaults(
  defineProps<{
    lines?: (string | ConsoleLine)[]
    title?: string
    /** Pin the view to the newest line as output arrives. */
    follow?: boolean
    /** Blinking block caret after the last line (still under reduced motion). */
    caret?: boolean
    class?: string
  }>(),
  { lines: () => [], title: "console", follow: true, caret: true }
)

const slots = useSlots()
const body = ref<HTMLDivElement | null>(null)

const rows = computed<ConsoleLine[]>(() =>
  props.lines.map((l) => (typeof l === "string" ? { text: l } : l))
)

const LEVEL_VAR: Record<ConsoleLevel, string> = {
  info: "var(--muted-foreground)",
  success: "var(--swatch-green, currentColor)",
  warn: "var(--swatch-orange, currentColor)",
  error: "var(--swatch-red, currentColor)",
}

watch(
  () => rows.value.length,
  () => {
    if (props.follow) nextTick(() => body.value?.scrollTo({ top: body.value.scrollHeight }))
  },
  { flush: "post" }
)
</script>

<template>
  <div :class="cn('flex min-h-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-background/60', props.class)">
    <div class="flex h-8 shrink-0 items-center gap-2 border-b border-border/60 px-3">
      <span class="size-1.5 rounded-full bg-muted-foreground/50" aria-hidden="true" />
      <span class="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">{{ props.title }}</span>
      <span v-if="slots.actions" class="ml-auto flex items-center gap-1.5">
        <slot name="actions" />
      </span>
    </div>
    <div ref="body" role="log" aria-live="polite" class="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed">
      <p v-if="!rows.length" class="text-muted-foreground/50">No output yet.</p>
      <p v-for="(l, i) in rows" :key="i" class="flex gap-2 whitespace-pre-wrap">
        <span v-if="l.at" class="shrink-0 text-muted-foreground/40 tabular-nums">{{ l.at }}</span>
        <span :style="{ color: LEVEL_VAR[l.level ?? 'info'] }">{{ l.text }}</span>
      </p>
      <span
        v-if="props.caret"
        aria-hidden="true"
        class="mt-0.5 inline-block h-3 w-1.5 animate-pulse bg-muted-foreground/70 motion-reduce:animate-none"
      />
    </div>
  </div>
</template>
