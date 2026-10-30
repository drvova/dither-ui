<!-- Generated from ../tailwind/DitherCombobox.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
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
    paddingRight: "2rem",
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
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    right: "0.75rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    color: "var(--muted-foreground)",
  },
  layer2: {
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
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--muted-foreground)",
    fontStyle: "italic",
  },
  row: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "var(--radius)",
    paddingInline: "0.5rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
  },
  bgBackground: { backgroundColor: "var(--background)" },
  cursorDefault: { cursor: "default", opacity: "40%" },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: { default: null, ":hover": { default: null, "@media (hover: hover)": "var(--background)" } },
  },
  text: { width: "0.5rem", height: "0.5rem", flexShrink: "0" },
})
</script>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { Option } from "./DitherSelect.vue"
import { cn, type StyleProp } from "./lib"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"

const props = withDefaults(
  defineProps<{
    options: Option[]
    modelValue: string
    placeholder?: string
    color?: PixelColor
    disabled?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { placeholder: "Select…", color: "blue", disabled: false },
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const open = ref(false)
const highlighted = ref(-1)

const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const marker = computed(() => cssColor(props.color))

const query = ref(selected.value?.label ?? "")
watch(
  () => props.modelValue,
  () => {
    query.value = selected.value?.label ?? ""
  },
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

function openPanel() {
  open.value = true
  const i = filtered.value.findIndex((o) => o.value === props.modelValue && !o.disabled)
  highlighted.value = i >= 0 ? i : filtered.value.findIndex((o) => !o.disabled)
}

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  highlighted.value = filtered.value.findIndex((o) => !o.disabled)
}

function pick(o: Option) {
  if (o.disabled) return
  emit("update:modelValue", o.value)
  query.value = o.label
  open.value = false
}

/** Blur / Escape — snap the text back to the last valid value. */
function revert() {
  open.value = false
  query.value = selected.value?.label ?? ""
}

function move(dir: number) {
  const list = filtered.value
  const n = list.length
  let i = highlighted.value
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!list[i].disabled) {
      highlighted.value = i
      return
    }
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault()
    if (!open.value) openPanel()
    else move(e.key === "ArrowDown" ? 1 : -1)
  } else if (e.key === "Enter") {
    if (!open.value) return
    e.preventDefault()
    const o = filtered.value[highlighted.value]
    if (o) pick(o)
  } else if (e.key === "Escape" && open.value) {
    e.preventDefault()
    revert()
  }
}
</script>

<template>
  <div :class="cn(styles.frame, props.xstyle, props.class)">
    <input
      type="text"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :disabled="props.disabled"
      :placeholder="props.placeholder"
      :value="query"
      v-bind="stylex.attrs(styles.input)"
      @input="onInput"
      @click="open || openPanel()"
      @keydown="onKeydown"
      @blur="revert"
    />
    <span aria-hidden="true" v-bind="stylex.attrs(styles.layer)">▾</span>
    <div v-if="open" role="listbox" v-bind="stylex.attrs(styles.layer2)">
      <div v-if="!filtered.length" v-bind="stylex.attrs(styles.box)">no matches</div>
      <div
        v-for="(o, i) in filtered"
        :key="o.value"
        role="option"
        :aria-selected="o.value === props.modelValue"
        :aria-disabled="o.disabled || undefined"
        :class="
          cn(styles.row, [
            i === highlighted && !o.disabled ? styles.bgBackground : null,
            o.disabled
              ? styles.cursorDefault
              : o.value === props.modelValue || i === highlighted
                ? styles.textForeground
                : styles.textMutedForeground,
          ])
        "
        @pointerenter="!o.disabled && (highlighted = i)"
        @pointerdown.prevent="pick(o)"
      >
        <span>{{ o.label }}</span>
        <span
          v-if="o.value === props.modelValue"
          aria-hidden="true"
          v-bind="stylex.attrs(styles.text)"
          :style="{ backgroundColor: marker, imageRendering: 'pixelated' }"
        />
      </div>
    </div>
  </div>
</template>
