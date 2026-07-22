<script setup lang="ts">
import { computed } from "vue"
import { cssColor } from "./palette"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

export type ExpandTab = { value: string; label: string; color?: PixelColor }

/** Icon bar where only the active tab unfolds its label — the rest stay
 * square glyphs. The label slides through a 0fr -> 1fr column, the house
 * grid trick, stilled under reduced motion. */
const props = withDefaults(
  defineProps<{
    tabs: ExpandTab[]
    modelValue: string
    color?: PixelColor
    class?: string
  }>(),
  { color: "blue" }
)
const emit = defineEmits<{ "update:modelValue": [string] }>()

const hue = computed(() => (t: ExpandTab) => cssColor(t.color ?? props.color))
</script>

<template>
  <div :class="cn('inline-flex gap-1 rounded-lg border border-border/60 bg-background/40 p-1', props.class)" role="tablist">
    <button
      v-for="t in props.tabs"
      :key="t.value"
      type="button"
      role="tab"
      :aria-selected="props.modelValue === t.value"
      class="flex h-8 items-center gap-0 rounded-md px-2.5 font-mono text-[12px] transition-colors"
      :class="props.modelValue === t.value ? 'bg-card text-foreground' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'"
      @click="emit('update:modelValue', t.value)"
    >
      <span
        aria-hidden="true"
        class="size-1.5 shrink-0 rounded-[1px]"
        :style="{ background: props.modelValue === t.value ? hue(t) : 'currentColor', opacity: props.modelValue === t.value ? 1 : 0.7 }"
      />
      <span
        class="grid transition-[grid-template-columns] duration-200 motion-reduce:transition-none"
        :style="{ gridTemplateColumns: props.modelValue === t.value ? '1fr' : '0fr' }"
      >
        <span class="min-w-0 overflow-hidden whitespace-nowrap" :class="props.modelValue === t.value ? 'pl-2' : ''">{{ t.label }}</span>
      </span>
    </button>
  </div>
</template>
