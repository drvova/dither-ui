<script setup lang="ts">
// Px rulers along the stage's top and left: ticks every 10, labels every
// 50, the span of what is in focus lit in the highlight, the pointer's
// position marked, and a guide pulled out of either ruler by dragging.
import { computed } from "vue"
import { useBench } from "../context"
import { boxFrom } from "../model/geometry"

const b = useBench()
const marks = (n: number) => Array.from({ length: Math.floor(n / 50) }, (_, i) => (i + 1) * 50)
const focus = computed(() => {
  const d = b.draft.value
  if (d?.kind === "region" || d?.kind === "marquee") return boxFrom(d.from, d.to)
  return b.reading.value?.box ?? b.typeReading.value?.box ?? b.a11y.value?.box ?? null
})
</script>

<template>
  <div class="wb-rulers" aria-hidden="true">
    <div class="wb-rule wb-rule-x" title="Drag down for a horizontal guide" @pointerdown="b.pullGuide($event, 'y')">
      <span v-for="n in marks(b.size.value.w)" :key="n" :style="{ left: `${n}px` }">{{ n }}</span>
      <i v-if="focus" class="span" :style="{ left: `${focus.x}px`, width: `${focus.w}px` }" />
      <i v-if="b.pointer.value" class="at" :style="{ left: `${b.pointer.value.x}px` }" />
    </div>
    <div class="wb-rule wb-rule-y" title="Drag right for a vertical guide" @pointerdown="b.pullGuide($event, 'x')">
      <span v-for="n in marks(b.size.value.h)" :key="n" :style="{ top: `${n}px` }">{{ n }}</span>
      <i v-if="focus" class="span" :style="{ top: `${focus.y}px`, height: `${focus.h}px` }" />
      <i v-if="b.pointer.value" class="at" :style="{ top: `${b.pointer.value.y}px` }" />
    </div>
    <div class="wb-corner">px</div>
  </div>
</template>

<style scoped>
.wb-rulers {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  --tick: color-mix(in oklab, var(--color-muted-foreground) 55%, transparent);
}

.wb-rule,
.wb-corner {
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--color-background);
  pointer-events: auto;
}

.wb-rule-x {
  right: 0;
  height: 14px;
  cursor: row-resize;
  background-image:
    linear-gradient(to right, var(--tick) 1px, transparent 0), linear-gradient(to right, var(--tick) 1px, transparent 0);
  background-size:
    10px 3px,
    50px 7px;
  background-position: 0 100%;
  background-repeat: repeat-x;
  box-shadow: inset 0 -1px 0 var(--color-border);
}

.wb-rule-y {
  bottom: 0;
  width: 14px;
  cursor: col-resize;
  background-image:
    linear-gradient(to bottom, var(--tick) 1px, transparent 0),
    linear-gradient(to bottom, var(--tick) 1px, transparent 0);
  background-size:
    3px 10px,
    7px 50px;
  background-position: 100% 0;
  background-repeat: repeat-y;
  box-shadow: inset -1px 0 0 var(--color-border);
}

.wb-corner {
  display: grid;
  width: 14px;
  height: 14px;
  place-items: center;
  font-size: 7px;
  color: var(--color-muted-foreground);
  box-shadow: inset -1px -1px 0 var(--color-border);
  pointer-events: none;
}

.wb-rule > span {
  position: absolute;
  pointer-events: none;
}

.wb-rule-x > span {
  top: 2px;
  padding-left: 2px;
}

.wb-rule-y > span {
  left: 2px;
  padding-bottom: 2px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.span {
  position: absolute;
  background: color-mix(in oklab, var(--wb-hl) 26%, transparent);
  pointer-events: none;
}

.wb-rule-x > .span {
  top: 0;
  bottom: 1px;
  box-shadow:
    inset 1px 0 var(--wb-hl),
    inset -1px 0 var(--wb-hl);
}

.wb-rule-y > .span {
  left: 0;
  right: 1px;
  box-shadow:
    inset 0 1px var(--wb-hl),
    inset 0 -1px var(--wb-hl);
}

.at {
  position: absolute;
  background: var(--color-foreground);
  pointer-events: none;
}

.wb-rule-x > .at {
  top: 0;
  bottom: 0;
  width: 1px;
}

.wb-rule-y > .at {
  left: 0;
  right: 0;
  height: 1px;
}

@media (forced-colors: active) {
  .wb-rule,
  .wb-corner {
    background-color: Canvas;
  }
}
</style>
