<!-- Generated from ../tailwind/DitherTextarea.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  textarea: {
    display: "block",
    width: "100%",
    lineHeight: "1.625",
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
    placeholder?: string
    rows?: number
    resize?: "none" | "vertical" | "horizontal" | "both"
    disabled?: boolean
    readonly?: boolean
    invalid?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  { modelValue: "", rows: 4, resize: "vertical", disabled: false, readonly: false, invalid: false },
)
const emit = defineEmits<{ "update:modelValue": [value: string] }>()
const field = useField()
const invalid = computed(() => props.invalid || field?.invalid.value || false)
</script>

<template>
  <textarea
    :id="($attrs.id as string | undefined) ?? field?.controlId.value"
    :value="props.modelValue"
    :placeholder="props.placeholder"
    :rows="props.rows"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :aria-invalid="invalid || undefined"
    :aria-describedby="($attrs['aria-describedby'] as string | undefined) ?? field?.describedBy.value"
    :style="{ resize: props.resize, ...(invalid ? { borderColor: cssColor('red') } : {}) }"
    :class="cn(CONTROL, styles.textarea, props.xstyle, props.class)"
    v-bind="$attrs"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
