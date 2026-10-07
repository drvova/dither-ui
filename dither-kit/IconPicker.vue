<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import { ICONS } from "./icons"
import Icon from "./Icon.vue"

/** Icon picker over the kit's own glyph set: a filter field over the names
 * and a radio grid (native radio semantics — arrow keys navigate the whole
 * grid, one tab stop). Value = the icon name. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    size?: number
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Filter icons…", size: 16, disabled: false },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const query = ref("")
const names = Object.keys(ICONS) as Array<keyof typeof ICONS> // Object.keys widens to string

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q === "" ? names : names.filter((n) => n.toLowerCase().includes(q))
})
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
    <input
      v-model="query"
      type="search"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      class="min-h-8 w-full rounded border border-border/70 bg-transparent px-2 py-1 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/60 focus-visible:border-accent/70 motion-reduce:transition-none"
    />
    <div class="grid max-h-48 grid-cols-6 gap-1 overflow-auto sm:grid-cols-8">
      <label
        v-for="name in filtered"
        :key="name"
        :title="name"
        class="grid aspect-square cursor-pointer place-items-center rounded border transition-colors motion-reduce:transition-none"
        :class="
          modelValue === name
            ? 'border-accent/70 bg-accent/15 text-foreground'
            : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
        "
      >
        <input
          class="sr-only"
          type="radio"
          name="dk-icon-picker"
          :value="name"
          :checked="modelValue === name"
          :disabled="props.disabled"
          @change="emit('update:modelValue', name)"
        />
        <Icon :name="name" :size="props.size" />
      </label>
      <p v-if="filtered.length === 0" class="col-span-full px-1 py-2 text-[12px] text-muted-foreground">
        No icons match “{{ query }}”
      </p>
    </div>
  </div>
</template>
