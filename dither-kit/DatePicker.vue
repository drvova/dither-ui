<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import ClickOutside from "./ClickOutside.vue"
import Calendar from "./Calendar.vue"
import Icon from "./Icon.vue"

/** Date field + calendar popover: the input shows the ISO value in a human
 * format, the calendar opens on click/focus, select closes, Escape and
 * outside-click dismiss (ClickOutside, capture-phase). The model stays ISO
 * YYYY-MM-DD. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    min?: string
    max?: string
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "YYYY-MM-DD", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "select", value: string): void
}>()

const open = ref(false)

const human = computed(() => {
  if (!props.modelValue) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) return props.modelValue
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${props.modelValue}T00:00:00`),
  )
})

function onSelect(value: string) {
  emit("select", value)
  open.value = false
}
</script>

<template>
  <ClickOutside :enabled="open" @outside="open = false">
    <div class="relative" :class="cn(props.class)" @keydown.esc.stop="open = false">
      <button
        type="button"
        :disabled="props.disabled"
        aria-haspopup="dialog"
        :aria-expanded="open"
        class="flex min-h-10 w-full items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-left font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
        @click="open = !open"
        @focus="open = true"
      >
        <span class="flex-1" :class="!props.modelValue && 'text-muted-foreground/60'">
          {{ human || props.placeholder }}
        </span>
        <Icon name="Calendar" :size="14" class="shrink-0 text-muted-foreground" />
      </button>
      <div
        v-if="open"
        role="dialog"
        aria-label="Pick a date"
        class="absolute left-0 top-full z-30 mt-1 shadow-lg"
      >
        <Calendar
          :model-value="props.modelValue"
          :min="props.min"
          :max="props.max"
          @update:model-value="emit('update:modelValue', $event)"
          @select="onSelect"
        />
      </div>
    </div>
  </ClickOutside>
</template>
