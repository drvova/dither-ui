<script setup lang="ts">
// The player: ONE Studio frame, rendered by the same renderers the Studio
// uses, at its own size, with none of the editor around it. It is the page a
// HyperFrames composition carries (the document embedded as JSON, the kit
// seeked through `hf-seek`) and the page the Studio opens for a live preview
// (`/play/#doc=<base64url document>`). Nothing here reads the editor's
// project store, so the document is whatever the page was given (source.ts).
import { computed } from "vue"
import type { Artboard } from "@/entities/artboard"
import { parseDocument } from "@/features/persistence"
import { ChartRenderer } from "@/widgets/chart-renderer"
import { WidgetRenderer } from "@/widgets/widget-renderer"
import type { PlaySource } from "./source"

const props = defineProps<{ source: PlaySource }>()

const artboard = computed<Artboard | null>(() => {
  const parsed = parseDocument(props.source.document)
  if (!parsed) return null
  return parsed.artboards.find((a) => a.id === props.source.artboardId) ?? parsed.artboards.find((a) => !a.hidden) ?? parsed.artboards[0] ?? null
})
</script>

<template>
  <div
    v-if="artboard"
    class="play-surface bg-card/60 p-3 text-[13px] text-foreground antialiased"
    :data-artboard-id="artboard.id"
    :style="{ width: `${artboard.w}px`, height: `${artboard.h}px` }"
  >
    <WidgetRenderer v-if="artboard.widget" :widget="artboard.widget" :artboard-id="artboard.id" />
    <div v-else class="h-full"><ChartRenderer :chart="artboard.chart" /></div>
  </div>
  <p v-else class="play-empty">No frame to play. Open this page from the Studio's video export.</p>
</template>

<style scoped>
.play-surface { position: relative; overflow: hidden; box-sizing: border-box; }
.play-empty { margin: 0; padding: 24px; font-family: var(--font-mono); font-size: 12px; color: var(--color-muted-foreground); }
</style>
