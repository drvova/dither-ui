<script setup lang="ts">
import { ref } from "vue"
import { editor } from "@/entities/editor"
import { usePanZoom } from "@/features/pan-zoom"
import Artboard from "./Artboard.vue"

const host = ref<HTMLElement | null>(null)
const { onWheel, startPan, zoomIn, zoomOut, resetZoom } = usePanZoom(host)
</script>

<template>
  <div
    ref="host"
    class="dk-canvas relative h-full w-full overflow-hidden"
    @wheel.prevent="onWheel"
    @pointerdown.self="startPan"
  >
    <div
      class="absolute left-0 top-0 origin-top-left"
      :style="{
        transform: `translate(${editor.viewport.x}px, ${editor.viewport.y}px) scale(${editor.viewport.zoom})`,
      }"
    >
      <Artboard v-for="a in editor.artboards" :key="a.id" :artboard="a" />
    </div>

    <div
      class="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-0.5 rounded-lg border border-border bg-card/90 p-1 font-mono text-xs backdrop-blur"
    >
      <button class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground" @click="zoomOut">−</button>
      <button class="w-12 rounded-md py-1 text-center tabular-nums text-muted-foreground transition-colors hover:text-foreground" @click="resetZoom">{{ Math.round(editor.viewport.zoom * 100) }}%</button>
      <button class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground" @click="zoomIn">+</button>
    </div>
  </div>
</template>

<style scoped>
.dk-canvas {
  background-color: color-mix(in oklab, var(--color-background) 92%, var(--color-muted));
  background-image: radial-gradient(
    circle,
    color-mix(in oklab, var(--color-foreground) 12%, transparent) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  cursor: grab;
}
.dk-canvas:active {
  cursor: grabbing;
}
</style>
