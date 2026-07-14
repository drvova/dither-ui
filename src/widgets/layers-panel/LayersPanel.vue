<script setup lang="ts">
import type { Layer } from "@/entities/chart"
import {
  editor,
  selectedArtboard,
  selectedLayers,
  selectLayer,
} from "@/entities/editor"

function seriesOf(layer: Layer) {
  return selectedArtboard.value?.chart.series.find((s) => s.key === layer.seriesKey)
}

function visible(layer: Layer): boolean {
  const c = selectedArtboard.value?.chart
  if (!c) return true
  switch (layer.kind) {
    case "grid": return c.grid.on
    case "xAxis": return c.xAxis.on
    case "yAxis": return c.yAxis.on
    case "legend": return c.legend.on
    case "tooltip": return c.tooltip.on
    case "series": return seriesOf(layer)?.on ?? true
    default: return true
  }
}

const togglable = (l: Layer) => l.kind !== "root" && l.kind !== "pie"

function toggle(layer: Layer) {
  const c = selectedArtboard.value?.chart
  if (!c) return
  switch (layer.kind) {
    case "grid": c.grid.on = !c.grid.on; break
    case "xAxis": c.xAxis.on = !c.xAxis.on; break
    case "yAxis": c.yAxis.on = !c.yAxis.on; break
    case "legend": c.legend.on = !c.legend.on; break
    case "tooltip": c.tooltip.on = !c.tooltip.on; break
    case "series": { const s = seriesOf(layer); if (s) s.on = !s.on; break }
  }
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <p class="mb-1 px-2 text-[10px] uppercase tracking-widest text-muted-foreground">layers</p>
    <button
      v-for="layer in selectedLayers"
      :key="layer.id"
      type="button"
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
      :class="[
        editor.selectedLayerId === layer.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-card',
        !visible(layer) && togglable(layer) ? 'opacity-45' : '',
        layer.kind === 'root' ? 'font-medium' : '',
        layer.kind === 'series' ? 'pl-5' : '',
      ]"
      @click="selectLayer(layer.id)"
    >
      <span class="truncate">{{ layer.label }}</span>
      <span
        v-if="layer.kind === 'series' && seriesOf(layer)"
        class="ml-auto size-2.5 shrink-0 rounded-[2px]"
        :style="{ backgroundColor: `var(--swatch-${seriesOf(layer)!.color})` }"
      />
      <span
        v-if="togglable(layer)"
        role="button"
        class="flex size-5 shrink-0 items-center justify-center rounded transition-opacity hover:opacity-100"
        :class="[layer.kind === 'series' ? '' : 'ml-auto', visible(layer) ? 'opacity-70' : 'opacity-40']"
        @click.stop="toggle(layer)"
      >
        <svg v-if="visible(layer)" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15.9 15.9 0 0 1-2.4 3.2" />
        </svg>
      </span>
    </button>
  </div>
</template>
