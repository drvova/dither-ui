<script setup lang="ts">
// Guides and the layout grid: columns, rows and a pixel grid in the guide
// colour; each guide a hairline with its position, the gap to the next
// guide on its axis labelled between them; the preview of the guide the
// Guides tool would place.
import { computed } from "vue"
import { useBench } from "../context"

const b = useBench()
const grid = computed(() => b.ws.value.grid)

/** Column (or row) bands for `n` tracks across `len` with margins and gutters. */
function tracks(len: number, n: number, gutter: number, margin: number) {
  const size = (len - margin * 2 - gutter * (n - 1)) / n
  return size > 0 ? Array.from({ length: n }, (_, i) => ({ at: margin + i * (size + gutter), size })) : []
}

const columns = computed(() =>
  grid.value.show.columns ? tracks(b.size.value.w, grid.value.columns, grid.value.gutter, grid.value.margin) : [],
)
const rows = computed(() =>
  grid.value.show.rows ? tracks(b.size.value.h, grid.value.rows, grid.value.rowGutter, grid.value.margin) : [],
)

/** Each guide with the gap to its next neighbour on the same axis. */
const lines = computed(() =>
  (["x", "y"] as const).flatMap((axis) => {
    const list = b.ws.value.guides.filter((g) => g.axis === axis).sort((p, q) => p.at - q.at)
    return list.map((g, i) => ({ ...g, gap: list[i + 1] ? Math.round((list[i + 1].at - g.at) * 10) / 10 : null }))
  }),
)
const selected = (id: string) => b.isSelected({ kind: "guides", id })
</script>

<template>
  <div class="wb-guides" aria-hidden="true">
    <div v-if="grid.show.pixel" class="pixel" :style="{ backgroundSize: `${grid.pixel}px ${grid.pixel}px` }" />
    <i
      v-for="(c, i) in columns"
      :key="`c${i}`"
      class="band"
      :style="{ left: `${c.at}px`, width: `${c.size}px`, top: 0, bottom: 0 }"
    />
    <i
      v-for="(r, i) in rows"
      :key="`r${i}`"
      class="band"
      :style="{ top: `${r.at}px`, height: `${r.size}px`, left: 0, right: 0 }"
    />
    <template v-for="g in lines" :key="g.id">
      <div
        class="line"
        :class="[g.axis, { on: selected(g.id) }]"
        :style="g.axis === 'x' ? { left: `${g.at}px` } : { top: `${g.at}px` }"
      >
        <span class="pos">{{ Math.round(g.at) }}</span>
      </div>
      <span
        v-if="g.gap"
        class="gap"
        :style="
          g.axis === 'x'
            ? { left: `${g.at + g.gap / 2}px`, top: '22px' }
            : { top: `${g.at + g.gap / 2}px`, left: '22px' }
        "
        >{{ g.gap }}</span
      >
    </template>
    <div
      v-if="b.tool.value === 'guides' && b.guideHover.value !== null && !b.draft.value"
      class="line preview"
      :class="b.guideAxis.value"
      :style="b.guideAxis.value === 'x' ? { left: `${b.guideHover.value}px` } : { top: `${b.guideHover.value}px` }"
    >
      <span class="pos">{{ b.guideHover.value }}</span>
    </div>
  </div>
</template>

<style scoped>
.wb-guides {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.pixel {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in oklab, var(--wb-guide) 22%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklab, var(--wb-guide) 22%, transparent) 1px, transparent 1px);
}

.band {
  position: absolute;
  background: color-mix(in oklab, var(--wb-guide) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--wb-guide) 22%, transparent);
}

.line {
  position: absolute;
  background: var(--wb-guide);
}

.line.x {
  top: 0;
  bottom: 0;
  width: 1px;
}

.line.y {
  left: 0;
  right: 0;
  height: 1px;
}

.line.on {
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--wb-guide) 45%, transparent);
}

.line.preview {
  background: none;
}

.line.preview.x {
  border-left: 1px dashed var(--wb-guide);
}

.line.preview.y {
  border-top: 1px dashed var(--wb-guide);
}

.pos,
.gap {
  position: absolute;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  line-height: 11px;
  white-space: nowrap;
  color: var(--color-background);
  background: var(--wb-guide);
}

.line.x > .pos {
  top: 16px;
  left: 3px;
}

.line.y > .pos {
  top: 3px;
  left: 16px;
}

.gap {
  transform: translate(-50%, -50%);
  color: var(--wb-guide);
  background: var(--color-background);
  box-shadow: inset 0 0 0 1px var(--wb-guide);
}
</style>
