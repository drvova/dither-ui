<!-- Generated from ../tailwind/CurrencyInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative" },
  layer: {
    pointerEvents: "none",
    position: "absolute",
    top: "calc(1 / 2 * 100%)",
    left: "0.625rem",
    translate: "0 calc(calc(1 / 2 * 100%) * -1)",
    fontSize: "13px",
    color: "var(--muted-foreground)",
  },
  input: { textAlign: "right", fontVariantNumeric: "   tabular-nums " },
  pl7: { paddingLeft: "1.75rem" },
})
</script>

<script setup lang="ts">
import { computed, ref } from "vue"
import { type StyleProp } from "./lib"
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
    xstyle?: StyleProp
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
  <div v-bind="stylex.attrs(styles.frame)">
    <span v-if="props.prefix" v-bind="stylex.attrs(styles.layer)" aria-hidden="true">{{ props.prefix }}</span>
    <DitherInput
      v-bind="$attrs"
      inputmode="decimal"
      :model-value="display"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :invalid="props.invalid"
      :xstyle="[styles.input, props.prefix && styles.pl7, props.xstyle, props.class]"
      @focus="focused = true"
      @blur="focused = false"
      @update:model-value="emit('update:modelValue', sanitize($event))"
    />
  </div>
</template>
