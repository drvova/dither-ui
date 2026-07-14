<script setup lang="ts">
import { ref } from "vue"
import { addArtboard, deselect, editor } from "@/entities/editor"
import { useShortcuts } from "@/features/keyboard"
import { usePanZoom } from "@/features/pan-zoom"
import Artboard from "./Artboard.vue"

const host = ref<HTMLElement | null>(null)
const { onWheel, startPan, zoomIn, zoomOut, resetZoom, fit } = usePanZoom(host)
useShortcuts({ fit, zoomIn, zoomOut, resetZoom })
</script>

<template>
  <div
    ref="host"
    class="dk-canvas relative h-full w-full overflow-hidden"
    @wheel.prevent="onWheel"
    @pointerdown.self="startPan"
    @click.self="deselect"
  >
    <div
      class="absolute left-0 top-0 origin-top-left"
      :style="{
        transform: `translate(${editor.viewport.x}px, ${editor.viewport.y}px) scale(${editor.viewport.zoom})`,
      }"
    >
      <Artboard v-for="a in editor.artboards" :key="a.id" :artboard="a" />
    </div>

    <!-- Empty state -->
    <div
      v-if="editor.artboards.length === 0"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
    >
      <p class="text-sm text-muted-foreground">No artboards yet.</p>
      <button
        type="button"
        class="pointer-events-auto rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground transition-opacity hover:opacity-90"
        @click="addArtboard('area')"
      >
        + Add artboard
      </button>
    </div>

    <!-- Zoom controls -->
    <div
      class="pointer-events-auto absolute bottom-4 left-4 flex items-center gap-0.5 rounded-lg border border-border bg-card/90 p-1 text-xs backdrop-blur"
    >
      <button class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground" title="Zoom out (⌘−)" @click="zoomOut">−</button>
      <button class="w-12 rounded-md py-1 text-center tabular-nums text-muted-foreground transition-colors hover:text-foreground" title="Reset to 100% (⌘0)" @click="resetZoom">{{ Math.round(editor.viewport.zoom * 100) }}%</button>
      <button class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground" title="Zoom in (⌘+)" @click="zoomIn">+</button>
      <span class="mx-0.5 h-4 w-px bg-border" />
      <button class="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground" title="Fit (⇧1)" @click="fit">
        <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
      </button>
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
