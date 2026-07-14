<script setup lang="ts">
import { computed } from "vue"
import type { Artboard } from "@/entities/artboard"
import {
  editor,
  moveArtboard,
  moveSelected,
  resizeArtboard,
  selectArtboard,
} from "@/entities/editor"
import { startDrag } from "@/features/artboard-transform"
import { ChartRenderer } from "@/widgets/chart-renderer"

const props = defineProps<{ artboard: Artboard }>()
const selected = computed(() => editor.selectedIds.includes(props.artboard.id))

const additive = (e: PointerEvent) => e.metaKey || e.ctrlKey || e.shiftKey

function onSelect(e: PointerEvent) {
  selectArtboard(props.artboard.id, additive(e))
}
function onHeaderDown(e: PointerEvent) {
  if (!selected.value) selectArtboard(props.artboard.id, additive(e))
  if (props.artboard.locked) return
  startDrag(e, (dx, dy) => {
    if (editor.selectedIds.length > 1 && editor.selectedIds.includes(props.artboard.id))
      moveSelected(dx, dy)
    else moveArtboard(props.artboard.id, dx, dy)
  })
}
function onResizeDown(e: PointerEvent) {
  if (!selected.value) selectArtboard(props.artboard.id)
  if (props.artboard.locked) return
  startDrag(e, (dx, dy) =>
    resizeArtboard(props.artboard.id, props.artboard.w + dx, props.artboard.h + dy)
  )
}
</script>

<template>
  <div
    class="absolute"
    :style="{
      left: `${artboard.x}px`,
      top: `${artboard.y}px`,
      width: `${artboard.w}px`,
      height: `${artboard.h}px`,
    }"
    @pointerdown.stop="onSelect"
  >
    <div
      class="absolute -top-6 left-0 flex max-w-full select-none items-center gap-1.5 truncate text-[11px]"
      :class="[selected ? 'text-accent' : 'text-muted-foreground', artboard.locked ? 'cursor-default' : 'cursor-move']"
      @pointerdown.stop="onHeaderDown"
    >
      <svg v-if="artboard.locked" viewBox="0 0 24 24" class="size-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      <span class="truncate">{{ artboard.name }}</span>
      <span class="text-muted-foreground/60">{{ artboard.w }}×{{ artboard.h }}</span>
    </div>

    <div
      class="h-full w-full rounded-lg bg-card/60 p-3"
      :class="selected ? 'ring-2 ring-accent' : 'border border-border'"
    >
      <ChartRenderer :chart="artboard.chart" />
    </div>

    <div
      v-if="selected && !artboard.locked"
      class="absolute -bottom-1.5 -right-1.5 size-3 cursor-nwse-resize rounded-[2px] border border-accent bg-background"
      @pointerdown.stop="onResizeDown"
    />
  </div>
</template>
