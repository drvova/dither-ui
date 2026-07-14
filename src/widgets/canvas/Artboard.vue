<script setup lang="ts">
import { computed } from "vue"
import type { Artboard } from "@/entities/artboard"
import { editor, selectArtboard } from "@/entities/editor"
import { startDrag } from "@/features/artboard-transform"
import { ChartRenderer } from "@/widgets/chart-renderer"
import { WidgetRenderer } from "@/widgets/widget-renderer"

const props = defineProps<{ artboard: Artboard }>()
const selected = computed(() => editor.selectedIds.includes(props.artboard.id))

const additive = (e: PointerEvent) => e.metaKey || e.ctrlKey || e.shiftKey

function onSelect(e: PointerEvent) {
  selectArtboard(props.artboard.id, additive(e))
}
/** Drag with edge/center snapping against the other artboards. Moves the
 * whole selection; guides render in the canvas while a snap is active. */
function onHeaderDown(e: PointerEvent) {
  if (!selected.value) selectArtboard(props.artboard.id, additive(e))
  if (props.artboard.locked) return
  const moving = editor.artboards.filter(
    (a) => editor.selectedIds.includes(a.id) && !a.locked
  )
  const others = editor.artboards.filter(
    (a) => !editor.selectedIds.includes(a.id) && !a.hidden
  )
  const starts = new Map(moving.map((a) => [a.id, { x: a.x, y: a.y }]))
  const meStart = { x: props.artboard.x, y: props.artboard.y }
  const { w, h } = props.artboard
  let accX = 0
  let accY = 0
  startDrag(
    e,
    (dx, dy) => {
      accX += dx
      accY += dy
      const threshold = 6 / (editor.viewport.zoom || 1)
      const rawX = meStart.x + accX
      const rawY = meStart.y + accY
      let sx = 0
      let sy = 0
      let gv: number | null = null
      let gh: number | null = null
      let bestX = threshold
      let bestY = threshold
      for (const o of others) {
        for (const ox of [o.x, o.x + o.w / 2, o.x + o.w]) {
          for (const mx of [rawX, rawX + w / 2, rawX + w]) {
            const d = ox - mx
            if (Math.abs(d) < bestX) {
              bestX = Math.abs(d)
              sx = d
              gv = ox
            }
          }
        }
        for (const oy of [o.y, o.y + o.h / 2, o.y + o.h]) {
          for (const my of [rawY, rawY + h / 2, rawY + h]) {
            const d = oy - my
            if (Math.abs(d) < bestY) {
              bestY = Math.abs(d)
              sy = d
              gh = oy
            }
          }
        }
      }
      for (const a of moving) {
        const s = starts.get(a.id)!
        a.x = s.x + accX + sx
        a.y = s.y + accY + sy
      }
      editor.guides.v = gv
      editor.guides.h = gh
    },
    () => {
      editor.guides.v = null
      editor.guides.h = null
    }
  )
}
// 8-direction resize with shift-to-constrain (corner handles keep the aspect
// ratio). Widget frames allow smaller minimums than chart frames.
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
const HANDLES: { dir: ResizeDir; class: string }[] = [
  { dir: "nw", class: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { dir: "n", class: "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { dir: "ne", class: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { dir: "e", class: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { dir: "se", class: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
  { dir: "s", class: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { dir: "sw", class: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { dir: "w", class: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
]

function onResizeDown(dir: ResizeDir, e: PointerEvent) {
  if (!selected.value) selectArtboard(props.artboard.id)
  const a = props.artboard
  if (a.locked) return
  const start = { x: a.x, y: a.y, w: a.w, h: a.h }
  const ratio = start.w / start.h
  const minW = a.widget ? 100 : 260
  const minH = a.widget ? 60 : 200
  let ax = 0
  let ay = 0
  startDrag(e, (dx, dy, ev) => {
    ax += dx
    ay += dy
    let w = start.w
    let h = start.h
    if (dir.includes("e")) w = start.w + ax
    if (dir.includes("w")) w = start.w - ax
    if (dir.includes("s")) h = start.h + ay
    if (dir.includes("n")) h = start.h - ay
    // Shift on a corner: constrain to the starting aspect ratio, following
    // whichever axis moved further.
    if (ev.shiftKey && dir.length === 2) {
      if (Math.abs(ax) * start.h > Math.abs(ay) * start.w) h = w / ratio
      else w = h * ratio
    }
    w = Math.max(minW, Math.round(w))
    h = Math.max(minH, Math.round(h))
    // Anchor the opposite edge: n/w drags move the origin by the size change.
    a.w = w
    a.h = h
    a.x = dir.includes("w") ? start.x + (start.w - w) : start.x
    a.y = dir.includes("n") ? start.y + (start.h - h) : start.y
  })
}
</script>

<template>
  <div
    class="absolute"
    :data-artboard-id="artboard.id"
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
      data-artboard-surface
      class="h-full w-full rounded-lg bg-card/60 p-3"
      :class="selected ? 'ring-2 ring-accent' : 'border border-border'"
    >
      <WidgetRenderer v-if="artboard.widget" :widget="artboard.widget" />
      <ChartRenderer v-else :chart="artboard.chart" />
    </div>

    <template v-if="selected && !artboard.locked">
      <div
        v-for="hd in HANDLES"
        :key="hd.dir"
        class="absolute z-10 size-3 rounded-[2px] border border-accent bg-background"
        :class="hd.class"
        @pointerdown.stop="onResizeDown(hd.dir, $event)"
      />
    </template>
  </div>
</template>
