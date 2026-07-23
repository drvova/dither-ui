<script lang="ts">
export type NotificationItem = {
  id: string
  title: string
  body?: string
  time?: string
  /** Text glyph for the leading icon box; omit for a dithered color dot. */
  icon?: string
  color?: PixelColor
}

const CARD = 64
const GAP = 8

/** Collapsed silhouettes — one expansion mechanism, three summaries. */
const VARIANTS = {
  stack: { peek: 10, origin: "50% 0%", at: (i: number) => `translateY(${i * 10}px) scale(${1 - i * 0.04})` },
  fan: { peek: 7, origin: "50% 130%", at: (i: number) => `translateY(${i * 7}px) rotate(${(i % 2 ? -1 : 1) * i * 2.2}deg) scale(${1 - i * 0.03})` },
  condensed: { peek: 4, origin: "50% 0%", at: (i: number) => `translateY(${i * 4}px) scale(${1 - i * 0.07})` },
} as const
export type NotificationStackVariant = keyof typeof VARIANTS
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cssColor } from "./palette"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Compact notification cards that spring from a stacked summary into a
 * readable list on hover, focus or tap — tap pins the list open (v-model),
 * hover and focus expand transiently. Three collapsed silhouettes share one
 * expansion: stack (peeked edges), fan (rotated hand), condensed (tight
 * slivers). Cards fan out on the house bouncy bezier with a per-card
 * stagger; reduced motion snaps. */
const props = withDefaults(
  defineProps<{
    items: NotificationItem[]
    /** Pinned-open state (v-model); hover and focus expand transiently. */
    modelValue?: boolean
    maxVisible?: number
    collapsedLabel?: string
    expandedLabel?: string
    emptyLabel?: string
    variant?: NotificationStackVariant
    color?: PixelColor
    class?: string
  }>(),
  {
    modelValue: false,
    maxVisible: 3,
    collapsedLabel: "Notifications",
    expandedLabel: "View all",
    emptyLabel: "All caught up",
    variant: "stack",
    color: "blue",
  }
)
const emit = defineEmits<{ "update:modelValue": [expanded: boolean]; viewall: [] }>()

const hovering = ref(false)
const focused = ref(false)
const visible = computed(() => props.items.slice(0, Math.max(1, props.maxVisible)))
const expanded = computed(() => props.modelValue || hovering.value || focused.value)
const height = computed(() => {
  const n = visible.value.length
  if (!n) return CARD
  return expanded.value ? n * (CARD + GAP) - GAP : CARD + (n - 1) * VARIANTS[props.variant].peek
})
const cardStyle = computed(() => (i: number) => ({
  transform: expanded.value ? `translateY(${i * (CARD + GAP)}px)` : VARIANTS[props.variant].at(i),
  transformOrigin: expanded.value ? "50% 0%" : VARIANTS[props.variant].origin,
  opacity: expanded.value ? 1 : String(Math.max(0.35, 1 - i * 0.25)),
  zIndex: String(visible.value.length - i),
  transitionDelay: `${(expanded.value ? i : visible.value.length - 1 - i) * 40}ms`,
}))
</script>

<template>
  <div
    :class="cn('w-72 font-mono select-none', props.class)"
    role="group"
    :aria-label="props.collapsedLabel"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
    @focusin="focused = true"
    @focusout="focused = false"
  >
    <div class="flex h-7 items-center justify-between gap-2 px-1">
      <span class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {{ props.collapsedLabel }}
        <span
          v-if="props.items.length"
          class="rounded-full border border-border/60 bg-background/60 px-1.5 text-[9px] tabular-nums"
        >{{ props.items.length }}</span>
      </span>
      <Transition name="dk-ns-fade">
        <button
          v-if="expanded && props.items.length > 0"
          type="button"
          :class="cn(CONTROL_BUTTON, 'rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground')"
          @click="emit('viewall')"
        >
          {{ props.expandedLabel }} →
        </button>
      </Transition>
    </div>

    <div
      v-if="!visible.length"
      class="flex h-16 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-[12px] text-muted-foreground"
    >
      {{ props.emptyLabel }}
    </div>

    <div
      v-else
      class="relative transition-[height] duration-300 motion-reduce:transition-none"
      :style="{ height: `${height}px`, transitionTimingFunction: 'cubic-bezier(0.2, 1.4, 0.4, 1)' }"
    >
      <component
        :is="i === 0 ? 'button' : 'div'"
        v-for="(item, i) in visible"
        :key="item.id"
        v-bind="i === 0 ? { type: 'button', 'aria-expanded': props.modelValue, 'aria-label': props.collapsedLabel } : {}"
        class="absolute inset-x-0 top-0 flex h-16 items-center gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card px-3 text-left transition-[transform,opacity] duration-300 motion-reduce:transition-none"
        :class="i === 0 ? CONTROL_BUTTON : ''"
        :style="{ ...cardStyle(i), transitionTimingFunction: 'cubic-bezier(0.2, 1.4, 0.4, 1)' }"
        :aria-hidden="i > 0 && !expanded ? 'true' : undefined"
        @click="i === 0 && emit('update:modelValue', !props.modelValue)"
      >
        <span
          aria-hidden="true"
          class="grid size-8 shrink-0 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px]"
          :style="{ color: cssColor(item.color ?? props.color) }"
        >
          <template v-if="item.icon">{{ item.icon }}</template>
          <span v-else class="size-2 rounded-[2px]" :style="{ background: cssColor(item.color ?? props.color) }" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="flex items-baseline justify-between gap-2">
            <span class="truncate text-[12px] text-foreground">{{ item.title }}</span>
            <span v-if="item.time" class="shrink-0 text-[9px] text-muted-foreground/80">{{ item.time }}</span>
          </span>
          <span v-if="item.body" class="mt-0.5 block truncate text-[11px] text-muted-foreground">{{ item.body }}</span>
        </span>
      </component>
    </div>
  </div>
</template>

<style scoped>
.dk-ns-fade-enter-active,
.dk-ns-fade-leave-active {
  transition: opacity 160ms ease;
}
.dk-ns-fade-enter-from,
.dk-ns-fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .dk-ns-fade-enter-active,
  .dk-ns-fade-leave-active {
    transition: none;
  }
}
</style>
