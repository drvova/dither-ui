<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"
import Icon from "./Icon.vue"

/** Multi-select as chips + a filterable option list: native checkboxes carry
 * semantics (keyboard for free), the query narrows the pool, selected chips
 * stay visible and individually removable. `value` is the picked set. */
const props = withDefaults(
  defineProps<{
    options?: string[]
    value?: string[]
    placeholder?: string
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Search…", disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void
  (e: "search", query: string): void
}>()

const query = ref("")

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const pool = props.options ?? []
  return q === "" ? pool : pool.filter((o) => o.toLowerCase().includes(q))
})
const selected = computed(() => props.value ?? [])

function isChecked(option: string): boolean {
  return selected.value.includes(option)
}

function toggle(option: string, checked: boolean) {
  const next = checked ? [...selected.value, option] : selected.value.filter((o) => o !== option)
  emit("update:modelValue", next)
}

function remove(option: string) {
  emit("update:modelValue", selected.value.filter((o) => o !== option))
}
</script>

<template>
  <div
    :class="
      cn(
        'grid gap-2 rounded-md border border-border bg-background/60 p-2',
        props.disabled && 'pointer-events-none opacity-40',
        props.class,
      )
    "
  >
    <div v-if="selected.length > 0" class="flex flex-wrap gap-1.5">
      <span
        v-for="option in selected"
        :key="option"
        class="inline-flex items-center gap-1 rounded border border-border/70 bg-card px-1.5 py-0.5 text-[12px]"
      >
        {{ option }}
        <button
          type="button"
          :aria-label="`Remove ${option}`"
          class="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
          @click="remove(option)"
        >
          <Icon name="Close" :size="10" />
        </button>
      </span>
    </div>

    <DitherInput
      v-model="query"
      type="search"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      class="min-h-8 py-1"
      @update:model-value="emit('search', $event)"
    />

    <ul class="grid max-h-44 gap-0.5 overflow-auto">
      <li v-if="filtered.length === 0" class="px-2 py-1.5 text-[12px] text-muted-foreground">
        No matches
      </li>
      <li v-for="option in filtered" :key="option">
        <label
          class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/10 motion-reduce:transition-none"
          :class="isChecked(option) ? 'text-foreground' : 'text-muted-foreground'"
        >
          <input
            type="checkbox"
            class="size-3.5 accent-[currentColor]"
            :checked="isChecked(option)"
            :disabled="props.disabled"
            @change="toggle(option, ($event.target as HTMLInputElement).checked)"
          />
          {{ option }}
        </label>
      </li>
    </ul>
  </div>
</template>
