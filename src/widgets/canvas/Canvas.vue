<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { addArtboard, deselect, editor, selectMany } from "@/entities/editor"
import { useShortcuts } from "@/features/keyboard"
import { usePanZoom } from "@/features/pan-zoom"
import Artboard from "./Artboard.vue"

const host = ref<HTMLElement | null>(null)
const { onWheel, startPan, zoomIn, zoomOut, resetZoom, fit, fitSelection } = usePanZoom(host)
useShortcuts({ fit, fitSelection, zoomIn, zoomOut, resetZoom })
const visible = computed(() => editor.artboards.filter((a) => !a.hidden))

// Space-to-pan (Figma convention): plain drag on empty canvas = marquee.
const spaceHeld = ref(false)
const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
}
function onKeyDown(e: KeyboardEvent) {
  if (e.key === " " && !isTyping(e.target)) spaceHeld.value = true
}
function onKeyUp(e: KeyboardEvent) {
  if (e.key === " ") spaceHeld.value = false
}
onMounted(() => {
  window.addEventListener("keydown", onKeyDown)
  window.addEventListener("keyup", onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown)
  window.removeEventListener("keyup", onKeyUp)
})

// Marquee selection on empty-canvas drag.
const marquee = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
function onCanvasDown(e: PointerEvent) {
  if (e.button === 1 || spaceHeld.value) return startPan(e)
  if (e.button !== 0) return
  const rect = host.value?.getBoundingClientRect()
  if (!rect) return
  const sx = e.clientX - rect.left
  const sy = e.clientY - rect.top
  marquee.value = { x1: sx, y1: sy, x2: sx, y2: sy }
  const move = (ev: PointerEvent) => {
    const x2 = ev.clientX - rect.left
    const y2 = ev.clientY - rect.top
    marquee.value = { x1: sx, y1: sy, x2, y2 }
    const v = editor.viewport
    const wx1 = (Math.min(sx, x2) - v.x) / v.zoom
    const wy1 = (Math.min(sy, y2) - v.y) / v.zoom
    const wx2 = (Math.max(sx, x2) - v.x) / v.zoom
    const wy2 = (Math.max(sy, y2) - v.y) / v.zoom
    const hit = editor.artboards.filter(
      (a) =>
        !a.hidden && !a.locked &&
        a.x < wx2 && a.x + a.w > wx1 && a.y < wy2 && a.y + a.h > wy1
    )
    selectMany(hit.map((a) => a.id))
  }
  const up = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", move)
    window.removeEventListener("pointerup", up)
    const moved = Math.hypot(ev.clientX - rect.left - sx, ev.clientY - rect.top - sy)
    if (moved < 3) deselect() // plain click on empty canvas
    marquee.value = null
  }
  window.addEventListener("pointermove", move)
  window.addEventListener("pointerup", up)
}
</script>

<template>
  <div
    ref="host"
    class="dk-canvas relative h-full w-full overflow-hidden"
    :class="spaceHeld ? 'cursor-grab' : ''"
    @wheel.prevent="onWheel"
    @pointerdown.self="onCanvasDown"
  >
    <div
      class="absolute left-0 top-0 origin-top-left"
      :style="{
        transform: `translate(${editor.viewport.x}px, ${editor.viewport.y}px) scale(${editor.viewport.zoom})`,
      }"
    >
      <Artboard v-for="a in visible" :key="a.id" :artboard="a" />
    </div>

    <!-- Snap guides (world coords -> screen) -->
    <div
      v-if="editor.guides.v != null"
      class="pointer-events-none absolute inset-y-0 w-px bg-accent/70"
      :style="{ left: `${editor.guides.v * editor.viewport.zoom + editor.viewport.x}px` }"
    />
    <div
      v-if="editor.guides.h != null"
      class="pointer-events-none absolute inset-x-0 h-px bg-accent/70"
      :style="{ top: `${editor.guides.h * editor.viewport.zoom + editor.viewport.y}px` }"
    />

    <!-- Marquee -->
    <div
      v-if="marquee"
      class="pointer-events-none absolute border border-accent/70 bg-accent/10"
      :style="{
        left: `${Math.min(marquee.x1, marquee.x2)}px`,
        top: `${Math.min(marquee.y1, marquee.y2)}px`,
        width: `${Math.abs(marquee.x2 - marquee.x1)}px`,
        height: `${Math.abs(marquee.y2 - marquee.y1)}px`,
      }"
    />

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
      class="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg border border-border/70 bg-background/95 p-1 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.24)]"
    >
      <button type="button" aria-label="Zoom out" class="zoom-tool" title="Zoom out (⌘−)" @click="zoomOut">−</button>
      <button type="button" aria-label="Reset zoom to 100%" class="w-12 rounded-md py-1 text-center tabular-nums text-muted-foreground transition-colors hover:text-foreground active:scale-[0.96]" title="Reset to 100% (⌘0)" @click="resetZoom">{{ Math.round(editor.viewport.zoom * 100) }}%</button>
      <button type="button" aria-label="Zoom in" class="zoom-tool" title="Zoom in (⌘+)" @click="zoomIn">+</button>
      <span class="mx-0.5 h-4 w-px bg-border" />
      <button type="button" aria-label="Fit to screen" class="zoom-tool" title="Fit (⇧1)" @click="fit">
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
}
.zoom-tool { display: flex; width: 1.75rem; height: 1.75rem; align-items: center; justify-content: center; border-radius: 0.375rem; color: var(--color-muted-foreground); transition: background-color 140ms ease, color 140ms ease, scale 100ms ease; }
.zoom-tool:hover { background: var(--color-background); color: var(--color-foreground); }
.zoom-tool:active { scale: 0.96; }
</style>
