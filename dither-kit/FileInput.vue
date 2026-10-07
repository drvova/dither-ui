<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
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
  <div class="grid gap-2" :class="cn(props.class)">
    <label
      class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 bg-card/30 px-4 py-6 text-center transition-colors has-[:focus-visible]:border-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/30 motion-reduce:transition-none"
      :class="cn(dragOver && 'border-accent/70 bg-accent/10', props.disabled && 'pointer-events-none opacity-40')"
      @dragover.prevent="dragOver = !props.disabled"
      @dragleave="dragOver = false"
      @drop="onDrop"
    >
      <input
        ref="inputEl"
        type="file"
        class="sr-only"
        :multiple="props.multiple"
        :accept="props.accept"
        :disabled="props.disabled"
        @change="onInputFiles"
      />
      <Icon name="Plus" :size="16" class="text-muted-foreground" />
      <span class="text-[12.5px] text-muted-foreground">
        Drop files here or
        <span class="text-foreground underline underline-offset-2">{{ props.buttonLabel }}</span>
      </span>
      <span v-if="props.accept" class="text-[11px] text-muted-foreground/70">{{ props.accept }}</span>
    </label>

    <ul v-if="files.length > 0" class="grid gap-1.5">
      <li
        v-for="(file, i) in files"
        :key="`${file.name}-${i}`"
        class="flex items-center gap-2 rounded border border-border/60 bg-card/50 px-2.5 py-1.5"
      >
        <Icon name="Check" :size="12" class="shrink-0 text-muted-foreground" />
        <span class="min-w-0 flex-1 truncate text-[12.5px] text-foreground">{{ file.name }}</span>
        <FileSizeText :bytes="file.size" class="shrink-0 text-[11px] text-muted-foreground" />
        <button
          type="button"
          :aria-label="`Remove ${file.name}`"
          :disabled="props.disabled"
          class="rounded p-1 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none motion-reduce:transition-none"
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
      class="justify-self-start"
      @click="commit([])"
    >
      Clear all
    </DitherButton>
  </div>
</template>
