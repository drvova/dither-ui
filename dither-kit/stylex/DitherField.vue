<!-- Generated from ../tailwind/DitherField.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

let fieldCount = 0

const styles = stylex.create({
  grid: { display: "grid", gap: "0.375rem" },
  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
  p: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "11px" },
  text: { display: "inline-block", width: "0.375rem", height: "0.375rem" },
  p2: { fontSize: "11px", lineHeight: "1.625", color: "var(--muted-foreground)" },
})
</script>

<script setup lang="ts">
import { computed, provide, toRef } from "vue"
import { FIELD_CONTEXT } from "../engine/field"
import { cssColor } from "../engine/palette"

const props = defineProps<{ label?: string; description?: string; error?: string; for?: string }>()
const base = `dk-field-${fieldCount++}`
const controlId = computed(() => props.for ?? `${base}-control`)
const helpId = `${base}-help`
const describedBy = computed(() => (props.error || props.description ? helpId : undefined))
const invalid = computed(() => !!props.error)
provide(FIELD_CONTEXT, { controlId, describedBy, invalid: toRef(invalid) })
</script>

<template>
  <div v-bind="stylex.attrs(styles.grid)">
    <label v-if="props.label" :for="controlId" v-bind="stylex.attrs(styles.label)">
      {{ props.label }}
    </label>
    <slot />
    <p v-if="props.error" :id="helpId" role="alert" v-bind="stylex.attrs(styles.p)" :style="{ color: cssColor('red') }">
      <span aria-hidden="true" v-bind="stylex.attrs(styles.text)" :style="{ background: cssColor('red') }" />
      {{ props.error }}
    </p>
    <p v-else-if="props.description" :id="helpId" v-bind="stylex.attrs(styles.p2)">
      {{ props.description }}
    </p>
  </div>
</template>
