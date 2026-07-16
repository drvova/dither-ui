<script lang="ts">
export type Option = { value: string; label: string; disabled?: boolean }
let selectCount = 0
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { CONTROL, POPOVER, useField } from "./control"
import { cn } from "./lib"
import { cssColor } from "./palette"
import type { PixelColor } from "./pixel"

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  options: Option[]
  modelValue: string
  placeholder?: string
  color?: PixelColor
  disabled?: boolean
  invalid?: boolean
  class?: string
}>(), { placeholder: "Select…", color: "blue", disabled: false, invalid: false })
const emit = defineEmits<{ "update:modelValue": [value: string] }>()
const field = useField()
const rootRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const open = ref(false)
const highlighted = ref(-1)
const idBase = `dk-select-${selectCount++}`
const listId = `${idBase}-listbox`
const selected = computed(() => props.options.find((o) => o.value === props.modelValue) ?? null)
const marker = computed(() => cssColor(props.color))
const invalid = computed(() => props.invalid || field?.invalid.value || false)
const optionId = (i: number) => `${idBase}-option-${i}`

function openPanel() {
  if (props.disabled) return
  open.value = true
  const selectedIndex = props.options.findIndex((o) => o.value === props.modelValue && !o.disabled)
  highlighted.value = selectedIndex >= 0 ? selectedIndex : props.options.findIndex((o) => !o.disabled)
}
function close() { open.value = false }
function pick(o: Option) {
  if (o.disabled) return
  emit("update:modelValue", o.value)
  close()
  nextTick(() => triggerRef.value?.focus())
}
function move(dir: number) {
  const n = props.options.length
  if (!n) return
  let i = highlighted.value
  for (let step = 0; step < n; step++) {
    i = (i + dir + n) % n
    if (!props.options[i].disabled) return void (highlighted.value = i)
  }
}
function edge(toEnd: boolean) {
  const enabled = props.options.map((o, i) => ({ o, i })).filter(({ o }) => !o.disabled)
  highlighted.value = enabled[toEnd ? enabled.length - 1 : 0]?.i ?? -1
}
function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
      e.preventDefault()
      openPanel()
      if (e.key === "ArrowUp") edge(true)
    }
    return
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault(); move(e.key === "ArrowDown" ? 1 : -1)
  } else if (e.key === "Home" || e.key === "End") {
    e.preventDefault(); edge(e.key === "End")
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault(); const option = props.options[highlighted.value]; if (option) pick(option)
  } else if (e.key === "Escape" || e.key === "Tab") close()
}
function onOutside(e: PointerEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}
onMounted(() => document.addEventListener("pointerdown", onOutside))
onBeforeUnmount(() => document.removeEventListener("pointerdown", onOutside))
</script>

<template>
  <div ref="rootRef" :class="cn('relative', props.class)">
    <button
      ref="triggerRef"
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && highlighted >= 0 ? optionId(highlighted) : undefined"
      :aria-invalid="invalid || undefined"
      :aria-describedby="field?.describedBy.value"
      :id="field?.controlId.value"
      :disabled="props.disabled"
      :style="invalid ? { borderColor: cssColor('red') } : undefined"
      :class="cn(CONTROL, 'flex w-full items-center justify-between gap-3 text-left')"
      v-bind="$attrs"
      @click="open ? close() : openPanel()"
      @keydown="onKeydown"
    >
      <span class="truncate" :class="selected ? 'text-foreground' : 'text-muted-foreground/70'">{{ selected?.label ?? props.placeholder }}</span>
      <span aria-hidden="true" class="text-muted-foreground transition-transform motion-reduce:transition-none" :class="open ? 'rotate-180' : ''">⌄</span>
    </button>
    <Transition name="dk-popover">
      <div v-if="open" :id="listId" role="listbox" :class="cn(POPOVER, 'absolute top-full z-30 mt-1 max-h-64 w-full overflow-auto p-1')">
        <div
          v-for="(o, i) in props.options"
          :id="optionId(i)"
          :key="o.value"
          role="option"
          :aria-selected="o.value === props.modelValue"
          :aria-disabled="o.disabled || undefined"
          class="flex min-h-9 items-center justify-between rounded-md px-2.5 py-1.5 text-[12px]"
          :class="[i === highlighted && !o.disabled ? 'bg-background text-foreground' : '', o.disabled ? 'cursor-default opacity-40' : 'cursor-pointer text-muted-foreground hover:bg-background hover:text-foreground']"
          @pointerenter="!o.disabled && (highlighted = i)"
          @pointerdown.prevent="pick(o)"
        >
          <span>{{ o.label }}</span>
          <span v-if="o.value === props.modelValue" aria-hidden="true" class="size-2 shrink-0" :style="{ backgroundColor: marker, imageRendering: 'pixelated' }" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dk-popover-enter-active, .dk-popover-leave-active { transition: transform 140ms cubic-bezier(0.2, 0, 0, 1), opacity 100ms ease; }
.dk-popover-enter-from, .dk-popover-leave-to { transform: translateY(-4px); opacity: 0; }
@media (prefers-reduced-motion: reduce) { .dk-popover-enter-active, .dk-popover-leave-active { transition: none; } }
</style>
