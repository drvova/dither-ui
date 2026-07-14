<script setup lang="ts">
import { reactive } from "vue"
import type { Artboard } from "@/entities/artboard"
import { type Layer, layersOf } from "@/entities/chart"
import { editor, selectArtboard, selectLayer } from "@/entities/editor"

// Collapsed set — artboards are expanded by default (familiar tree behaviour).
const collapsed = reactive(new Set<string>())
const isOpen = (id: string) => !collapsed.has(id)
function toggle(id: string) {
  if (collapsed.has(id)) collapsed.delete(id)
  else collapsed.add(id)
}

const childLayers = (a: Artboard) =>
  layersOf(a.chart, a.id).filter((l) => l.kind !== "root")

function seriesOf(a: Artboard, layer: Layer) {
  return a.chart.series.find((s) => s.key === layer.seriesKey)
}
function visible(a: Artboard, layer: Layer): boolean {
  const c = a.chart
  switch (layer.kind) {
    case "grid": return c.grid.on
    case "xAxis": return c.xAxis.on
    case "yAxis": return c.yAxis.on
    case "legend": return c.legend.on
    case "tooltip": return c.tooltip.on
    case "series": return seriesOf(a, layer)?.on ?? true
    default: return true
  }
}
const togglable = (l: Layer) => l.kind !== "root" && l.kind !== "pie"
function toggleVis(a: Artboard, layer: Layer) {
  const c = a.chart
  switch (layer.kind) {
    case "grid": c.grid.on = !c.grid.on; break
    case "xAxis": c.xAxis.on = !c.xAxis.on; break
    case "yAxis": c.yAxis.on = !c.yAxis.on; break
    case "legend": c.legend.on = !c.legend.on; break
    case "tooltip": c.tooltip.on = !c.tooltip.on; break
    case "series": { const s = seriesOf(a, layer); if (s) s.on = !s.on; break }
  }
}

function pickArtboard(a: Artboard) {
  selectArtboard(a.id)
  collapsed.delete(a.id)
}
</script>

<template>
  <div class="flex flex-col gap-px text-[13px]">
    <template v-for="a in editor.artboards" :key="a.id">
      <!-- Artboard (frame) row -->
      <div
        class="group flex h-7 items-center gap-1 rounded pl-1 pr-1.5 transition-colors"
        :class="editor.selectedArtboardId === a.id ? 'bg-accent/15' : 'hover:bg-card'"
        @click="pickArtboard(a)"
      >
        <button
          type="button"
          class="flex size-4 shrink-0 items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground"
          @click.stop="toggle(a.id)"
        >
          <svg viewBox="0 0 24 24" class="size-3 transition-transform" :class="isOpen(a.id) ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <span class="grid size-3.5 shrink-0 place-items-center text-[13px] font-semibold leading-none" :class="editor.selectedArtboardId === a.id ? 'text-accent' : 'text-muted-foreground/60'">#</span>
        <span class="truncate" :class="editor.selectedArtboardId === a.id ? 'font-medium text-foreground' : 'text-foreground/90'">{{ a.name }}</span>
        <span class="ml-auto shrink-0 text-[11px] capitalize text-muted-foreground/50">{{ a.chart.type }}</span>
      </div>

      <!-- Child layers -->
      <template v-if="isOpen(a.id)">
        <button
          v-for="layer in childLayers(a)"
          :key="layer.id"
          type="button"
          class="group/row flex h-7 items-center gap-2 rounded pl-8 pr-1.5 text-left transition-colors"
          :class="[
            editor.selectedLayerId === layer.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-card',
            !visible(a, layer) && togglable(layer) ? 'opacity-45' : '',
          ]"
          @click="selectLayer(layer.id)"
        >
          <span class="truncate text-[12px]">{{ layer.label }}</span>
          <span
            v-if="layer.kind === 'series' && seriesOf(a, layer)"
            class="ml-auto size-2.5 shrink-0 rounded-[2px]"
            :style="{ backgroundColor: `var(--swatch-${seriesOf(a, layer)!.color})` }"
          />
          <span
            v-if="togglable(layer)"
            role="button"
            class="flex size-5 shrink-0 items-center justify-center rounded transition-opacity hover:opacity-100"
            :class="[layer.kind === 'series' ? '' : 'ml-auto', visible(a, layer) ? 'opacity-0 group-hover/row:opacity-80' : 'opacity-60']"
            @click.stop="toggleVis(a, layer)"
          >
            <svg v-if="visible(a, layer)" viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 2l20 20M6.7 6.7A10.5 10.5 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.3-1.5M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15.9 15.9 0 0 1-2.4 3.2" /></svg>
          </span>
        </button>
      </template>
    </template>
  </div>
</template>
