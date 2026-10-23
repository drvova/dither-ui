<script setup lang="ts">
// The measuring layer: X-ray's outlines on a canvas, the inspected box with
// its padding, margin and gap bands, the pointed ghost, typography's lines
// and baselines, accessibility's tab order and flags, Alt distances, kept
// measurements and the distances from the inspected box to the guides.
// Decorative (aria-hidden): the readout under the stage says it in words.
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useBench } from "../context"
import { parseColor, type RGBA } from "../model/color"
import { distances, right, bottom, type Box, type Segment } from "../model/geometry"

const b = useBench()
const canvas = ref<HTMLCanvasElement | null>(null)

const at = (x: Box) => ({ left: `${x.x}px`, top: `${x.y}px`, width: `${x.w}px`, height: `${x.h}px` })
const sides = (v: number[]) => v.map((n) => `${n}px`).join(" ")

/** The box every measuring tool lights: inspect, x-ray, type or a11y. */
const target = computed(() => {
  const r = b.reading.value
  if (r) return { box: r.box, label: r.label, reading: r }
  const t = b.typeReading.value
  if (t) return { box: t.box, label: t.label, reading: null }
  const a = b.a11y.value
  if (a) return { box: a.box, label: `${a.role}${a.name ? ` “${a.name.slice(0, 24)}”` : ""}`, reading: null }
  return null
})

/** Distances from the inspected box to the nearest guide on each side. */
const guideLinks = computed<Segment[]>(() => {
  const t = target.value
  if (!t || b.tool.value !== "inspect") return []
  const box = t.box
  const out: Segment[] = []
  const xs = b.ws.value.guides.filter((g) => g.axis === "x").map((g) => g.at)
  const ys = b.ws.value.guides.filter((g) => g.axis === "y").map((g) => g.at)
  const cy = box.y + box.h / 2
  const cx = box.x + box.w / 2
  const left = Math.max(...xs.filter((x) => x <= box.x), -Infinity)
  const rightG = Math.min(...xs.filter((x) => x >= right(box)), Infinity)
  const top = Math.max(...ys.filter((y) => y <= box.y), -Infinity)
  const bottomG = Math.min(...ys.filter((y) => y >= bottom(box)), Infinity)
  if (Number.isFinite(left) && box.x - left > 0) out.push({ x1: left, y1: cy, x2: box.x, y2: cy, value: box.x - left })
  if (Number.isFinite(rightG) && rightG - right(box) > 0)
    out.push({ x1: right(box), y1: cy, x2: rightG, y2: cy, value: rightG - right(box) })
  if (Number.isFinite(top) && box.y - top > 0) out.push({ x1: cx, y1: top, x2: cx, y2: box.y, value: box.y - top })
  if (Number.isFinite(bottomG) && bottomG - bottom(box) > 0)
    out.push({ x1: cx, y1: bottom(box), x2: cx, y2: bottomG, value: bottomG - bottom(box) })
  return out
})

const kept = computed(() =>
  b.ws.value.measures.map((m) => ({
    ...m,
    segments: distances(m.from.box, m.to.box),
    on: b.isSelected({ kind: "measures", id: m.id }),
  })),
)

const orderPath = computed(() =>
  b.order.value.map((o, i) => `${i ? "L" : "M"}${o.x + Math.min(o.w, 10)} ${o.y + Math.min(o.h, 10)}`).join(""),
)

const chipBelow = (box: Box) => box.y < 34
const chipEnd = (box: Box) => box.x > b.size.value.w / 2
const mid = (s: Segment) => ({ left: `${(s.x1 + s.x2) / 2}px`, top: `${(s.y1 + s.y2) / 2}px` })

function paint() {
  const c = canvas.value
  if (!c) return
  const { w, h } = b.size.value
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = Math.max(1, Math.round(w * dpr))
  c.height = Math.max(1, Math.round(h * dpr))
  const ctx = c.getContext("2d")
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  // Custom properties compute with their var() chain resolved: the swatch
  // the settings picked, in the current theme.
  const css = getComputedStyle(c)
  const rgb = (name: string, fallback: RGBA) => parseColor(css.getPropertyValue(name)) ?? fallback
  const hl = rgb("--wb-hl", { r: 255, g: 150, b: 50, a: 1 })
  const guide = rgb("--wb-guide", { r: 150, g: 110, b: 255, a: 1 })
  for (const x of b.xray.value) {
    const alpha = Math.max(0.22, 0.85 - x.depth * 0.09)
    const tone = x.layout ? guide : hl
    ctx.strokeStyle = `rgb(${tone.r} ${tone.g} ${tone.b} / ${alpha})`
    ctx.setLineDash(x.layout ? [3, 2] : [])
    ctx.strokeRect(x.box.x + 0.5, x.box.y + 0.5, Math.max(0, x.box.w - 1), Math.max(0, x.box.h - 1))
  }
}
watch([() => b.xray.value, () => b.size.value, () => b.settings.highlight, () => b.settings.guide], paint)
onBeforeUnmount(() => {
  canvas.value = null
})
</script>

<template>
  <div class="wb-marks" aria-hidden="true">
    <canvas v-show="b.tool.value === 'xray'" ref="canvas" class="xray" />

    <!-- Accessibility: the Tab order and the flags. -->
    <template v-if="b.tool.value === 'a11y'">
      <svg class="svg" :width="b.size.value.w" :height="b.size.value.h">
        <path v-if="b.order.value.length > 1" :d="orderPath" class="order-path" />
      </svg>
      <span
        v-for="(o, i) in b.order.value"
        :key="`o${i}`"
        class="order"
        :style="{ left: `${o.x + Math.min(o.w, 10) - 8}px`, top: `${o.y + Math.min(o.h, 10) - 8}px` }"
        >{{ i + 1 }}</span
      >
      <div v-for="(m, i) in b.marks.value" :key="`m${i}`" class="flag" :style="at(m.box)">
        <b>!</b>
      </div>
    </template>

    <!-- Typography: each line's box and baseline. -->
    <template v-if="b.typeReading.value">
      <div v-for="(l, i) in b.typeReading.value.lines" :key="`l${i}`" class="line" :style="at(l)" />
      <div
        v-for="(y, i) in b.typeReading.value.baselines"
        :key="`b${i}`"
        class="baseline"
        :style="{
          top: `${y}px`,
          left: `${b.typeReading.value.lines[i].x}px`,
          width: `${b.typeReading.value.lines[i].w}px`,
        }"
      />
    </template>

    <!-- What a comment would attach to. -->
    <div v-if="b.aim.value && !b.draftThread.value" class="ghost" :style="at(b.aim.value.box)">
      <span class="chip" :class="{ below: chipBelow(b.aim.value.box), end: chipEnd(b.aim.value.box) }"
        >comment on {{ b.aim.value.label }}</span
      >
    </div>

    <!-- The pointed element while another is pinned. -->
    <div v-if="b.ghost.value" class="ghost" :style="at(b.ghost.value)" />

    <!-- The target. -->
    <div v-if="target" class="target" :style="at(target.box)">
      <template v-if="target.reading && b.settings.layout">
        <i
          class="margin"
          :style="{
            top: `-${target.reading.outer[0]}px`,
            right: `-${target.reading.outer[1]}px`,
            bottom: `-${target.reading.outer[2]}px`,
            left: `-${target.reading.outer[3]}px`,
            borderWidth: sides(target.reading.outer.map((n) => Math.max(0, n))),
          }"
        />
        <i class="pad" :style="{ inset: sides(target.reading.edge), borderWidth: sides(target.reading.pad) }" />
      </template>
      <b class="tl" /><b class="tr" /><b class="bl" /><b class="br" />
      <span class="chip" :class="{ below: chipBelow(target.box), end: chipEnd(target.box) }"
        >{{ target.label }} {{ target.box.w }}×{{ target.box.h }}</span
      >
    </div>
    <template v-if="target?.reading && b.settings.layout">
      <i v-for="(g, i) in target.reading.gaps" :key="`g${i}`" class="gapband" :style="at(g)" />
    </template>

    <!-- Distances: Alt, kept measurements, guide links. -->
    <svg class="svg" :width="b.size.value.w" :height="b.size.value.h">
      <template v-if="b.altMeasure.value">
        <rect
          v-for="(x, i) in [b.altMeasure.value.from, b.altMeasure.value.to]"
          :key="`ab${i}`"
          :x="x.x + 0.5"
          :y="x.y + 0.5"
          :width="Math.max(0, x.w - 1)"
          :height="Math.max(0, x.h - 1)"
          class="dist-box"
        />
        <line
          v-for="(s, i) in b.altMeasure.value.segments"
          :key="`as${i}`"
          :x1="s.x1"
          :y1="s.y1"
          :x2="s.x2"
          :y2="s.y2"
          :class="s.dashed ? 'dist dashed' : 'dist'"
        />
      </template>
      <template v-for="m in kept" :key="m.id">
        <line
          v-for="(s, i) in m.segments"
          :key="i"
          :x1="s.x1"
          :y1="s.y1"
          :x2="s.x2"
          :y2="s.y2"
          :class="[s.dashed ? 'dist dashed' : 'dist', { on: m.on }]"
        />
      </template>
      <line
        v-for="(s, i) in guideLinks"
        :key="`gl${i}`"
        :x1="s.x1"
        :y1="s.y1"
        :x2="s.x2"
        :y2="s.y2"
        class="dist dashed"
      />
    </svg>
    <template v-if="b.altMeasure.value">
      <span
        v-for="(s, i) in b.altMeasure.value.segments.filter((x) => !x.dashed)"
        :key="`av${i}`"
        class="value"
        :style="mid(s)"
        >{{ s.value }}</span
      >
    </template>
    <template v-for="m in kept" :key="`kv${m.id}`">
      <span v-for="(s, i) in m.segments.filter((x) => !x.dashed)" :key="i" class="value" :style="mid(s)">{{
        s.value
      }}</span>
    </template>
    <span v-for="(s, i) in guideLinks" :key="`glv${i}`" class="value" :style="mid(s)">{{ s.value }}</span>
  </div>
</template>

<style scoped>
.wb-marks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.xray,
.svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.target,
.ghost,
.line,
.flag,
.gapband {
  position: absolute;
}

.target {
  outline: 1px solid var(--wb-hl);
}

.ghost {
  outline: 1px dashed color-mix(in oklab, var(--wb-hl) 70%, transparent);
}

.pad,
.margin {
  position: absolute;
  border-style: solid;
}

.pad {
  border-color: color-mix(in oklab, var(--wb-hl) 18%, transparent);
}

.margin {
  border-color: color-mix(in oklab, var(--wb-hl) 9%, transparent);
  border-style: dashed;
}

.gapband {
  background: repeating-linear-gradient(
    -45deg,
    color-mix(in oklab, var(--wb-guide) 32%, transparent) 0 1px,
    transparent 1px 5px
  );
}

.target > b {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--wb-hl);
}

.tl {
  top: -3px;
  left: -3px;
}

.tr {
  top: -3px;
  right: -3px;
}

.bl {
  bottom: -3px;
  left: -3px;
}

.br {
  right: -3px;
  bottom: -3px;
}

/* Black on either theme's ember clears 5:1. */
.chip {
  position: absolute;
  bottom: calc(100% + 5px);
  left: -1px;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
  color: black;
  background: var(--wb-hl);
}

.chip.below {
  top: calc(100% + 5px);
  bottom: auto;
}

.chip.end {
  right: -1px;
  left: auto;
}

.line {
  outline: 1px solid color-mix(in oklab, var(--wb-hl) 45%, transparent);
  background: color-mix(in oklab, var(--wb-hl) 7%, transparent);
}

.baseline {
  position: absolute;
  height: 1px;
  background: var(--wb-hl);
}

.order-path {
  fill: none;
  stroke: var(--wb-guide);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.order {
  position: absolute;
  display: grid;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  place-items: center;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  color: var(--color-background);
  background: var(--wb-guide);
}

.flag {
  outline: 1px dashed var(--wb-hl);
}

.flag > b {
  position: absolute;
  top: -7px;
  right: -7px;
  display: grid;
  width: 13px;
  height: 13px;
  place-items: center;
  border-radius: 50%;
  font-size: 9px;
  color: black;
  background: var(--wb-hl);
}

.dist-box {
  fill: none;
  stroke: color-mix(in oklab, var(--wb-guide) 75%, transparent);
  stroke-dasharray: 2 2;
}

.dist {
  stroke: var(--wb-guide);
  stroke-width: 1;
}

.dist.dashed {
  stroke-dasharray: 3 2;
  opacity: 0.7;
}

.dist.on {
  stroke-width: 2;
}

.value {
  position: absolute;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  line-height: 11px;
  white-space: nowrap;
  transform: translate(-50%, -50%);
  color: var(--color-background);
  background: var(--wb-guide);
}

@media (forced-colors: active) {
  .wb-marks {
    forced-color-adjust: none;
  }
  .chip {
    color: HighlightText;
  }
}
</style>
