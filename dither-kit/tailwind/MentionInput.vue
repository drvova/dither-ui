<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"

/** @-mention autocomplete over a textarea: detection is a regex on the text
 * before the caret (`/@(\w*)$/`), the list anchors to the field (not the
 * caret — no mirror div), Arrow keys pick, Enter/Tab inserts, Escape closes.
 * Selection replaces the @query and leaves the caret after a space. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    options?: string[]
    placeholder?: string
    rows?: number
    disabled?: boolean
    class?: string
  }>(),
  { options: () => [], placeholder: "Write… use @ to mention", rows: 3, disabled: false },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void
  (e: "mention", value: string): void
}>()

const el = ref<HTMLTextAreaElement | null>(null)
const open = ref(false)
const query = ref("")
const start = ref(0) // caret index where the @ begins
const active = ref(0)

const matches = computed(() => {
  const q = query.value.toLowerCase()
  return props.options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8)
})

function syncOpen() {
  const node = el.value
  if (!node) return
  const caret = node.selectionStart ?? node.value.length
  const m = node.value.slice(0, caret).match(/@([\w-]*)$/)
  if (m) {
    query.value = m[1]
    start.value = caret - m[1].length - 1
    active.value = 0
    open.value = matches.value.length > 0
  } else {
    open.value = false
  }
}

function choose(option: string) {
  const text = props.modelValue ?? ""
  const node = el.value
  const caret = node?.selectionStart ?? text.length
  const next = `${text.slice(0, start.value)}@${option} ${text.slice(caret)}`
  emit("update:modelValue", next)
  emit("mention", option)
  open.value = false
  requestAnimationFrame(() => {
    if (!node) return
    const pos = start.value + option.length + 2
    node.focus()
    node.setSelectionRange(pos, pos)
  })
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === "ArrowDown") {
    e.preventDefault()
    active.value = (active.value + 1) % matches.value.length
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    active.value = (active.value - 1 + matches.value.length) % matches.value.length
  } else if (e.key === "Enter" || e.key === "Tab") {
    const pick = matches.value[active.value]
    if (pick) {
      e.preventDefault()
      choose(pick)
    }
  } else if (e.key === "Escape") {
    e.preventDefault()
    open.value = false
  }
}
</script>

<template>
  <div class="relative">
    <textarea
      ref="el"
      :value="props.modelValue ?? ''"
      :placeholder="props.placeholder"
      :rows="props.rows"
      :disabled="props.disabled"
      :class="
        cn(
          'min-h-20 w-full resize-y rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none',
          props.class,
        )
      "
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keyup="syncOpen"
      @click="syncOpen"
      @keydown="onKeydown"
    />
    <ul
      v-if="open && matches.length > 0"
      role="listbox"
      aria-label="Mention suggestions"
      class="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
    >
      <li
        v-for="(option, i) in matches"
        :key="option"
        role="option"
        :aria-selected="i === active"
        class="cursor-pointer rounded px-2 py-1.5 text-[12.5px] transition-colors"
        :class="i === active ? 'bg-accent/20 text-foreground' : 'text-muted-foreground'"
        @mousedown.prevent="choose(option)"
        @mousemove="active = i"
      >
        {{ option }}
      </li>
    </ul>
  </div>
</template>
