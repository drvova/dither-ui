<!-- Generated from ../tailwind/DitherAutocomplete.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  input: {
    width: "100%",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    "::placeholder": { color: "var(--muted-foreground)" },
    boxShadow: { default: null, ":focus-visible": "0 0 0 calc(1px + 0px) var(--ring)" },
    outlineStyle: { default: null, ":focus-visible": "none" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  layer: {
    position: "absolute",
    top: "100%",
    zIndex: "30",
    marginTop: "0.25rem",
    width: "100%",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
  },
  box: {
    cursor: "pointer",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
  },
  box2: { backgroundColor: "var(--background)", color: "var(--foreground)" },
  box3: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    suggestions: string[]
    modelValue: string
    placeholder?: string
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Search…", disabled: false },
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
  <div :class="cn(styles.frame, props.xstyle, props.class)">
    <input
      type="text"
      role="combobox"
      :aria-expanded="open && filtered.length > 0"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :value="props.modelValue"
      v-bind="stylex.attrs(styles.input)"
      @input="onInput"
      @click="open = true"
      @keydown="onKeydown"
      @blur="open = false"
    />
    <div v-if="open && filtered.length" role="listbox" v-bind="stylex.attrs(styles.layer)">
      <div
        v-for="(s, i) in filtered"
        :key="s"
        role="option"
        :aria-selected="s === props.modelValue"
        :class="cn(styles.box, i === highlighted ? styles.box2 : styles.box3)"
        @pointerenter="highlighted = i"
        @pointerdown.prevent
        @click="pick(s)"
      >
        {{ s }}
      </div>
    </div>
  </div>
</template>
