<script setup lang="ts">
import { computed, ref } from "vue"
import { cn } from "./lib"
import DitherInput from "./DitherInput.vue"

/** Money entry: the model stays a plain decimal string ("1234.56"), the
 * DISPLAY groups thousands while blurred and shows raw digits while focused
 * so the caret and typing stay predictable. One dot, digits only. */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    prefix?: string
    locale?: string
    disabled?: boolean
    invalid?: boolean
    class?: string
  }>(),
  { placeholder: "0.00", prefix: "$", locale: "en-US" },
)
const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()

const focused = ref(false)

function sanitize(raw: string): string {
  const oneDot = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
  const [whole = "", ...rest] = oneDot.split(".")
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole
}

const display = computed(() => {
  if (focused.value) return props.modelValue ?? ""
  const raw = props.modelValue ?? ""
  if (raw === "") return ""
  const n = Number(raw)
  if (Number.isNaN(n)) return raw
  return new Intl.NumberFormat(props.locale, {
    minimumFractionDigits: raw.includes(".") ? Math.min(raw.split(".")[1].length, 2) : 0,
    maximumFractionDigits: 2,
  }).format(n)
})
</script>

<template>
  <div class="relative">
    <span
      v-if="props.prefix"
      class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground"
      aria-hidden="true"
      >{{ props.prefix }}</span
    >
    <DitherInput
      v-bind="$attrs"
      inputmode="decimal"
      :model-value="display"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :invalid="props.invalid"
      :class="cn('text-right tabular-nums', props.prefix && 'pl-7', props.class)"
      @focus="focused = true"
      @blur="focused = false"
      @update:model-value="emit('update:modelValue', sanitize($event))"
    />
  </div>
</template>
