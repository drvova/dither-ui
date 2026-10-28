<!-- Generated from ../tailwind/DitherInput.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  input: {
    width: "100%",
    cursor: { default: null, ":read-only": "default" },
    backgroundColor: { default: null, ":read-only": "color-mix(in oklab, var(--card) 40%, transparent)" },
    color: { default: null, ":read-only": "var(--muted-foreground)" },
  },
})
</script>

<script setup lang="ts">
import { computed } from "vue"
import { cn, type StyleProp } from "./lib"
import { cssColor } from "../engine/palette"
import { CONTROL } from "./control"
import { useField } from "../engine/field"

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    type?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    invalid?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: "", type: "text", disabled: false, invalid: false },
)

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>()
const field = useField()
const invalid = computed(() => props.invalid || field?.invalid.value || false)
const invalidStyle = computed(() => (invalid.value ? { borderColor: cssColor("red") } : undefined))
</script>

<template>
  <input
    :type="props.type"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :id="($attrs.id as string | undefined) ?? field?.controlId.value"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :aria-invalid="invalid || undefined"
    :aria-describedby="($attrs['aria-describedby'] as string | undefined) ?? field?.describedBy.value"
    :style="invalidStyle"
    :class="cn(CONTROL, styles.input, props.xstyle, props.class)"
    v-bind="$attrs"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
