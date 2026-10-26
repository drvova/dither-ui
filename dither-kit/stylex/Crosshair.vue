<!-- Generated from ../tailwind/Crosshair.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  frame: { position: "relative", overflow: "hidden" },
  layer: { pointerEvents: "none", position: "absolute", insetBlock: "0px" },
  layer2: { pointerEvents: "none", position: "absolute", insetInline: "0px" },
})
</script>

<script setup lang="ts">
import { ref } from "vue"
import { cn, type StyleProp } from "./lib"

const props = withDefaults(
  defineProps<{
    color?: string
    thickness?: number
    class?: string
    xstyle?: StyleProp
  }>(),
  { color: "#7CFF67", thickness: 1 },
)

const area = ref<HTMLElement | null>(null)
const x = ref(-99)
const y = ref(-99)
const on = ref(false)

function onMove(e: PointerEvent) {
  const r = area.value?.getBoundingClientRect()
  if (!r) return
  x.value = e.clientX - r.left
  y.value = e.clientY - r.top
  on.value = true
}
</script>

<template>
  <div ref="area" :class="cn(styles.frame, props.xstyle, props.class)" @pointermove="onMove" @pointerleave="on = false">
    <slot />
    <div
      v-bind="stylex.attrs(styles.layer)"
      :style="{ left: `${x}px`, width: `${props.thickness}px`, background: props.color, opacity: on ? 0.8 : 0 }"
      aria-hidden="true"
    />
    <div
      v-bind="stylex.attrs(styles.layer2)"
      :style="{ top: `${y}px`, height: `${props.thickness}px`, background: props.color, opacity: on ? 0.8 : 0 }"
      aria-hidden="true"
    />
  </div>
</template>
