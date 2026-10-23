<script setup lang="ts">
// The workbench of one preview (after Kobra's component workbench and its
// Mesurer tray): the overlay teleported into the preview frame — layout
// grid and guides, measurements, annotations, the pointer surface, rulers,
// notes, comments, the loupe and the tray — and, under the frame, the
// readout and the motion, responsive and settings panels.
import { computed, onBeforeUnmount, onMounted, provide, type Slot } from "vue"
import { createBench } from "./bench"
import { BENCH } from "./context"
import { swatch } from "./model/settings"
import Comments from "./ui/Comments.vue"
import Guides from "./ui/Guides.vue"
import Ink from "./ui/Ink.vue"
import Loupe from "./ui/Loupe.vue"
import Marks from "./ui/Marks.vue"
import Motion from "./ui/Motion.vue"
import Notes from "./ui/Notes.vue"
import Readout from "./ui/Readout.vue"
import Responsive from "./ui/Responsive.vue"
import Rulers from "./ui/Rulers.vue"
import Settings from "./ui/Settings.vue"
import Tray from "./ui/Tray.vue"

const props = defineProps<{
  host: HTMLElement
  content: HTMLElement
  card: HTMLElement
  benchKey: string
  section: string
  title: string
  url: string
  render?: Slot
}>()
const emit = defineEmits<{ exit: [] }>()

const b = createBench({
  host: props.host,
  content: props.content,
  card: props.card,
  key: props.benchKey,
  section: props.section,
  title: props.title,
  url: props.url,
  exit: () => emit("exit"),
})
provide(BENCH, b)
onMounted(b.start)
onBeforeUnmount(b.stop)

const vars = computed(() => ({
  "--wb-hl": swatch(b.settings.highlight),
  "--wb-guide": swatch(b.settings.guide),
}))

const CURSORS: Record<string, string> = {
  inspect: "crosshair",
  xray: "crosshair",
  type: "text",
  color: "crosshair",
  loupe: "none",
  a11y: "help",
  select: "default",
  arrow: "crosshair",
  pen: "crosshair",
  eraser: "none",
  text: "text",
  comment: "cell",
  shot: "crosshair",
  video: "crosshair",
}
const HANDLE_CURSORS: Record<string, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  rotate: "grab",
}
const cursor = computed(() =>
  b.tool.value === "select" && b.handleHover.value
    ? HANDLE_CURSORS[b.handleHover.value]
    : b.tool.value === "guides"
      ? b.guideAxis.value === "x"
        ? "col-resize"
        : "row-resize"
      : (CURSORS[b.tool.value ?? ""] ?? "auto"),
)

defineExpose({ bench: b })
</script>

<template>
  <Teleport :to="host">
    <div
      :ref="(el) => (b.overlay.value = el as HTMLElement)"
      class="wb"
      :class="{ capturing: b.capturing.value }"
      :style="vars"
    >
      <Guides />
      <Marks />
      <Ink />
      <div
        v-if="b.tool.value"
        class="wb-surface"
        :style="{ cursor }"
        @pointerdown="b.down"
        @pointermove="b.move"
        @pointerup="b.up"
        @pointercancel="b.up"
        @pointerleave="b.leave"
        @dblclick="b.editAt"
        @wheel="b.wheel"
        @contextmenu.prevent
      />
      <Rulers v-if="b.toggles.rulers" />
      <Notes />
      <Comments />
      <Loupe v-if="(b.tool.value === 'loupe' || b.tool.value === 'color') && b.pointer.value" />
      <Tray />
    </div>
  </Teleport>
  <Readout />
  <Motion v-if="b.toggles.motion" />
  <Responsive v-if="b.toggles.responsive" :render="render" />
  <Settings v-if="b.panel.value === 'settings'" />
</template>

<style scoped>
/* The overlay covers the frame's padding box; it is never part of a
   capture (`.capturing` while a still or a recording is taken). */
.wb {
  position: absolute;
  inset: 0;
  z-index: 5;
  border-radius: inherit;
  font: 500 9px/1 var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--color-muted-foreground);
  pointer-events: none;
}

.wb.capturing {
  visibility: hidden;
}

.wb-surface {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: auto;
  touch-action: none;
}

@media (forced-colors: active) {
  .wb {
    --wb-hl: Highlight;
    --wb-guide: LinkText;
    forced-color-adjust: none;
  }
}
</style>
