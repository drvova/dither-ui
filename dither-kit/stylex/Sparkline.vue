<!-- Generated from ../tailwind/Sparkline.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script setup lang="ts">
import { computed } from "vue"
import { AreaChart } from "./area-chart"
import Area from "./Area.vue"
import type { VariantInput } from "../engine/chart-context"
import type { BloomInput } from "../engine/dither-paint"
import type { DitherColor } from "../engine/palette"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    /** Plain numeric series — the common sparkline case. */
    data: number[]
    color: DitherColor
    variant?: VariantInput
    seed?: number
    markerIndex?: number | null
    /** Scrubbable: the pointer marks the nearest point with the chart's own
     * crosshair and `hoverChange` reports its index (null on leave). */
    interactive?: boolean
    /** Brighten the fill while the pointer is over it. */
    hoverLift?: boolean
    /** The idle particle drift along the line; off, the chart holds still. */
    sparkles?: boolean
    hovered?: boolean
    bloom?: BloomInput
    bloomOnHover?: boolean
    animate?: boolean
    class?: string
    xstyle?: StyleProp
  }>(),
  {
    variant: "gradient",
    markerIndex: null,
    interactive: false,
    hoverLift: true,
    sparkles: true,
    hovered: false,
    bloom: "off",
    bloomOnHover: false,
    animate: false,
  },
)

const emit = defineEmits<{ hoverChange: [index: number | null] }>()

const rows = computed(() => props.data.map((v) => ({ v })))
const config = computed(() => ({ v: { color: props.color } }))
</script>

<template>
  <AreaChart
    :data="rows"
    :config="config"
    :interactive="props.interactive"
    :hover-lift="props.hoverLift"
    :sparkles="props.sparkles"
    :on-hover-change="(index: number | null) => emit('hoverChange', index)"
    :animate="props.animate"
    :seed="props.seed"
    :marker-index="props.markerIndex"
    :hovered="props.hovered"
    :bloom="props.bloom"
    :bloom-on-hover="props.bloomOnHover"
    :margins="{ top: 0, right: 0, bottom: 0, left: 0 }"
    :class="cn(props.xstyle, props.class)"
  >
    <Area data-key="v" :variant="props.variant" />
  </AreaChart>
</template>
