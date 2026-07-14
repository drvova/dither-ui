<script setup lang="ts">
import { useCommonChart } from "./common-context"
import { cn } from "./lib"
import { rgb } from "./palette"

defineOptions({ chartLayer: "dom" })

const props = withDefaults(
  defineProps<{
    isClickable?: boolean
    align?: "left" | "center" | "right"
  }>(),
  { isClickable: false, align: "right" }
)

const chart = useCommonChart()

function dimmed(name: string): boolean {
  const emphasis = chart.selectedDataKey ?? chart.focusDataKey
  return emphasis !== null && emphasis !== name
}
</script>

<template>
  <div
    :class="
      cn(
        'pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-3 px-1',
        props.align === 'right' && 'justify-end',
        props.align === 'center' && 'justify-center',
        props.align === 'left' && 'justify-start'
      )
    "
  >
    <button
      v-for="name in chart.names"
      :key="name"
      type="button"
      :disabled="!props.isClickable"
      :class="
        cn(
          'flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-opacity',
          props.isClickable &&
            'pointer-events-auto cursor-pointer hover:text-foreground',
          dimmed(name) && 'opacity-40'
        )
      "
      @click="
        chart.selectDataKey(chart.selectedDataKey === name ? null : name)
      "
      @pointerenter="chart.setFocusDataKey(name)"
      @pointerleave="chart.setFocusDataKey(null)"
      @focus="chart.setFocusDataKey(name)"
      @blur="chart.setFocusDataKey(null)"
    >
      <span
        class="size-2 rounded-[1px]"
        :style="{ backgroundColor: rgb(chart.seedOf(name).fill) }"
      />
      {{ chart.labelOf(name) }}
    </button>
  </div>
</template>
