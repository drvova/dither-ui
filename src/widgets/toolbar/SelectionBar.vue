<script setup lang="ts">
import { computed, ref } from "vue"
import { DitherIcon } from "@dither-kit"
import {
  addReelArtboard,
  duplicateSelected,
  editor,
  groupSelected,
  removeSelected,
  replay,
  selectedArtboard,
  ungroup,
} from "@/entities/editor"
import { evolveSelected } from "@/features/agent"
import { exportArtboardPng } from "@/features/export-image"

// What to do with the selection: a bar over the foot of the canvas while a
// frame is selected (raised over the data editor when it is open).
const emit = defineEmits<{ export: []; video: [] }>()
const pngBusy = ref(false)
const canEdit = () => editor.selectedArtboardId !== ""
const canData = () => !!selectedArtboard.value && !selectedArtboard.value.widget
const canUngroup = () => !!selectedArtboard.value?.groupId
// A reel cuts the selected frames (in selection order); reels themselves are not clips.
const canReel = () =>
  editor.selectedIds.some((id) => editor.artboards.find((a) => a.id === id)?.widget?.kind !== "reel")
const makeReel = () => addReelArtboard(editor.selectedIds)
const selectionLabel = computed(() =>
  editor.selectedIds.length > 1 ? `${editor.selectedIds.length} selected` : (selectedArtboard.value?.name ?? ""),
)
const doUngroup = () => {
  const a = selectedArtboard.value
  if (a?.groupId) ungroup(a.groupId)
}
async function exportPng() {
  const a = selectedArtboard.value
  if (!a || pngBusy.value) return
  pngBusy.value = true
  await exportArtboardPng(a, 2)
  pngBusy.value = false
}
</script>

<template>
  <Transition name="selection-tools">
    <div
      v-if="canEdit()"
      class="capsule absolute left-1/2 z-30 flex h-10 max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto p-1"
      :class="editor.dataOpen ? 'bottom-[17rem]' : 'bottom-3'"
      role="toolbar"
      aria-label="Selection actions"
    >
      <span class="max-w-36 truncate px-2 text-[11px] text-foreground" aria-live="polite">{{ selectionLabel }}</span>
      <span class="mx-0.5 h-4 w-px bg-border" />
      <button type="button" title="Duplicate (⌘D)" class="tool wide" @click="duplicateSelected">
        <DitherIcon name="Copy" :size="14" :stroke-width="1.5" /><span class="lbl">Duplicate</span>
      </button>
      <button v-if="canUngroup()" type="button" title="Ungroup (⌘⇧G)" class="tool wide" @click="doUngroup">
        <DitherIcon name="Group" :size="14" :stroke-width="1.5" /><span class="lbl">Ungroup</span>
      </button>
      <button v-else type="button" title="Group (⌘G)" class="tool wide" @click="groupSelected">
        <DitherIcon name="Group" :size="14" :stroke-width="1.5" /><span class="lbl">Group</span>
      </button>
      <button type="button" title="Delete (⌫)" class="tool wide text-destructive" @click="removeSelected">
        <DitherIcon name="Trash" :size="14" :stroke-width="1.5" /><span class="lbl">Delete</span>
      </button>
      <span class="mx-0.5 h-4 w-px bg-border" />
      <button type="button" title="Replay animation" class="tool" aria-label="Replay animation" @click="replay">
        <DitherIcon name="Refresh" :size="14" :stroke-width="1.5" />
      </button>
      <button
        type="button"
        title="Evolve: four seeded variants of this frame"
        class="tool wide"
        @click="evolveSelected()"
      >
        <DitherIcon name="Dice" :size="14" :stroke-width="1.5" /><span class="lbl">Evolve</span>
      </button>
      <button
        v-if="canReel()"
        type="button"
        title="Reel: play the selected frames in order with dither transitions"
        class="tool wide"
        @click="makeReel"
      >
        <DitherIcon name="Film" :size="14" :stroke-width="1.5" /><span class="lbl">Reel</span>
      </button>
      <button
        v-if="canData()"
        type="button"
        class="tool wide"
        :aria-pressed="editor.dataOpen"
        @click="editor.dataOpen = !editor.dataOpen"
      >
        <DitherIcon name="Table" :size="14" :stroke-width="1.5" /><span class="lbl">Data</span>
      </button>
      <button type="button" class="tool wide" @click="emit('export')">
        <DitherIcon name="Code" :size="14" :stroke-width="1.5" /><span class="lbl">Code</span>
      </button>
      <button type="button" :disabled="pngBusy" class="tool wide" @click="exportPng">
        <DitherIcon name="Image" :size="14" :stroke-width="1.5" /><span class="lbl">{{
          pngBusy ? "Saving…" : "PNG"
        }}</span>
      </button>
      <button type="button" title="Export as a HyperFrames video composition" class="tool wide" @click="emit('video')">
        <DitherIcon name="Video" :size="14" :stroke-width="1.5" /><span class="lbl">Video</span>
      </button>
    </div>
  </Transition>
</template>

<style scoped src="./tool.css"></style>
<style scoped>
/* On a canvas too narrow for the words, the actions keep their glyphs and
   their names (screen readers still read the label); the words step out. */
@container canvas (max-width: 900px) {
  .tool .lbl {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
.selection-tools-enter-active,
.selection-tools-leave-active {
  transition:
    transform 350ms var(--ease-settle),
    opacity 120ms ease;
}
.selection-tools-enter-from,
.selection-tools-leave-to {
  transform: translate(-50%, 6px);
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .selection-tools-enter-active,
  .selection-tools-leave-active {
    transition: none;
  }
}
</style>
