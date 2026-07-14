<script setup lang="ts">
import { computed } from "vue"
import type { AreaVariant } from "@/shared/dither-kit"
import { editor, selectedArtboard, selectedChart, selectedLayers, setSelectedType } from "@/entities/editor"
import { BLOOMS, CHART_TYPES, familyOf, STACKS, VARIANTS } from "@/shared/config"
import { ColorPicker, NumberField, Segmented, Toggle } from "@/shared/ui"

const ab = selectedArtboard
const chart = selectedChart
const layer = computed(() => selectedLayers.value.find((l) => l.id === editor.selectedLayerId))
const kind = computed(() => layer.value?.kind ?? "root")
const fam = computed(() => (chart.value ? familyOf(chart.value.type) : "cartesian"))
const series = computed(() =>
  layer.value?.seriesKey
    ? chart.value?.series.find((s) => s.key === layer.value!.seriesKey)
    : undefined
)

const pieVariant = computed(() => chart.value?.series[0]?.variant ?? "gradient")
function setPieVariant(v: AreaVariant) {
  chart.value?.series.forEach((s) => (s.variant = v))
}
</script>

<template>
  <div v-if="chart && ab" class="flex h-full flex-col">
    <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3">
      <span class="truncate text-[13px] font-medium text-foreground">{{ layer?.label ?? "Inspector" }}</span>
      <span class="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{{ kind }}</span>
    </div>
    <div class="flex flex-col gap-5 overflow-y-auto p-4">

    <!-- ROOT / FRAME -->
    <template v-if="kind === 'root'">
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">name</span>
        <input v-model="ab.name" type="text" name="artboard-name" autocomplete="off" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" />
      </label>
      <div class="grid grid-cols-2 gap-2">
        <NumberField v-model="ab.x" label="X" />
        <NumberField v-model="ab.y" label="Y" />
        <NumberField v-model="ab.w" label="W" :min="260" />
        <NumberField v-model="ab.h" label="H" :min="200" />
      </div>

      <section>
        <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">type</p>
        <div class="flex flex-wrap gap-0.5 rounded-md border border-border bg-background/60 p-0.5">
          <button v-for="t in CHART_TYPES" :key="t" type="button" class="rounded-[5px] px-2.5 py-1 text-xs capitalize leading-none transition-colors" :class="chart.type === t ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'" @click="setSelectedType(t)">{{ t }}</button>
        </div>
      </section>

      <section class="flex flex-col gap-3">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground">style</p>
        <Segmented v-model="chart.bloom" :options="BLOOMS" label="bloom" />
        <Segmented v-if="fam === 'cartesian'" v-model="chart.stackType" :options="STACKS" label="stack" />
        <label v-if="chart.type === 'pie'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">radius</span>
          <input v-model.number="chart.innerRadius" type="range" name="pie-radius" min="0" max="0.85" step="0.05" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.innerRadius.toFixed(2) }}</span>
        </label>
        <NumberField v-model="chart.animationDuration" label="anim" unit="ms" :min="0" :max="4000" :step="50" />
        <div class="flex gap-4 pt-0.5">
          <Toggle v-model="chart.animate" label="animate" />
          <Toggle v-if="fam === 'cartesian'" v-model="chart.interactive" label="interactive" />
        </div>
      </section>

      <section v-if="fam === 'cartesian'">
        <p class="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">margins</p>
        <div class="grid grid-cols-2 gap-2">
          <NumberField v-model="chart.margins.top" label="top" :min="0" />
          <NumberField v-model="chart.margins.right" label="right" :min="0" />
          <NumberField v-model="chart.margins.bottom" label="bottom" :min="0" />
          <NumberField v-model="chart.margins.left" label="left" :min="0" />
        </div>
      </section>
    </template>

    <!-- SERIES / SLICE -->
    <template v-else-if="kind === 'series' && series">
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">label</span>
        <input v-model="series.label" type="text" name="series-label" autocomplete="off" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" />
      </label>
      <div class="text-[11px] text-muted-foreground">
        <span class="mb-1 block">color</span>
        <ColorPicker v-model="series.color" />
      </div>
      <Segmented v-if="chart.type !== 'line'" v-model="series.variant" :options="VARIANTS" label="variant" />
      <div class="flex gap-4 pt-0.5">
        <Toggle v-model="series.on" label="visible" />
        <Toggle v-model="series.isClickable" label="clickable" />
      </div>
    </template>

    <!-- PIE -->
    <template v-else-if="kind === 'pie'">
      <Segmented :model-value="pieVariant" :options="VARIANTS" label="variant" @update:model-value="setPieVariant" />
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">radius</span>
        <input v-model.number="chart.innerRadius" type="range" name="pie-radius" min="0" max="0.85" step="0.05" class="flex-1 accent-foreground" />
        <span class="w-8 tabular-nums text-foreground">{{ chart.innerRadius.toFixed(2) }}</span>
      </label>
    </template>

    <!-- GRID -->
    <template v-else-if="kind === 'grid'">
      <div class="flex gap-4">
        <Toggle v-model="chart.grid.horizontal" label="horizontal" />
        <Toggle v-model="chart.grid.vertical" label="vertical" />
      </div>
      <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">dash</span>
        <input v-model="chart.grid.dash" type="text" name="grid-dash" autocomplete="off" class="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-accent/60" placeholder="3 3" />
      </label>
    </template>

    <!-- X AXIS -->
    <template v-else-if="kind === 'xAxis'">
      <NumberField v-model="chart.xAxis.tickMargin" label="tick gap" :min="0" />
      <NumberField v-model="chart.xAxis.maxTicks" label="max ticks" :min="1" :max="20" />
    </template>

    <!-- Y AXIS -->
    <template v-else-if="kind === 'yAxis'">
      <NumberField v-model="chart.yAxis.tickCount" label="ticks" :min="2" :max="12" />
      <NumberField v-model="chart.yAxis.tickMargin" label="tick gap" :min="0" />
    </template>

    <!-- LEGEND -->
    <template v-else-if="kind === 'legend'">
      <Segmented v-model="chart.legend.align" :options="['left', 'center', 'right']" label="align" />
      <Toggle v-model="chart.legend.clickable" label="clickable" />
    </template>

    <!-- TOOLTIP -->
    <template v-else-if="kind === 'tooltip'">
      <Segmented v-model="chart.tooltip.variant" :options="['default', 'frosted-glass']" label="variant" />
    </template>
    </div>
  </div>

  <div v-else class="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
    Select an artboard to edit its properties.
  </div>
</template>
