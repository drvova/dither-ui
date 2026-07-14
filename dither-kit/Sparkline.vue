<script setup lang="ts">
import { computed } from "vue"
import { AreaChart } from "./area-chart"
import Area from "./Area.vue"
import type { VariantInput } from "./chart-context"
import type { BloomInput } from "./dither-paint"
import type { DitherColor } from "./palette"

const props = withDefaults(
  defineProps<{
    /** Plain numeric series — the common sparkline case. */
    data: number[]
    color: DitherColor
    variant?: VariantInput
    markerIndex?: number | null
    hovered?: boolean
    bloom?: BloomInput
    bloomOnHover?: boolean
    animate?: boolean
    class?: string
  }>(),
  {
    variant: "gradient",
    markerIndex: null,
    hovered: false,
    bloom: "off",
    bloomOnHover: false,
    animate: false,
  }
)

const rows = computed(() => props.data.map((v) => ({ v })))
const config = computed(() => ({ v: { color: props.color } }))
</script>

<template>
  <AreaChart
    :data="rows"
    :config="config"
    :interactive="false"
    :animate="props.animate"
    :marker-index="props.markerIndex"
    :hovered="props.hovered"
    :bloom="props.bloom"
    :bloom-on-hover="props.bloomOnHover"
    :margins="{ top: 0, right: 0, bottom: 0, left: 0 }"
    :class="props.class"
  >
    <Area data-key="v" :variant="props.variant" />
  </AreaChart>
</template>
