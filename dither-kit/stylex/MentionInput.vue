<!-- Generated from ../tailwind/MentionInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  textarea: {
    minHeight: "5rem",
    width: "100%",
    resize: "vertical",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: {
      default: "var(--border)",
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--foreground) 25%, transparent)",
      },
      ":focus-visible": "var(--ring)",
    },
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    color: "var(--foreground)",
    transitionProperty: { default: "border-color, box-shadow", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
    "::placeholder": { color: "var(--muted-foreground)" },
    pointerEvents: { default: null, ":disabled": "none" },
    opacity: { default: null, ":disabled": "40%" },
  },
  ul: {
    position: "absolute",
    top: "100%",
    right: "0px",
    left: "0px",
    zIndex: "20",
    marginTop: "0.25rem",
    maxHeight: "12rem",
    overflow: "auto",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--popover)",
    padding: "0.25rem",
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  li: {
    cursor: "pointer",
    borderRadius: "0.25rem",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12.5px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  li2: {
    backgroundColor: "color-mix(in oklab, var(--accent) 20%, transparent)",
    color: "var(--foreground)",
  },
  li3: { color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"

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
    xstyle?: StyleProp
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
  <div v-bind="stylex.attrs(styles.frame)">
    <textarea
      ref="el"
      :value="props.modelValue ?? ''"
      :placeholder="props.placeholder"
      :rows="props.rows"
      :disabled="props.disabled"
      :class="cn(styles.textarea, props.xstyle, props.class)"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @keyup="syncOpen"
      @click="syncOpen"
      @keydown="onKeydown"
    />
    <ul
      v-if="open && matches.length > 0"
      role="listbox"
      aria-label="Mention suggestions"
      v-bind="stylex.attrs(styles.ul)"
    >
      <li
        v-for="(option, i) in matches"
        :key="option"
        role="option"
        :aria-selected="i === active"
        :class="cn(styles.li, i === active ? styles.li2 : styles.li3)"
        @mousedown.prevent="choose(option)"
        @mousemove="active = i"
      >
        {{ option }}
      </li>
    </ul>
  </div>
</template>
