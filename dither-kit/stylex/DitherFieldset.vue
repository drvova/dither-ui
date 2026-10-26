<!-- Generated from ../tailwind/DitherFieldset.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  fieldset: {
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    padding: "1rem",
  },
  legend: {
    paddingInline: "0.375rem",
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  grid: { display: "grid", gap: "1rem" },
})
</script>

<script setup lang="ts">
defineProps<{ legend: string }>()
</script>

<template>
  <fieldset v-bind="stylex.attrs(styles.fieldset)">
    <legend v-bind="stylex.attrs(styles.legend)">
      {{ legend }}
    </legend>
    <div v-bind="stylex.attrs(styles.grid)">
      <slot />
    </div>
  </fieldset>
</template>
