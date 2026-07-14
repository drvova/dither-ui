<script setup lang="ts">
import { computed } from "vue"
import type { VariantInput } from "@dither-kit"
import { editor, replay, selectedArtboard, selectedChart, selectedLayers, setSelectedType } from "@/entities/editor"
import { CHART_TYPES, EASING_NAMES, familyOf, STACKS } from "@/shared/config"
import { BezierEditor, BloomField, ColorField, NumberField, Segmented, TextureField, Toggle } from "@/shared/ui"

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

const locked = computed(() => {
  const c = chart.value
  const a = ab.value
  if (!c || !a) return false
  switch (kind.value) {
    case "root": return a.locked
    case "series": return series.value?.locked ?? false
    case "grid": return c.grid.locked
    case "xAxis": return c.xAxis.locked
    case "yAxis": return c.yAxis.locked
    case "legend": return c.legend.locked
    case "tooltip": return c.tooltip.locked
    default: return false
  }
})
function unlock() {
  const c = chart.value
  const a = ab.value
  if (!c || !a) return
  switch (kind.value) {
    case "root": a.locked = false; break
    case "series": if (series.value) series.value.locked = false; break
    case "grid": c.grid.locked = false; break
    case "xAxis": c.xAxis.locked = false; break
    case "yAxis": c.yAxis.locked = false; break
    case "legend": c.legend.locked = false; break
    case "tooltip": c.tooltip.locked = false; break
  }
}

// Easing: three presets + "custom" which opens the bezier curve editor,
// seeded from the preset's equivalent curve so the switch is seamless.
const EASING_CHOICES = [...EASING_NAMES, "custom"] as const
const DOT_VARIANTS = ["border", "colored-border", "filled"] as const
const SEED_BEZIER: Record<string, [number, number, number, number]> = {
  linear: [0.25, 0.25, 0.75, 0.75],
  "ease-out": [0.33, 1, 0.68, 1],
  "ease-in-out": [0.65, 0, 0.35, 1],
}
const easingChoice = computed<string>(() => {
  const e = chart.value?.easing ?? "ease-in-out"
  return typeof e === "string" ? e : "custom"
})
const bezierPoints = computed<[number, number, number, number]>(() => {
  const e = chart.value?.easing
  return typeof e === "object" && e
    ? [e[0], e[1], e[2], e[3]]
    : SEED_BEZIER["ease-in-out"]
})
function setEasingChoice(v: string | number) {
  const c = chart.value
  if (!c) return
  if (v === "custom") {
    const seed = SEED_BEZIER[easingChoice.value] ?? SEED_BEZIER["ease-in-out"]
    c.easing = [seed[0], seed[1], seed[2], seed[3]]
  } else {
    c.easing = v as (typeof EASING_NAMES)[number]
  }
}

const pieVariant = computed<VariantInput>(
  () => chart.value?.series[0]?.variant ?? "gradient"
)
function setPieVariant(v: VariantInput) {
  chart.value?.series.forEach((s) => (s.variant = v))
}
</script>

<template>
  <div v-if="chart && ab" class="flex h-full flex-col">
    <div class="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3">
      <span class="truncate text-[13px] font-medium text-foreground">{{ layer?.label ?? "Inspector" }}</span>
      <span class="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{{ kind }}</span>
    </div>
    <div v-if="locked" class="mx-4 mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted-foreground">
      <span class="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" class="size-3.5 text-accent" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        Locked
      </span>
      <button type="button" class="rounded border border-border px-1.5 py-0.5 text-foreground transition-colors hover:bg-background" @click="unlock">Unlock</button>
    </div>
    <div class="flex flex-col gap-5 overflow-y-auto p-4" :class="locked ? 'pointer-events-none select-none opacity-50' : ''">

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
        <BloomField v-model="chart.bloom" />
        <Segmented v-if="fam === 'cartesian'" v-model="chart.stackType" :options="STACKS" label="stack" />
        <label v-if="chart.type === 'pie'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">radius</span>
          <input v-model.number="chart.innerRadius" type="range" name="pie-radius" min="0" max="0.85" step="0.05" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.innerRadius.toFixed(2) }}</span>
        </label>
        <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">pixel</span>
          <input v-model.number="chart.cell" type="range" name="cell" min="1" max="6" step="1" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.cell }}px</span>
        </label>
        <label v-if="chart.type === 'bar'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">bar gap</span>
          <input v-model.number="chart.barGap" type="range" name="bar-gap" min="0" max="0.7" step="0.02" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.barGap.toFixed(2) }}</span>
        </label>
        <label v-if="chart.type === 'line'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">glow</span>
          <input v-model.number="chart.glowSize" type="range" name="glow-size" min="0.05" max="0.4" step="0.01" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.glowSize.toFixed(2) }}</span>
        </label>
        <template v-if="chart.type === 'pie'">
          <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span class="w-14 shrink-0">pop</span>
            <input v-model.number="chart.popOut" type="range" name="pie-pop" min="0" max="20" step="1" class="flex-1 accent-foreground" />
            <span class="w-8 tabular-nums text-foreground">{{ chart.popOut }}px</span>
          </label>
          <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span class="w-14 shrink-0">rim</span>
            <input v-model.number="chart.rimWidth" type="range" name="pie-rim" min="0" max="5" step="0.2" class="flex-1 accent-foreground" />
            <span class="w-8 tabular-nums text-foreground">{{ chart.rimWidth.toFixed(1) }}</span>
          </label>
        </template>
        <label v-if="chart.type === 'radar'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">falloff</span>
          <input v-model.number="chart.falloff" type="range" name="radar-falloff" min="0.1" max="1" step="0.05" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.falloff.toFixed(2) }}</span>
        </label>
        <Toggle v-if="fam === 'cartesian'" v-model="chart.interactive" label="interactive" />
      </section>

      <section class="flex flex-col gap-3">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground">animation</p>
        <div class="grid grid-cols-2 gap-2">
          <NumberField v-model="chart.animationDuration" label="time" unit="ms" :min="0" :max="4000" :step="50" />
          <NumberField v-model="chart.animationDelay" label="delay" unit="ms" :min="0" :max="4000" :step="50" />
        </div>
        <Segmented
          :model-value="easingChoice"
          :options="EASING_CHOICES"
          label="easing"
          @update:model-value="setEasingChoice"
        />
        <BezierEditor
          v-if="easingChoice === 'custom'"
          :model-value="bezierPoints"
          @update:model-value="chart.easing = [$event[0], $event[1], $event[2], $event[3]]"
        />
        <label v-if="chart.type === 'bar'" class="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span class="w-14 shrink-0">stagger</span>
          <input v-model.number="chart.stagger" type="range" name="bar-stagger" min="0" max="0.9" step="0.05" class="flex-1 accent-foreground" />
          <span class="w-8 tabular-nums text-foreground">{{ chart.stagger.toFixed(2) }}</span>
        </label>
        <div class="flex flex-wrap gap-x-4 gap-y-2 pt-0.5">
          <Toggle v-model="chart.animate" label="animate" />
          <Toggle v-model="chart.hoverLift" label="hover lift" />
          <Toggle v-if="chart.type === 'area' || chart.type === 'line'" v-model="chart.sparkles" label="sparkles" />
        </div>
        <template v-if="(chart.type === 'area' || chart.type === 'line') && chart.sparkles">
          <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span class="w-14 shrink-0">stars</span>
            <input v-model.number="chart.sparkleDensity" type="range" name="sparkle-density" min="0.2" max="3" step="0.1" class="flex-1 accent-foreground" />
            <span class="w-8 tabular-nums text-foreground">{{ chart.sparkleDensity.toFixed(1) }}×</span>
          </label>
          <label class="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span class="w-14 shrink-0">wink</span>
            <input v-model.number="chart.sparkleSpeed" type="range" name="sparkle-speed" min="0.2" max="3" step="0.1" class="flex-1 accent-foreground" />
            <span class="w-8 tabular-nums text-foreground">{{ chart.sparkleSpeed.toFixed(1) }}×</span>
          </label>
        </template>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <button type="button" class="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground" @click="replay()">
            <svg viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
            replay
          </button>
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
        <ColorField v-model="series.color" />
      </div>
      <TextureField v-if="chart.type !== 'line'" v-model="series.variant" />
      <div class="flex gap-4 pt-0.5">
        <Toggle v-model="series.on" label="visible" />
        <Toggle v-model="series.isClickable" label="clickable" />
      </div>

      <section v-if="fam === 'cartesian'" class="flex flex-col gap-2.5 border-t border-border/60 pt-3">
        <p class="text-[10px] uppercase tracking-widest text-muted-foreground">markers</p>
        <Toggle v-model="series.dots.on" label="dots at every point" />
        <template v-if="series.dots.on">
          <Segmented v-model="series.dots.variant" :options="DOT_VARIANTS" label="style" />
          <NumberField v-model="series.dots.r" label="radius" :min="1" :max="8" :step="0.5" />
        </template>
        <Toggle v-model="series.activeDot.on" label="active dot on hover" />
        <template v-if="series.activeDot.on">
          <Segmented v-model="series.activeDot.variant" :options="DOT_VARIANTS" label="style" />
          <NumberField v-model="series.activeDot.r" label="radius" :min="1" :max="10" :step="0.5" />
        </template>
      </section>
    </template>

    <!-- PIE -->
    <template v-else-if="kind === 'pie'">
      <TextureField :model-value="pieVariant" @update:model-value="setPieVariant" />
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
