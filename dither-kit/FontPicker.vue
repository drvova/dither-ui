<script setup lang="ts">
import { cn } from "./lib"

/** Font stack picker: each option renders its own name in its own family so
 * the preview IS the choice — no separate swatch to drift. Value = the CSS
 * font stack string. */
const FONT_STACKS: Array<{ label: string; stack: string }> = [
  { label: "System UI", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { label: "Geometric sans", stack: "'Futura', 'Century Gothic', 'Avenir', sans-serif" },
  { label: "Humanist sans", stack: "'Segoe UI', 'Frutiger', 'Helvetica Neue', sans-serif" },
  { label: "Old-style serif", stack: "'Charter', 'Georgia', 'Times New Roman', serif" },
  { label: "Transitional serif", stack: "'Libre Baskerville', 'Georgia', serif" },
  { label: "Monospace", stack: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace" },
  { label: "Console", stack: "'Lucida Console', 'Menlo', 'DejaVu Sans Mono', monospace" },
  { label: "Display", stack: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" },
  { label: "Rounded", stack: "'Nunito', 'Segoe UI', system-ui, sans-serif" },
  { label: "Handwriting", stack: "'Segoe Script', 'Comic Sans MS', cursive" },
]

const props = withDefaults(
  defineProps<{ modelValue?: string; disabled?: boolean; class?: string }>(),
  { disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Font"
    :class="
      cn(
        'grid gap-1 rounded-md border border-border bg-background/60 p-1.5',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
  >
    <label
      v-for="font in FONT_STACKS"
      :key="font.stack"
      class="flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 transition-colors motion-reduce:transition-none"
      :class="
        modelValue === font.stack
          ? 'bg-accent/15 text-foreground'
          : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
      "
    >
      <input
        class="sr-only"
        type="radio"
        name="dk-font-picker"
        :value="font.stack"
        :checked="modelValue === font.stack"
        :disabled="props.disabled"
        @change="emit('update:modelValue', font.stack)"
      />
      <span class="text-[13px]" :style="{ fontFamily: font.stack }">{{ font.label }}</span>
      <span class="text-[11px] text-muted-foreground/70">Aa 123</span>
    </label>
  </div>
</template>
