<script setup lang="ts">
import { computed } from "vue"
import type { Artboard } from "@/entities/artboard"
import {
  editor,
  moveArtboard,
  resizeArtboard,
  selectArtboard,
} from "@/entities/editor"
import { startDrag } from "@/features/artboard-transform"
import { ChartRenderer } from "@/widgets/chart-renderer"

const props = defineProps<{ artboard: Artboard }>()
const selected = computed(() => editor.selectedArtboardId === props.artboard.id)

function onHeaderDown(e: PointerEvent) {
  selectArtboard(props.artboard.id)
  startDrag(e, (dx, dy) => moveArtboard(props.artboard.id, dx, dy))
}
function onResizeDown(e: PointerEvent) {
  selectArtboard(props.artboard.id)
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
    @pointerdown.stop="selectArtboard(artboard.id)"
  >
    <div
      class="absolute -top-6 left-0 flex max-w-full cursor-move select-none items-center gap-1.5 truncate text-[11px]"
      :class="selected ? 'text-foreground' : 'text-muted-foreground'"
      @pointerdown.stop="onHeaderDown"
    >
      <span class="truncate">{{ artboard.name }}</span>
      <span class="text-muted-foreground/60">{{ artboard.w }}×{{ artboard.h }}</span>
    </div>

    <div
      class="h-full w-full rounded-lg bg-card/60 p-3"
      :class="selected ? 'ring-2 ring-foreground' : 'ring-1 ring-white/10 dark:ring-white/10'"
    >
      <ChartRenderer :chart="artboard.chart" />
    </div>

    <div
      v-if="selected"
      class="absolute -bottom-1.5 -right-1.5 size-3 cursor-nwse-resize rounded-[2px] border border-foreground bg-background"
      @pointerdown.stop="onResizeDown"
    />
  </div>
</template>
