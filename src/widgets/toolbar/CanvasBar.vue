<script setup lang="ts">
import { computed, ref } from "vue"
import { DitherIcon, type IconName } from "@dither-kit"
import {
  actualSize,
  addReelArtboard,
  duplicateSelected,
  editor,
  fitAll,
  groupSelected,
  removeSelected,
  replay,
  selectedArtboard,
  startInspecting,
  ungroup,
  zoomIn,
  zoomOut,
} from "@/entities/editor"
import { evolveSelected } from "@/features/agent"
import { handoff } from "@/features/agent/handoff"
import { exportArtboardPng } from "@/features/export-image"

// The canvas's one bar, at its foot: the view (zoom and fit), what the
// selection is, what to do with it, and Inspect. Every key is always there,
// a glyph with its name, and one that does not apply to the selection is
// disabled, never removed, so the bar keeps its width whatever is picked.
// The words live in the titles and the names; a narrower canvas lets the
// label, then the zoom steps, step out. The agent has every action too
// (`features/agent`). It stands aside while the workbench inspects or
// frames are being picked for the agent (each brings its own bar).
const emit = defineEmits<{ export: []; video: [] }>()

const pngBusy = ref(false)
const none = computed(() => editor.selectedIds.length === 0)
const grouped = computed(() => !!selectedArtboard.value?.groupId)
// A reel cuts the selected frames (in selection order); reels are not clips.
const canReel = computed(() =>
  editor.selectedIds.some((id) => editor.artboards.find((a) => a.id === id)?.widget?.kind !== "reel"),
)
const canData = computed(() => !!selectedArtboard.value && !selectedArtboard.value.widget)
const label = computed(() =>
  editor.selectedIds.length > 1
    ? `${editor.selectedIds.length} selected`
    : (selectedArtboard.value?.name ?? "Nothing selected"),
)

async function savePng() {
  const a = selectedArtboard.value
  if (!a || pngBusy.value) return
  pngBusy.value = true
  await exportArtboardPng(a, 2)
  pngBusy.value = false
}
function toggleGroup() {
  const a = selectedArtboard.value
  if (a?.groupId) ungroup(a.groupId)
  else groupSelected()
}

/** A key of the bar, and the agent's action that does the same. */
type Key = {
  id: string
  agent: string
  icon: IconName
  name: string
  keys?: string
  run: () => void
  off?: boolean
  pressed?: boolean
  danger?: boolean
}
/** The bar's keys in groups (a hairline between), each group a row of keys. */
const groups = computed<Key[][]>(() => [
  [
    {
      id: "duplicate",
      agent: "duplicate",
      icon: "Copy",
      name: "Duplicate",
      keys: "⌘D",
      run: duplicateSelected,
      off: none.value,
    },
    {
      id: "group",
      agent: grouped.value ? "ungroup" : "group",
      icon: "Group",
      name: grouped.value ? "Ungroup" : "Group",
      keys: grouped.value ? "⌘⇧G" : "⌘G",
      run: toggleGroup,
      off: none.value,
    },
    {
      id: "delete",
      agent: "remove_artboard",
      icon: "Trash",
      name: "Delete",
      keys: "⌫",
      run: removeSelected,
      off: none.value,
      danger: true,
    },
  ],
  [
    { id: "replay", agent: "replay", icon: "Refresh", name: "Replay the animations", run: replay },
    {
      id: "evolve",
      agent: "evolve",
      icon: "Dice",
      name: "Evolve: four seeded variants",
      run: () => evolveSelected(),
      off: none.value,
    },
    {
      id: "reel",
      agent: "add_reel",
      icon: "Film",
      name: "Reel: play the selected frames in order",
      run: () => addReelArtboard(editor.selectedIds),
      off: !canReel.value,
    },
    {
      id: "data",
      agent: "update_artboard",
      icon: "Table",
      name: "Edit the chart's data",
      run: () => (editor.dataOpen = !editor.dataOpen),
      off: !canData.value,
      pressed: editor.dataOpen && canData.value,
    },
  ],
  [
    {
      id: "code",
      agent: "get_code",
      icon: "Code",
      name: "Export the code",
      run: () => emit("export"),
      off: none.value,
    },
    {
      id: "png",
      agent: "export_png",
      icon: "Image",
      name: pngBusy.value ? "Saving the PNG" : "Save as PNG",
      run: savePng,
      off: none.value || pngBusy.value,
    },
    {
      id: "video",
      agent: "export_video",
      icon: "Video",
      name: "Export as a video",
      run: () => emit("video"),
      off: none.value,
    },
  ],
  [{ id: "inspect", agent: "inspect", icon: "Inspect", name: "Inspect, measure and annotate", run: startInspecting }],
])
const titleOf = (k: Key) => (k.keys ? `${k.name} (${k.keys})` : k.name)
</script>

<template>
  <Transition name="canvas-bar">
    <div
      v-if="!editor.inspecting && !handoff.picking"
      class="canvas-bar capsule"
      :class="{ 'is-raised': editor.dataOpen }"
      role="toolbar"
      aria-label="Canvas"
    >
      <div class="zoom">
        <button
          type="button"
          class="tool step"
          data-agent="set_view"
          aria-label="Zoom out"
          title="Zoom out (⌘−)"
          @click="zoomOut"
        >
          <DitherIcon name="Minus" :size="14" :stroke-width="1.5" />
        </button>
        <button
          type="button"
          class="tool pct"
          data-agent="set_view"
          aria-label="Zoom to 100%"
          title="Zoom to 100% (⌘0)"
          @click="actualSize"
        >
          {{ Math.round(editor.viewport.zoom * 100) }}%
        </button>
        <button
          type="button"
          class="tool step"
          data-agent="set_view"
          aria-label="Zoom in"
          title="Zoom in (⌘+)"
          @click="zoomIn"
        >
          <DitherIcon name="Plus" :size="14" :stroke-width="1.5" />
        </button>
        <button
          type="button"
          class="tool"
          data-agent="set_view"
          aria-label="Fit every frame"
          title="Fit every frame (⇧1)"
          @click="fitAll"
        >
          <DitherIcon name="Maximize" :size="14" :stroke-width="1.5" />
        </button>
      </div>
      <span class="rule" />
      <span class="what" :class="{ 'is-none': none }" aria-live="polite">{{ label }}</span>
      <template v-for="(row, i) in groups" :key="i">
        <span class="rule" :class="{ 'what-rule': i === 0 }" />
        <button
          v-for="k in row"
          :key="k.id"
          type="button"
          class="tool"
          :class="{ 'text-destructive': k.danger }"
          :disabled="k.off"
          :aria-label="k.name"
          :aria-pressed="k.pressed === undefined ? undefined : k.pressed"
          :title="titleOf(k)"
          :data-key="k.id"
          :data-agent="k.agent"
          @click="k.run"
        >
          <DitherIcon :name="k.icon" :size="14" :stroke-width="1.5" />
        </button>
      </template>
    </div>
  </Transition>
</template>

<style scoped src="./tool.css"></style>
<style scoped>
/* One capsule at the canvas's foot, centred, its width set by its keys
   alone (the label has a fixed slot), raised over the data editor while it
   is open. */
.canvas-bar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  z-index: 30;
  display: flex;
  max-width: calc(100% - 24px);
  height: 2.5rem;
  align-items: center;
  gap: 2px;
  padding: 4px;
  overflow-x: auto;
  translate: -50% 0;
  scrollbar-width: none;
  white-space: nowrap;
}
.canvas-bar.is-raised {
  bottom: 17rem;
}
.zoom {
  display: flex;
  gap: 2px;
}
.pct {
  width: 3rem;
  font-variant-numeric: tabular-nums;
}
.rule {
  flex: none;
  width: 1px;
  height: 1rem;
  margin-inline: 2px;
  background: var(--color-border);
}
/* The selection's name in a slot of its own width: a long name is cut, a
   short one leaves the slot as it was. */
.what {
  flex: none;
  width: 7.5rem;
  overflow: hidden;
  padding-inline: 6px;
  font-size: 11px;
  text-overflow: ellipsis;
  color: var(--color-foreground);
}
.what.is-none {
  color: var(--color-muted-foreground);
}
/* A narrower canvas: the label steps out (the keys keep their names for a
   screen reader and their titles for a pointer), then the zoom steps (the
   percentage and fit stay). */
@container canvas (max-width: 760px) {
  .what,
  .what-rule {
    display: none;
  }
}
@container canvas (max-width: 600px) {
  .step {
    display: none;
  }
}
/* Down to the Studio's narrowest canvas (1024px with both side columns
   open) the keys close up to 28px, still past the 24px floor. */
@container canvas (max-width: 540px) {
  .tool {
    min-width: 1.75rem;
  }
  .pct {
    width: 2.75rem;
  }
}
.canvas-bar-enter-active,
.canvas-bar-leave-active {
  transition:
    translate 350ms var(--ease-settle),
    opacity 150ms var(--ease-settle);
}
.canvas-bar-enter-from,
.canvas-bar-leave-to {
  translate: -50% 6px;
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .canvas-bar-enter-active,
  .canvas-bar-leave-active {
    transition: none;
  }
}
</style>
