<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

const props = withDefaults(
  defineProps<{
    suggestions: string[]
    modelValue: string
    placeholder?: string
    disabled?: boolean
    class?: string
  }>(),
  { placeholder: "Search…", disabled: false }
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const open = ref(false)
const highlighted = ref(-1)

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q) return props.suggestions
  return props.suggestions.filter((s) => s.toLowerCase().includes(q))
})

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value)
  open.value = true
  highlighted.value = 0
}

function pick(s: string) {
  emit("update:modelValue", s)
  open.value = false
}

function move(dir: number) {
  const n = filtered.value.length
  if (!n) return
  highlighted.value = (highlighted.value + dir + n) % n
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
    if (!open.value) {
      open.value = true
      highlighted.value = 0
    } else {
      move(e.key === "ArrowDown" ? 1 : -1)
    }
  } else if (e.key === "Enter") {
    if (!open.value) return
    e.preventDefault()
    const s = filtered.value[highlighted.value]
    if (s !== undefined) pick(s)
  } else if (e.key === "Escape" && open.value) {
    e.preventDefault()
    open.value = false
  }
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <input
      type="text"
      role="combobox"
      :aria-expanded="open && filtered.length > 0"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :value="props.modelValue"
      class="w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
      @input="onInput"
      @click="open = true"
      @keydown="onKeydown"
      @blur="open = false"
    />
    <div
      v-if="open && filtered.length"
      role="listbox"
      class="absolute top-full z-30 mt-1 w-full rounded-lg border border-border bg-card p-1"
    >
      <div
        v-for="(s, i) in filtered"
        :key="s"
        role="option"
        :aria-selected="s === props.modelValue"
        class="cursor-pointer rounded-md px-2 py-1.5 text-[12px]"
        :class="
          i === highlighted
            ? 'bg-background text-foreground'
            : 'text-muted-foreground hover:bg-background hover:text-foreground'
        "
        @pointerenter="highlighted = i"
        @pointerdown.prevent="pick(s)"
      >
        {{ s }}
      </div>
    </div>
  </div>
</template>
