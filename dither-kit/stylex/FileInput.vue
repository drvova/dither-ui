<!-- Generated from ../tailwind/FileInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", gap: "0.5rem" },
  label: {
    display: "flex",
    cursor: "pointer",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    borderStyle: "dashed",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 30%, transparent)",
    paddingInline: "1rem",
    paddingBlock: "1.5rem",
    textAlign: "center",
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  borderAccent70: {
    borderColor: "color-mix(in oklab, var(--accent) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--accent) 10%, transparent)",
  },
  pointerEventsNone: { pointerEvents: "none", opacity: "40%" },
  input: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  },
  icon: { color: "var(--muted-foreground)" },
  text: { fontSize: "12.5px", color: "var(--muted-foreground)" },
  text2: { color: "var(--foreground)", textDecorationLine: "underline", textUnderlineOffset: "2px" },
  text3: { fontSize: "11px", color: "var(--muted-foreground)" },
  ul: { display: "grid", gap: "0.375rem" },
  li: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 50%, transparent)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
  },
  icon2: { flexShrink: "0", color: "var(--muted-foreground)" },
  text4: {
    minWidth: "0px",
    flex: "1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12.5px",
    color: "var(--foreground)",
  },
  fileSizeText: { flexShrink: "0", fontSize: "11px", color: "var(--muted-foreground)" },
  button: {
    borderRadius: "0.25rem",
    padding: "0.25rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: {
      default: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    pointerEvents: { default: null, ":disabled": "none" },
  },
  button2: { justifySelf: "flex-start" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { cn, type StyleProp } from "./lib"
import DitherButton from "./DitherButton.vue"
import Icon from "./Icon.vue"
import FileSizeText from "./FileSizeText.vue"

/** File picker with a visible selection: a hidden native input (label
 * driven, so it's keyboard-reachable), the chosen files listed with sizes,
 * per-file remove, one clear-all. The model is `File[]` — read-only in the
 * DOM, owned by the parent through v-model:files. */
const props = withDefaults(
  defineProps<{
    modelValue?: File[]
    multiple?: boolean
    accept?: string
    disabled?: boolean
    buttonLabel?: string
    class?: string
    xstyle?: StyleProp
  }>(),
  { multiple: false, disabled: false, buttonLabel: "Choose files" },
)
const emit = defineEmits<{
  (e: "update:modelValue", value: File[]): void
  (e: "change", value: File[]): void
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

const files = computed(() => props.modelValue ?? [])

function commit(next: File[]) {
  emit("update:modelValue", next)
  emit("change", next)
}

function onInputFiles() {
  const list = inputEl.value?.files
  if (!list || list.length === 0) return
  const picked = Array.from(list)
  commit(props.multiple ? [...files.value, ...picked] : [picked[0] as File])
  if (inputEl.value) inputEl.value.value = ""
}

function removeFile(index: number) {
  commit(files.value.filter((_, i) => i !== index))
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  if (props.disabled) return
  const dropped = Array.from(e.dataTransfer?.files ?? [])
  if (dropped.length === 0) return
  commit(props.multiple ? [...files.value, ...dropped] : [dropped[0] as File])
}
</script>

<template>
  <div :class="cn(styles.grid, props.xstyle, props.class)">
    <label
      :class="
        cn(styles.label, 'dk-file-drop', dragOver && styles.borderAccent70, props.disabled && styles.pointerEventsNone)
      "
      @dragover.prevent="dragOver = !props.disabled"
      @dragleave="dragOver = false"
      @drop="onDrop"
    >
      <input
        ref="inputEl"
        type="file"
        v-bind="stylex.attrs(styles.input)"
        :multiple="props.multiple"
        :accept="props.accept"
        :disabled="props.disabled"
        @change="onInputFiles"
      />
      <Icon name="Plus" :size="16" :xstyle="styles.icon" />
      <span v-bind="stylex.attrs(styles.text)">
        Drop files here or
        <span v-bind="stylex.attrs(styles.text2)">{{ props.buttonLabel }}</span>
      </span>
      <span v-if="props.accept" v-bind="stylex.attrs(styles.text3)">{{ props.accept }}</span>
    </label>

    <ul v-if="files.length > 0" v-bind="stylex.attrs(styles.ul)">
      <li v-for="(file, i) in files" :key="`${file.name}-${i}`" v-bind="stylex.attrs(styles.li)">
        <Icon name="Check" :size="12" :xstyle="styles.icon2" />
        <span v-bind="stylex.attrs(styles.text4)">{{ file.name }}</span>
        <FileSizeText :bytes="file.size" :xstyle="styles.fileSizeText" />
        <button
          type="button"
          :aria-label="`Remove ${file.name}`"
          :disabled="props.disabled"
          v-bind="stylex.attrs(styles.button)"
          @click="removeFile(i)"
        >
          <Icon name="Close" :size="12" />
        </button>
      </li>
    </ul>
    <DitherButton
      v-if="files.length > 0"
      variant="solid"
      size="sm"
      :disabled="props.disabled"
      :xstyle="styles.button2"
      @click="commit([])"
    >
      Clear all
    </DitherButton>
  </div>
</template>

<style scoped>
/* The drop zone rings while the file input inside it has keyboard focus. */
.dk-file-drop:has(:focus-visible) {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 30%, transparent);
}
</style>
