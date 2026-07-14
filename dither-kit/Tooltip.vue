<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useCommonChart } from "./common-context"
import { cn } from "./lib"
import { rgb } from "./palette"

export type TooltipVariant = "default" | "frosted-glass"

defineOptions({ chartLayer: "dom" })

const props = withDefaults(
  defineProps<{
    labelKey?: string
    valueFormatter?: (value: number, name: string) => string
    variant?: TooltipVariant
  }>(),
  { variant: "default" }
)

const VARIANT: Record<TooltipVariant, string> = {
  default: "bg-popover",
  "frosted-glass": "bg-popover/70 backdrop-blur-sm",
}

const chart = useCommonChart()
const show = computed(() => chart.ready && chart.hoverIndex != null)

// Retain the last hovered index so the card keeps its content while fading out.
const lastIndex = ref(0)
watch(
  () => chart.hoverIndex,
  (hi) => {
    if (hi != null) lastIndex.value = hi
  }
)
const index = computed(() => chart.hoverIndex ?? lastIndex.value)
const heading = computed(() => chart.heading(index.value, props.labelKey))
const items = computed(() => chart.itemsAt(index.value))
</script>

<template>
  <Transition name="dk-tooltip">
    <div
      v-if="show && items.length > 0"
      :class="
        cn(
          'dk-tooltip-card pointer-events-none absolute z-10 rounded-md border px-2 py-1 shadow-sm',
          VARIANT[props.variant]
        )
      "
      :style="{
        top: `${chart.tooltipTop}px`,
        left: `${chart.tooltipLeft}px`,
        transform: 'translate(-50%, -115%)',
      }"
    >
      <div
        v-if="heading"
        class="mb-0.5 font-mono text-[10px] text-muted-foreground"
      >
        {{ heading }}
      </div>
      <div class="flex flex-col gap-0.5">
        <div
          v-for="item in items"
          :key="item.name"
          class="flex items-center gap-1.5 font-mono text-[11px] text-popover-foreground tabular-nums"
          :style="{ opacity: item.dimmed ? 0.4 : 1 }"
        >
          <span
            class="size-2 rounded-[1px]"
            :style="{ backgroundColor: rgb(item.seed.fill) }"
          />
          <span class="text-muted-foreground">{{ item.label }}</span>
          <span class="ml-auto pl-2 text-foreground">
            {{
              props.valueFormatter
                ? props.valueFormatter(item.value, item.name)
                : item.value.toLocaleString()
            }}
          </span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Glide between points (top/left) with a spring-ish curve; fade via Transition.
   Replaces the React `motion` spring with native CSS — no dependency. */
.dk-tooltip-card {
  transition:
    top 260ms cubic-bezier(0.22, 1, 0.36, 1),
    left 260ms cubic-bezier(0.22, 1, 0.36, 1);
}
.dk-tooltip-enter-active,
.dk-tooltip-leave-active {
  transition: opacity 180ms ease;
}
.dk-tooltip-enter-from,
.dk-tooltip-leave-to {
  opacity: 0;
}
</style>
