<script setup lang="ts">
import { cssColor } from "./palette"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Morphing status pill — a compact row that stays visible while the detail
 * panel unfolds beneath it through the house 0fr -> 1fr grid trick. Escape
 * collapses; reduced motion snaps. */
const props = withDefaults(
  defineProps<{
    /** Expanded state (v-model). */
    modelValue?: boolean
    label?: string
    color?: PixelColor
    /** Pulse the status dot while collapsed. */
    live?: boolean
    class?: string
  }>(),
  { modelValue: false, label: "Status", color: "green", live: true }
)
const emit = defineEmits<{ "update:modelValue": [boolean] }>()
</script>

<template>
  <div
    :class="cn('inline-block overflow-hidden rounded-2xl border border-border/60 bg-background/80 font-mono', props.class)"
    @keydown.escape="emit('update:modelValue', false)"
  >
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3.5 py-2 text-left text-[12px] text-foreground transition-colors hover:bg-card/40"
      :aria-expanded="props.modelValue"
      @click="emit('update:modelValue', !props.modelValue)"
    >
      <span
        aria-hidden="true"
        class="size-1.5 shrink-0 rounded-full motion-reduce:animate-none"
        :class="props.live && !props.modelValue ? 'animate-pulse' : ''"
        :style="{ background: cssColor(props.color) }"
      />
      <slot name="compact">{{ props.label }}</slot>
      <span aria-hidden="true" class="ml-auto pl-3 text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none" :class="props.modelValue ? 'rotate-180' : ''">▾</span>
    </button>
    <div
      class="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
      :style="{ gridTemplateRows: props.modelValue ? '1fr' : '0fr' }"
    >
      <div class="min-h-0 overflow-hidden" :inert="!props.modelValue">
        <div class="border-t border-border/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
