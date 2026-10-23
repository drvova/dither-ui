<script setup lang="ts">
// The annotation layer: arrows, ink (a filled outline that swells and
// thins) and marker strokes, the gesture being drawn, the selection's
// outlines, the capture region and the eraser's footprint.
import { computed } from "vue"
import { useBench } from "../context"
import { boxFrom } from "../model/geometry"
import { arrowPaths, centerline, inkOutline } from "../model/ink"
import { swatch } from "../model/settings"

const b = useBench()

const arrows = computed(() => b.ws.value.arrows.map((a) => ({ ...a, ...arrowPaths(a.from, a.to, a.width) })))
const strokes = computed(() =>
  b.ws.value.strokes.map((s) => ({ ...s, d: s.kind === "ink" ? inkOutline(s.points, s.width) : centerline(s.points) })),
)
const draftShape = computed(() => {
  const d = b.draft.value
  if (!d) return null
  if (d.kind === "arrow")
    return { kind: "arrow" as const, ...arrowPaths(d.from, d.to, 2), color: swatch(b.settings.annotate) }
  if (d.kind === "stroke") {
    const marker = b.settings.pen === "marker"
    return {
      kind: "stroke" as const,
      marker,
      d: marker ? centerline(d.points) : inkOutline(d.points, b.settings.inkWidth),
      color: swatch(marker ? b.settings.markerSwatch : b.settings.inkSwatch),
      width: b.settings.markerWidth,
    }
  }
  if (d.kind === "region" || d.kind === "marquee") return { kind: d.kind, box: boxFrom(d.from, d.to) }
  return null
})
const outlines = computed(
  () => (b.revision.value, b.selection.value.map((item) => b.boundsOfItem(item)).filter(Boolean)),
)
/** The transform box with its corner and rotate handles (Select). */
const handles = computed(() => {
  void b.revision.value
  void b.selection.value
  if (b.tool.value !== "select" || b.draft.value?.kind === "marquee") return null
  const box = b.selectionBox()
  if (!box) return null
  return {
    box,
    corners: [
      [box.x, box.y],
      [box.x + box.w, box.y],
      [box.x, box.y + box.h],
      [box.x + box.w, box.y + box.h],
    ],
    rotate: { x: box.x + box.w / 2, y: box.y - 20 },
  }
})
const eraser = computed(() => (b.tool.value === "eraser" && b.pointer.value ? Math.max(8, b.settings.inkWidth * 2) : 0))
</script>

<template>
  <svg class="wb-ink" :width="b.size.value.w" :height="b.size.value.h" aria-hidden="true">
    <g v-for="s in strokes" :key="s.id">
      <path v-if="s.kind === 'ink'" :d="s.d" :fill="s.color" />
      <path v-else :d="s.d" :stroke="s.color" :stroke-width="s.width" class="marker" />
    </g>
    <g v-for="a in arrows" :key="a.id" :stroke="a.color" :fill="a.color">
      <path :d="a.shaft" :stroke-width="a.width" stroke-linecap="round" fill="none" />
      <path :d="a.head" stroke-linejoin="round" :stroke-width="1" />
    </g>
    <template v-if="draftShape">
      <g v-if="draftShape.kind === 'arrow'" :stroke="draftShape.color" :fill="draftShape.color">
        <path :d="draftShape.shaft" stroke-width="2" stroke-linecap="round" fill="none" />
        <path :d="draftShape.head" stroke-linejoin="round" stroke-width="1" />
      </g>
      <template v-else-if="draftShape.kind === 'stroke'">
        <path v-if="!draftShape.marker" :d="draftShape.d" :fill="draftShape.color" />
        <path v-else :d="draftShape.d" :stroke="draftShape.color" :stroke-width="draftShape.width" class="marker" />
      </template>
      <rect
        v-else
        :x="draftShape.box.x + 0.5"
        :y="draftShape.box.y + 0.5"
        :width="draftShape.box.w"
        :height="draftShape.box.h"
        :class="draftShape.kind"
      />
    </template>
    <rect
      v-for="(o, i) in outlines"
      :key="i"
      :x="o!.x - 2.5"
      :y="o!.y - 2.5"
      :width="o!.w + 5"
      :height="o!.h + 5"
      class="selected"
    />
    <g v-if="handles" class="handles">
      <rect
        :x="handles.box.x + 0.5"
        :y="handles.box.y + 0.5"
        :width="handles.box.w"
        :height="handles.box.h"
        class="frame"
      />
      <line :x1="handles.rotate.x" :y1="handles.box.y" :x2="handles.rotate.x" :y2="handles.rotate.y + 4" class="stem" />
      <circle :cx="handles.rotate.x" :cy="handles.rotate.y" r="4" class="knob" />
      <rect
        v-for="(c, i) in handles.corners"
        :key="i"
        :x="c[0] - 3.5"
        :y="c[1] - 3.5"
        width="7"
        height="7"
        class="knob"
      />
    </g>
    <circle
      v-if="eraser && b.pointer.value"
      :cx="b.pointer.value.x"
      :cy="b.pointer.value.y"
      :r="eraser"
      class="eraser"
    />
  </svg>
  <span
    v-if="draftShape && draftShape.kind === 'region' && draftShape.box.w > 4"
    class="wb-size"
    :style="{ left: `${draftShape.box.x + draftShape.box.w}px`, top: `${draftShape.box.y + draftShape.box.h + 6}px` }"
    aria-hidden="true"
    >{{ draftShape.box.w }}×{{ draftShape.box.h }}</span
  >
</template>

<style scoped>
.wb-ink {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.marker {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.42;
}

.region {
  fill: color-mix(in oklab, var(--wb-hl) 8%, transparent);
  stroke: var(--wb-hl);
  stroke-dasharray: 4 3;
}

.marquee {
  fill: color-mix(in oklab, var(--color-foreground) 4%, transparent);
  stroke: color-mix(in oklab, var(--color-foreground) 50%, transparent);
  stroke-dasharray: 3 3;
}

.selected {
  fill: none;
  stroke: var(--wb-hl);
  stroke-dasharray: 3 2;
}

.handles .frame {
  fill: none;
  stroke: var(--wb-hl);
  stroke-width: 1;
}

.handles .stem {
  stroke: var(--wb-hl);
}

.handles .knob {
  fill: var(--color-background);
  stroke: var(--wb-hl);
  stroke-width: 1.5;
}

.eraser {
  fill: color-mix(in oklab, var(--color-foreground) 8%, transparent);
  stroke: color-mix(in oklab, var(--color-foreground) 60%, transparent);
}

.wb-size {
  position: absolute;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
  transform: translateX(-100%);
  color: black;
  background: var(--wb-hl);
  pointer-events: none;
}
</style>
