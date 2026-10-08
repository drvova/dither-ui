<script setup lang="ts">
// One clip of a reel: the referenced frame at its own size, centred and
// scaled down (never up) to fit the reel's frame, rendered by the same
// renderers the Studio and the player use.
import type { Artboard } from "@/entities/artboard"
import { ChartRenderer } from "@/widgets/chart-renderer"
import WidgetRenderer from "@/widgets/widget-renderer/WidgetRenderer.vue"

defineProps<{ artboard: Artboard; scale: number }>()
</script>

<template>
  <div
    class="absolute top-1/2 left-1/2 bg-card/60 p-3 text-[13px] text-foreground"
    :data-clip="artboard.id"
    :style="{ width: `${artboard.w}px`, height: `${artboard.h}px`, transform: `translate(-50%, -50%) scale(${scale})` }"
  >
    <WidgetRenderer v-if="artboard.widget" :widget="artboard.widget" :artboard-id="artboard.id" />
    <div v-else class="h-full"><ChartRenderer :chart="artboard.chart" /></div>
  </div>
</template>
